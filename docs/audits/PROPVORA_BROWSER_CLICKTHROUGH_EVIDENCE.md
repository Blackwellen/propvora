# Propvora — Live Browser Click-Through Evidence

**Date:** 2026-06-14 · **Method:** Playwright against a running build (`next start`), logged in
as a real Enterprise + platform-admin QA account with demo data. Harnesses: `e2e/drive.mjs`
(walk), `e2e/capture2.mjs` (visual capture, viewed), `e2e/interact.mjs` (tabs/menus/edit).

## ✅ Confirmed working (observed in browser, not assumed)
- **All 99 `/app` + `/admin` + portal routes return 200** — no crashes, no error pages.
- **Zero horizontal overflow (warp)** at desktop (1366) AND mobile (375) across all walked
  routes — the P2a shell-boundary fixes hold.
- **Zero console errors on page load** (the warp/load walk).
- **Home dashboard** renders real data: Enterprise badge, KPI strip (Properties/Units/
  Tenancies/Occupancy/Rent Roll), "Needs attention" list, portfolio snapshot grid.
- **Property detail** is rich + real: hero, full tab row (Overview/Units/Tenancies/Financials/
  Compliance/Documents/Contacts/Work/Activity), occupancy + financial stats, compliance
  snapshot, quick health, recent activity.
- **AI Copilot bubble** opens → right-docked "Propvora Copilot" panel with chat + quick actions.
- **Interaction harness:** 14 sub-tabs + 20 dropdown/3-dot menus exercised across 9 detail/
  admin pages — **0 interaction errors** (no crashing menus/tabs).
- Demo seed populates core sections: properties 5, contacts 15, tasks 20, tenancies 6, jobs 8.

## ⚠️ Real findings (to fix)
| # | Finding | Severity | Status |
|---|---------|----------|--------|
| F1 | **Demo seeder gaps** — `supplier_jobs`, `documents`, `compliance_items`, `money_transactions` seed **0 rows**, so those sections render empty even with demo loaded. | High | open |
| F2 | **Property/unit card covers** — `PropertyCard`/`UnitCard` correctly render a photo with gradient fallback, but the card data pipeline reads `cover_image_url` while the DB column is `cover_file_id`; covers won't show on list/home cards until `cover_file_id → URL` is resolved. | Med | open |
| F3 | **Guided tour** overlays every page on first use; an `enabled`/`setEnabled` exists in the provider but isn't surfaced as a clear toggle / onboarding opt-out. | Med | open |
| F4 | **Console errors (authenticated):** `ERR_SSL_PROTOCOL_ERROR` (a resource requested over https on localhost — likely an asset/avatar URL) + a transient `Failed to fetch RSC payload` during the login redirect. | Med | investigate |
| F5 | **List rows navigate via `router.push` (onClick), not `<a href>`** — so detail pages aren't middle-click/deep-link/SEO friendly and resist anchor-based testing. | Low | note |
| F6 | Interaction harness under-counts sub-tabs on some detail pages (property shows ~9, harness found 1) — this app's tab markup needs per-page-type selectors for fully exhaustive coverage. | Low (test) | open |

## Logic flows observed end-to-end
Login (email/password → /app) · workspace context + Enterprise plan applied · demo-data
inject (`/api/demo/seed`) · dashboard load · list → detail (direct URL) · detail sub-tabs ·
3-dot/dropdown menus open/close · AI Copilot open · portal pages load (scoped empty states
for the non-linked QA user) · admin pages load (platform-admin gated).

## Not yet exercised (next)
Create wizards end-to-end (submit valid/invalid), inline edit save+persist, file upload,
bulk actions, per-portal authenticated flows with a linked portal identity, mobile-viewport
interaction, and the full per-page-type exhaustive component sweep (F6).

## Test infra note
Playwright login needs `pressSequentially` (react-hook-form + the custom `Input` don't pick up
`.fill()`); the cookie banner must be dismissed first. This is a **test-harness** detail, not
an app bug — real users typing into the form authenticate fine.
