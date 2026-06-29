# Release Evidence — Customer Workspace

**Audit date:** 2026-06-27 · **Auditor:** Claude Code · **Branch:** main
**QA matrix:** [qa-release/sections/17-customer-workspace.md](../../../qa-release/sections/17-customer-workspace.md)
**Promotion / scope detail:** [user-fixes/customer-workspace/v2-demo-surface.md](../../user-fixes/customer-workspace/v2-demo-surface.md) ·
[user-fixes/customer-workspace/real-vs-demo-surfaces.md](../../user-fixes/customer-workspace/real-vs-demo-surfaces.md)

Section: Customer workspace (`/customer/*`) — **48 routes**. Top-nav-only shell.

## Scope — V2 demo surface, flag-gated OFF for V1

A **pixel-perfect demo/preview build** with **no customer Supabase backend** (migration
`20260617230000` written, **not applied**). Favourites, saved searches, collections, avatar
upload, 2FA, identity verification etc. are intentionally client-side demo interactions
(toast / localStorage). The whole surface is gated **OFF for V1** via `NEXT_PUBLIC_*` customer
flags, so its demo buttons are **not dead buttons in a live V1 path**. This evidence scores the
surface **as a demo build** (visual quality, navigation, public-data wiring), not as a
live-backend V1 section.

## Genuinely-live, public-data-backed surfaces

| Page | Score | Notes |
|------|-------|-------|
| `stays/page.tsx`, `stays/[slug]` | 5 | Live public marketplace data via `getPublicStays` / `getPublicStayBySlug`; FIX-636 wired real Share (Web Share + clipboard) |
| `stays/map`, `stays/long-term`, `stays/long-term/[slug]` | 4 | Live public data; some toolbar buttons demo-only (save search / compare) |
| `search`, `saved` | 4 | Public search data; save = demo |
| `lets/*` (search, journey, properties/[id], tenancies/[id]) | 4 | Public let data rendered; interactive booking = demo |

## Demo-interaction surfaces (toast / localStorage by design — V2)

Home/dashboard, profile, notifications (5 as demo); account-settings, help, favourites, saved,
bookings/* (list/[id]/completed/disputes/modify/dispute/report-issue), maintenance(+/new),
messages(+/[id]), payments, orders, reviews (4 as demo). All consistent demo state; deductions
are expected demo-only interactions on ~40 buttons + hardcoded help/account-settings content.

## Bugs found & fixed this session

| ID | File | Fix |
|----|------|-----|
| FIX-636 | `customer/stays/[slug]/page.tsx` + new `StayDetailActions.tsx` | Wired real Share (Web Share API + clipboard fallback, "Link copied" confirm); Save toggles real pressed/saved state. Extracted interactive header into a client component (page stays a server component). |

## Final score & decision

- **As a V1 surface:** N/A — gated OFF, not in V1 release scope.
- **As a V2 demo build (visual + public-data quality):** **~85/100** — strong visual polish,
  navigation, top-nav shell, public marketplace data wiring; deductions are the by-design
  demo-only interactions + hardcoded help/account-settings content.

**Ready behind feature flag (V2 demo surface).** Must not be flipped on until the customer
backend is built (migration apply + `/api/customer/*` endpoints — see user-fixes docs). It is
invisible to V1 users and is **not a V1 release blocker**.
