# Propvora Internationalisation — Documentation Index

**Posture (read first):** Propvora is a **property-management platform, NOT a legal/tax advisor.** All jurisdiction figures below are **informational, from verified public sources, provided as a convenience**. The **operator must verify and customise** every value for their own compliance. Permanent "not legal advice" disclaimer + full customizability — see **[LIABILITY-disclaimer-and-customizability-plan.md](LIABILITY-disclaimer-and-customizability-plan.md)**.

---

## 1. Planning & strategy
| Doc | What |
|---|---|
| [v1-enterprise-i18n-audit-and-plan.md](v1-enterprise-i18n-audit-and-plan.md) | Current-state audit, 4 i18n axes, 45-country tiers, phased plan |
| [v1-i18n-granular-section-matrix.md](v1-i18n-granular-section-matrix.md) | Every leaf of the app map rated L/J/C/M with the alteration needed |
| [v1-i18n-MASTER-BUILD-PLAN.md](v1-i18n-MASTER-BUILD-PLAN.md) | Active-jurisdiction-context design, data model, phasing, override design (§10b) |
| [v1-i18n-360-research-scope.md](v1-i18n-360-research-scope.md) | The **28-dimension** research register + progress snapshot + Planning-profiles register |
| [INTEGRATION-and-IMPLEMENTATION-plan.md](INTEGRATION-and-IMPLEMENTATION-plan.md) | **Where it plugs in:** existing infra to reuse, the 2 central integration points, **Settings (6 surfaces)**, sections-requiring-implementation register, data-model touchpoints |
| [DIMENSION-by-DIMENSION-implementation.md](DIMENSION-by-DIMENSION-implementation.md) | **Deep per-dimension change spec (all 28):** data + engine/pack file + consuming surfaces + settings + override + specific code changes, grouped + dependency/phase rollup |
| [impl-spec/PART-1-legal-frameworks.md](impl-spec/PART-1-legal-frameworks.md) | **Full 13-facet build spec** — dims 1,3,5,6,10,11,12,13,22,23 (integration·components·context·cross·fields·DB·functions·onboarding·seed) |
| [impl-spec/PART-2-compliance-work.md](impl-spec/PART-2-compliance-work.md) | Full 13-facet build spec — dims 4,20,24,27 (+ the `buildings` entity) |
| [impl-spec/PART-3-money-tax.md](impl-spec/PART-3-money-tax.md) | Full 13-facet build spec — dims 2,7,8,9,21,26 |
| [impl-spec/PART-4-structural-and-rollup.md](impl-spec/PART-4-structural-and-rollup.md) | Full 13-facet build spec — dims 15,16,17,18,19,25,28 **+ Phase-0 spine, workspace→section rollup, onboarding & seed plan, master migration index** |
| [INTEGRATION-TODO.md](INTEGRATION-TODO.md) | **The build to-do (A–K) with per-section QA GATES** — surfaces touched, checklist tier, i18n-critical checks; shipped items ticked |
| [qa/MASTER-QA-CHECKLISTS.md](qa/MASTER-QA-CHECKLISTS.md) | **Canonical release-readiness checklists** — Tier 1 main-section (220) · Tier 2 sub-tab (317) · Tier 3 nested + wizard/detail spine, with the i18n overlay |
| [LIABILITY-disclaimer-and-customizability-plan.md](LIABILITY-disclaimer-and-customizability-plan.md) | **Liability posture + dismissible disclaimer pop-up + full customizability layer** |
| [GAP-AUDIT-and-internal-signoff.md](GAP-AUDIT-and-internal-signoff.md) | Corpus gap audit + internal-review record (posture-corrected) |

## 2. Consolidated reference
| Doc | What |
|---|---|
| [ALL-45-country-matrix.md](ALL-45-country-matrix.md) | **Canonical** quick-ref: possession · deposit · rent-control · acquisition-tax · recurring-tax for **all 45** |

## 3. Per-dimension sourced docs
| Dim(s) | Doc | Breadth |
|---|---|---|
| 1 Possession | [tier-a-notice-periods-sourced.md](legal-frameworks/tier-a-notice-periods-sourced.md) · [tier-b-notice-periods-sourced.md](legal-frameworks/tier-b-notice-periods-sourced.md) | all 45 |
| 2 Deposits | [deposit-rules-sourced.md](legal-frameworks/deposit-rules-sourced.md) | all 45 |
| 3,5 Licensing + Registration | [licensing-registration-sourced.md](legal-frameworks/licensing-registration-sourced.md) | Tier-A + repr. |
| 4,20 Safety compliance + Trade certs | [safety-compliance-and-trade-certs-sourced.md](compliance-frameworks/safety-compliance-and-trade-certs-sourced.md) | UK/IE/FR/DE/ES + 6 |
| 6 Rent regulation | [rent-regulation-sourced.md](legal-frameworks/rent-regulation-sourced.md) | Tier-A + lead EU |
| 7,21 Acquisition + Recurring tax | [property-tax-sourced.md](tax-frameworks/property-tax-sourced.md) | Tier-A + ES/DE (matrix = all 45) |
| 8,9 Income tax + interest relief | (in [agent-fitness-incometax-language-sourced.md](legal-frameworks/agent-fitness-incometax-language-sourced.md)) | UK/IE/DE/FR/ES/IT |
| 10 Short-let | [short-let-licensing-sourced.md](legal-frameworks/short-let-licensing-sourced.md) | 8 + pattern |
| 13,14,18,22 RtR/Energy/Tenancy-models/Tenant-fees | [tenancy-rtr-fees-energy-sourced.md](legal-frameworks/tenancy-rtr-fees-energy-sourced.md) | UK nations + EU notes |
| 17 Housing/tenure models | [housing-tenure-models-sourced.md](legal-frameworks/housing-tenure-models-sourced.md) | UK/DE/FR/US/ES + refs |
| 19,23,24,25 Agent/Fitness/Insurance/Language | [agent-fitness-incometax-language-sourced.md](legal-frameworks/agent-fitness-incometax-language-sourced.md) | UK + key |
| 26 CGT/disposal tax | [capital-gains-disposal-tax-sourced.md](tax-frameworks/capital-gains-disposal-tax-sourced.md) | UK + patterns |
| 27 Building safety | [building-safety-sourced.md](compliance-frameworks/building-safety-sourced.md) | UK E&W |
| 28 AML/KYC | [aml-kyc-sourced.md](legal-frameworks/aml-kyc-sourced.md) | UK + queued |
| 15,16 Money-format + Privacy | (in code: `src/lib/i18n/country-profiles.ts`) | all 45 |

## 4. Status of the programme
- **Research/design phase: substantially complete** across all 28 dimensions (5 core dims cover all 45; deeper dims = Tier-A + key jurisdictions, cited).
- **Posture locked:** `sourced` / informational / permanent disclaimer / fully customisable. **No counsel sign-off blocker.**
- **Remaining research = breadth backfill** (small-jurisdiction cells on deeper dims) — low-value, continuation work, clearly marked in each doc.
- **Next = implementation:** Phase 0 (per-property jurisdiction engine + active-jurisdiction context + money formatter) **+ the disclaimer/customizability layer**, then the typed packs built from these sourced docs.

## Encoding contract (for implementation)
Every dimension becomes a typed pack consumed by a single `resolveValue(dimension, jurisdiction, context)` that walks the override chain **per-case ▸ per-property ▸ per-workspace ▸ Propvora sourced default ▸ blank**, and renders each value with an **"edit" affordance + source chip + permanent disclaimer**.
