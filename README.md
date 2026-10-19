# Messora Client

Web app for **Messora** — mess management made simple.

**Stack:** Next.js 16 (App Router) · TypeScript · Redux Toolkit + RTK Query · Zod 4 + React Hook Form · nuqs · Tailwind CSS 4 · shadcn/ui (Radix) · lucide · sonner · motion

**Docs:** [Roadmap](docs/ROADMAP.md) · [Design system](docs/DESIGN_SYSTEM.md) · [Frontend guide](docs/FRONTEND_GUIDE.md)

## Getting started

Start the API first ([messora-server](https://github.com/badaruddinomar/messora-server)), then:

```bash
npm install
cp .env.example .env.local   # API_URL=http://localhost:5000
npm run dev                  # http://localhost:3000
```

## Scripts

| Script                        | What it does                       |
| ----------------------------- | ---------------------------------- |
| `npm run dev`                 | Dev server                         |
| `npm run build` / `npm start` | Production build and serve         |
| `npm run lint`                | ESLint                             |
| `npm run format`              | Prettier (sorts Tailwind classes)  |
| `npm run typecheck`           | Generate route types and run `tsc` |
| `npm test`                    | Unit + component tests (Vitest)    |
| `npm run test:e2e`            | End-to-end tests (Playwright)      |

E2E tests need the API running. Start it with a raised auth rate limit, since the suite signs up many users:
`AUTH_RATE_LIMIT=1000 npm run dev` in messora-server.

## How it fits together

- **API calls** go to `/api/v1/*` on the Next.js origin and are rewritten to `API_URL` (see `next.config.ts`).
  This keeps the httpOnly auth cookies first-party, so there are no cross-site cookie issues in production.
- **RTK Query** — `src/store/api.ts` is the root API slice. On a `401` it calls `/auth/refresh` once
  (shared across concurrent requests) and retries; if refresh fails the user is logged out.
  Features add endpoints with `api.injectEndpoints` (e.g. `src/features/auth/auth-api.ts`).
- **Redux store** — `src/store/index.ts`; the `auth` slice holds the current user and session status.
- **Forms** — React Hook Form with Zod schemas (`src/features/<feature>/<feature>-schemas.ts`), bound with the `Form` components in `components/ui/form.tsx`.
- **URL state** — nuqs (e.g. `?next=` after login, the steps of the forgot-password flow).
  Components using nuqs must sit under a `<Suspense>` boundary (required by Cache Components).
- **Route protection** — `(app)` routes are wrapped in `<RequireAuth>`, `(auth)` routes in `<RequireGuest>`.

```
src/
  app/                      # routing only: layouts, pages, metadata
    (auth)/                 # guest-only: login, register, forgot-password
    (app)/                  # logged-in: dashboard, verify-email
  components/
    ui/                     # shadcn-style primitives on Radix: Button, Input, Form, Dialog, Sheet, ...
    common/                 # app patterns: PageHeader, EmptyState, DataTable, MoneyText, StatusBadge, ...
    layout/                 # app shell: Sidebar, TopBar, BottomNav, UserMenu
  features/
    auth/
      auth-api.ts           # RTK Query endpoints (injectEndpoints)
      auth-slice.ts         # Redux slice
      auth-schemas.ts       # Zod form schemas
      components/           # forms, RequireAuth, RequireGuest
      hooks/                # useAuthStatus
      utils.ts
    dashboard/components/
  store/                    # store setup, root API slice (with token refresh), typed hooks
  providers/                # Redux, nuqs, theme, tooltips, toasts
  constants/                # route paths, navigation
  hooks/                    # shared hooks (useMediaQuery)
  lib/                      # framework-agnostic helpers (cn, API error parsing)
  types/                    # shared types (API envelope, User)
```

**Adding a feature** (e.g. `mess`): create `src/features/mess/` with `mess-api.ts` (inject endpoints into
`store/api.ts`), `mess-schemas.ts` and `components/`; keep the files under `app/` thin, so they only
import and render feature components.
