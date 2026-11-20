# Intelligence data pipeline

## Runtime boundaries

1. The Express API owns authenticated orchestration and read APIs.
2. PostgreSQL is the durable handoff between every stage.
3. `polityra-ingestion` claims `pipeline_jobs` with `FOR UPDATE SKIP LOCKED`.
4. The FastAPI worker accepts typed extraction and verification payloads.
5. The Next.js application consumes the typed API-client methods.

The API process does not run ingestion timers. Vercel cron only enqueues work through
`GET /api/v1/pipeline/schedule`; a separately running Rust worker performs the long-lived work.

## Processing flow

```text
source.fetch
  -> source_fetch_runs
  -> immutable document_versions
  -> document.extract_claims
  -> claims + entities + events (exact offsets)
  -> claim.find_evidence
  -> evidence
  -> claim.verify
  -> claim_verifications
```

Jobs have an idempotency key, lease owner, bounded retry policy, attempt history, correlation ID and
dead-letter state. Retries use the job type and payload without relying on a process-local queue.

## Document integrity

Normalized text is SHA-256 hashed. A canonical source URL plus source ID identifies the document.
Changed content appends a `document_versions` row and advances the current version; it is never
silently deleted. Exact duplicates are not reprocessed.

## Security boundary

The Rust fetcher:

- permits HTTPS only;
- rejects credentials and non-standard ports;
- resolves every redirect and rejects private, loopback, link-local, multicast and reserved targets;
- pins the validated DNS answer for the request;
- bounds redirects, request duration and response size;
- treats feed entries from outside the registered source host as untrusted and ignores them.

External document text is passed to Python as data. The deterministic extraction endpoint extracts
only exact source spans and cannot generate unsupported text. Internal extraction and verification
calls are authenticated when `INTERNAL_SERVICE_TOKEN` is configured.

## Analysis boundary

Claim status and model confidence are separate. Verification states describe evidence availability
and provenance, not truth probabilities. AI-generated analysis must cite `claims` and `evidence`
records and remain distinguishable from verified observations, attributed statements, scenarios and
forecasts.
