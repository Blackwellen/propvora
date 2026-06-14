# Propvora — Finalization Task List (21-phase production-hardening master)

**Source:** founder master prompt (2026-06-14). **Repo is source of truth** — docs updated after code is verified.
**Status legend:** ✅ done · 🟡 partial · ⬜ pending · 🔄 in progress.

## Already implemented (verified this programme — build-green, tests passing)
RLS isolation+IDOR (20/20) · subscription gates (31/31) · E2E scaffold · security headers (CSP/HSTS/frame) ·
Stripe webhook signature **+ idempotency** + most events · audit-log coverage · app-side rate limiting ·
billing gates + entitlement service · account deletion/SAR + erasure worker (gated) · cookie consent ·
maintenance mode + safe error pages · TOTP MFA · `/api/health`+`/api/ready` · compliance pack (11 docs) ·
legal entity corrected (Blackwellen Ltd, ICO ZC160806) · F1 seeder fix · F2 covers · F3 tour toggle ·
F4 SSL @import · global dropdown scroll · 44 property + 41 supplier categories cross-integrated ·
**property-create insert FIXED** (was broken) · **task-create insert FIXED** (was broken).

## Phases (this programme)

| Phase | Scope | Status |
|------|-------|--------|
| 0 | Repo-first audit; run full gate suite; write 8 audit docs + this list | 🟡 (scripts partial; docs partial) |
| 1 | Remove ALL hardcoded demo/mock fallbacks from production UI; rebuild Supabase demo seeders + lifecycle; honest states; `audit:mock-data` | ⬜ |
| 2 | Canonical operation-profile enum unified everywhere + legacy map + tests | ⬜ |
| 3 | Schema/adapter cleanup — audit every insert/update vs live schema; query registry; CRUD tests | 🔄 (property+task fixed; calendar_events + others flagged) |
| 4 | Billing E2E — plan enum normalize, checkout validation, all webhook events, `billing-e2e.mjs` + docs | 🟡 (gates+webhook done; E2E/tests pending) |
| 5 | AI **multi-provider gateway** (OpenAI/OpenRouter/Anthropic/Gemini/NVIDIA) + admin model controls + tables | ⬜ |
| 6 | AI **hard caps** (per-plan/6h/day/week/month + cost budgets), fail-closed on quota + tests | 🟡 (soft per-workspace limit exists; hard caps pending) |
| 7 | Legal module hardening — disclaimers, draft-only, review badges, HMO/SA/R2R/possession checks, tables, tests | ⬜ |
| 8 | Accounting **ledger** — double-entry, immutable posts, reversals, balances from journal lines, perms, tests | ⬜ |
| 9 | Smart Rules automations V1.1 (rules/runs/actions; R2R/SA/HMO/planning/accounting triggers; review-first) | ⬜ |
| 10 | Internal **pentest python suite** (`security/` headers/auth/IDOR/rate/xss-sql/upload/fuzz/billing/ai + report) | ⬜ (internal JS RLS/gate tests exist; brief written) |
| 11 | Portal completion — recipient `/p/[token]` routes, hashed+expiring+revocable tokens, scoped+audited, upload, mobile, tests | 🟡 (token model + scoping exist; recipient routes/tests pending) |
| 12 | Admin/workspace/account settings — real switcher/KPIs/billing/AI, server role enforce, z-index/New/search | 🟡 |
| 13 | ROUTE_LOGIC_FLOW_MATRIX + Playwright critical-flow tests | 🟡 (inventory + create-flow harness done) |
| 14 | RLS_POLICY_MATRIX + per-table tests | 🟡 (241/241 enabled + isolation test; matrix/per-table pending) |
| 15 | API_SECURITY_MATRIX (auth/role/zod/rate/audit per route) | ⬜ |
| 16 | File-upload security (MIME/size/signed/scoped) + tests | 🟡 (upload hardened; tests pending) |
| 17 | Performance audit + doc | 🟡 (readiness doc; deep pass pending) |
| 18 | Legal/policy pages + acceptance logging | 🟡 (pages exist+corrected; acceptance logging pending) |
| 19 | Docs rebuild (README + ~20 docs) | 🟡 (release/compliance docs done; user/admin manuals pending) |
| 20 | Release gates (CI fail-on-error, remove `lint||true`, all `test:*` scripts) | ⬜ |
| 21 | Final deliverables + production-ready decision (only when every gate passes) | ⬜ |

## Honest scope note
This is a multi-week programme. The largest new builds are **Phase 5 (AI gateway)**, **Phase 8 (accounting
ledger)**, **Phase 9 (smart rules)**, **Phase 1 (mock-data removal + seeder rebuild)**, **Phase 10 (pentest
python suite)** and **Phase 11 (recipient portals)**. Work proceeds phase-by-phase with build-green verification
and a milestone push after each. Production-ready is NOT declared until every Phase-20 gate passes
(see `docs/release/PROP-VORA-RELEASE-SIGNOFF.md`).
