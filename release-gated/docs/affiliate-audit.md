# Release Evidence — Affiliate (PM in-workspace + standalone Portal)
**Audit date:** 2026-06-27 · **Auditor:** Claude Code (session-fullaudit) · **Verification:** code-level + prior tsc-clean (live QA pending dev-slot)

Covers BOTH surfaces (shared components/AffiliateTabNav):
- **PM in-workspace:** `/property-manager/affiliates/*` (Overview/Links/Referrals/Network/Earnings/Settings) — DashboardContainer shell, workspace-auth.
- **Standalone Portal:** `(affiliate)/affiliate/*` (same 6 tabs) — `AffiliatePortalLayout` with `requireAffiliateContext()` 3-layer guard: session → workspace (auto-bootstrap customer ws) → `affiliateEnabled` flag (else redirect /affiliate-programme).

## Findings — no code blockers
- **Data:** 100% live Supabase (`affiliates`, `affiliate_referrals`, `affiliate_commissions`, `affiliate_payouts`, `affiliate_links`, `affiliate_click_log`, `affiliate_milestones`, `stripe_connect_accounts`); 42P01/PGRST-safe → empty. KPIs/earnings/funnel/network/milestones all computed from real rows. No mock arrays, no Math.random in display paths (only in `makeReferralCode` suffix for code uniqueness — acceptable).
- **Currency:** centralized `formatPence()` (Intl GBP) everywhere; all money stored/computed in pence integers; **no raw `£${…}`**.
- **Payouts flag (OFF default):** `isAffiliatePayoutsEnabled()` (`NEXT_PUBLIC_AFFILIATE_PAYOUTS_ENABLED`). Server `requestAffiliatePayout()` returns `{ok:false, gated:true, "…coming soon…"}` when off; UI hides the request button + shows "Payouts coming soon, balance keeps accruing"; button also disabled when cleared < £50 min. Admin queue ops intentionally NOT flag-gated (back-office can process). All attempts audited.
- **Commission ledger:** immutable (insert + status transitions pending→payable→paid→reversed); idempotent Stripe-webhook accrual; 30-day cooling-off clear; refund/chargeback reversal. Read-only-correct.
- **Referral links:** real per-affiliate `referral_code` + `discount_referral_code` persisted on `affiliates`; copy buttons use clipboard API with confirmation.
- **Controls:** enrol / request-payout / copy-link / settings-save / Stripe-connect / filters — all live, with loading/empty/error states. No dead controls, no `dark:`.
- **Stripe Connect:** "Set up Stripe payouts" → `/api/connect/onboard` redirect (gated by Connect-enabled status).

**Decision:** Both surfaces **code-complete / clean** (code-level; live QA pending dev-slot). Payouts intentionally gated OFF for V1 (confirms project-affiliate).
