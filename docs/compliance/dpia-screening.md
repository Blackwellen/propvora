# DPIA Screening

Controller: Blackwellen Ltd (Propvora), Company No. 16482166, ICO ZC160806.
Contact: legal@propvora.com.

A **Data Protection Impact Assessment (DPIA)** is mandatory under Art. 35 UK GDPR
where processing is "likely to result in a high risk" to individuals, and the ICO
recommends screening all new processing. This document screens Propvora's
processing and records the outcome: **no full DPIA is required for the core SaaS,
but a focused DPIA/risk assessment is warranted for the AI Copilot** (held
separately in `ai-copilot-risk-assessment.md`).

## Screening questions (ICO + Art. 35(3) triggers)

| # | Trigger | Propvora answer | Risk |
|---|---------|-----------------|------|
| 1 | Systematic & extensive automated **evaluation/profiling** with legal/significant effects? | No. No automated decisions with legal effect; AI Copilot is assistive only with a "not final advice" disclaimer and no autonomous risky actions. | Low |
| 2 | Large-scale processing of **special-category** or criminal-offence data? | No. Special-category data not intentionally collected; free-text notes could contain it — covered by minimisation + erasure controls (`data-map.md`). | Low–Med |
| 3 | **Systematic monitoring** of a publicly accessible area? | No. | None |
| 4 | **Innovative technology / AI**? | Yes — LLM Copilot (OpenAI gpt-4o-mini), workspace-scoped. | Med → dedicated assessment |
| 5 | **Large-scale** processing? | Beta scale; per-workspace tenancy isolation (229 RLS-enabled tables). Volume currently modest. | Low |
| 6 | **Matching/combining** datasets from different sources? | No cross-workspace combination; data stays within the operator's workspace boundary. | Low |
| 7 | Data about **vulnerable** subjects? | Possible (tenants). Handled as ordinary contact/tenancy data; access scoped + audited. | Med |
| 8 | **Denial of service / access** based on processing? | Plan gates control feature access (server-side), not individuals' legal rights. | Low |
| 9 | Processing that prevents subjects **exercising a right**? | No — SAR/erasure/portability runbook in place; account deletion + export request tables built. | Low |
| 10 | **International transfers** to higher-risk jurisdictions? | US processors (Stripe/Resend/OpenAI/Vercel) under SCCs/UK IDTA — see `international-transfer-assessment.md`. | Med |

## Scoring

Two or more "high-risk" triggers, or any single trigger combined with novel tech,
points toward a DPIA. Propvora hits **one clear novel-technology trigger (AI)**
plus medium signals on special-category-in-free-text, vulnerable subjects, and
transfers.

## Outcome

- **Core SaaS (accounts, portfolio, money, portals, billing):** full DPIA **not
  required**. Risks are addressed by existing technical/organisational measures —
  RLS on all 229 tables, workspace isolation, server-side gates, security headers,
  audit logging, retention schedule, breach runbook. Recorded here as screened-out.
- **AI Copilot:** a focused **DPIA-style risk assessment is required** and is held
  in `ai-copilot-risk-assessment.md`. Treat that document as the Art. 35 record
  for the AI feature.
- **International transfers:** assessed in `international-transfer-assessment.md`.

## Review triggers (re-screen when any occur)
- Enabling Stripe Connect payouts (handling tenant payment flows).
- Adding profiling, scoring, or automated decisions with significant effect.
- Introducing tenant-referencing / credit-check features (HMRC/MTD, referencing).
- Materially increasing scale, or processing health/financial-vulnerability data.
- Changing AI provider, model, or expanding what data the model can read.

> **Legal review required.** Engineering-prepared screening. A qualified data
> protection adviser should confirm the outcome and the AI DPIA before GA.
