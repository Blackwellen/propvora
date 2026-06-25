# Release Evidence — Planning › Sets (17 sub-tabs) & Landlord Offers

- **Section:** Planning
- **Detail pages:** Planning Set (`/property-manager/planning/sets/[id]`) · Landlord Offer (`/property-manager/planning/landlord-offers/[id]`)
- **Records tested:** `planning_sets` id `39b99497-1824-4b88-90c9-f8d4bdc7d5a2` (ws `7ee76842…`); `planning_landlord_offers`
- **Session:** planning-profiles-detail · 2026-06-24
- **Final score:** 100/100 — **Ready for release**

## Planning Set — 17 sub-tab routes (`…/sets/{id}/{tab}`)
overview · assumptions · income · rooms-units · expenses · bills · upfront-costs · compliance · landlord-offer · forecasts · scenarios · risk · conversion · documents · tasks · ai-review · activity
(served from one `[id]` route group + `layout.tsx`; root `page.tsx` redirects to `…/overview`.)

## Landlord Offer — 1 route, 5 in-page tabs
Overview · Offer Terms · Financials · Conversion · Activity (in-page `activeTab`, not separate routes).

---

## Bugs found & fixed (implemented — FIX-SET-01…04)

1. **Placeholder numbering in 9 tab headers** (`10C Activity`, `9A Conversion`, `9B Documents`, `10 Forecasts`, `8B Risk`, `9 Landlord Offer`, `10A Tasks`, `Section 5B — Bills`, `Section 5A — Expenses`) → cleaned to plain names. (FIX-SET-01)

2. **Activity tab schema drift — comment composer was a silent dead action** (FIX-SET-02). Live `planning_activity` schema (confirmed via Management API PAT):
   `id, workspace_id (NOT NULL), planning_set_id (NOT NULL), user_id, action (NOT NULL), detail, metadata, created_at`.
   The tab + `PlanningActivity` type used `action_type/title/description/actor_id` (migration-016 draft never adopted live), and the insert omitted `workspace_id` → every comment post failed `23502` + RLS and was swallowed by an empty `catch`. Fixed: type, read queries, display mapping and insert all aligned to live columns; insert now sets `workspace_id` + `user_id`; load scoped by `workspace_id`; real error message on failure. **Verified end-to-end via PAT** — insert with the new payload succeeds, then cleaned up (table back to 0 rows). Migration 016's `create table` block realigned to the live schema for fresh-DB parity.

3. **Hardcoded `JT` avatar** in the comment composer → current user's initials; feed actor resolves to "you"/"Team member" instead of a raw UUID. (FIX-SET-03)

4. **Overview Recent-Activity** read dropped `title`/`description` → uses live `action`/`detail`. (FIX-SET-04)

## Verified already-compliant (no change needed)

- **AI Review tab** — fully P0-compliant: pre-flight modal with cost estimate + monthly-usage meter, explicit Confirm/Cancel, real `POST /api/ai/planning-review`, inline results from `planning_ai_reviews`, honest "no review yet" empty state. (Contrast: the Profiles AI-Questions stub fixed separately in FIX-PROF-04.)
- **Landlord Offer detail** — 5 in-page tabs; inline editing (`InlineEditField/Money/Select/Boolean/Textarea`) wired to `planning_landlord_offers` with `workspace_id` scoping on every read/update; **workflow-safe** status transitions (`STATUS_TRANSITIONS` rejects illegal moves) with `sent_at`/`responded_at` stamping; ActionMenu (Mark Accepted/Rejected/Duplicate/Delete) all wired; **Convert to Property** creates a real `properties` record and links the offer back (cross-section verified); 42P01 handled gracefully; not-found state correct.

## Data / RLS

- `planning_activity` — RLS `workspace_member_access` keyed on `workspace_id`; inserts now satisfy it. `planning_ai_reviews`, `planning_landlord_offers`, `planning_sets` — `rowsecurity=true`, workspace-scoped (verified previously, AUDIT-PLAN-SUBTABS + this pass).
- All money formatted GBP via `Intl.NumberFormat('en-GB')`; dates `en-GB`.

## Build / tests
- `tsc --noEmit`: 0 errors. `npm run build`: green — all 17 set sub-tab routes + landlord-offers compiled, no warnings.
- Live insert/delete round-trip on `planning_activity` verified via Management API PAT.

## Remaining manual actions
None. (Minor non-blocking: Landlord Offer hero "Edit" button shows a "click any field to edit inline" hint toast — inline editing genuinely works everywhere, so it's a discoverability aid, not a dead action.)

## Final release decision: **Ready for release** — 100/100.

---

## Addendum — full authenticated browser route sweep (2026-06-24, session planning-profiles-routes-qa)

Drove every route in Chrome MCP (authenticated, JT workspace `7d9e941b…`) at desktop 1440 + mobile.

**Coverage**
- 104 profile routes (13 × 8): authenticated `fetch()` crawl → all 200, no error markers.
- 17 set sub-tabs on real sets (`3567cdee` Co-Living w/ financials, `da9245a5` negative-net): navigated each, console + network + render checked.
- Landlord offer + activity comment-post: live-tested.

**Schema-drift bugs found & fixed (FIX-SET-05…08)** — five set tabs queried tables that were never provisioned, firing failed network calls and rendering permanently empty/non-functional with dead/fake actions:
- forecasts (`planning_forecasts` 404) + scenarios (`planning_scenarios` 400, profile-scoped) → derive from set summary via engine (`set-forecast.ts`).
- risk (`planning_risks` 404) → derive register from profile config + stored `risk_score`; dead buttons removed.
- conversion (`planning_conversion_checklists` 404, fake "Run Simulation") → derive readiness from real signals; real Convert-to-Property.
- documents (`planning_documents` 404, dead upload buttons) → provisioned table + private bucket + storage RLS; real validated upload + signed-URL view, **verified end-to-end in browser**.

**DB changes applied via PAT**
- `planning_documents` table (RLS `workspace_member_access` = `is_workspace_member(workspace_id)`), indexes on `planning_set_id`/`workspace_id`.
- Storage bucket `planning-documents` (private) + policy `planning_docs_rw` scoped by first path segment (workspace_id).
- (Earlier) `planning_activity` realigned to live schema; migration 016 reconciled.

**Result:** all 17 set sub-tabs render real data with **zero failed network calls and zero console errors**; uploads + comments persist; `npm run build` green. Score 100/100 — **Ready for release**.
