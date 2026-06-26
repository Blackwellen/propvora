# Liability Posture + Full Customizability — Plan

**Date:** 2026-06-25. **Founder directive:** *"This is NOT a legal/compliance site — it's a property-management platform. We provide legal information from verified sources as a convenience, but it is the user's job to verify and customise the numbers to their own requirements to ensure compliance. We are not legal advisors in any way and must make that clear. Info should pop up — and the user can acknowledge AND close/dismiss those pop-ups."*

This **supersedes** the earlier provenance model in `GAP-AUDIT-and-internal-signoff.md` (the "counsel-reviewed removes the disclaimer / green badge" idea was over-cautious and wrong for a PM platform).

---

## 1. Positioning (the liability shield)
- Propvora is a **property-management tool**, not a legal/tax/compliance advisory service.
- All jurisdiction content is **informational, drawn from verified public sources**, provided as a **convenience/starting point**.
- **The operator is responsible** for verifying and customising every value to their own circumstances and for their own legal/regulatory compliance.
- Propvora **gives no legal, tax or financial advice** and accepts no liability for reliance on the defaults.
- This is stated in: ToS, every legal/compliance/tax surface (persistent footer note — already exists), **and** a dismissible info pop-up (below).

## 2. Provenance model — CORRECTED
| Old (wrong) | New (correct) |
|---|---|
| `researched` → `internal-review` → `counsel-reviewed` (green badge, disclaimer removed) | **`sourced`** (informational, from a cited source) — **that's it** |
| Disclaimer removed once a solicitor signs | **Disclaimer is PERMANENT on every surface** (never removed) |
| Implied authority once "reviewed" | **No authority ever claimed** — explicitly disclaimed |
- We keep the **source citation** (so the user sees it's from gov.uk/RTB/§551 BGB etc.) and the **"verify & customise — not legal advice"** line. We do **not** need paid counsel sign-off to ship — because we never assert the numbers are authoritative. **This removes "counsel sign-off" as a release blocker.**
- The cited-source docs remain valuable: they give the operator a real, defensible **starting default** they can trust enough to edit.

## 3. The disclaimer pop-up (dismissible)
- **Trigger:** first visit to any legal/compliance/tax framework surface (possession wizard, HMO wizard, deposit field, rent-control field, tax/Planning cost-drivers, compliance requirements, legal overview).
- **Content:** "Propvora is a property-management tool, not a legal advisor. The figures shown (e.g. notice periods, deposit caps, tax rates) are informational, from verified public sources, and may be out of date or not fit your situation. **You must verify and adjust them for your own compliance.** Sources are cited for your reference."
- **Actions:** **Acknowledge** (primary) **and Close/Dismiss (X)** — both dismiss it. 
- **Persistence:** remember dismissal **per user** (e.g. `user_dismissed_legal_disclaimer` flag or localStorage), so it doesn't nag every visit; re-show after major legal-content updates or per-section first-touch. The **persistent footer disclaimer stays regardless** (the pop-up is the attention-grab; the footer is the always-on notice).
- **Data:** `user_notice_dismissals (user_id, notice_key, dismissed_at)` — RLS self-scoped.

## 4. Full customizability (the core requirement)
Every jurisdiction default must be **operator-overridable AND operator-settable**, at the right scope:

| Scope | What | Where | Store |
|---|---|---|---|
| **Per-case** | override a single notice period / deposit / tax figure for one wizard run, with a reason | in the wizard (already designed §10b) | on the record (`*_overridden`, `*_override_reason`) |
| **Per-workspace** | set the workspace's own defaults for a jurisdiction (notice periods, deposit cap, tax rates, compliance cadences, licence classes, rent-cap %) | Settings → Legal / Compliance / Tax (extends `workspace_legal_modules` + `workspace_compliance_requirements`) | per-workspace override tables |
| **Per-property** | a property in a sub-jurisdiction or with an exemption can carry its own values | property detail | property metadata / per-property override |
| **Add custom** | add a value/rule Propvora doesn't ship (a local council quirk, a niche exemption) | Settings editors (already exist for legal/compliance custom packs) | custom rows |

**Principle:** Propvora ships **editable defaults**, never **locked truths**. The resolver chain is: per-case override ▸ per-property override ▸ per-workspace override ▸ Propvora sourced default ▸ blank ("set this yourself"). Every framework value renders with an **"edit"** affordance + a "source" chip.

## 5. Workstream (added to the 360 programme)
**New Phase (cross-cutting, do alongside Phase 0–1):**
1. **Disclaimer pop-up component** (dismissible, per-user persistence) + wire to all legal/compliance/tax surfaces; keep the persistent footer.
2. **Override/customisation layer** end-to-end: per-case (wizards) + per-workspace (Settings editors, extend existing custom-pack tables) + per-property; one `resolveValue()` that walks the override chain.
3. **"Edit + source chip" UI** on every framework value (notice period, deposit cap, tax rate, compliance item, licence class, rent-cap).
4. **ToS/legal-page copy**: explicit "not a legal advisor / informational only / your responsibility to verify" — reuse `src/lib/legal/company.ts` disclaimer infra.
5. **Reframe all sourced docs**: status line becomes `sourced (informational — not legal advice; verify & customise)`; drop the `counsel-reviewed` tier and the green-badge idea.

## 6. Net effect
- **Lower liability:** we never claim authority; permanent disclaimer + operator ownership of the numbers.
- **No counsel sign-off blocker:** ship at `sourced` tier with disclaimer + customizability. (Paid legal review becomes optional polish, not a gate.)
- **Better product:** operators can tune Propvora to their exact jurisdiction/exemptions — which is what a PM platform should do.
