## Goal

Recreate your `vms-front` Warehouse Management System inside Lovable with a cleaner, more animated UI, replace all mock data with real calls to your `vms-back` Node/Express/Prisma backend, and add three new capabilities you asked for:

1. A responsive app shell — collapsible sidebar on desktop, bottom/drawer navbar on mobile.
2. A Telegram-style theme toggle that animates from the toggle button itself, plus preset themes + a custom color editor.
3. An editable dashboard everywhere — drag/resize/add/remove widget cards on the dashboard, and inline-edit table rows that save back to the API.

Stack stays Lovable-standard: React 18 + Vite + TS + Tailwind + shadcn. Redux Toolkit + axios + i18next + recharts brought over from your repo.

## App shell

- Desktop (≥ md): collapsible sidebar (`@/components/ui/sidebar`) with icon-only collapsed mode; the toggle stays visible in the header.
- Mobile (< md): sidebar hides, replaced by a bottom navbar with the top 5 destinations + a "More" sheet for the rest.
- Header: page title (breadcrumb), global search, language switcher (en/ru/uz from your i18n setup), notifications bell, theme toggle, user menu.
- Active route highlighting + smooth open/close animations on groups.

Routes mirror your repo:
`/login`, `/`, `/dashboard`, `/inventory`, `/products`, `/brands`, `/categories`, `/suppliers`, `/warehouses`, `/purchase-orders`, `/orders`, `/receivings`, `/shipments`, `/cycle-counts`, `/ops`, `/notifications`, `/settings/*`.

## Theme system (Telegram-style)

- A `ThemeProvider` writing CSS variables on `:root` for primary, accent, background, foreground, muted, border, radius, font.
- Toggle button uses the **View Transitions API** with a circular clip-path expanding from the button's screen coordinates → exact Telegram feel. Falls back to a fade on browsers without support.
- **Presets** (5–6): Default, Ocean, Sunset, Forest, Mono, Midnight. One click applies a full palette.
- **Custom editor** in `/settings/appearance`: color pickers for each token, radius slider, font family, live preview pane. Persisted in `localStorage` and (when logged in) on the user profile via the backend.
- Every shadcn component already reads from these CSS vars, so theme changes propagate everywhere automatically. Mock data and hard-coded colors are removed from existing UI.

## Editable dashboard

Two layers, both saved to the backend per user:

- **Layout edit mode** — toggle "Edit dashboard" in the header. Widgets become draggable/resizable on a 12-column grid (`react-grid-layout`). User can add/remove widgets from a palette (KPI card, line chart, bar chart, donut, recent-activity list, low-stock list, PO status, fulfillment metrics, control-tower alerts). Layout JSON saved per user.
- **Inline data edit** — across tables (Inventory, Products, Brands, Categories, Suppliers, Warehouses): click a cell to edit, Enter to save (PATCH to API), Esc to cancel, optimistic update with toast on failure. Bulk select + bulk edit drawer for power users.

## Backend wiring (vms-back)

- Single `axios` instance in `src/lib/api.ts` reading `VITE_API_BASE_URL` (default `http://localhost:9000`), with JWT bearer interceptor + refresh-token flow matching your backend's auth.
- Per-feature API modules (`src/features/<area>/api.ts`) replacing the mock `dashboardApi.ts`, `opsApi.ts`, etc. Same function names so the rest of the app keeps working.
- Redux Toolkit slices preserved; mock `await delay(...)` blocks removed and replaced with real `axios` calls.
- Multi-tenant header (`X-Tenant-Id`) and role-aware UI (hide actions the JWT role can't perform).
- A `.env.example` documents `VITE_API_BASE_URL`, `VITE_LOGISTICS_BASE_URL`, `VITE_POS_BASE_URL` to match your backend ports 9000/9100/9200.
- CORS reminder: ensure your backend allows the Lovable preview origin during dev.

## UI/UX polish

- Tailwind animation utilities (`fade-in`, `scale-in`, `slide-in-right`) applied to page transitions, dialogs, sidebar, dropdowns.
- Skeleton loaders for every data view (no more blank flashes).
- Empty states with a single primary action.
- Toast feedback (sonner) on every mutation.
- Keyboard shortcuts: `⌘K` global command palette to jump anywhere, `g d` → dashboard, `g i` → inventory, `e` → toggle edit mode.

## Build order

1. App shell: providers (Redux, i18n, theme, router, tooltip, toaster), sidebar + mobile navbar, header, layout, route skeleton.
2. Theme system: ThemeProvider, presets, View Transitions toggle, `/settings/appearance`.
3. Auth: `/login` + token refresh + protected routes wired to `vms-back`.
4. Dashboard: real API + editable widget grid + widget palette.
5. Data pages (Inventory → Products → Brands → Categories → Suppliers → Warehouses → POs → Orders → Receivings → Shipments → CycleCounts → Ops → Notifications) with inline edit.
6. Polish pass: animations, skeletons, empty states, command palette, shortcuts.

## Technical notes

- **Packages added**: `axios`, `@reduxjs/toolkit`, `react-redux`, `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `recharts`, `react-grid-layout`, `@types/react-grid-layout`.
- **Folder layout**: keep your feature-sliced `features/<area>/{api,model,ui}` style under `src/features/` for parity with `vms-front`.
- **Theme toggle implementation**: `document.startViewTransition(() => setTheme(next))` + a `::view-transition-new(root)` keyframe with `clip-path: circle()` anchored at the button's bbox.
- **Editable grid**: `react-grid-layout` with `isDraggable`/`isResizable` gated by an `editMode` flag in a `dashboardSlice`; layout persisted via `PUT /me/dashboard-layout`.
- **Backend assumption**: endpoints follow REST under `/api/...` per your README. If real paths differ, I'll adjust the api modules in one pass once you point me at a route file or hit the first 404.

## What I need from you to finish wiring

- Confirm the dev base URL (default I'll use: `http://localhost:9000`).
- Once running, the first endpoint that 404s tells me your real route prefix — I'll update the api layer in one shot.
