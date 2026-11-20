use polityra_core::PipelineJob;
use serde_json::Value;
use sqlx::{Executor, PgPool, Postgres, Row, Transaction};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum QueueError {
    #[error("database operation failed: {0}")]
    Database(#[from] sqlx::Error),
    #[error("invalid queue payload: {0}")]
    Payload(#[from] serde_json::Error),
}

pub fn retry_delay_seconds(attempt: i32) -> i64 {
    2_i64
        .pow((attempt.max(1) - 1).min(10) as u32)
        .saturating_mul(30)
}

pub async fn claim(
    pool: &PgPool,
    worker_id: &str,
    job_type: Option<&str>,
) -> Result<Option<PipelineJob>, QueueError> {
    let mut tx = pool.begin().await?;
    let row = sqlx::query(
        r#"
        SELECT id, job_type, payload, attempts, max_attempts, correlation_id, status
        FROM pipeline_jobs
        WHERE (status = 'pending' OR (status = 'running' AND lease_expires_at < now()))
          AND run_after <= now()
          AND ($1::text IS NULL OR job_type = $1)
        ORDER BY priority DESC, created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
        "#,
    )
    .bind(job_type)
    .fetch_optional(&mut *tx)
    .await?;

    let Some(row) = row else {
        tx.commit().await?;
        return Ok(None);
    };
    let id: Uuid = row.try_get("id")?;
    let attempt: i32 = row.try_get("attempts")?;
    let previous_status: String = row.try_get("status")?;
    if previous_status == "running" {
        sqlx::query(
            r#"
            UPDATE pipeline_job_attempts
            SET status = 'lease_expired', completed_at = now(),
                error_message = 'Worker lease expired'
            WHERE job_id = $1 AND status = 'running'
            "#,
        )
        .bind(id)
        .execute(&mut *tx)
        .await?;
    }

    sqlx::query(
        r#"
        UPDATE pipeline_jobs
        SET status = 'running', attempts = attempts + 1, worker_id = $2,
            lease_expires_at = now() + interval '5 minutes', updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(id)
    .bind(worker_id)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO pipeline_job_attempts (job_id, attempt, worker_id, status)
        VALUES ($1, $2, $3, 'running')
        "#,
    )
    .bind(id)
    .bind(attempt + 1)
    .bind(worker_id)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;

    Ok(Some(PipelineJob {
        id,
        job_type: row.try_get("job_type")?,
        payload: row.try_get("payload")?,
        attempts: attempt + 1,
        max_attempts: row.try_get("max_attempts")?,
        correlation_id: row.try_get("correlation_id")?,
    }))
}

pub async fn complete(
    pool: &PgPool,
    job: &PipelineJob,
    worker_id: &str,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"
        UPDATE pipeline_jobs
        SET status = 'completed', lease_expires_at = NULL, worker_id = NULL,
            completed_at = now(), last_error = NULL, updated_at = now()
        WHERE id = $1 AND worker_id = $2 AND status = 'running'
        "#,
    )
    .bind(job.id)
    .bind(worker_id)
    .execute(&mut *tx)
    .await?;
    finish_attempt(&mut tx, job.id, job.attempts, "completed", None).await?;
    tx.commit().await
}

pub async fn fail(
    pool: &PgPool,
    job: &PipelineJob,
    worker_id: &str,
    message: &str,
) -> Result<(), sqlx::Error> {
    let terminal = job.attempts >= job.max_attempts;
    let status = if terminal { "dead_letter" } else { "pending" };
    let delay = retry_delay_seconds(job.attempts);
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"
        UPDATE pipeline_jobs
        SET status = $3, lease_expires_at = NULL, worker_id = NULL,
            run_after = CASE WHEN $3 = 'pending' THEN now() + ($4 * interval '1 second') ELSE run_after END,
            last_error = $5, updated_at = now(),
            completed_at = CASE WHEN $3 = 'dead_letter' THEN now() ELSE NULL END
        WHERE id = $1 AND worker_id = $2 AND status = 'running'
        "#,
    )
    .bind(job.id)
    .bind(worker_id)
    .bind(status)
    .bind(delay)
    .bind(message)
    .execute(&mut *tx)
    .await?;
    finish_attempt(&mut tx, job.id, job.attempts, "failed", Some(message)).await?;
    tx.commit().await
}

pub async fn enqueue<'e, E>(
    executor: E,
    job_type: &str,
    payload: Value,
    idempotency_key: &str,
    priority: i32,
    correlation_id: Uuid,
) -> Result<(), sqlx::Error>
where
    E: Executor<'e, Database = Postgres>,
{
    sqlx::query(
        r#"
        INSERT INTO pipeline_jobs (job_type, payload, idempotency_key, priority, correlation_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (job_type, idempotency_key) DO NOTHING
        "#,
    )
    .bind(job_type)
    .bind(payload)
    .bind(idempotency_key)
    .bind(priority)
    .bind(correlation_id)
    .execute(executor)
    .await?;
    Ok(())
}

async fn finish_attempt(
    tx: &mut Transaction<'_, Postgres>,
    job_id: Uuid,
    attempt: i32,
    status: &str,
    error_message: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE pipeline_job_attempts
        SET status = $3, completed_at = now(), error_message = $4
        WHERE job_id = $1 AND attempt = $2
        "#,
    )
    .bind(job_id)
    .bind(attempt)
    .bind(status)
    .bind(error_message)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::retry_delay_seconds;

    #[test]
    fn retry_is_exponential_and_bounded() {
        assert_eq!(retry_delay_seconds(1), 30);
        assert_eq!(retry_delay_seconds(2), 60);
        assert_eq!(retry_delay_seconds(3), 120);
        assert!(retry_delay_seconds(100) < 31_000);
    }
}
