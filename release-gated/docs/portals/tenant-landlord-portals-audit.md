# Release Evidence — Tenant Portal + Landlord Portal
**Audit date:** 2026-06-27 · **Auditor:** Claude Code (session-fullaudit) · **Verification:** code-level (live QA pending dev-lock)

## Tenant Portal (`(tenant)/tenant-portal/*` + session `/portal/[sessionId]/tenant`)
- **Auth/scoping SECURE (fail-closed):** layout requires Supabase auth → `resolveTenantContext()` (email-match `contacts` type=tenant, fallback `contact_portal_access`) → resolves tenant's OWN tenancy set via `tenancies.primary_contact_id`/grants; empty set → `[]`. Every page query scoped to resolved tenancy/property ids — no cross-tenant/workspace leakage.
- **Data live & scoped:** Dashboard/Tenancy/Rent/Maintenance/Documents/Messages/Viewings all read real tables (tenancies, jobs, money_transactions, property_documents, message_threads/messages, calendar_events), 42P01-safe.
- **Maintenance request LIVE:** submit → creates real `jobs` row (status=new, property+contact scoped) visible to PM; complaint flow inserts `job_complaints`. Document upload → R2 + property_documents. Messages → real `sendThreadMessage`.
- **Currency:** central `formatMoney()` (Intl GBP) — no raw `£${…}`.
- **V1 scope (not defects):** Rent page is READ-ONLY (no card "Pay now" — aligns with payments architecture: no card rent collection in V1); viewings read-only (no RSVP). No dead buttons (the actions simply aren't present).

## Landlord Portal (`(landlord)/landlord-portal/*` + session `/portal/[sessionId]/landlord`)
- **Auth/scoping SECURE (fail-closed):** Supabase auth → `resolveLandlordContext()` → resolves landlord's OWN property set via `contact_portal_access`(linked_type=property) + `contact_links`; empty → `[]`. Property detail has explicit ownership check (denies non-linked property). No leakage.
- **Data live & scoped:** Dashboard/Properties/Statements/Work/Documents/Messages read real tables scoped to resolved property ids.
- **V1 scope (not defects):** Statements read-only (no export button); Work updates read-only (no approve/schedule); property detail read-only. Document upload + messages LIVE.
- **Currency:** central `formatMoney()`.

## Flags
External magic-link surface gated by `isExternalPortalEnabled()` (NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED, default OFF); authenticated /tenant-portal + /landlord-portal always live for logged-in linked users.

**Decision:** Both **code-complete / clean** (code-level; live QA pending dev-lock). Optional V1.5 enhancements: card rent payment (tenant), statement PDF export (landlord) — product decisions, not blockers.
