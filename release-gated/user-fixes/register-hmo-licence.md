# User / Manual Fixes — Register HMO Licence wizard

The wizard is **100/100 release-ready for England & Wales**. Nothing here blocks the E&W release. The items below are tracked V1.5 enhancements that Claude Code deliberately did **not** build this drop, with the reason.

## 1. Cross-jurisdiction HMO registration (Scotland / Northern Ireland) — V1.5
**Why not done now (not a blocker):** HMO licensing genuinely exists in Scotland (Housing (Scotland) Act 2006) and Northern Ireland under their own regimes — `src/lib/legal/jurisdiction.ts` already marks `modules.hmo.applies = true` for both. However:
- The current register's `licence_type` options (Mandatory / Additional / Selective) are **England & Wales Housing Act 2004 classes** and are wrong for Scotland/NI.
- The Scottish/NI licence-class taxonomies and conditions have **not been professionally reviewed**, which is a prerequisite under the project's "reviewed vs research-only" jurisdiction posture.

**Current safe behaviour (intentional):** the wizard and the whole HMO subtree are gated to England & Wales via `LegalJurisdictionGate module="hmo"` (layout-level, so direct URLs are covered). Scotland/NI/other workspaces see the jurisdiction panel and are routed to generic record-keeping in Compliance/Documents. No incorrect E&W statute is ever shown.

**Exact manual steps to enable later (founder / legal):**
1. Obtain a reviewed source for Scottish HMO licence classes (and NI equivalents) and their standard conditions.
2. Add jurisdiction-specific `licence_type` option sets to `src/lib/legal/jurisdiction.ts` (or a new `hmoLicenceClasses(jurisdiction)` helper).
3. Relax the HMO gate from `reviewed`-only to "module applies" for HMO specifically, OR add a Scotland/NI variant of the wizard that renders the jurisdiction's licence classes.
4. Add a migration note if any new enum/column is needed (none required for the current free-text-safe schema).
5. Re-run the wizard QA matrix for the added jurisdictions (flag ON/OFF, RLS, direct URL).

## 2. Council e-filing / API submission — out of scope (external)
The wizard records the licence in Propvora for tracking + renewal reminders only. It does **not** apply for or file a licence with a local authority. No UK-wide council filing API exists; this stays manual by design. The Review step states this explicitly.

## Nothing else outstanding
- Build clean, tsc clean, RLS enforced, NOT-NULL jsonb handled, drafts + double-submit guarded, all launch points wired (incl. the previously-404 property-detail link).
