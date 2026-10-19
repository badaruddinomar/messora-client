# Messora Client

Web app for **Messora** — mess management made simple.

**Stack:** Next.js 16 (App Router) · TypeScript · Redux Toolkit + RTK Query · Zod 4 + React Hook Form · nuqs · Tailwind CSS 4

## Getting started

Start the API first ([messora-server](https://github.com/badaruddinomar/messora-server)), then:

```bash
npm install
cp .env.example .env.local   # API_URL=http://localhost:5000
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |

## How it fits together

- **API calls** go to `/api/v1/*` on the Next.js origin and are rewritten to `API_URL` (see `next.config.ts`).
  This keeps the httpOnly auth cookies first-party, so there are no cross-site cookie issues in production.
- **RTK Query** — `src/store/api.ts` is the root API slice. On a `401` it calls `/auth/refresh` once
  (shared across concurrent requests) and retries; if refresh fails the user is logged out.
  Features add endpoints with `api.injectEndpoints` (e.g. `src/features/auth/auth-api.ts`).
- **Redux store** — `src/store/index.ts`; the `auth` slice holds the current user and session status.
- **Forms** — React Hook Form with Zod schemas (`src/features/<feature>/schemas.ts`).
- **URL state** — nuqs (e.g. `?next=` after login, the steps of the forgot-password flow).
  Components using nuqs must sit under a `<Suspense>` boundary (required by Cache Components).
- **Route protection** — `(app)` routes are wrapped in `<RequireAuth>`, `(auth)` routes in `<RequireGuest>`.

```
src/
  app/
    (auth)/   login, register, forgot-password
    (app)/    dashboard, verify-email
  components/ui/      Button, Field, Alert
  features/auth/      auth-api, auth-slice, schemas, components
  store/              store, root API slice, typed hooks
  providers/          Redux + nuqs providers
```
