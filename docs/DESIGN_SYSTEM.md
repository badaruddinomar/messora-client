# Design system

The goal: Messora should feel **premium, calm and fast**, like a finance app people trust with their money. Every screen should look like it was made by the same person. This document is the reference; when in doubt, follow it rather than inventing a new pattern.

## 1. Principles

1. **Clarity over decoration.** Numbers and actions first. Show one primary action per screen.
2. **Consistency.** The same thing always looks and behaves the same: an amount, a status, a member row, a confirmation.
3. **Mobile first.** Most members use a phone, often one-handed. Design at 360 px first, then enhance for desktop.
4. **Instant feel.** Optimistic updates for small actions, skeletons instead of spinners, no layout shift.
5. **Trust.** Money is always exact, explained, and never ambiguous about who owes whom.

## 2. Stack

| Need       | Library                                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| Components | **shadcn/ui** (copied into `src/components/ui`, built on Radix: accessible by default) |
| Styling    | Tailwind CSS 4 with design tokens (CSS variables)                                      |
| Icons      | **lucide-react**, one icon set only                                                    |
| Toasts     | **sonner**                                                                             |
| Theme      | **next-themes**: light, dark, system                                                   |
| Animation  | **motion** (`motion/react`), used sparingly                                            |
| Tables     | **TanStack Table** (through a shared `DataTable`)                                      |
| Charts     | **Recharts**, styled with our tokens (see §9)                                          |
| Dates      | **date-fns** (+ `react-day-picker` for the date picker)                                |

Don't add a second library for something on this list.

## 3. Design tokens

All colors come from CSS variables in `src/app/globals.css`, defined for light **and** dark. **Never** use raw Tailwind palette colors (`bg-emerald-500`, `text-gray-400`) or hex values in components; use the semantic tokens.

| Token                                                         | Use                                          |
| ------------------------------------------------------------- | -------------------------------------------- |
| `background` / `foreground`                                   | page background and default text             |
| `card` / `card-foreground`                                    | surfaces (cards, sheets, popovers)           |
| `muted` / `muted-foreground`                                  | subtle backgrounds, secondary text           |
| `border`, `input`, `ring`                                     | borders, input borders, focus ring           |
| `primary` / `primary-foreground`                              | brand (emerald), primary buttons, active nav |
| `secondary`, `accent`                                         | secondary buttons, hover backgrounds         |
| `success`, `warning`, `destructive`, `info` (+ `-foreground`) | statuses, alerts, money direction            |

**Money colors (always the same):**

- the member owes (negative balance) → `destructive`
- the member gets money back (positive balance) → `success`
- settled / zero → `muted-foreground`

**Status colors:** `PENDING` → warning · `APPROVED`/`ACTIVE` → success · `REJECTED` → destructive · `CLOSED`/`LEFT` → muted · `OPEN` → info.
Use a single `StatusBadge` component so these never drift.

### Typography

- Latin: **Geist Sans**; Bangla: **Hind Siliguri** (or Noto Sans Bengali). Set both in the font stack, so mixed text renders well.
- Scale (Tailwind): `text-xs` 12 · `text-sm` 14 (default body in the app) · `text-base` 16 · `text-lg` 18 · `text-xl` 20 · `text-2xl` 24 (page titles) · `text-3xl` 30 (big stat numbers).
- Weights: 400 body, 500 labels and buttons, 600 headings. Avoid 700+ except big numbers.
- **Numbers use `tabular-nums`** (amounts, meal counts, tables), so columns line up and values don't jump when they change.

### Spacing, radius, elevation

- 4 px grid. Common gaps: `gap-2` inside controls, `gap-4` between fields, `gap-6` between sections, `p-4` (mobile) / `p-6` (desktop) inside cards.
- Radius: `rounded-md` for inputs and buttons, `rounded-xl` for cards, `rounded-full` for avatars and pills.
- Elevation: flat by default with `border`. `shadow-sm` for cards that float (popovers, dialogs, sticky bars). No heavy shadows.

## 4. Motion

Motion explains changes; it doesn't decorate.

| What                        | Duration   | Easing                       |
| --------------------------- | ---------- | ---------------------------- |
| Hover, press, toggle        | 150 ms     | ease-out                     |
| Popover, dropdown, tooltip  | 150–200 ms | ease-out (fade + 4 px slide) |
| Dialog, sheet, page section | 200–250 ms | ease-out in, ease-in out     |
| List item add or remove     | 200 ms     | layout animation             |

- Animate `opacity` and `transform` only, never layout properties like `width` or `top`.
- Honour `prefers-reduced-motion`: turn off slides and keep only fades.
- Buttons get a subtle press state (`active:scale-[0.98]`). Numbers that change (balances, totals) can count up briefly, at most 400 ms.

## 5. Layout

- **App shell:** desktop has a left sidebar (collapsible) and a top bar with the mess switcher, notifications and user menu. Mobile has a top bar and a **bottom navigation** with 5 items: Home, Meals, Bazar, Chat, More.
- Breakpoints: design at 360 px, then `sm` 640, `md` 768 (tablet), `lg` 1024 (sidebar appears), `xl` 1280.
- Content width: `max-w-6xl` for dashboards and tables, `max-w-2xl` for forms and settings, `max-w-md` for auth.
- Every page starts with a `PageHeader` (title, optional description, primary action on the right; on mobile the primary action becomes a floating or sticky button).
- On mobile, tables become **card lists** (the `DataTable` supports a card renderer). Never scroll the whole page sideways.
- Dialogs on desktop become **bottom sheets** on mobile (the `ResponsiveDialog` component).

