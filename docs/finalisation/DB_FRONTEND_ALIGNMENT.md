# Database ↔ Frontend Alignment — Propvora

**Generated:** 2026-06-15 · Scope: every Supabase query in the app vs. the **live**
schema.

## Headline

The data layer is **fully aligned**. Every table/column the app reads or writes exists in
the live database; there are no phantom tables and no mock/hardcoded data paths left in
the shipped sections. The alignment is gated by a script, not asserted by eye.

| Gate | Result | Command |
|---|---|---|
| Query ↔ schema mismatches | **0** | `npm run audit:schema` (`scripts/audit-queries.mjs`) |
| RLS enablement on `workspace_id` tables | **195/195** | `npm run audit:rls` / `scripts/test/rls-coverage.mjs` |
| Cross-workspace IDOR | **0 leaks** (96 assertions) | `scripts/test/idor-sweep.mjs` |
| Anonymous exposure | **0 rows** (31 assertions) | `scripts/test/anon-exposure.mjs` |

Live schema reference: `docs/final-wiring/live-schema.{json,md}`. Full per-table policy
matrix: `docs/finalisation/RLS_POLICY_MATRIX.md`.

## Section wiring (all live)

| Section | Primary live tables |
|---|---|
| Portfolio | `properties`, `units`, `property_units`, `tenancies`, `tenancy_parties`, `property_media` |
| Money | `money_transactions`, `invoices`/`invoice_lines`, `bills`/`bill_lines`, `arrears_records`, `deposits`, `payments`, `arrears_view` |
| Work | `tasks`, `jobs`, `work_items`, `ppm_plans`, `suppliers`, `supplier_jobs` |
| Compliance | `compliance_items`, `property_compliance_items`, `compliance_evidence`, `property_inspections`, `hmo_licences` |
| Planning | `planning_sets`, `planning_scenarios`, `planning_income_lines`, `planning_expense_lines`, `planning_profiles` |
| Legal | `possession_cases`, `possession_evidence`, `agreements`, `agreement_signatures` |
| Accounting | ledger tables + `reconciliation_items`, `money_forecast_records`, `margins_view` |
| Automations | `automation_rules`/`recipes`/`runs`/`events` |
| Contacts | `contacts`, `contact_notes`/`links`/`activity`/`portal_access` |
| Calendar | `calendar_events`, `calendar_reminders`, `calendar_settings`, `calendar_ical_tokens` |
| Messages | `message_threads`, `messages` (single schema-correct layer for app + portals) |
| Notifications | `notifications`, `notification_preferences` |
| Portals | `portal_access_tokens`, `portal_sessions`, `contact_portal_access`, `share_links`/`share_link_*` |
| Billing | `workspaces.plan`, `workspace_subscriptions`/`billing`, `workspace_addons`, `stripe_*` |

## Defence in depth

Frontend queries use the **RLS-scoped** client (browser or server) — never the service
role — so workspace isolation is enforced by the database even if an app-level check were
missed. API routes add an explicit membership/role check on top (see
`API_SECURITY_MATRIX.md`). 42P01/42703-safe fallbacks (e.g. portal messaging) return
empty rather than throw when an optional table is absent.

## Residual

- Four tables are RLS-on/0-policy (default-deny, service-role-only): `activity_logs`,
  `bug_reports`, `mail_oauth_states`, `share_link_rate_limits` — safe, but unfinished
  surfaces.
- Three views (`arrears_view`, `margins_view`, `v_activity_feed`) inherit base-table RLS.

**Conclusion:** the app is schema-correct and RLS-scoped end to end, with a script gate
keeping it that way. No misaligned query or unscoped read/write found.
