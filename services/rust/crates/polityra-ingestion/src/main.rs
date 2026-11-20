use anyhow::{Context, anyhow, bail};
use feed_rs::parser;
use futures_util::StreamExt;
use polityra_core::{FetchedDocument, SourceFetchPayload};
use polityra_dedup::{content_hash, word_jaccard};
use polityra_normalizer::normalize_text;
use reqwest::{Client, redirect::Policy};
use serde_json::json;
use sqlx::{Column, PgPool, Row};
use std::{
    net::{IpAddr, SocketAddr},
    time::{Duration, Instant},
};
use tokio::{net::lookup_host, time::sleep};
use tracing::{error, info, warn};
use url::Url;
use uuid::Uuid;

const MAX_RESPONSE_BYTES: usize = 5 * 1024 * 1024;
const MAX_REDIRECTS: usize = 4;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "polityra_ingestion=info".into()),
        )
        .json()
        .init();

    let database_url = std::env::var("DATABASE_URL").context("DATABASE_URL is required")?;
    let pool = PgPool::connect(&database_url).await?;
    let worker_id = format!("ingestion-{}", Uuid::new_v4());
    let poll_ms: u64 = std::env::var("PIPELINE_POLL_INTERVAL_MS")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(1000);

    info!(%worker_id, "pipeline worker started");
    register_worker(&pool, &worker_id, "running").await?;
    let mut last_heartbeat = Instant::now();
    loop {
        if last_heartbeat.elapsed() >= Duration::from_secs(15) {
            register_worker(&pool, &worker_id, "running").await?;
            last_heartbeat = Instant::now();
        }
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {
                set_worker_status(&pool, &worker_id, "stopping").await?;
                info!(%worker_id, "shutdown requested");
                break;
            }
            job = polityra_queue::claim(&pool, &worker_id, None) => {
                match job? {
                    Some(job) => {
                        let result = process_job(&pool, &job).await;
                        match result {
                            Ok(()) => polityra_queue::complete(&pool, &job, &worker_id).await?,
                            Err(err) => {
                                let message = err.to_string();
                                error!(job_id = %job.id, job_type = %job.job_type, %message, "pipeline job failed");
                                polityra_queue::fail(&pool, &job, &worker_id, &message).await?;
                            }
                        }
                    }
                    None => sleep(Duration::from_millis(poll_ms)).await,
                }
            }
        }
    }
    set_worker_status(&pool, &worker_id, "stopped").await?;
    Ok(())
}

async fn register_worker(pool: &PgPool, worker_id: &str, status: &str) -> anyhow::Result<()> {
    sqlx::query(
        r#"
        INSERT INTO pipeline_workers (worker_id, worker_type, status, metadata)
        VALUES ($1, 'rust-ingestion', $2, $3::jsonb)
        ON CONFLICT (worker_id) DO UPDATE SET
            status = EXCLUDED.status, last_heartbeat_at = now(), metadata = EXCLUDED.metadata
        "#,
    )
    .bind(worker_id)
    .bind(status)
    .bind(json!({"version": env!("CARGO_PKG_VERSION")}))
    .execute(pool)
    .await?;
    Ok(())
}

async fn set_worker_status(pool: &PgPool, worker_id: &str, status: &str) -> anyhow::Result<()> {
    sqlx::query(
        "UPDATE pipeline_workers SET status = $2, last_heartbeat_at = now() WHERE worker_id = $1",
    )
    .bind(worker_id)
    .bind(status)
    .execute(pool)
    .await?;
    Ok(())
}

async fn process_job(pool: &PgPool, job: &polityra_core::PipelineJob) -> anyhow::Result<()> {
    match job.job_type.as_str() {
        "source.fetch" => fetch_source(pool, job).await,
        "document.extract_claims" => extract_document(pool, job).await,
        "claim.find_evidence" => find_claim_evidence(pool, job).await,
        "claim.verify" => verify_claim(pool, job).await,
        "analysis.create" => {
            if job.payload.get("analysisId").is_some() {
                create_manual_analysis(pool, job).await
            } else {
                create_analysis(pool, job).await
            }
        }
        other => bail!("unsupported job type: {other}"),
    }
}