## 6. Components

The shared kit lives in `src/components/ui` (shadcn primitives) and `src/components/common` (app-level patterns):

| Component                                                             | Rule                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                              | variants: default (primary), secondary, outline, ghost, destructive, link. Sizes: sm, default, lg, icon. **One primary button per view.** Show a spinner inside the button while pending, and disable it. |
| `Form` + `FormField`                                                  | Label above the input, help text below, the error replaces the help text. Required fields aren't marked with `*`; mark the _optional_ ones instead.                                                       |
| `Input`, `Select`, `Combobox`, `DatePicker`, `MoneyInput`, `OtpInput` | Height 40 px (44 px touch targets on mobile). `MoneyInput` shows ৳ and accepts only valid decimals.                                                                                                       |
| `Card`, `StatCard`                                                    | `StatCard` = label + big number + optional trend or helper text.                                                                                                                                          |
| `DataTable`                                                           | Sorting and filtering through nuqs (in the URL), a skeleton while loading, an empty state, and a card layout on mobile.                                                                                   |
| `StatusBadge`, `MoneyText`, `MemberAvatar`, `DateText`                | The **only** way to show a status, an amount, a member or a date.                                                                                                                                         |
| `EmptyState`                                                          | icon + one-line title + short explanation + primary action                                                                                                                                                |
| `ErrorState`                                                          | friendly message + "Try again" (calls `refetch`)                                                                                                                                                          |
| `ConfirmDialog`                                                       | for destructive or irreversible actions. The confirm button names the action ("Close October", not "OK").                                                                                                 |
| `ResponsiveDialog`                                                    | dialog on desktop, bottom sheet on mobile                                                                                                                                                                 |
| `Skeleton`                                                            | matches the shape of the content it replaces                                                                                                                                                              |

## 7. States & feedback

Every data view handles **loading, empty, error and success**. That's part of the definition of done.

- **Loading:** skeletons for content; spinners only inside buttons. Keep the previous data visible while refetching.
- **Optimistic UI** for quick toggles (meals, reactions, mark as read), with a rollback and an error toast if the request fails.
- **Toasts** (sonner) for the result of an action ("Deposit approved"), with **Undo** where it's cheap. Form validation errors stay **inline**, never in a toast.
- **Destructive actions** need a `ConfirmDialog`, or an undo toast for reversible ones.
- **Disabled actions** explain why in a tooltip ("Month is closed").

## 8. Content & formatting

- Voice: short, friendly, plain. Sentence case everywhere ("Add bazar", not "Add Bazar").
- Use the same words everywhere: **Mess, Member, Manager, Meal, Meal rate, Bazar, Deposit, Expense, Charge, Month, Due, Refund, Settle**.
- Money: `formatMoney()` → `৳1,250.50` (always 2 decimals in tables; drop `.00` in big stat cards). A negative balance reads "Due ৳500", never "-৳500".
- Dates: `12 Oct 2026` in lists, `Today` / `Yesterday` for recent items, relative time ("5 min ago") in chat and notifications.
- Meal counts: up to 2 decimals, trailing zeros dropped (`2.5`, `3`).

## 9. Charts

- One chart answers one question. Title it with the insight ("Meal rate is down 8% from September"), not just the metric.
- Use the token colors; a series in `primary`, comparisons in `muted-foreground`. At most 5 categorical colors.
- Always label axes and units (৳). Tooltips use `MoneyText` formatting. Every chart has an empty state.
- A single series uses `--chart-series` (validated against the card surface in light and dark; dark steps down to L 0.66 to stay in the dark chart band). Build charts with `ChartCard` (`components/charts`): insight title, a Chart/Table switch, and the table is what prints.
- Thin marks: 2px lines with ringed dots, bars at most 24px with a 4px rounded end, hairline solid gridlines, no dual axes.

## 10. Accessibility

- Contrast meets WCAG AA in both themes. Focus rings are always visible (`ring` token); never remove outlines without a replacement.
- Everything works with a keyboard. Dialogs trap focus and close with Esc (Radix handles this; don't fight it).
- Icon-only buttons have an `aria-label`. Status isn't shown by color alone (the badge has text).
- Touch targets are at least 44 × 44 px on mobile.

## 11. Screen polish checklist

Use this for every screen before its PR is merged:

- [ ] Uses only tokens and shared components; no one-off colors, sizes or new patterns
- [ ] Looks right at 360 px, 768 px and 1280 px, in light **and** dark
- [ ] Loading (skeleton), empty, error and success states are designed
- [ ] One clear primary action; destructive actions confirm
- [ ] Amounts, dates, statuses and members use `MoneyText`, `DateText`, `StatusBadge` and `MemberAvatar`
- [ ] Keyboard and screen-reader friendly; reduced motion respected
- [ ] No layout shift when data loads; no horizontal scroll on mobile
- [ ] Copy is sentence case and uses the standard terms
