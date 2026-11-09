# Open Polityra Web

The web application is the Next.js frontend for Open Polityra. It includes public project and
research pages, plus an authenticated workspace for exploring research data and analyses.

## Requirements

- Node.js 22 or later
- pnpm 10 (the version managed by the repository's `packageManager` field)
- The repository dependencies installed from the monorepo root

## Run locally

From the repository root:

```bash
corepack enable
pnpm install
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000).

To run the frontend from its package directory instead:

```bash
cd apps/web
pnpm dev
```

The workspace provides the following frontend commands:

```bash
pnpm --filter web build
pnpm --filter web start
pnpm --filter web lint
pnpm --filter web typecheck
```

`build` creates a production Next.js build; run `start` after building to serve it locally.

## Pages

| Route                    | Purpose                           |
| ------------------------ | --------------------------------- |
| `/`                      | Project overview                  |
| `/about`                 | Project scope and principles      |
| `/research`              | Research areas and project status |
| `/methodology`           | Research methods and standards    |
| `/login` and `/register` | Workspace access                  |
| `/dashboard`             | Authenticated research workspace  |
| `/ai-workflow`           | Authenticated analysis workflows  |

The dashboard and workflow routes are protected application pages rather than public search landing
pages. Login, registration, and workspace pages are marked `noindex`.

## Configuration

The frontend reads its public API address from `NEXT_PUBLIC_API_URL`. For local development, the
repository's root `.env.example` documents the default API at `http://localhost:4000`; copy it to
`.env` at the repository root if you are running the API locally. The API can also be run with:

```bash
pnpm --filter @open-polityra/api dev
```

`NEXT_PUBLIC_REPO_URL` optionally overrides the GitHub repository link shown in the site. Do not put
credentials or server-only secrets in `NEXT_PUBLIC_*` variables; Next.js exposes those values to
browsers.

## SEO metadata

Page titles, descriptions, canonical URLs, and social-sharing metadata use Next.js's Metadata API.
Public informational pages are listed in the generated `/sitemap.xml`; `/robots.txt` points crawlers
to that sitemap. The Open Graph image is served from `/og-image.png`.

The canonical origin is configured in `src/lib/site.ts`. Update `SITE_URL` there if the production
domain changes.

## Related documentation

- [Monorepo setup and architecture](../../README.md)
- [API package](../api/)
- [Next.js documentation](https://nextjs.org/docs)
