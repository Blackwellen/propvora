# User / Follow-up Fixes — Add Contact / Person / Organisation wizard

**Status: RESOLVED (2026-06-24).** All previously-deferred wizard step persistence
was wired and verified. No outstanding manual actions.

---

## Resolved follow-ups

| Step | Was | Now |
|---|---|---|
| 4 Relationship Links | Static stub (hardcoded counts, no selectors, no write target) | **Removed** (bloat). Contact↔property/tenancy links live as FKs on `tenancies`/`jobs`/`invoices` and are made by creating/editing those records, not a contact link table. Wizard renumbered 8→7. |
| 5 Type-Specific | Collected then discarded | **Persisted** to `contacts.metadata.type_details` and surfaced on the detail page (Supplier Profile / Enquiry tabs hydrated from metadata; generic "Details" card on Overview for other types). PAT-verified. |
| 6 Documents | File pickers discarded on submit | **Uploaded** to R2 + inserted into `documents` with `metadata.contact_id` + expiry; surfaces in the contact Documents tab. |
| 7 Portal Access | Toggle discarded | **Provisions a real grant** via `POST /api/portals/grant`; surfaces in the Portal Access tab. PAT + browser verified. |

See FIX-446…451 in `qa-release/implementation-fix-log.md`.

## No external blockers

Everything was applied directly in code + verified via the Management API PAT
(schema, persistence, cleanup). No Stripe / Vercel / DNS / Sentry gates involved.