async fn fetch_source(pool: &PgPool, job: &polityra_core::PipelineJob) -> anyhow::Result<()> {
    let payload: SourceFetchPayload = serde_json::from_value(job.payload.clone())?;
    let row = sqlx::query(
        r#"
        SELECT canonical_url, metadata, fetch_config, last_successful_fetch
        FROM sources
        WHERE id = $1 AND is_active = true
        "#,
    )
    .bind(payload.source_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| anyhow!("enabled source not found"))?;

    let canonical: Option<String> = row.try_get("canonical_url")?;
    let metadata: serde_json::Value = row.try_get("metadata")?;
    let fetch_config: serde_json::Value = row.try_get("fetch_config")?;
    let fetch_url = metadata
        .pointer("/news_scraper/feedUrl")
        .and_then(|value| value.as_str())
        .or_else(|| fetch_config.get("url").and_then(|value| value.as_str()))
        .or(canonical.as_deref())
        .ok_or_else(|| anyhow!("source has no fetch URL"))?;
    let minimum_interval = fetch_config
        .get("min_interval_seconds")
        .and_then(|value| value.as_u64())
        .unwrap_or(0);
    let last_successful: Option<chrono::DateTime<chrono::Utc>> =
        row.try_get("last_successful_fetch")?;
    if minimum_interval > 0
        && last_successful.is_some_and(|value| {
            chrono::Utc::now()
                .signed_duration_since(value)
                .num_seconds()
                < minimum_interval as i64
        })
    {
        info!(source_id = %payload.source_id, "source fetch skipped by configured rate limit");
        return Ok(());
    }
    let allowed_host = canonical
        .as_deref()
        .and_then(|value| Url::parse(value).ok())
        .and_then(|url| url.host_str().map(str::to_owned))
        .ok_or_else(|| anyhow!("source has no valid canonical host"))?;

    let run_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO source_fetch_runs (source_id, status, fetched_url)
        VALUES ($1, 'running', $2) RETURNING id
        "#,
    )
    .bind(payload.source_id)
    .bind(fetch_url)
    .fetch_one(pool)
    .await?;

    let fetched = fetch_public_url(fetch_url, &allowed_host).await;
    match fetched {
        Err(error) => {
            sqlx::query(
                r#"
                UPDATE source_fetch_runs
                SET status = 'failed', completed_at = now(), error_message = $2
                WHERE id = $1
                "#,
            )
            .bind(run_id)
            .bind(error.to_string())
            .execute(pool)
            .await?;
            sqlx::query(
                "UPDATE sources SET last_failed_fetch = now(), updated_at = now() WHERE id = $1",
            )
            .bind(payload.source_id)
            .execute(pool)
            .await?;
            return Err(error);
        }
        Ok(fetched) => {
            let documents = parse_feed(&fetched.body, &allowed_host, &fetched.final_url)?;
            let mut inserted = 0;
            let mut duplicates = 0;
            for document in documents {
                if store_document(pool, payload.source_id, document, job).await? {
                    inserted += 1;
                } else {
                    duplicates += 1;
                }
            }
            let bytes = fetched.body.len() as i64;
            let hash = content_hash(&fetched.body);
            sqlx::query(
                r#"
                UPDATE source_fetch_runs
                SET status = 'succeeded', completed_at = now(), final_url = $2,
                    content_type = $3, content_hash = $4, bytes_fetched = $5,
                    response_status = $6,
                    metadata = $7::jsonb
                WHERE id = $1
                "#,
            )
            .bind(run_id)
            .bind(&fetched.final_url)
            .bind(&fetched.content_type)
            .bind(&hash)
            .bind(bytes)
            .bind(fetched.status)
            .bind(json!({"documents": inserted, "duplicates": duplicates}))
            .execute(pool)
            .await?;
            sqlx::query(
                "UPDATE sources SET last_successful_fetch = now(), updated_at = now() WHERE id = $1",
            )
            .bind(payload.source_id)
            .execute(pool)
            .await?;
        }
    }
    Ok(())
}

struct FetchedResponse {
    body: String,
    content_type: Option<String>,
    final_url: String,
    status: i32,
}

async fn fetch_public_url(raw_url: &str, allowed_host: &str) -> anyhow::Result<FetchedResponse> {
    let mut current = Url::parse(raw_url)?;
    for redirect in 0..=MAX_REDIRECTS {
        let (address, host, port) = validate_public_url(&current, allowed_host).await?;
        let client = Client::builder()
            .redirect(Policy::none())
            .timeout(Duration::from_secs(15))
            .resolve(&host, SocketAddr::new(address, port))
            .build()?;
        let response = client
            .get(current.clone())
            .header(
                "Accept",
                "application/atom+xml, application/rss+xml, application/xml, text/xml",
            )
            .header(
                "User-Agent",
                "OpenPolityraIngestion/0.1 (+source registry crawler)",
            )
            .send()
            .await?;
        let status = response.status();
        if status.is_redirection() {
            if redirect == MAX_REDIRECTS {
                bail!("too many redirects");
            }
            let location = response
                .headers()
                .get(reqwest::header::LOCATION)
                .and_then(|value| value.to_str().ok())
                .ok_or_else(|| anyhow!("redirect missing Location header"))?;
            current = current.join(location)?;
            continue;
        }
        if !status.is_success() {
            bail!("source returned HTTP {}", status.as_u16());
        }
        if response
            .content_length()
            .is_some_and(|size| size > MAX_RESPONSE_BYTES as u64)
        {
            bail!("source response exceeds {MAX_RESPONSE_BYTES} bytes");
        }
        let content_type = response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .map(str::to_owned);
        let status_code = status.as_u16() as i32;
        let mut stream = response.bytes_stream();
        let mut bytes = Vec::new();
        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            if bytes.len() + chunk.len() > MAX_RESPONSE_BYTES {
                bail!("source response exceeds {MAX_RESPONSE_BYTES} bytes");
            }
            bytes.extend_from_slice(&chunk);
        }
        let body = String::from_utf8(bytes)?;
        return Ok(FetchedResponse {
            body,
            content_type,
            final_url: current.to_string(),
            status: status_code,
        });
    }
    unreachable!()
}

