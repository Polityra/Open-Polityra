# Infrastructure Monitoring Configuration for Open Polityra

## Purpose
Define the monitoring and alerting configuration for all Open Polityra services.

## Services to Monitor

| Service | Port | Health Endpoint | Key Metrics |
|---|---|---|---|
| Frontend (Next.js) | 3000 | /api/health | Response time, error rate, active users |
| Backend API | 4000 | /api/v1/health | Request latency, error rate, queue depth |
| Analysis Worker | 8000 | /api/v1/health | Processing time, pipeline completion rate, AI provider health |
| PostgreSQL | 5432 | pg_isready | Connection count, query latency, replication lag |

## Alert Thresholds

- **P0 (Immediate)**: Any service down > 5 minutes
- **P1 (Urgent)**: Error rate > 5% on any service for > 10 minutes
- **P2 (Important)**: Response time > 2s on backend API for > 15 minutes
- **P3 (Warning)**: Database disk usage > 80%

## Data Retention

- Metrics: 30 days in detailed form, then aggregated to daily summaries
- Logs: 14 days in structured format, then archived for 90 days
- Audit logs: Retained indefinitely per governance requirements
