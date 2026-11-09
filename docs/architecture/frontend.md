# Frontend Architecture — Open Polityra Platform

## Technology Stack

- **Framework**: Next.js 16+ with App Router (React Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with @tailwindcss/turbopack
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **State Management**: React context + useSyncExternalStore patterns

## Application Structure

```
apps/web/src/
├── app/                          # Next.js App Router pages
│   ├── (public)/                 # Public routes (no auth required)
│   │   ├── page.tsx              # Landing page
│   │   ├── about/page.tsx        # Mission and governance
│   │   ├── research/page.tsx     # Research areas overview
│   │   └── methodology/page.tsx  # Research methods documentation
│   ├── (dashboard)/              # Authenticated routes
│   │   ├── layout.tsx            # Sidebar + header layout
│   │   ├── dashboard/page.tsx    # Strategic overview
│   │   ├── economy/geopolitics/security/resilience/...
│   │   ├── scenarios/page.tsx    # Scenario modeling tools
│   │   ├── forecasting/page.tsx  # Forecast visualization
│   │   ├── reports/page.tsx      # Research report registry
│   │   └── sources/page.tsx      # Source explorer
│   └── api/                      # Next.js route handlers (minimal)
├── components/                   # Reusable UI components
│   ├── layout/Sidebar.tsx        # Navigation sidebar
│   ├── charts/SummaryChart.tsx   # Shared chart wrapper
│   └── common/                   # Buttons, dialogs, loading states
├── features/                     # Feature-specific modules
│   ├── economic-analysis/
│   ├── geopolitical-analysis/
│   ├── risk-analysis/
│   └── scenario-builder/
├── hooks/                        # Shared React hooks
├── lib/                          # API client and utilities
├── stores/                       # Client-side state management
├── types/                        # Frontend TypeScript types
└── styles/                       # Global styles and design tokens
```

## Key Design Decisions

1. **Shared UI via `@open-polityra/ui`**: All reusable components live in the shared UI package;
   pages compose them.
2. **Typed API client via `@open-polityra/api-client`**: No raw fetch calls in page code — all API
   interactions use the typed client.
3. **Dark navy/blue theme**: Professional visual identity matching Open Polityra's design tokens.
4. **Server Components by default**: Pages are server components; only interactive elements use
   `'use client'`.
