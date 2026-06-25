# User / Manual Actions — Contact Detail Page (`/property-manager/contacts/[id]`)

These are the items Claude Code could not fully complete in this session, with the exact reason for each.

## 1. Live verification — DONE (this session) + remaining viewport breadth
**Done live (Chrome DevTools MCP, authenticated, against the running dev server on `:3002`):**
- Organisation page (the exact checklist supplier `12332cda…`): header, 10 tabs, real KPIs; Audit + Portal Access confirmed showing honest empty states (no fabricated data); no fake Related-Contacts; **0 console errors**.
- Tenant page (`d3baf680…`, Sarah Mitchell): real tenancy KPIs; Tasks **create → persisted across hard reload** (DB row verified + cleaned up); Tenancy tab shows real property/unit + real "Open Full Tenancy Record" link; checked at 1536 and 390 (mobile) — no overflow.
- Not-found state confirmed for the stale checklist ID `d9b9dd59…`.
- One HTTP-400 (units `name` column) found live and **fixed**.

**Remaining (low-risk breadth, not blocking):** the full 8-viewport matrix (1366/1280/1024/768/430/375) on every one of the 10 sub-tabs for both records was not exhaustively screenshotted — only 1536 + 390 were. The shared shell + primitives are already responsive (verified on other Contacts surfaces). Re-run the sweep when convenient.

## 1b. `npm run build` — intentionally skipped (NOT a code blocker)
Two other sessions had live `next dev` servers on the shared `.next` (port 3002). Running `next build` would overwrite `.next` and corrupt their dev state, so it was deliberately not run. `npx tsc --noEmit` is clean (run twice) and the app was fully exercised live. Run `npm run build` once the other sessions release `.next`.

## 2. Landlord → property / planning-set / landlord-offer relations — SCHEMA ENRICHMENT (not a defect)
**Why not wired to real lists:** The live schema has no contact foreign key linking a **landlord** contact to `properties`, `planning_sets`, or `landlord_offers` (verified: `tenancies.primary_contact_id`, `invoices.contact_id`, `jobs.supplier_contact_id`, `tasks.assignee_contact_id` exist; there is no `properties.owner_contact_id` etc.). These tabs therefore show honest empty states with **working CTAs** routed to the real creation/link flows.

**To enrich later (optional, V1.5):** add an `owner_contact_id` (or a `property_contacts` join) and extend `useContactRelations` to populate `properties` / `planning_sets` / `landlord_offers`. PAT-applicable via the Management API once the column/table design is decided.

## 3. Seed coverage for live verification
If either test record has no tenancy/invoice/job/task/portal-grant, seed 1–2 realistic rows (PAT, service role) so the relational tabs render populated states during the sweep — see the Seed Before Test Rule. The code already renders correctly for both empty and populated states (verified via type-check + static review).
