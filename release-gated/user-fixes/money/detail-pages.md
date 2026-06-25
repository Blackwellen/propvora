# User / Manual Actions — Money › Detail Pages

These items were **not** completed in the 2026-06-25 `money-detail-qa` drop. Each lists exactly why Claude Code could not finish it and the precise step required.

---

## 1. Stripe Connect onboarding (external gate — blocks "Pay via Stripe")

**Why not done by Claude Code:** Stripe Connect Express onboarding is an OAuth/browser flow against Stripe's dashboard with live business/banking details — it cannot be completed via PAT or code.

**Exact steps:**
1. In `/property-manager/workspace-settings` → Payments, click "Connect Stripe".
2. Complete Stripe Connect Express onboarding (business profile + bank account).
3. Confirm the returned `stripe_account_id` is stored on the workspace.
4. Re-test: the "Pay via Stripe" button on the Bill detail page should enable (currently disabled with tooltip "Stripe Connect not configured").

Until then the disabled state is correct and intentional (not a defect).

---

## 2. Full 8-viewport screenshot matrix

**Status update:** All five surfaces have now been **live-verified** (Chrome MCP, dev :3004) — Bill (desktop 1536 + mobile 390), Invoice (desktop), Dispute (flag ON + OFF), Deposit (desktop), Arrears (desktop) — all render real data with clean consoles and no overflow. What remains is the *exhaustive* screenshot capture at every one of the 8 required sizes (1536/1366/1280/1024/768/430/390/375) for each page, for the visual-regression archive.

**Why not fully done by Claude Code:** Time-boxed drop; representative breakpoints (desktop + mobile, plus the lg shell switch) were covered live, not all 8 per page.

**Exact steps:** With a dev server running, open each route and capture at the 8 sizes; log in `qa-release/browser-qa-log.md`. No layout defects expected (shared responsive shell).

## 2b. Deposit seed data — "Unknown Tenant" rows

**Observation (not a code defect):** 3 of the 9 seeded deposits have no `contact_id`, so the list shows "Unknown Tenant" (and 1 has no `property_id` → "Unknown Property"). The page handles this with a correct fallback label. For demo polish, backfill `deposits.contact_id`/`property_id` on those rows (via PAT) to a real contact/property. Not done automatically because the correct tenant/property for those rows can't be inferred safely.

---

## 3. Automated test suites for these pages

**Why not done by Claude Code:** No existing test harness covers these specific Money detail routes; writing the full positive/negative RLS + E2E + visual-regression suite was beyond this drop's time box. Manual live RLS isolation **was** verified for the Bill page (cross-workspace id returns not-found, no leak).

**Exact steps (recommended):**
- RLS: add positive (owner can read own-workspace bill/invoice) + negative (other workspace, no membership) tests against `bills`, `invoices`, `payments`, `marketplace_disputes`.
- E2E: Bills list → bill detail → Record Payment → payment appears in Payment tab + outstanding drops; Invoice list → detail → Mark as Paid.
- Visual regression: snapshot the 6 pages at the benchmark viewport.

---

## Nothing else is blocking

All defects found in code (FIX-460/461/462) were fixed and verified in this session. No P0/P1 defects remain open for these pages.

---

## RESOLVED in Pass 2 (2026-06-25) — no longer user actions

- **Deposit seed ("Unknown Tenant"/"Unknown Property")** — ✅ DONE via PAT. 5 deposits backfilled with real tenant contacts + properties; 0 unknowns remain. (Was §2b.)
- **Automated RLS suite** — ✅ DONE. `scripts/test/money-rls.mjs` (Node, not Playwright), 24/24 passing, wired into `npm run test:integration`. (Was §3, RLS part.)
- **"Pay via Stripe" wiring** — ✅ DONE (code). Now a live Connect-status-aware button (FIX-464). Only the **Stripe Connect OAuth onboarding itself** remains a genuine external/founder step (§1).
- **Responsive matrix** — Bill captured at all 8 sizes; the other 4 pages live-verified at desktop. Remaining: re-run the Chrome MCP resize loop for Invoice/Dispute/Deposit/Arrears at all 8 sizes after an MCP restart (tooling, not a code defect).

The only true external blocker left is **Stripe Connect OAuth onboarding** (§1).

---

## Stripe Connect — UPDATE 2026-06-25: flag now ENABLED + button verified ON-state

`NEXT_PUBLIC_FF_STRIPE_CONNECT=true` set in `.env.local`; dev server restarted. Verified live (Chrome MCP, :3004):
the bill-page button now renders **"Set up Stripe"** (enabled onboarding CTA, with external-link icon) in both the
hero bar and the right-rail Quick Actions — the correct flag-ON / not-yet-connected state. `/api/connect/status`
returns `enabled:true`; console clean. Dual-state confirmed (OFF→disabled+reason, ON→onboarding CTA).

Remaining genuinely-external founder steps to make a card charge actually settle:
1. Set `NEXT_PUBLIC_FF_STRIPE_CONNECT=true` in the **deployed** env (Vercel) too — done locally only.
2. Ensure live Stripe API keys are present in the deployed env so `/api/connect/onboard` can create the account link.
3. Click "Set up Stripe" and complete Stripe Connect Express onboarding (business + bank). Once `charges_enabled`,
   the button flips to "Pay via Stripe" → Record Payment.
