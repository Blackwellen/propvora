# Propvora Global Rollout Phasing & Gating Checklist

**Companion to:** `INTERNATIONAL_EXPANSION_MASTER_PLAN.md`, `COUNTRY_LEGAL_PROFILES.md`, `I18N_LOCALIZATION_AND_UX_PLAN.md`. **Generated:** 2026-06-15.

> ⚠️ Build/planning document, **not legal/tax advice**. Each phase gate that says "register / appoint / review" is a **Blackwellen commercial+legal action** (⚖️/🧾), not a code task — but the app must not *enable* a market until that action is recorded.

---

## 0. The master gate: this whole initiative is GATED

**International expansion does not start until the current UK V1 build is signed off as release-ready.** "Release-ready" is defined by the existing MAX-RELEASE programme (`docs/release` trackers; memory `project-max-release.md`). Today that signoff is **NOT** granted. Concretely, before any international work begins:

### Gate A — "Current build complete" checklist (must all be true)

- [ ] UK V1 functional scope complete; no stub/placeholder routes (`no-stub-release-rule`, `final-go-live-scorecard`).
- [ ] `node scripts/audit-queries.mjs` = 0 (schema fully aligned — memory `project-schema-alignment.md`).
- [ ] 0 Tailwind `dark:` classes (memory `feedback-no-dark-classes.md`).
- [ ] Billing gates live + server-side (`src/lib/billing/gates.ts`; memory `project-billing-gates.md`).
- [ ] WCAG 2.2 AA pass across app + marketing (this becomes legally load-bearing in the EU via the EAA).
- [ ] Security review clean (RLS/IDOR/service-role exposure — the `scripts/test/idor-sweep.mjs`, `anon-exposure.mjs`, `role-within-workspace.mjs` probes already in the repo).
- [ ] Live on staging.propvora.com + production deploy path proven (memory `reference-vercel-deploy.md`).
- [ ] MAX-RELEASE signoff explicitly flipped to release-ready.

Until Gate A passes, the international docs remain **planning artefacts only**. The marketplace/global architecture is also explicitly branch-isolated (`feature/global-context-marketplace-architecture`) so it cannot destabilise V1 (marketplace audit §25).

---

## 1. Phasing principle

Enter markets in order of **decreasing legal/operational similarity to the UK** and **increasing compliance cost**. Subscriptions can go live earlier than property packs everywhere — the phases below gate the **property/legal intelligence**, not just the ability to bill.

```text
Phase 0  UK only (V1)                         ← current
Phase 1  English-law-adjacent (IE, AU, NZ, CA-en, US-en billing)
Phase 2  EU/EEA + Switzerland
Phase 3  Established non-EU (JP, SG, BR, MX, UAE)
Phase 4  Restricted/manual markets (TR, IN, ZA, NG, KE, PK, TH-caution)
Never*   BANNED set (sanctions) — *unless law changes + counsel clears
```

---

## 2. Phase plan (effort / risk / what unlocks)

### Phase 0 — UK (current)
- **Scope:** full V1. `country_profiles` has one `enabled` row (GB).
- **Effort/Risk:** baseline / baseline.

### Phase 1 — English-law-adjacent (IE, AU, NZ, Canada-en, US-en billing)
- **Unlocks:** Context Engine country fields live; multi-currency; i18n scaffold (en-* + fr-CA); first non-GB packs (AU state sub-packs, NZ Healthy Homes, IE RTB) at `beta`.
- **Compliance prerequisites:** appoint **EU rep** (via Ireland) for IE; AU/NZ/CA **GST registrations** (🧾); CASL consent ledger (CA); US **sales-tax engine** + nexus tracking even for English billing; US 19-state privacy patchwork handling; **sanctions/eligibility gate live**.
- **Effort:** High (this phase builds the engine). **Risk:** Medium — English-language reduces localization risk; US tax/privacy is the main hazard.

### Phase 2 — EU/EEA + Switzerland
- **Unlocks:** full i18n (de/fr/es/it/nl/sv/fi/da/cs/hr/hu); EU VAT **OSS** registration (🧾); EU packs at `research_only → beta`; EAA accessibility hard requirement; EU **14-day withdrawal + cancel button (19 Jun 2026)**; cookie-consent opt-in.
- **Compliance prerequisites:** **EU Art 27 rep** confirmed; **Swiss rep** (FADP); EU SCCs / DPF chain for transfers; per-country e-invoicing roadmap (IT/FR/BE/PL); EU consumer-law T&C variants (⚖️).
- **Effort:** Very High (translation + per-country tenancy packs + e-invoicing). **Risk:** High — 27 tenancy regimes, e-invoicing mandates, withdrawal-button deadline.

