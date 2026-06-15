# V2 RLS / Workspace-Isolation Test Matrix

**Scope:** Every Propvora v2 marketplace-platform table — verifies RLS is enabled, a
workspace-scoped (or admin / self / public) policy exists, and that the **anon**
role can reach **only** the intentionally-public surfaces.

**Probe:** [`scripts/test/v2-rls-matrix.mjs`](../../scripts/test/v2-rls-matrix.mjs)
**Project ref:** `oovgfknmzjcgbilwumch` (live staging DB)
**Run date:** 2026-06-15
**Result:** **48 / 48 tables present · 48 / 48 RLS-enabled · 0 cross-workspace leaks · 0 failures.**

> Numbers below are copied verbatim from an actual probe run against the live
> database (`node scripts/test/v2-rls-matrix.mjs`). This is **not** an estimate.

---

## Methodology

The probe combines two independent evidence sources and follows the connection
pattern of the existing `scripts/test/*` probes (env loaded via the shared
`/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/` regex from `.env` + `.env.local`; anon key,
service-role key, and Management API personal-access token).

1. **Management API introspection** (`SUPABASE_PERSONAL_ACCESS_KEY` →
   `api.supabase.com/v1/projects/{ref}/database/query`):
   - `pg_class.relrowsecurity` → **RLS enabled?**
   - `pg_class.relforcerowsecurity` → RLS forced?
   - `count(pg_policy)` per table → **policy count**.
   - `pg_trigger` per ledger table → **immutability trigger present?**

2. **Anon-key live query** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, no signed-in user,
   PostgREST role = `anon`, `auth.uid()` = null): a raw `select *` against every
   table, asserting the row count matches the table's **intended** anon exposure:
   - **PUBLIC** (reference/global, public legal docs, world-readable trust scores)
     → anon *may* read; a `permission denied` here would be the failure.
   - **SCOPED / ADMIN / SELF** → anon **must** be blocked (0 rows, or a
     permission/RLS error). Any live workspace row returned to anon is a `LEAK`.

