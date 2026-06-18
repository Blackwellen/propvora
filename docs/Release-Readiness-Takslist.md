# Release Readiness Task List

> **Authoritative source (2026-06-18):** release gates and the risk register now
> live in the strategic audit pack:
> [`Audits/propvora-strategic-bloat-commercial-gap-audit/16-release-readiness-and-risk-register.md`](Audits/propvora-strategic-bloat-commercial-gap-audit/16-release-readiness-and-risk-register.md).
> The cross-cutting gap list that feeds these gates is in
> [`06-gap-analysis.md`](Audits/propvora-strategic-bloat-commercial-gap-audit/06-gap-analysis.md),
> and the staged scope (what must be ON/OFF at launch) is in
> [`17-deprecation-and-feature-flag-plan.md`](Audits/propvora-strategic-bloat-commercial-gap-audit/17-deprecation-and-feature-flag-plan.md)
> and [`19-founder-decision-lock.md`](Audits/propvora-strategic-bloat-commercial-gap-audit/19-founder-decision-lock.md).

## Two gates (summary — full checklists in doc 16)

1. **Beta-ready** — wedge functional end-to-end (auth/onboarding, portfolio,
   compliance, money basics, portals), RLS verified, Stripe webhooks live, DR/backup
   confirmed, no Layer-D flags leaking into nav.
2. **Paid-launch-ready** — billing/entitlement gates enforced, payment security
   reviewed, SAR/account-deletion working, support SLA + maintenance mode +
   audit logs in place, accessibility + mobile baseline, marketplace/customer
   flags **OFF**.

This file is intentionally a pointer; do not duplicate the checklists here — keep
them single-sourced in the audit pack.