### Phase 3 — Established non-EU (JP, SG, BR, MX, UAE)
- **Unlocks:** ja-JP / pt-BR locales; PIX (BR), local methods; LGPD **DPO** (BR); JCT/GST/VAT registrations (🧾).
- **Prerequisites:** BR **encarregado/DPO** appointed; JP APPI handling (EU adequacy helps); BR **NF-e e-invoicing** via local provider; CDC 7-day withdrawal.
- **Effort:** High. **Risk:** Medium-High — Brazil tax/e-invoicing complexity.

### Phase 4 — Restricted / manual markets (TR, IN, ZA, NG, KE, PK, TH)
- **Unlocks:** **manual-onboarding** path only; `offer_status = restricted`; packs mostly `research_only` with strong disclaimers (esp. **TH short-let** and **PK no-DP-law**).
- **Prerequisites:** alternative payment providers where no Stripe (TR); **IN OIDAR GST** (no threshold, 🧾); ZA **Information Officer**, NG **NDPC**, KE **ODPC** registrations (⚖️); enhanced sanctions/risk screening; **DPDP negative-list** monitoring (IN).
- **Effort:** High per-country, low parallelism. **Risk:** High — payments, localisation pressure, and short-let legality (TH) are sharp edges.

### Never (unless law changes) — BANNED set
- Cuba, Iran, North Korea, Syria, Russia, Belarus, Venezuela, Nicaragua, Sudan, South Sudan, Somalia, Yemen, Afghanistan, Myanmar, China-mainland (payments), and occupied UA regions. **Hard-blocked at signup**; revisit only on counsel advice (⚖️).

---

## 3. Per-market launch gate (repeat for every new country)

A country may flip from `research_only` to `beta`/`enabled` **only** when all are recorded:

- [ ] **Eligibility** confirmed (not BANNED; sanctions feed live; geo-screen for sub-region cases e.g. UA).
- [ ] **Payments**: Stripe billing supported (or approved alternative); Connect payout matrix updated if suppliers/affiliates payable there.
- [ ] **Tax** 🧾: indirect-tax registration done / threshold-tracked; invoice fields + tax-ID validation + e-invoice format set; tax engine covers the country.
- [ ] **Privacy** ⚖️: regime mapped; representative/DPO/Info-Officer appointed where required; transfer mechanism selected; DSAR window + breach clock + authority recorded; privacy notice translated + reviewed.
- [ ] **Consumer/contract** ⚖️: region T&C/EULA/DPA/refund variant reviewed; withdrawal/auto-renewal handling correct; governing-law clause + consumer-mandatory carve-outs reflected.
- [ ] **Property pack** ⚖️: tenancy/short-let/compliance rules reviewed by local counsel, OR feature left in `generic_only`/`research_only` with disclaimers and AI guardrails on.
- [ ] **Localization**: locale catalog complete; legal/consent strings marked `reviewed`; formats/address/phone correct; accessibility re-checked (EAA where EU).
- [ ] **AI guardrails**: country prompt-guard set; legal/tax depth downgraded until pack `reviewed`.
- [ ] **Admin/Release Gate**: `reviewed_by` + `reviewed_at` populated; Platform-Admin release gate flipped.

---

## 4. Build order (within the international workstream, post-Gate-A)

Aligns with marketplace-audit §25 build order, with compliance content interleaved:

1. Context Engine + country/workspace/property fields + `country_profiles` schema.
2. Eligibility + sanctions gate (signup/billing/payout screens).
3. Tax engine integration + multi-currency + invoice model (incl. e-invoice-ready).
4. i18n framework (next-intl) + format/address/phone layer.
5. Privacy/consent engine (regime-aware DSAR/erasure/breach/consent; subprocessor + DPA generator).
6. Legal/compliance **gating** (disable UK-statute features off-GB; generic fallback modes).
7. Region T&C/EULA/refund/withdrawal variants + checkout consent/cancel flows.
8. Per-phase country packs (Phase 1 → 4) behind the per-market launch gate.
9. Admin global control plane (Countries / Country Packs / Representatives / Release Gates).
10. Full international test matrix + release gates.

---

## 5. Top risks to sequence around (cross-ref master plan §10)

1. **Sanctions gate correctness** — must precede *any* non-UK signup (Phase 1 blocker).
2. **US tax + privacy patchwork** — heaviest Phase-1 hazard despite English language.
3. **EU reps + e-invoicing + withdrawal button** — Phase-2 blockers with hard 2026 dates.
4. **Property-pack over-reach** — never present unreviewed jurisdiction logic as advice; default to disable/generic.
5. **Brazil/India tax + DP** — Phase 3/4 complexity; budget for local advisers and e-invoicing providers.

---

## 6. Sources
Consolidated in `INTERNATIONAL_EXPANSION_MASTER_PLAN.md` §11 (privacy regimes, tax thresholds, e-invoicing dates, Stripe support, sanctions lists, EAA, EU consumer withdrawal). Internal gating references: `docs/release` MAX-RELEASE trackers, `scripts/audit-queries.mjs`, `src/lib/billing/gates.ts`, `src/proxy.ts`.