async fn validate_public_url(
    url: &Url,
    allowed_host: &str,
) -> anyhow::Result<(IpAddr, String, u16)> {
    if url.scheme() != "https" || !url.username().is_empty() || url.password().is_some() {
        bail!("only credential-free HTTPS URLs are allowed");
    }
    let host = url
        .host_str()
        .ok_or_else(|| anyhow!("URL has no host"))?
        .to_ascii_lowercase();
    let allowed = allowed_host.trim_start_matches("www.").to_ascii_lowercase();
    let normalized_host = host.trim_start_matches("www.");
    if normalized_host != allowed && !normalized_host.ends_with(&format!(".{allowed}")) {
        bail!("redirect escaped the configured source host");
    }
    let port = url.port_or_known_default().unwrap_or(443);
    if port != 443 {
        bail!("non-standard ports are not allowed");
    }
    let addresses: Vec<_> = lookup_host((host.as_str(), port)).await?.collect();
    if addresses.is_empty() || addresses.iter().any(|socket| !is_public(socket.ip())) {
        bail!("source host did not resolve exclusively to public addresses");
    }
    Ok((addresses[0].ip(), host, port))
}

fn is_public(address: IpAddr) -> bool {
    match address {
        IpAddr::V4(ip) => {
            !(ip.is_private()
                || ip.is_loopback()
                || ip.is_link_local()
                || ip.is_multicast()
                || ip.is_unspecified()
                || ip.is_broadcast()
                || ip.is_documentation()
                || matches!(ip.octets(), [0, _, _, _])
                || (ip.octets()[0] == 100 && (64..=127).contains(&ip.octets()[1])))
        }
        IpAddr::V6(ip) => {
            !(ip.is_loopback()
                || ip.is_unspecified()
                || ip.is_multicast()
                || ip.is_unique_local()
                || ip.is_unicast_link_local())
        }
    }
}

fn parse_feed(
    body: &str,
    allowed_host: &str,
    base_url: &str,
) -> anyhow::Result<Vec<FetchedDocument>> {
    let feed = parser::Builder::new()
        .base_uri(Some(base_url))
        .build()
        .parse(body.as_bytes())?;
    let mut documents = Vec::new();
    for entry in feed.entries {
        let original_url = entry
            .links
            .first()
            .map(|link| link.href.clone())
            .unwrap_or_default();
        let parsed = Url::parse(&original_url).ok();
        if parsed
            .as_ref()
            .is_none_or(|url| !host_allowed(url, allowed_host))
        {
            warn!(url = %original_url, "ignored feed entry outside configured host");
            continue;
        }
        let content = entry
            .content
            .as_ref()
            .and_then(|content| content.body.as_deref())
            .or_else(|| {
                entry
                    .summary
                    .as_ref()
                    .map(|summary| summary.content.as_str())
            })
            .unwrap_or("");
        let raw_content = normalize_text(content);
        if raw_content.is_empty() {
            continue;
        }
        documents.push(FetchedDocument {
            external_id: Some(entry.id),
            title: entry
                .title
                .map(|title| title.content)
                .unwrap_or_else(|| "Untitled".to_owned()),
            canonical_url: original_url.clone(),
            original_url,
            document_type: "feed_entry".to_owned(),
            published_at: entry.published.or(entry.updated),
            raw_content,
            language: feed.language.clone(),
        });
        if documents.len() >= 100 {
            break;
        }
    }
    if documents.is_empty() {
        bail!("feed contained no valid supported entries");
    }
    Ok(documents)
}

fn host_allowed(url: &Url, allowed_host: &str) -> bool {
    let Some(host) = url.host_str() else {
        return false;
    };
    let host = host.trim_start_matches("www.");
    let allowed = allowed_host.trim_start_matches("www.");
    url.scheme() == "https" && (host == allowed || host.ends_with(&format!(".{allowed}")))
}

