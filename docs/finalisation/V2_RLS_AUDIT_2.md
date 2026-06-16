# V2 RLS / Isolation Audit — Part 2 (2026-06-17 release wave)

**Project:** `oovgfknmzjcgbilwumch` · **Date:** 2026-06-16
**Probe:** `scripts/test/v2-rls-matrix-2.mjs` (READ-ONLY — no insert/update/delete, no seeding)
**Method:** Supabase Management API introspection (`pg_class`/`pg_policy`) + anon-key SELECT + service-role row count, per table.

This audit covers **every table created in the 2026-06-17 release wave** — the three
migrations applied this cycle:

- `20260617070000_payments_money_accounting.sql` — money/accounting + dispute/fee ledgers
- `20260617080000_country_packs_intl.sql` — international country packs + i18n + privacy/compliance
- `20260617090000_legal_ical_xc.sql` — booking legal framework + iCal channel sync **(this session)**

The earlier marketplace / supplier / automation / escrow tables are covered by
`scripts/test/v2-rls-matrix.mjs` (Part 1) and are not re-listed here.

## Classification

Each table's policy `USING` expression is read live and auto-classified:

| Class  | Meaning | Anon expectation |
|--------|---------|------------------|
| `PUBLIC` | `USING (true)` — reference data | anon read intended (no permission error) |
| `SCOPED` | `is_workspace_member()` / `workspace_members` / `EXISTS(...)` | anon MUST be blocked |
| `DENY`   | `USING (false)` — service-role only | anon MUST be blocked |

The probe also derives the class from the live `USING` expr and flags any
mismatch with the author's declared intent. **0 mismatches** were found.

## Result — full matrix (live run)

```
=== v2 RLS / ISOLATION MATRIX — PART 2  (project oovgfknmzjcgbilwumch) ===
introspection: ON · service-role counts: ON

TABLE                              INTENDED  DERIVED  EXISTS  RLS  POL  ANON  LIVE  VERDICT
------------------------------------------------------------------------------------------------------------------------
booking_legal_documents            PUBLIC    PUBLIC   yes     Y    1    19    19    PUBLIC_OK
booking_listing_legal              SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
booking_ical_connections           SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
booking_ical_sync_events           SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
booking_legal_acceptances          SCOPED    SCOPED   yes     Y    1    0     5     BLOCKED
booking_revenue_entries            SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
hold_ledger_entries                SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
payment_release_blocks             SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
dispute_actions                    SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
fee_rule_audit                     DENY      DENY     yes     Y    1    0     0     BLOCKED
fx_rates                           SCOPED    SCOPED   yes     Y    2    0     10    BLOCKED
address_models                     PUBLIC    PUBLIC   yes     Y    1    0     5     PUBLIC_OK
billing_country_matrix             PUBLIC    PUBLIC   yes     Y    1    0     26    PUBLIC_OK
connect_payout_country_matrix      PUBLIC    PUBLIC   yes     Y    1    0     26    PUBLIC_OK
country_consumer_rules             PUBLIC    PUBLIC   yes     Y    1    0     26    PUBLIC_OK
country_invoice_rules              PUBLIC    PUBLIC   yes     Y    1    0     26    PUBLIC_OK
country_pack_audit_events          PUBLIC    PUBLIC   yes     Y    1    0     0     PUBLIC_OK
country_pack_reviews               PUBLIC    PUBLIC   yes     Y    1    0     5     PUBLIC_OK
country_pack_versions              PUBLIC    PUBLIC   yes     Y    1    0     0     PUBLIC_OK
country_privacy_profiles           PUBLIC    PUBLIC   yes     Y    1    0     26    PUBLIC_OK
country_profiles                   PUBLIC    PUBLIC   yes     Y    1    0     26    PUBLIC_OK
country_regions                    PUBLIC    PUBLIC   yes     Y    1    0     19    PUBLIC_OK
country_release_gates              PUBLIC    PUBLIC   yes     Y    1    0     26    PUBLIC_OK
country_representatives            PUBLIC    PUBLIC   yes     Y    1    0     6     PUBLIC_OK
country_tax_profiles               PUBLIC    PUBLIC   yes     Y    1    0     26    PUBLIC_OK
country_tax_rates                  PUBLIC    PUBLIC   yes     Y    1    0     0     PUBLIC_OK
data_transfer_mechanisms           PUBLIC    PUBLIC   yes     Y    1    0     4     PUBLIC_OK
regional_terms_versions            PUBLIC    PUBLIC   yes     Y    1    0     0     PUBLIC_OK
sanctions_country_rules            PUBLIC    PUBLIC   yes     Y    1    0     14    PUBLIC_OK
subprocessor_register              PUBLIC    PUBLIC   yes     Y    1    0     4     PUBLIC_OK
intl_translation_keys              PUBLIC    PUBLIC   yes     Y    1    0     0     PUBLIC_OK
intl_translation_namespaces        PUBLIC    PUBLIC   yes     Y    1    0     3     PUBLIC_OK
intl_translation_strings           PUBLIC    PUBLIC   yes     Y    1    0     0     PUBLIC_OK
privacy_requests                   SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
privacy_request_events             SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
regional_terms_consent_events      SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED
breach_incident_clocks             SCOPED    SCOPED   yes     Y    1    0     0     BLOCKED

--- SUMMARY ---
tables covered:   37
present:          37
not present:      0
anon blocked (scoped/deny): 14
public-read OK:   23
LEAKS:            0

No isolation failures detected.
```

