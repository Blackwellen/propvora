# Internationalisation — Implementation Evidence

**Last updated:** 2026-06-29 · **Status:** implementation substantially shipped (flag-gated, additive)
**Trackers:** [INTEGRATION-TODO.md](INTEGRATION-TODO.md) (build checklist) · [GAP-AUDIT-and-internal-signoff.md](GAP-AUDIT-and-internal-signoff.md) (posture/sign-off)
**Fix log:** `qa-release/implementation-fix-log.md` — **FIX-533…595** (spine + engines) and **FIX-715…726** (consolidation, packs, persistence, capture, live sweep).

> This is the "what actually shipped" record that the research/plan docs pointed forward to.
> The i18n programme is **additive and flag-gated**: V1 ships GB-reviewed today; everything below
> expands multi-jurisdiction depth behind that gate. Posture is `sourced` / informational /
> permanently disclaimed / operator-customisable — **no counsel sign-off blocker**.

---

## Verification summary

- **874 unit/integration tests pass** (i18n formatters + 22-locale messages + FX + 45-pack guard +
  service-methods + supplier-credentials). `tsc --noEmit` **clean (0 errors)** across the app.
- **Live MCP acceptance (K57, 2026-06-29):** authenticated Chrome-MCP session (dev :3001) against a
  **seeded mixed portfolio** (UK + ES + AE + DE) in the JT Property Manager workspace. Home
  dashboard + property detail render clean (0 console errors) at desktop (1440) and mobile (390).
  The sweep **found and fixed two real jurisdiction bugs** (see "Live findings").
- **Seed (K56):** 3 record-true non-GB properties created via the Management API PAT —
  Barcelona (ES/EUR), Dubai (AE/AED, serviced-accommodation), Berlin (DE/EUR) — geocoded + persisted.

---

## Workstream status (A–K)

| WS | Area | Status | Evidence |
|----|------|--------|----------|
| **A** | Jurisdiction spine (resolver, hooks, primitives, FX, provider) | ✅ shipped | FIX-533…542 |
| **A11** | Money-formatter consolidation → shared `formatCurrencyAmount` core | ✅ | FIX-715 + drift-guard test |
| **B13–B18** | Settings/Admin tabs (Region&Jurisdiction, Customisation, Disclaimers, Account Lang, Admin Translations, Admin Jurisdiction Packs) | ✅ (verified already built) | reconciled doc-drift |
| **C** | Legal engines (possession, licensing, rent-control, short-let, tenancy-models, tenant-checks/fees, fitness) | ✅ engines + first-surface | FIX-578…592 |
| **C25** | Jurisdiction-aware notice **service-methods** engine + possession Record-Service | ✅ | FIX-718 (18 tests) |
| **D** | Compliance (property-keyed requirements, grouped coverage, trade-cert/insurance/building-safety) | ✅ | FIX-550/574/584/589/593 |
| **D31** | Cert wizard sources type + `kind` from the **selected property's** jurisdiction | ✅ | FIX-717 |
| **E** | Money/Tax engines (deposits, acquisition/disposal/recurring tax, interest-relief) | ✅ engines + first-surface | FIX-545…582 |
| **F41** | Planning tax engines jurisdiction-parameterised + currency-correct estimators | ✅ (+ EUR-mislabel bug fixed) | FIX-720 |
| **F42** | **Sets + Offers + property-detail money all render in the record's currency** | ✅ complete | FIX-722/723/725 |
| **F43** | Analytics group-by-jurisdiction | ⛔ **deferred** — source tables don't exist (mock-backed); belongs to the analytics-feature build, not i18n wiring | verified via PAT 2026-06-29 |
| **G** | Cross-cutting (tenure, agreement, agent-regulation, AML, bilingual notice) | ✅ engines + first-surface | FIX-584…594 |
| **H50** | `COUNTRY_PACKS` **6 → 45** jurisdictions | ✅ | FIX-716 (13 guard tests) |
| **I51** | Add-Property captures country/region + derives currency → record-true on create | ✅ | FIX-719 |
| **I52** | Planning-Set jurisdiction persistence + **supplier-credentials capture (full UI+API+RLS)** | ✅ | FIX-723/724 |
| **J** | 22-locale CORE vocabulary translated + wired + tested | ✅ | FIX-595 |
| **K56** | Mixed UK+ES+AE+DE seed via PAT | ✅ | this session |
| **K57** | Live MCP acceptance sweep | ✅ focused pass (2 bugs fixed); exhaustive every-route × 8-viewport pass remains | this session |

---

## Live findings (K57) — bugs the sweep caught and fixed

1. **Property money showed £ for foreign properties (FIX-725).** The shared property-detail `fmt()`
   hardcoded GBP. Now currency-aware across **all six** money-bearing tabs (Overview, Finances,
   Tenancies, Units, Work, Rent-to-Rent). Verified live: Barcelona → €1,450 / €17,400.

2. **Maps blank for non-UK addresses (FIX-726).** Three separate geocoders hardcoded `country=gb`,
   so foreign addresses returned no coordinates → empty maps. Fixed everywhere: `lib/maps/geocode.ts`
   (global by default, country-biased when given), `LocationMap` fallback (per-marker country),
   `LocationAutocomplete` (global), the Add-Property wizard (passes country), and **`useCreateProperty`
   geocodes centrally** so *every* property-creation path gets a pin — not just one wizard. Verified
   live: a Dubai property with no stored coords geocoded client-side and dropped the pin in Dubai Marina.

---

## Remaining (honestly tracked — none block V1)

- **F43 analytics** — build the analytics data layer first (yield/portfolio/pricing source tables are
  absent), then add multi-currency + group-by-jurisdiction. Separate feature, flag-gated.
- **Exhaustive K57 sweep** — every route × 8 viewports × jurisdiction; the spine + the two surfaced
  bugs are verified.
- **`[~]` persistence tails** — a few per-engine override write-UIs (engines compute correctly today).
- **Breadth backfill** — small-jurisdiction cells on deeper dimensions (low-value continuation; marked
  in each `*-sourced.md`).

## Release decision

**Ready for release behind the i18n flag.** V1 ships GB-reviewed; the multi-jurisdiction surfaces
(45 packs, record-true properties, currency-correct money everywhere, jurisdiction-aware legal /
compliance / tax / service-methods, supplier credentials, working foreign maps) are built, tested,
and acceptance-checked against real ES/AE/DE data, carrying the permanent not-legal-advice disclaimer.
