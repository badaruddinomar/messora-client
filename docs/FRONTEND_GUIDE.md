# Frontend guide

How the client is built, and the rules every feature follows. The UI rules are in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## 1. Folder structure

```
src/
  app/                       # routing only: layout.tsx, page.tsx, loading.tsx, error.tsx, metadata
    (auth)/                  # guest-only pages
    (app)/                   # logged-in pages
      m/[slug]/...           # mess-scoped pages (from Phase 2), e.g. /m/green-house/meals
  components/
    ui/                      # shadcn primitives (Button, Input, Dialog, ...)
    common/                  # app-level patterns (PageHeader, EmptyState, MoneyText, DataTable, ...)
    layout/                  # app shell (Sidebar, BottomNav, TopBar, MessSwitcher)
  features/<feature>/
    <feature>-api.ts         # RTK Query endpoints (api.injectEndpoints)
    <feature>-slice.ts       # client-only state, if any
    <feature>-schemas.ts     # Zod form schemas + inferred types
    <feature>-types.ts       # API types for this feature
    components/              # feature UI
    hooks/                   # feature hooks
    utils.ts
  store/                     # store, root API slice, typed hooks
  providers/                 # Redux, nuqs, theme, toaster
  constants/                 # routes, navigation, limits
  hooks/                     # hooks shared across features (useMediaQuery, ...)
  lib/                       # framework-agnostic helpers (format, cn, errors)
  types/                     # types shared across features (User, ApiResponse, Money)
  test/                      # Vitest setup
e2e/                         # Playwright specs
```

The `components/ui` primitives follow shadcn/ui's code and conventions (Radix + `cva` + `cn`). They were written by
hand because the shadcn registry wasn't reachable from the build environment; `npx shadcn add <component>` works too
when it is, as long as the result is adapted to our tokens.

**Rules**

- Files under `app/` stay thin: they read params, set metadata, and render a feature component.
- A feature may import from `components/`, `lib/`, `store/`, `types/` and `constants/`. Avoid feature-to-feature imports; if two features need something, move it to a shared folder.
- File names are kebab-case; components are PascalCase; hooks start with `use`.
- No barrel `index.ts` files in features (they hurt tree-shaking and blur the client/server boundary).

## 2. Server vs client components

- Pages and layouts are Server Components by default. Add `"use client"` only to the component that needs state, effects, browser APIs or Redux, and push it as far down the tree as possible.
- Cache Components is enabled. Anything that reads the URL on the client (nuqs, `useSearchParams`) must sit under a `<Suspense>` boundary, or the build fails.
- Before using a Next.js API you haven't used in this project yet, read its guide in `node_modules/next/dist/docs/` (this Next.js version has breaking changes).

## 3. Data fetching (RTK Query)

- All server data goes through RTK Query. **No** `fetch` in components and no copies of server data in slices.
- One `*-api.ts` per feature, injected into `store/api.ts`. Each endpoint `transformResponse`s the `{ data }` envelope away and declares `providesTags` / `invalidatesTags`.
- Tags are scoped by id: `{ type: "Bazar", id }` plus `{ type: "Bazar", id: "LIST" }`. Mutations invalidate exactly what they change.
- Optimistic updates (`onQueryStarted` + `updateQueryData`, undo on failure) for quick toggles: meals, reactions, read state.
- Mess-scoped endpoints take `messId` as an argument; build URLs with the shared helper.
- Realtime (Socket.IO) events update the RTK Query cache directly (`updateQueryData`) or invalidate tags. They never write to a separate store.

## 4. State: where does it live?

| State                                                                      | Where                      |
| -------------------------------------------------------------------------- | -------------------------- |
| Server data                                                                | RTK Query cache            |
| Shareable UI state: filters, tabs, selected month, pagination, wizard step | **URL with nuqs**          |
| Session (current user, auth status)                                        | `auth` slice               |
| Truly global client UI (sidebar collapsed, theme)                          | small slice or next-themes |
| Local UI (dialog open, hover)                                              | `useState`                 |

## 5. Forms

- React Hook Form + `zodResolver(schema)`. The schema lives in `<feature>-schemas.ts`; types come from `z.infer`.
- Map server validation errors (`details`) back to fields; show other errors in a form-level alert.
- Disable the submit button while pending, and never allow a double submit.
- Money inputs are validated as decimal **strings** and sent as strings; never `parseFloat` money.

## 6. Code quality

- TypeScript `strict`; no `any`, no non-null `!` except right after a guard.
- Components stay small (aim for under ~150 lines); extract subcomponents and hooks.
- No premature `useMemo`/`useCallback`; add them only for measured problems or stable references required by dependencies.
- No inline styles and no raw colors (see DESIGN_SYSTEM §3).
- Lazy-load heavy, rarely used UI (charts, PDF export, emoji picker, voice recorder) with `next/dynamic`.
- Images through `next/image`; user uploads served from the CDN with explicit sizes.
- ESLint and Prettier must pass with no warnings in CI.

## 7. Testing

| Kind       | Tool                     | What                                                                                                  |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Unit       | Vitest                   | formatters, hooks, utils, schema edge cases                                                           |
| Component  | Vitest + Testing Library | complex interactive components (meal grid, split preview, close wizard)                               |
| End to end | Playwright               | the critical flows: auth, create or join a mess, toggle meals, add and approve a bazar, close a month |

Unit and component tests live next to the code (`*.test.ts(x)`). E2E specs live in `e2e/` and run against the real
API, on a desktop and a phone viewport. Flows that need an emailed code are covered by the server's integration tests.

```bash
npm test                 # unit + component tests
npm run test:e2e         # e2e: start the API first (in messora-server: AUTH_RATE_LIMIT=1000 npm run dev)
```

## 8. PR checklist

- [ ] Lint, typecheck, unit tests and build pass
- [ ] The screen passes the DESIGN_SYSTEM polish checklist (§11)
- [ ] Loading, empty and error states; works at 360 px; works in dark mode
- [ ] Tags invalidated correctly (no stale data after a mutation)
- [ ] `docs/ROADMAP.md` boxes ticked (in both repos)
