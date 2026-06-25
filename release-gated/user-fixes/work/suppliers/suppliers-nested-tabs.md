# Manual verification — Work › Suppliers nested sub-tabs

All code defects found in this drop were fixed in-session (dead-mock cleanup on the Overview tab — see `release-gated/docs/work/suppliers/suppliers-nested-tabs.md`). The items below are **visual confirmations** against seeded data, not code fixes.

## Why Claude Code did not complete these
Browser-only visual/interaction checks require a running dev server + Chrome MCP + seeded supplier data (contacts, supplier documents with mixed expiry, completed jobs). Not run in this code-audit session. All four tabs were already fully live-wired before this drop; only dead-code removal was needed.

## Exact steps
1. Seed for the dev workspace (`oovgfknmzjcgbilwumch`) via Management API:
   - 4+ `contacts` with `type=supplier` (varied trades).
   - supplier documents with a mix of valid / expiring-within-30d / expired / none.
   - 5+ completed `jobs` linked to those suppliers (`supplier_contact_id`, `status` in complete/invoiced/closed, with `invoiced_amount`/`quoted_amount`).
2. Start dev server (claimed port) + Chrome MCP.
3. Screenshot at all 8 viewports for each route:
   - `/property-manager/work/suppliers` (Overview) — table, filters, sort, Export, ActionMenu, "Network by Trade", "Preferred Suppliers".
   - `/property-manager/work/suppliers/preferred` (Directory) — cards, Preferred-only toggle, Mark/Remove preferred persistence after refresh.
   - `/property-manager/work/suppliers/compliance` — populated roll-up table, status filter, Export CSV.
   - `/property-manager/work/suppliers/performance` — populated scorecard, completion bars, Export CSV.
4. Confirm zero console errors / React warnings / hydration warnings / failed network calls.
5. Save screenshots under `release-gated/docs/work/suppliers/screenshots/`.
