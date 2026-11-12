# Deployment

This repository does not establish a production deployment target or a supported public service. The
scripts and configuration are development scaffolding; deployment must be reviewed and configured by
project maintainers before use.

## Before deploying

- Select and document the hosting environment, data residency, domain, and service ownership.
- Set secrets through the platform's secret manager; do not commit `.env`.
- The API loads the repository-root `.env` for local runs. On Vercel, `.env` is not deployed;
  configure variables in the Vercel project settings for each needed environment so they are
  available to the API service at runtime.
- For the API service, configure these required Vercel runtime variables in each environment you
  deploy (Production, and Preview if you test preview deployments):
  - `DATABASE_URL`: use the Supabase **Transaction pooler** connection string from the dashboard's
    **Connect** dialog (port `6543`) for this serverless API. Do not use the direct
    `db.<project-ref>.supabase.co:5432` endpoint unless the project has IPv4 connectivity enabled;
    direct endpoints may resolve to IPv6 addresses that the Vercel function cannot reach.
  - `JWT_SECRET`: a randomly generated secret of at least 32 characters.
- The API connects with `pg` directly, so it does not need `SUPABASE_URL` or a Supabase API key. Do
  not expose either required value through a `NEXT_PUBLIC_` variable.
- Provision and secure PostgreSQL for database-backed API functionality.
- For Vercel Services, leave `NEXT_PUBLIC_API_URL` unset so the browser uses the same-origin
  `/api/v1` route to the API service. If the variable is set to a localhost URL in production, the
  frontend ignores it and uses the same-origin route.
- For deployments where the API is hosted separately, set `NEXT_PUBLIC_API_URL` to its HTTPS origin
  (without an `/api` path), and configure CORS and authentication appropriately.
- Review the Python worker's permissive development CORS setting and placeholder readiness checks
  before exposing it.
- Test build, migrations, health/readiness semantics, backup restoration, logging, and rollback
  procedures in a non-production environment.
- Publish an alpha disclaimer, supported-use policy, and contact path for security reports.

## Vercel build troubleshooting

The root workspace uses the pnpm version pinned in `package.json` and the root `pnpm-lock.yaml`.
Service directories also contain npm lockfiles; check the deployment logs and project build
overrides if Vercel selects npm for one service but invokes pnpm or Turbo elsewhere. Do not assume
the two lockfile sets describe identical dependencies.

To select the pinned pnpm version on Vercel, set `ENABLE_EXPERIMENTAL_COREPACK=1` for the deployment
environment and use a supported Node.js version, such as Node 22. Review any Install Command and
Build Command overrides in the project settings: an override can change which package manager or
workspace is used. Deploy a preview and confirm the logs show the expected install and successful
build before promoting it.

`ERR_INVALID_THIS` / `Value of "this" must be of type URLSearchParams` during a pnpm registry
request can indicate an incompatible older pnpm version. Record the actual Node and pnpm versions in
the build log before attributing the error to a particular version. A separate warning about a
missing `microfrontends.json` means the project is in a microfrontends group; review the group's
configuration independently rather than treating that warning as the package installation error.

The fiscal-balance prototype serves a checked-in public-data snapshot. Refreshing it is a separate
source-data operation and should be reviewed before publication.
