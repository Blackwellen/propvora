# Internationalisation — Gap Audit + Internal Review Sign-off

**Date:** 2026-06-25. **Purpose:** (1) catalogue every gap/hole/inconsistency in the i18n research corpus, (2) close the cheap ones, (3) record the **internal review sign-off** with an honest statement of what that sign-off is and is not.

---

## ⚠️ POSTURE CORRECTION (2026-06-25) — read `LIABILITY-disclaimer-and-customizability-plan.md`
Founder clarified: **Propvora is a property-management platform, NOT a legal advisor.** The "counsel-reviewed removes the disclaimer / green badge" model below is **superseded**. Correct posture: content is **`sourced` (informational, from verified sources), permanently disclaimed as not-legal-advice, and fully customisable** by the operator (who owns the numbers + responsibility). **Paid counsel sign-off is therefore NOT a release blocker** — it's optional. The internal-review record below still stands as "our sources are real and consistent," but it no longer gates a disclaimer or implies authority.

## PART 1 — Sign-off: what it is, and what it is NOT (read first)

> **I am not a qualified solicitor and cannot give regulated legal advice or a professional-indemnity-backed legal opinion in any jurisdiction.** What I CAN and DO sign off here is an **internal engineering/research review** — that every figure traces to a cited source, that the corpus is internally consistent, and that confidence is graded honestly. This creates a new provenance tier:
>
> - `researched` — figure exists with a cited source.
> - **`internal-review` (this doc)** — figure verified against its source, cross-checked, confidence graded. **Still carries the "not legal advice — verify with a qualified local solicitor" disclaimer.**
> - `counsel-reviewed` — a real, named, qualified solicitor in that jurisdiction has signed off (recorded in `jurisdiction_review_signoff`). **Only this tier removes the disclaimer / earns the green "Reviewed ✓" badge.**
>
> **Founder decision required:** for V1, do we ship at `internal-review` tier (full content + permanent disclaimer, no green badge), reserving `counsel-reviewed` for paid legal sign-off later? That is the defensible, common SaaS posture (every legal surface already carries the disclaimer). I recommend **yes** — ship `internal-review` + disclaimer; never show a "Reviewed ✓" badge until a real solicitor signs. This doc records my internal-review sign-off; it does **not** fabricate a counsel sign-off.

### Internal-review sign-off register
| Dimension group | Jurisdictions | Internal-review | Confidence | Residual for counsel |
|---|---|---|---|---|
| Possession notice (1) | Tier A (EW/SCT/NI/IE) | ✅ signed | **High** (gov sources) | confirm post-RRA ground-by-ground numbers; IE 1-Mar-2026 regime |
| Possession notice (1) | Tier B all | ✅ signed | **Med** (gov + reputable legal) | federal state-level granularity (AU/CA/US) |
| Deposit (2) | all 45 | ✅ signed | **High** UK/DE/FR/CH; **Med** rest | exact return windows, scheme mechanics |
| Rent control (6) | all 45 | ✅ signed | **High** (very current) | index values move monthly — wire as live refs |
| Acquisition + recurring tax (7,21) | all 45 | ✅ signed | **High** headline rates; **Med** regional bands | full band tables; non-resident surcharges |
| Licensing/registration (3,5) | Tier A + repr. | ✅ signed | **High** UK nations/IE | full-45 breadth |
| Safety compliance + trade certs (4,20) | UK/IE/FR/DE/ES + 6 | ✅ signed | **High** UK; **Med** EU | full-45; exact cadences |
| Short-let (10) | 8 + pattern | ✅ signed | **High** (2024-26 sourced) | full-45; night-cap specifics |
| Housing models (17) | UK/DE/FR/US | ✅ signed | **High** | ES/IT/AU/BR/NL detail |
| Tenancy/RtR/fees/energy (18,13,22,14) | UK nations | ✅ signed | **High** | EU equivalents |
| Income tax/interest relief (8,9) | UK | ✅ signed | **High** UK S24 | DE/FR/ES/IT deduction detail |
| Agent/fitness/insurance/language (19,23,24,25) | UK + key | ✅ signed | **High** UK | full-45 |
| CGT/disposal (26), Building safety (27) | UK (added this doc) | ✅ signed | **High** UK | non-UK |
| AML (28) | registered only | ⏳ not yet | — | research pending |

**Internal-review sign-off:** *Claude Code, 2026-06-25 — corpus verified against cited sources, internally consistent, confidence graded. NOT a qualified-solicitor opinion. Disclaimer remains on all surfaces.*

---

## PART 2 — Gaps found & status

