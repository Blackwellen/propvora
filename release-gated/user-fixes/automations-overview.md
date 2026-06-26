# User / Manual Actions — Automations: Overview

> **Status (2026-06-25, post-MCP-sweep): all four previously-open items are CLOSED.**
> Live Chrome DevTools MCP sweep + vitest unit + live engine E2E + RLS isolation + a
> clean production build were all completed in-session. Nothing below requires a manual
> action; this file is retained as evidence of what was verified.

---

## 1. Clean production build — DONE

`npm run build` → **✓ Compiled successfully** (Next 16 / Turbopack) → `Finished
TypeScript in 2.8min` (no type errors) → page-data collection → **exit 0**, with
`/automations/overview` + `/workspace-settings/automations` in the route table and
`/automations/home` + `/automations/admin-controls` as redirects.

The earlier failures were environmental, not code: (a) a transient `semi space` OOM under
host RAM pressure from concurrent dev servers, then (b) a **stale `.next/lock`** left by
that aborted run, which made `next build` refuse with "Another next build process is
already running." Fix: `rm -f .next/lock` (never remove `.next/dev/lock` — that's a
running dev server). `tsc --noEmit` is also clean for this changeset.

---

## 2. Live browser QA sweep + flags-OFF gating — DONE

Live Chrome MCP sweep (authed PM session, :3005) verified rename + redirects + identical
tab strip (no Admin Controls, no bounce) across Overview / Runs & Logs / Usage & Limits +
governance page + responsive at 390/768/1440 with 0 console errors.

The flags-OFF *hidden* state couldn't be exercised visually (the shared dev server pinned
`NEXT_PUBLIC_QA_ALL_FLAGS=true`, set by another session — a build-time inline that can't be
flipped without restarting a server other sessions depend on). Covered instead by a
deterministic test: `src/lib/automation/governance.test.ts` asserts on the real
`AUTOMATIONS_TABS` that `hiddenTabs=["Canvas Builder","Integrations"]` removes exactly
those (Webhooks is a sub-tab of Integrations; Admin Controls is gone). **8/8 pass.**

---

## 3. Cross-workspace RLS — DONE

`scripts/test/governance-rls.mjs` (registered in `run-all.mjs`): RLS-scoped fixture user
gets own read ✓, own write persists ✓, **foreign read blocked (0 rows)** ✓, **foreign
write blocked (error), workspace B unchanged** ✓. **5/5 pass.**

---

## 4. Governance enforcement engine E2E — DONE

`src/lib/automation/governance-e2e.test.ts` runs the REAL `evaluateWorkspace` against the
live DB: (a) the DB CHECK on `smart_rules.action_type` **rejects** dangerous actions
outright (they can't be v1 rules; they live only on the v2 node path, already hard-gated
to approvals), and (b) the engine runs a safe auto-run rule through governance without
over-holding it. **2/2 pass.** `requiresReview` is additionally unit-tested (8/8).

This E2E also **surfaced + fixed a pre-existing bug** (FIX-530): all 7 v1 `compliance_items`
triggers filtered `.neq("status","complete")`, but the live `compliance_status` enum has
no `complete` value — so the query errored, was swallowed, and every compliance Smart Rule
matched 0 rows. Now excludes the satisfied states (`ok`/`exempt`).

---

> ⚠️ **Concurrency note:** a second session ("automations-qa", port 3006) was editing the
> same `src/lib/automation/*` files during this drop and reverted `engine.ts` /
> `evaluate.ts` / `run-all.mjs` once; they were re-applied and re-verified (10/10). If
> these files appear reverted again, re-apply FIX-505 (engine governance wiring) and
> FIX-530 (compliance `.not("status","in",'("ok","exempt")')`).