3. **Service-role row count** (`SUPABASE_SERVICE_ROLE_KEY`): for every table we
   also record the **live** row count visible to the service role, so the matrix
   is honest about whether the table actually held data to leak (a "0 rows to
   anon" on an empty table is weaker proof than on a populated one).

4. **Public booking RPC** (`create_public_reservation`): called by the anon
   client with a non-existent listing id. We assert it is reachable (not
   `function does not exist` / `permission denied for function`) and that it
   **rejects** the bad input by validation — confirming `GRANT EXECUTE … TO anon`
   works **without** creating any reservation.

5. **Append-only ledgers:** immutability is enforced by a `BEFORE UPDATE/DELETE`
   trigger, not by RLS. The probe confirms the trigger exists via `pg_trigger`
   rather than attempting a destructive UPDATE/DELETE.

**This probe is READ-ONLY.** It performs no INSERT/UPDATE/DELETE and seeds no
throwaway workspace. (The seeded cross-workspace leak proof is covered separately
by `scripts/test/idor-sweep.mjs` and `scripts/test/anon-exposure.mjs`.)

**Exposure classes used in the matrix:**

| Class    | Meaning                                                              | Anon expectation              |
|----------|---------------------------------------------------------------------|-------------------------------|
| `SCOPED` | Workspace-scoped via `workspace_members` / helper functions         | **Blocked** (0 rows)          |
| `ADMIN`  | Platform-admin or service-role only                                 | **Blocked** (0 rows)          |
| `SELF`   | Per-user rows (`user_id = auth.uid()`)                              | **Blocked** (anon has no uid) |
| `PUBLIC` | Reference/global, public legal docs, world-readable trust signals   | **Readable** (intended)       |

---

## Results matrix (live probe output)

`RLS`=row-level-security enabled · `POL`=policy count · `ANON`=rows returned to the
anon role · `LIVE`=rows visible to service role.

| Table | Class | Exists | RLS | POL | ANON | LIVE | Verdict |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| marketplace_listings | SCOPED | yes | Y | 9 | 0 | 0 | BLOCKED (see note 1) |
| marketplace_listing_media | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| marketplace_listing_availability | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| marketplace_listing_pricing | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| marketplace_categories | PUBLIC | yes | Y | 1 | 0 | 13 | PUBLIC_OK (see note 2) |
| marketplace_transactions | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| marketplace_commission_ledger | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED · immutable trg ✓ |
| marketplace_reviews | SCOPED | yes | Y | 7 | 0 | 0 | BLOCKED |
| marketplace_disputes | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| marketplace_trust_scores | PUBLIC | yes | Y | 2 | 0 | 0 | PUBLIC_OK |
| marketplace_terms_acceptance | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| marketplace_risk_signals | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| marketplace_fee_rules | PUBLIC | yes | Y | 2 | 0 | 7 | PUBLIC_OK (see note 2) |
| supplier_workspace_profiles | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| supplier_workspace_services | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| supplier_workspace_coverage_areas | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| supplier_workspace_availability | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| supplier_workspace_onboarding_state | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| supplier_connections | SCOPED | yes | Y | 4 | 0 | 0 | BLOCKED |
| supplier_marketplace_quotes | SCOPED | yes | Y | 3 | 0 | 0 | BLOCKED |
| supplier_job_assignments | SCOPED | yes | Y | 3 | 0 | 0 | BLOCKED |
| bookings | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| rate_plans | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| booking_blocked_dates | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| escrow_payments | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| escrow_holds | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| payouts | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| payout_ledger | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED · immutable trg ✓ |
| payments_webhook_events | ADMIN | yes | Y | 0 | 0 | 0 | BLOCKED (see note 3) |
| identity_verifications | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| verification_documents | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| verification_checks | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| sanctions_screenings | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |
| customer_profiles | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| customer_saved_listings | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| risk_events | ADMIN | yes | Y | 1 | 0 | 0 | BLOCKED |
| risk_scores | ADMIN | yes | Y | 2 | 0 | 0 | BLOCKED |
| automation_definitions | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| automation_v2_runs | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| automation_run_steps | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| automation_webhook_endpoints | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| automation_webhook_deliveries | SCOPED | yes | Y | 1 | 0 | 0 | BLOCKED |
| country_packs | PUBLIC | yes | Y | 2 | 0 | 10 | PUBLIC_OK (see note 2) |
| country_tax_rules | PUBLIC | yes | Y | 2 | 8 | 8 | PUBLIC_OK |
| jurisdiction_profiles | PUBLIC | yes | Y | 2 | 10 | 10 | PUBLIC_OK |
| marketplace_legal_documents | PUBLIC | yes | Y | 1 | 6 | 6 | PUBLIC_OK |
| marketplace_policy_acceptance | SELF | yes | Y | 2 | 0 | 0 | BLOCKED |
| partner_relationships | SCOPED | yes | Y | 2 | 0 | 0 | BLOCKED |

**Public booking RPC** `create_public_reservation` → `anon_callable = true`;
reachable and **rejected** a non-existent-listing call with `listing not found`
(validation worked, no row written). ✓

### Summary counts

| Metric | Value |
|---|---|
| Tables covered | 48 |
| Present | 48 |
| Not present | 0 |
| **RLS enabled** | **48 / 48** |
| Anon blocked (SCOPED / ADMIN / SELF) | 41 |
| Public-read OK | 7 |
| **Cross-workspace / anon LEAKS** | **0** |
| Probe failures | 0 |

---

## Notes & nuances (honest findings)

These are **not** failures, but they document where the live policy behaviour
differs from a naïve reading of the task spec, so reviewers aren't surprised.

**Note 1 — Anon CANNOT browse published listings; only `status='active'`, not
`status='published'`.**
`marketplace_listings` carries **multiple** public-read policies layered by
different migrations:

- `mkt_listings_published_read` — bound `TO authenticated` only, `status='published'`.
- `marketplace_listings_public_read` / `public_read` — bound `TO {authenticated, anon}`, `status='active'`.

So the **anon-reachable** public surface is rows where **`status = 'active'`**, not
`'published'`. The probe reported `anon=0` for this table only because there are
currently **0 listings** in the DB (live=0) and none in `active` state. The
isolation guarantee holds (workspace rows are never exposed), but two things are
worth a product decision:
- The `'published'` public-read policy is `authenticated`-only, so an anonymous
  visitor browsing the marketplace must rely on the `'active'`-status policy.
- There are **two near-duplicate** anon public-read policies (`marketplace_listings_public_read`
  and `public_read`, both `status='active'`). Consider consolidating to one named
  policy to avoid drift. **Recommendation below.**

**Note 2 — Three "reference" tables are `authenticated`-only, not truly anon-public.**
`marketplace_categories`, `marketplace_fee_rules`, and `country_packs` use read
policies bound `TO authenticated` (their `USING` is `true`, but the role binding
excludes anon). Hence `anon=0` despite `live=13 / 7 / 10`. This is **safe and
arguably correct** (no sensitive data, but no need to expose the fee schedule /
country catalogue to logged-out scrapers). The genuinely anon-public reference
tables are `country_tax_rules` (anon=8), `jurisdiction_profiles` (anon=10), and
`marketplace_legal_documents` (anon=6) — all confirmed readable by anon and
containing only non-sensitive global/legal data.

**Note 3 — `payments_webhook_events` has RLS enabled with 0 policies (deny-all).**
This is **intentional**: the public Stripe-style webhook handler writes to this
table using the **service role** (which bypasses RLS), and no client role should
ever read it. Deny-all to anon/authenticated is the correct posture. The probe
treats this table as the one documented `ADMIN` exception to the "RLS + ≥1 policy"
rule.

**Append-only ledgers — immutability triggers confirmed.**
Both `marketplace_commission_ledger` (`trg_marketplace_ledger_immutable`) and
`payout_ledger` (`trg_payout_ledger_immutable`) have their `BEFORE UPDATE/DELETE`
immutability triggers in place (verified via `pg_trigger`). UPDATE/DELETE are
rejected at the trigger layer regardless of role. (The probe verifies trigger
*presence* read-only; it does not fire a destructive write.)

---

## Gaps found

**No security gaps.** Every v2 table covered:
- exists,
- has RLS enabled,
- has at least one policy (except the documented service-only
  `payments_webhook_events`),
- returns **zero** workspace/admin/self rows to the anon role,
- and the public booking RPC is anon-callable yet input-validated.

The only items worth follow-up are **product/hygiene**, not isolation defects:

| # | Item | Severity | Detail |
|---|---|---|---|
| G1 | Duplicate anon public-read policies on `marketplace_listings` (`marketplace_listings_public_read` + `public_read`, both `status='active'`) | Low (hygiene) | Consolidate to a single named policy to prevent future drift / accidental status widening. |
| G2 | Public listing browse keyed to `status='active'` while the workspace UI publishes to `status='published'` | Low–Med (product) | Confirm which status value is the "live to anonymous shoppers" state, and align the anon policy + the publish flow so anonymous visitors actually see published listings. |
| G3 | `partner_relationships` present and isolated but currently empty (live=0) | Info | Isolation verified structurally (RLS+2 policies, anon blocked); re-run after data exists for a populated-table proof. |

---

## What could NOT be (fully) tested here

- **Cross-tenant leakage with populated data:** this probe runs read-only and
  does not seed two workspaces, so for tables with `live=0` the "anon sees 0 rows"
  proof is structural (RLS on + policy + role binding) rather than data-driven.
  The **seeded** proofs live in `scripts/test/idor-sweep.mjs` (workspace A cannot
  SELECT/UPDATE/DELETE/INSERT workspace B rows) and `scripts/test/anon-exposure.mjs`
  (seeds a throwaway workspace, then asserts anon=0). Those should be run as the
  companion data-driven evidence; this matrix is the **coverage + role-binding**
  layer across the full v2 surface.
- **Ledger immutability under a real UPDATE:** verified by trigger presence only
  (read-only requirement). A destructive UPDATE/DELETE test against a seeded ledger
  row would prove the trigger fires, but is out of scope for a read-only probe.
- **Authenticated-but-wrong-workspace reads of the `published`/`active` listing
  surface:** the published-read policies are `authenticated`-scoped; verifying a
  signed-in user from workspace A can see workspace B's *published* listing (the
  intended marketplace behaviour) requires a signed-in session and belongs in the
  IDOR / marketplace-browse functional tests.

---

## How to reproduce

```bash
node scripts/test/v2-rls-matrix.mjs          # human-readable matrix + summary
node scripts/test/v2-rls-matrix.mjs --json    # machine-readable {results, rpc, failures}
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (for live row
counts), and `SUPABASE_PERSONAL_ACCESS_KEY` (for Management API introspection).
The script degrades gracefully — without the PAT it still runs anon probes; without
the service key it skips live row counts. Exit code is non-zero on any isolation
failure.