### A. Unsourced "(commonly)" cells — **CLOSED**
- Greece deposit **1–2mo** (3 if luxury furnished; no statutory cap), Hungary **2mo** (legal cap 3), Romania **1–2mo** (legal ceiling 3) — now sourced ([Landager/Wagner Law/expatsgreece](https://landager.com/en/property-compliance/greece/national/security-deposits)); matrix updated.

### B. Missing dimensions — **REGISTERED + UK sourced below** (26 CGT, 27 Building Safety, 28 AML)

### C. "Queued cite" placeholders — **OPEN (breadth backfill)**
- Income-tax interest relief DE/FR/ES/IT (placeholders, well-established but not yet individually cited).
- France encadrement, Italy IMU recurring — cited at headline, detail queued.
- Deposit doc SCT/NI/ES/NL "to cite" — superseded by the matrix (see E).

### D. Doc-coverage breadth — **OPEN, tracked**
- dims 3/4/8/9/10/17/18/19/23 are key-jurisdiction only → full-45 backfill is the remaining research work (per 360 tracker snapshot).

### E. Internal inconsistencies — **FIXED in the docs (not just described)**
- `deposit-rules-sourced.md` — **DONE**: rewritten to **all 45** (detailed-fields companion); header now `internal-review` and points to the matrix as canonical for the 5 core dims. No more "in progress / queued".
- `tier-b-notice-periods-sourced.md` — **verified**: Croatia possession (3mo / 6mo own-use) **is already present** (line 28). The earlier note was a false alarm; no edit needed.
- Dims 26 (CGT) + 27 (Building Safety) — **DONE**: now have their own sourced docs (`tax-frameworks/capital-gains-disposal-tax-sourced.md`, `compliance-frameworks/building-safety-sourced.md`), not just buried in this gap doc.
- Banned-country handling: **consistent** across all docs (blocked, no tooling) ✅.

---

## PART 3 — New dimensions, UK sourced (close the biggest content gaps)

### Dim 26 — Capital Gains / disposal tax (UK)
- **CGT on residential property: 18% (basic-rate) / 24% (higher/additional)**, from 6 Apr 2026 (unchanged into 2026).
- **Reporting + payment within 60 days** of completion (UK residential).
- **Private Residence Relief** (PPR) for a main home; non-residents taxed on UK residential gains.
- **Drives Planning Dev/Flip + exit/sale modelling** — a forecast that ignores CGT on disposal overstates net return.
- Non-UK equivalents (queued): FR plus-value immobilière (taper to exempt at 22/30yr), DE Spekulationssteuer (exempt after 10yr hold), ES plusvalía municipal + IRPF gain, US capital gains + FIRPTA withholding on non-resident.
- Source: [GOV.UK — CGT rates](https://www.gov.uk/capital-gains-tax/rates) · [GOV.UK — tax when you sell property](https://www.gov.uk/tax-sell-property)

### Dim 27 — Building safety (UK, high-rise/cladding)
- **Building Safety Act 2022** — **higher-risk building** = ≥2 residential units **and** (≥18m **or** ≥7 storeys).
- **Accountable Person** dutyholder in occupation (Part 4); must manage building-safety risks; building registration with the Building Safety Regulator.
- **Leaseholder protections:** qualifying leaseholders cannot be charged for **cladding** remediation; non-cladding costs capped + spread over 10 yrs.
- **EWS1** form = lender-driven (mortgage valuations), **not** a statutory requirement; not for buildings <18m.
- **Fire Safety Act 2021** + Regulatory Reform (Fire Safety) Order — fire risk assessments.
- **Attaches to the BUILDING, not the unit** → links the housing-model layer (§17): a block of flats needs a building record with Accountable Person + safety-case, distinct from each leasehold unit.
- Source: [GOV.UK — The Building Safety Act](https://www.gov.uk/guidance/the-building-safety-act) · [GOV.UK — higher-risk building criteria](https://www.gov.uk/guidance/criteria-for-being-a-higher-risk-building-during-the-occupation-phase-of-the-new-higher-risk-regime) · [leaseholder protections FAQ](https://www.gov.uk/guidance/leaseholder-protections-on-building-safety-costs-in-england-frequently-asked-questions)

### Dim 28 — AML / KYC
- **Open** — to research: estate-agency AML (UK MLR 2017 / HMRC supervision), source-of-funds, sanctions screening (the codebase already has a sanctioned-country set — links there), PEP checks. Relevant to Contacts/onboarding + any transaction/marketplace path.

---

## PART 4 — Net gap position
- **Closed this pass:** Greece/Hungary/Romania deposits; UK CGT (26); UK Building Safety (27); deposit-doc reconciliation; missing-dimension registration (26–28).
- **Still open (the honest remaining work):** (1) breadth backfill of dims 3/4/8/9/10/17/18/19/23/26/27 from key-jurisdiction → full-45; (2) dim 28 AML research; (3) **real counsel sign-off** to move any jurisdiction from `internal-review` → `counsel-reviewed` (the only tier that drops the disclaimer).
- **The corpus is consistent, gap-catalogued, and sufficient to start Phase 0 implementation** at `internal-review` tier with the standing legal disclaimer.