async fn store_document(
    pool: &PgPool,
    source_id: Uuid,
    document: FetchedDocument,
    job: &polityra_core::PipelineJob,
) -> anyhow::Result<bool> {
    let normalized = normalize_text(&document.raw_content);
    let hash = content_hash(&normalized);
    let mut tx = pool.begin().await?;
    let existing = sqlx::query(
        "SELECT id, content_hash, current_version FROM documents WHERE source_id = $1 AND canonical_url = $2 FOR UPDATE"
    )
    .bind(source_id)
    .bind(&document.canonical_url)
    .fetch_optional(&mut *tx)
    .await?;

    let (document_id, changed, version) = if let Some(row) = existing {
        let document_id: Uuid = row.try_get("id")?;
        let existing_hash: String = row.try_get("content_hash")?;
        if existing_hash == hash {
            tx.commit().await?;
            return Ok(false);
        }
        let next_version: i32 = row.try_get::<i32, _>("current_version")? + 1;
        sqlx::query(
            r#"
            INSERT INTO document_versions (
                document_id, version, content_hash, raw_content, normalized_text,
                title, published_at, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(document_id)
        .bind(next_version)
        .bind(&hash)
        .bind(&document.raw_content)
        .bind(&normalized)
        .bind(&document.title)
        .bind(document.published_at)
        .bind(json!({"external_id": document.external_id, "fetch_correlation_id": job.correlation_id}))
        .execute(&mut *tx)
        .await?;
        sqlx::query(
            r#"
            UPDATE documents
            SET content_hash = $2, title = $3, normalized_text = $4,
                published_at = $5, current_version = $6,
                metadata = metadata || $7::jsonb
            WHERE id = $1
            "#,
        )
        .bind(document_id)
        .bind(&hash)
        .bind(&document.title)
        .bind(&normalized)
        .bind(document.published_at)
        .bind(next_version)
        .bind(json!({"latest_fetch_correlation_id": job.correlation_id}))
        .execute(&mut *tx)
        .await?;
        (document_id, true, next_version)
    } else {
        let document_id: Uuid = sqlx::query_scalar(
            r#"
            INSERT INTO documents (
                source_id, external_id, canonical_url, original_url, title,
                document_type, published_at, language, content_hash, normalized_text, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
            "#,
        )
        .bind(source_id)
        .bind(document.external_id.as_deref())
        .bind(&document.canonical_url)
        .bind(&document.original_url)
        .bind(&document.title)
        .bind(&document.document_type)
        .bind(document.published_at)
        .bind(document.language.as_deref())
        .bind(&hash)
        .bind(&normalized)
        .bind(json!({"fetch_correlation_id": job.correlation_id}))
        .fetch_one(&mut *tx)
        .await?;
        sqlx::query(
            r#"
            INSERT INTO document_versions (
                document_id, version, content_hash, raw_content, normalized_text,
                title, published_at, metadata
            ) VALUES ($1, 1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(document_id)
        .bind(&hash)
        .bind(&document.raw_content)
        .bind(&normalized)
        .bind(&document.title)
        .bind(document.published_at)
        .bind(json!({"external_id": document.external_id, "fetch_correlation_id": job.correlation_id}))
        .execute(&mut *tx)
        .await?;
        (document_id, true, 1)
    };
    if changed {
        let similar = sqlx::query(
            r#"
            SELECT id, normalized_text FROM documents
            WHERE id <> $1 AND normalized_text IS NOT NULL
            ORDER BY ingested_at DESC LIMIT 100
            "#,
        )
        .bind(document_id)
        .fetch_all(&mut *tx)
        .await?;
        for row in similar {
            let candidate_id: Uuid = row.try_get("id")?;
            let candidate_text: String = row.try_get("normalized_text")?;
            let confidence = word_jaccard(&normalized, &candidate_text, 3);
            if confidence >= 0.9 {
                sqlx::query(
                    r#"
                    INSERT INTO document_relationships (
                        from_document_id, to_document_id, relationship, confidence
                    ) VALUES ($1, $2, 'near_duplicate', $3)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(candidate_id)
                .bind(document_id)
                .bind(confidence)
                .execute(&mut *tx)
                .await?;
            }
        }
        polityra_queue::enqueue(
            &mut *tx,
            "document.extract_claims",
            json!({"contractVersion": 1, "documentId": document_id}),
            &format!("{document_id}:v{version}"),
            20,
            job.correlation_id,
        )
        .await?;
    }
    tx.commit().await?;
    Ok(true)
}

async fn extract_document(pool: &PgPool, job: &polityra_core::PipelineJob) -> anyhow::Result<()> {
    let document_id: Uuid = serde_json::from_value(job.payload["documentId"].clone())?;
    let row = sqlx::query(
        r#"
        SELECT d.id, d.source_id, d.title, d.normalized_text, d.language, d.published_at
        FROM documents d WHERE d.id = $1
        "#,
    )
    .bind(document_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| anyhow!("document not found"))?;
    let endpoint = std::env::var("PYTHON_SERVICE_URL")
        .unwrap_or_else(|_| "http://analysis-worker:8000".to_owned());
    let request = polityra_core::ExtractionRequest {
        document_id,
        source_id: row.try_get("source_id")?,
        title: row.try_get("title")?,
        text: row
            .try_get::<Option<String>, _>("normalized_text")?
            .unwrap_or_default(),
        language: row.try_get("language")?,
        published_at: row.try_get("published_at")?,
    };
    let response = Client::new()
        .post(format!("{endpoint}/api/v1/intelligence/extract"))
        .bearer_auth(
            std::env::var("INTERNAL_SERVICE_TOKEN")
                .context("INTERNAL_SERVICE_TOKEN is required for Python extraction")?,
        )
        .json(&request)
        .send()
        .await?
        .error_for_status()?;
    let result: serde_json::Value = response.json().await?;
    store_extraction(pool, document_id, result).await
}

async fn store_extraction(
    pool: &PgPool,
    document_id: Uuid,
    result: serde_json::Value,
) -> anyhow::Result<()> {
    let claims = result
        .get("claims")
        .and_then(|value| value.as_array())
        .ok_or_else(|| anyhow!("Python response is missing claims"))?;
    let entities = result
        .get("entities")
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default();
    let events = result
        .get("events")
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default();
    let mut tx = pool.begin().await?;
    let mut claim_rows = Vec::new();
    for claim in claims {
        let claim_id: Option<Uuid> = sqlx::query_scalar(
            r#"
            INSERT INTO claims (
                document_id, subject, predicate, object, claim_text, claim_type,
                source_start, source_end, language, extraction_model, extraction_confidence
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (document_id, source_start, source_end) DO UPDATE
            SET extraction_model = EXCLUDED.extraction_model
            RETURNING id
            "#,
        )
        .bind(document_id)
        .bind(claim["subject"].as_str())
        .bind(claim["predicate"].as_str().unwrap_or("states"))
        .bind(claim["object"].as_str())
        .bind(claim["text"].as_str().unwrap_or_default())
        .bind(claim["claim_type"].as_str().unwrap_or("factual_statement"))
        .bind(claim["source_start"].as_i64().unwrap_or_default() as i32)
        .bind(claim["source_end"].as_i64().unwrap_or_default() as i32)
        .bind(claim["language"].as_str())
        .bind(
            claim["extraction_model"]
                .as_str()
                .unwrap_or("deterministic-v1"),
        )
        .bind(claim["extraction_confidence"].as_f64().unwrap_or(0.5))
        .fetch_optional(&mut *tx)
        .await?;
        if let Some(id) = claim_id {
            claim_rows.push((
                id,
                claim["source_start"].as_i64().unwrap_or_default(),
                claim["source_end"].as_i64().unwrap_or_default(),
            ));
        }
    }
    let mut entity_rows = Vec::new();
    for entity in entities {
        let entity_id: Uuid = sqlx::query_scalar(
            r#"
            INSERT INTO entities (canonical_name, entity_type)
            VALUES ($1, $2)
            ON CONFLICT (canonical_name, entity_type) DO UPDATE
            SET canonical_name = EXCLUDED.canonical_name
            RETURNING id
            "#,
        )
        .bind(entity["name"].as_str().unwrap_or_default())
        .bind(entity["entity_type"].as_str().unwrap_or("named_entity"))
        .fetch_one(&mut *tx)
        .await?;
        entity_rows.push((
            entity_id,
            entity["source_start"].as_i64().unwrap_or_default(),
            entity["source_end"].as_i64().unwrap_or_default(),
        ));
    }
    for (claim_id, claim_start, claim_end) in &claim_rows {
        for (entity_id, entity_start, entity_end) in &entity_rows {
            if entity_start < claim_end && entity_end > claim_start {
                sqlx::query(
                    r#"
                    INSERT INTO claim_entities (claim_id, entity_id, role, confidence)
                    VALUES ($1, $2, 'mentioned', 0.5)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(claim_id)
                .bind(entity_id)
                .execute(&mut *tx)
                .await?;
            }
        }
    }
    for event in events {
        let Some(offset) = event["claim_offsets"]
            .as_array()
            .and_then(|offsets| offsets.first())
            .and_then(|offset| offset.as_array())
        else {
            continue;
        };
        let event_start = offset[0].as_i64().unwrap_or_default();
        let event_end = offset[1].as_i64().unwrap_or_default();
        let event_type = event["event_type"]
            .as_str()
            .unwrap_or("public_announcement");
        let event_id: Uuid = sqlx::query_scalar(
            r#"
            INSERT INTO events (idempotency_key, event_type, title, occurred_at, metadata)
            VALUES ($1, $2, $3, $4::timestamptz, $5::jsonb)
            ON CONFLICT (idempotency_key) DO UPDATE SET title = EXCLUDED.title
            RETURNING id
            "#,
        )
        .bind(format!("{document_id}:{event_start}:{event_type}"))
        .bind(event_type)
        .bind(event["title"].as_str().unwrap_or_default())
        .bind(event["occurred_at"].as_str())
        .bind(json!({"document_id": document_id, "source_text": event["source_text"]}))
        .fetch_one(&mut *tx)
        .await?;
        for (claim_id, claim_start, claim_end) in &claim_rows {
            if *claim_start == event_start && *claim_end == event_end {
                sqlx::query(
                    r#"
                    INSERT INTO event_claims (event_id, claim_id, relationship)
                    VALUES ($1, $2, 'supports') ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(event_id)
                .bind(claim_id)
                .execute(&mut *tx)
                .await?;
            }
        }
    }
    for (claim_id, _, _) in &claim_rows {
        polityra_queue::enqueue(
            &mut *tx,
            "claim.find_evidence",
            json!({"contractVersion": 1, "claimId": claim_id}),
            &format!("{claim_id}:initial"),
            10,
            Uuid::new_v4(),
        )
        .await?;
    }
    tx.commit().await?;
    Ok(())
}

async fn post_intelligence(
    path: &str,
    body: serde_json::Value,
) -> anyhow::Result<serde_json::Value> {
    let endpoint = std::env::var("PYTHON_SERVICE_URL")
        .unwrap_or_else(|_| "http://analysis-worker:8000".into());
    let token =
        std::env::var("INTERNAL_SERVICE_TOKEN").context("INTERNAL_SERVICE_TOKEN is required")?;
    let response = Client::new()
        .post(format!("{endpoint}{path}"))
        .bearer_auth(token)
        .json(&body)
        .send()
        .await?
        .error_for_status()?;
    Ok(response.json().await?)
}

async fn find_claim_evidence(
    pool: &PgPool,
    job: &polityra_core::PipelineJob,
) -> anyhow::Result<()> {
    let claim_id: Uuid = serde_json::from_value(job.payload["claimId"].clone())?;
    let claim = sqlx::query("SELECT id, document_id, claim_text FROM claims WHERE id = $1")
        .bind(claim_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| anyhow!("claim not found"))?;
    let candidates = sqlx::query(
        r#"
        SELECT id, source_id, normalized_text, metadata
        FROM documents
        WHERE id <> $1 AND normalized_text IS NOT NULL
        ORDER BY ingested_at DESC
        LIMIT 100
        "#,
    )
    .bind(claim.try_get::<Uuid, _>("document_id")?)
    .fetch_all(pool)
    .await?;
    let candidates: Vec<_> = candidates
        .into_iter()
        .map(|row| {
            let metadata: serde_json::Value = row.try_get("metadata").unwrap_or_else(|_| json!({}));
            json!({
                "document_id": row.try_get::<Uuid, _>("id").unwrap_or_default(),
                "source_id": row.try_get::<Uuid, _>("source_id").unwrap_or_default(),
                "dependency_root": metadata.get("dependency_root").and_then(|value| value.as_str()),
                "text": row.try_get::<Option<String>, _>("normalized_text").unwrap_or_default().unwrap_or_default()
            })
        })
        .collect();
    let result = post_intelligence(
        "/api/v1/intelligence/match-evidence",
        json!({
            "claim_id": claim_id,
            "claim_text": claim.try_get::<String, _>("claim_text")?,
            "candidates": candidates
        }),
    )
    .await?;
    let mut tx = pool.begin().await?;
    for matched in result["matches"].as_array().unwrap_or(&Vec::new()) {
        sqlx::query(
            r#"
            INSERT INTO evidence (
                claim_id, document_id, stance, quote, source_start, source_end,
                dependency_root, relevance, match_method
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING
            "#,
        )
        .bind(claim_id)
        .bind(
            matched["document_id"]
                .as_str()
                .and_then(|value| Uuid::parse_str(value).ok()),
        )
        .bind(matched["stance"].as_str().unwrap_or("context"))
        .bind(matched["quote"].as_str().unwrap_or_default())
        .bind(matched["source_start"].as_i64().unwrap_or_default() as i32)
        .bind(matched["source_end"].as_i64().unwrap_or(1) as i32)
        .bind(
            matched["dependency_root"]
                .as_str()
                .and_then(|value| Uuid::parse_str(value).ok()),
        )
        .bind(matched["relevance"].as_f64().unwrap_or(0.0))
        .bind(
            matched["match_method"]
                .as_str()
                .unwrap_or("deterministic-token-overlap-v1"),
        )
        .execute(&mut *tx)
        .await?;
    }
    polityra_queue::enqueue(
        &mut *tx,
        "claim.verify",
        json!({"contractVersion": 1, "claimId": claim_id}),
        &format!("{claim_id}:initial"),
        10,
        job.correlation_id,
    )
    .await?;
    tx.commit().await?;
    Ok(())
}

async fn verify_claim(pool: &PgPool, job: &polityra_core::PipelineJob) -> anyhow::Result<()> {
    let claim_id: Uuid = serde_json::from_value(job.payload["claimId"].clone())?;
    let evidence = sqlx::query(
        r#"
        SELECT e.id, e.document_id, d.source_id, e.dependency_root, e.stance,
               e.quote, e.source_start, e.source_end, d.published_at
        FROM evidence e JOIN documents d ON d.id = e.document_id
        WHERE e.claim_id = $1
        "#,
    )
    .bind(claim_id)
    .fetch_all(pool)
    .await?;
    let candidates: Vec<_> = evidence
        .iter()
        .map(|row| {
            json!({
                "id": row.try_get::<Uuid, _>("id").unwrap_or_default(),
                "document_id": row.try_get::<Uuid, _>("document_id").unwrap_or_default(),
                "source_id": row.try_get::<Uuid, _>("source_id").unwrap_or_default(),
                "dependency_root": row.try_get::<Option<Uuid>, _>("dependency_root").unwrap_or_default(),
                "stance": row.try_get::<String, _>("stance").unwrap_or_else(|_| "context".into()),
                "quote": row.try_get::<String, _>("quote").unwrap_or_default(),
                "source_start": row.try_get::<i32, _>("source_start").unwrap_or_default(),
                "source_end": row.try_get::<i32, _>("source_end").unwrap_or(1),
                "published_at": row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("published_at").unwrap_or_default()
            })
        })
        .collect();
    let result = post_intelligence(
        "/api/v1/intelligence/verify",
        json!({"claim_id": claim_id, "evidence": candidates}),
    )
    .await?;
    let status = result["status"]
        .as_str()
        .ok_or_else(|| anyhow!("verification response missing status"))?;
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"
        INSERT INTO claim_verifications (
            claim_id, status, reasoning, model, supporting_evidence_ids,
            contradictory_evidence_ids
        ) VALUES ($1, $2, $3, 'deterministic-verification-v1',
                  ARRAY(SELECT jsonb_array_elements_text($4::jsonb)::uuid),
                  ARRAY(SELECT jsonb_array_elements_text($5::jsonb)::uuid))
        "#,
    )
    .bind(claim_id)
    .bind(status)
    .bind(result["reasoning"].as_str().unwrap_or_default())
    .bind(json!(result["supporting_evidence_ids"]))
    .bind(json!(result["contradictory_evidence_ids"]))
    .execute(&mut *tx)
    .await?;
    sqlx::query("UPDATE claims SET status = $2 WHERE id = $1")
        .bind(claim_id)
        .bind(status)
        .execute(&mut *tx)
        .await?;
    polityra_queue::enqueue(
        &mut *tx,
        "analysis.create",
        json!({"contractVersion": 1, "claimId": claim_id}),
        &format!("{claim_id}:{status}"),
        0,
        job.correlation_id,
    )
    .await?;
    tx.commit().await?;
    Ok(())
}

async fn create_analysis(pool: &PgPool, job: &polityra_core::PipelineJob) -> anyhow::Result<()> {
    let claim_id: Uuid = serde_json::from_value(job.payload["claimId"].clone())?;
    let row = sqlx::query(
        r#"
        SELECT c.id, c.document_id, c.claim_text, c.status, d.title AS document_title,
          COALESCE(array_agg(e.id) FILTER (WHERE e.stance = 'supports'), '{}') AS supporting,
          COALESCE(array_agg(e.id) FILTER (WHERE e.stance = 'contradicts'), '{}') AS contradicting
        FROM claims c
        JOIN documents d ON d.id = c.document_id
        LEFT JOIN evidence e ON e.claim_id = c.id
        WHERE c.id = $1
        GROUP BY c.id, c.document_id, c.claim_text, c.status, d.title
        "#,
    )
    .bind(claim_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| anyhow!("claim not found for analysis"))?;
    let supporting: Vec<Uuid> = row.try_get("supporting")?;
    let contradicting: Vec<Uuid> = row.try_get("contradicting")?;
    let document_id: Uuid = row.try_get("document_id")?;
    let result = post_intelligence(
        "/api/v1/intelligence/report",
        json!({
            "claim_id": claim_id,
            "document_id": document_id,
            "document_title": row.try_get::<String, _>("document_title")?,
            "claim_text": row.try_get::<String, _>("claim_text")?,
            "status": row.try_get::<String, _>("status")?,
            "evidence_ids": supporting,
            "contradictory_evidence_ids": contradicting
        }),
    )
    .await?;
    let title: String = result["title"]
        .as_str()
        .unwrap_or("Intelligence report")
        .to_owned();
    let mut tx = pool.begin().await?;
    let analysis_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO analyses (user_id, title, description, parameters, status, result)
        VALUES (NULL, $1, $2, $3::jsonb, 'completed', $4::jsonb)
        ON CONFLICT ((parameters->>'claimId'))
          WHERE user_id IS NULL AND parameters->>'kind' = 'automatic-intelligence'
        DO UPDATE SET title = EXCLUDED.title, result = EXCLUDED.result, updated_at = now()
        RETURNING id
        "#,
    )
    .bind(title)
    .bind("Deterministic evidence-linked claim report")
    .bind(json!({"kind": "automatic-intelligence", "claimId": claim_id}))
    .bind(&result)
    .fetch_one(&mut *tx)
    .await?;
    for citation in result["citations"].as_array().unwrap_or(&Vec::new()) {
        sqlx::query(
            r#"
            INSERT INTO analysis_evidence (
                analysis_id, claim_id, citation_key, statement_type
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (analysis_id, citation_key)
            DO UPDATE SET claim_id = EXCLUDED.claim_id, statement_type = EXCLUDED.statement_type
            "#,
        )
        .bind(analysis_id)
        .bind(
            citation["claim_id"]
                .as_str()
                .and_then(|value| Uuid::parse_str(value).ok()),
        )
        .bind(citation["key"].as_str().unwrap_or("C1"))
        .bind(
            citation["statement_type"]
                .as_str()
                .unwrap_or("unverified_claim"),
        )
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(())
}

async fn create_manual_analysis(
    pool: &PgPool,
    job: &polityra_core::PipelineJob,
) -> anyhow::Result<()> {
    let analysis_id: Uuid = serde_json::from_value(job.payload["analysisId"].clone())?;
    let analysis = sqlx::query(
        "SELECT user_id, title, parameters FROM analyses WHERE id = $1 AND user_id IS NOT NULL",
    )
    .bind(analysis_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| anyhow!("manual analysis not found"))?;
    let user_id: Uuid = analysis.try_get("user_id")?;
    let parameters: serde_json::Value = analysis.try_get("parameters")?;
    sqlx::query(
        "UPDATE analyses SET status = 'running', error_message = NULL, updated_at = now() WHERE id = $1",
    )
    .bind(analysis_id)
    .execute(pool)
    .await?;

    let outcome = execute_manual_analysis(pool, analysis_id, user_id, parameters).await;
    if let Err(error) = outcome {
        let status = if job.attempts >= job.max_attempts {
            "failed"
        } else {
            "pending"
        };
        sqlx::query(
            "UPDATE analyses SET status = $2, error_message = $3, updated_at = now() WHERE id = $1",
        )
        .bind(analysis_id)
        .bind(status)
        .bind(error.to_string())
        .execute(pool)
        .await?;
        return Err(error);
    }
    Ok(())
}

async fn execute_manual_analysis(
    pool: &PgPool,
    analysis_id: Uuid,
    user_id: Uuid,
    parameters: serde_json::Value,
) -> anyhow::Result<()> {
    let source_ids = uuid_array(&parameters, "sourceIds");
    let indicator_ids = uuid_array(&parameters, "indicatorIds");
    let report_ids = uuid_array(&parameters, "reportIds");
    let scenario_ids = uuid_array(&parameters, "scenarioIds");

    let sources = sqlx::query(
        "SELECT id, name, publisher, category, description, canonical_url FROM sources WHERE id = ANY($1::uuid[])",
    )
    .bind(&source_ids)
    .fetch_all(pool)
    .await?;
    let indicators = sqlx::query(
        "SELECT id, name, category, unit, frequency, description FROM indicators WHERE id = ANY($1::uuid[])",
    )
    .bind(&indicator_ids)
    .fetch_all(pool)
    .await?;
    let reports = sqlx::query(
        "SELECT id, title, status, format, content, created_at FROM reports WHERE id = ANY($1::uuid[]) AND (user_id = $2 OR user_id IS NULL)",
    )
    .bind(&report_ids)
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    let scenarios = sqlx::query(
        "SELECT id, name, description, assumptions, parameters, created_at FROM scenarios WHERE id = ANY($1::uuid[]) AND (created_by = $2 OR created_by IS NULL)",
    )
    .bind(&scenario_ids)
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    if source_ids.len() != sources.len()
        || indicator_ids.len() != indicators.len()
        || report_ids.len() != reports.len()
        || scenario_ids.len() != scenarios.len()
    {
        bail!("one or more selected records are unavailable");
    }

    let source_context = rows_json(sources);
    let indicator_context = rows_json(indicators);
    let report_context = rows_json(reports);
    let scenario_context = rows_json(scenarios);
    let context = [
        parameters
            .get("context")
            .and_then(|value| value.as_str())
            .unwrap_or_default()
            .to_owned(),
        if source_context.is_empty() {
            String::new()
        } else {
            format!("Sources from the database:\n{source_context}")
        },
        if indicator_context.is_empty() {
            String::new()
        } else {
            format!("Indicators from the database:\n{indicator_context}")
        },
        if report_context.is_empty() {
            String::new()
        } else {
            format!("Reports from the database:\n{report_context}")
        },
        if scenario_context.is_empty() {
            String::new()
        } else {
            format!("Scenarios from the database:\n{scenario_context}")
        },
    ]
    .into_iter()
    .filter(|value| !value.trim().is_empty())
    .collect::<Vec<_>>()
    .join("\n\n");

    if context.trim().is_empty() && parameters.get("observations").is_none() {
        bail!("select a database record or provide context");
    }
    let request = json!({
        "topic": parameters["topic"].as_str().unwrap_or("Untitled analysis"),
        "context": context,
        "observations": parameters.get("observations"),
        "scope": parameters.get("scope").and_then(|value| value.as_str()).unwrap_or("topic"),
        "time_horizon": parameters.get("time_horizon").and_then(|value| value.as_i64()).unwrap_or(30),
        "methodology": parameters.get("methodology").and_then(|value| value.as_str()).unwrap_or("comprehensive"),
        "enable_ai_synthesis": parameters.get("enable_ai_synthesis").and_then(|value| value.as_bool()).unwrap_or(true)
    });
    let result = post_intelligence("/api/v1/analysis", request).await?;
    sqlx::query(
        "UPDATE analyses SET status = 'completed', result = $2::jsonb, error_message = NULL, updated_at = now() WHERE id = $1",
    )
    .bind(analysis_id)
    .bind(result)
    .execute(pool)
    .await?;
    Ok(())
}

fn uuid_array(parameters: &serde_json::Value, key: &str) -> Vec<Uuid> {
    parameters
        .get(key)
        .and_then(|value| value.as_array())
        .into_iter()
        .flatten()
        .filter_map(|value| value.as_str())
        .filter_map(|value| Uuid::parse_str(value).ok())
        .collect()
}

fn rows_json(rows: Vec<sqlx::postgres::PgRow>) -> String {
    let values: Vec<_> = rows
        .into_iter()
        .map(|row| {
            let mut object = serde_json::Map::new();
            for column in row.columns() {
                if let Ok(value) = row.try_get::<serde_json::Value, _>(column.name()) {
                    object.insert(column.name().to_owned(), value);
                } else if let Ok(value) = row.try_get::<String, _>(column.name()) {
                    object.insert(column.name().to_owned(), serde_json::Value::String(value));
                } else if let Ok(value) = row.try_get::<Option<String>, _>(column.name()) {
                    object.insert(
                        column.name().to_owned(),
                        value.map_or(serde_json::Value::Null, serde_json::Value::String),
                    );
                }
            }
            serde_json::Value::Object(object)
        })
        .collect();
    serde_json::to_string(&values).unwrap_or_else(|_| "[]".to_owned())
}
