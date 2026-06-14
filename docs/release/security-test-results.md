# Security Test Results (empirical)

**Run:** `node scripts/test/run-all.mjs` · **Last run:** 2026-06-14 · against the LIVE Supabase database.

These are repeatable, automated tests — the internal equivalent of the multi-workspace
leakage / IDOR / subscription-boundary parts of a pen-test. They prove the Critical
release gates with evidence, not assertion.

## 1. RLS multi-workspace isolation + IDOR — ✅ 20/20 PASS
`scripts/test/rls-isolation.mjs`

Creates two real auth users + workspaces, seeds workspace **B** across 7 tenant tables
(`properties, contacts, tasks, notifications, documents, supplier_jobs, tenancies`),
signs in **as user A**, and asserts:

| Assertion | Result |
|-----------|--------|
| A cannot **LIST** any workspace-B row (each of 7 tables) | ✅ 0 B-rows visible |
| A cannot **FETCH B's row by id** (IDOR, each of 7 tables) | ✅ 0 rows |
| A cannot **INSERT** into workspace B | ✅ blocked — "new row violates row-level security policy" |
| A cannot **UPDATE** B's contact | ✅ 0 rows updated |

Fixtures are fully torn down (rows → memberships → workspaces → profiles → auth users).
Complements the static coverage check (`scripts/audit-rls.mjs`: 241/241 tables RLS-enabled).

## 2. Subscription / feature gates — ✅ 31/31 PASS
`scripts/test/billing-gates.mjs`

Transpiles and drives the REAL `src/lib/billing/gates.ts` with a mock client per plan,
asserting server-side allow/block:

| Feature | starter | operator | scale | pro_agency | enterprise |
|---------|:-------:|:--------:|:-----:|:----------:|:----------:|
| AI Copilot | ❌ | ❌ | ✅ | ✅ | ✅ |
| Advanced reports | ❌ | ✅ | ✅ | ✅ | ✅ |
| White-label | ❌ | ❌ | ❌ | ✅ | ✅ |
| SSO / SAML | ❌ | ❌ | ❌ | ✅ | ✅ |
| Portals | ❌ | ❌ | ✅ | ✅ | ✅ |
| Automation | ❌ | ❌ | ✅ | ✅ | ✅ |

All gates return the structured `{allowed, tier, reason, status:402}` upgrade result.

## Still pending (not covered by these two suites)
- **Role-within-workspace** boundaries (member vs admin vs read-only) — most isolation
  is membership-based RLS (proven above); role differentiation is app-level and needs
  dedicated tests once role-gated mutations are finalised.
- **Browser E2E** (Playwright) — scaffolded in `e2e/`; needs a running dev server +
  seeded accounts to execute (see `e2e/README.md`).
- **External pen-test** — see `docs/release/external-pentest-brief.md`.