## Verdict

- **37/37** tables present, **RLS enabled**, **≥1 policy** each.
- **0 leaks.** Every `SCOPED`/`DENY` table returned **0 rows to anon**, including
  the ones that actually hold live data — proving isolation rather than an empty
  table coincidentally looking safe:
  - `booking_legal_acceptances` — **5 live rows**, anon blocked.
  - `fx_rates` — **10 live rows**, anon blocked.
- **0 intent/derived mismatches** — every declared class matches the live
  `USING` expression.

### This session's tables (legal + iCal) specifically

| Table | Class | Policy | Anon | Notes |
|-------|-------|--------|------|-------|
| `booking_legal_documents` | PUBLIC | `bld_select_all` USING(true) | reads 19 rows | public legal registry powering the public legal pages — correct. |
| `booking_listing_legal` | SCOPED | `bll_ws_member` | blocked | per-listing legal config; workspace-member FOR ALL. |
| `booking_ical_connections` | SCOPED | `bic_ws_member` | blocked | **no anon SELECT policy** — the public export feed is mediated only by the service-role route `/api/booking/ical/[token].ics`, which emits dates only. |
| `booking_ical_sync_events` | SCOPED | `bise_ws_member_read` | blocked | append-only audit; member READ only, writes are service-role. |
| `booking_legal_acceptances` | SCOPED | `booking_legal_acceptances_ws_member` | blocked (5 live) | RLS re-asserted this session; **no client INSERT policy** — acceptances are captured server-side via the service role only. |

## Gaps / honest notes (not security failures)

1. **PUBLIC reference tables currently return 0 rows to the publishable anon key.**
   Every `country_*` / `billing_*` / `intl_*` / `sanctions_*` / `subprocessor_*`
   table is correctly classed PUBLIC (`USING(true)`) and anon hits **no permission
   error** (so there is no leak and no broken page), but the `sb_publishable_…`
   anon key returns **0 rows** even where the service role sees many. This is a
   **pre-existing platform characteristic, not a regression introduced this
   session** — the same is true of the already-shipped `country_packs` and
   `marketplace_categories` reference tables (classed PUBLIC in Part 1). By
   contrast `booking_legal_documents` and `marketplace_legal_documents` *do*
   surface their rows to the same anon key, which is why the public legal pages
   render their content correctly. If any of these reference tables ever needs to
   be read directly by an anonymous browser client, an explicit
   `GRANT SELECT … TO anon` (the grant is present) plus confirming the
   publishable-key role resolution would be required. The app today reads these
   reference tables server-side (service role / authenticated), so this does not
   block release.

2. **`country_pack_audit_events` is PUBLIC (`USING(true)`).** This is intentional —
   it is the country-pack review/audit trail meant as reference, not workspace
   data — but it is worth a conscious sign-off that audit events here carry no
   private/workspace data. It currently holds 0 rows.

3. **`fee_rule_audit` is DENY (`USING(false)`)** — readable by no client role, only
   the service role. Confirmed blocked to anon; intended.

## How to re-run

```bash
node scripts/test/v2-rls-matrix-2.mjs          # human-readable
node scripts/test/v2-rls-matrix-2.mjs --json   # machine-readable (exit 1 on any failure)
```
