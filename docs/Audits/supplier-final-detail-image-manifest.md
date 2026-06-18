# Supplier `/supplier` Workspace — Final 4 Batches Image Manifest

**Source images:** `supplier_extra_images/` (31 files, 4 timestamp groups = 4 batches).
**Image numbering:** 38–68 (continues the earlier supplier-workspace image set).
**Mandatory pre-build deliverable** per the build prompt. Maps every image → page title, target route, active sidebar item, key components, panel/wizard state, **existing-route status**, and ambiguity notes.

## Ground rules (re-stated from the build prompt)

- **Reuse the existing `/supplier` shell.** Routes live under `src/app/(supplier-workspace)/supplier/…`, chrome = `SupplierAppShell` (shared `SideNavigation`) + `SupplierDetailShell` for detail/back-nav pages. Mobile = `SupplierMobileNav`. **Do NOT create a new shell or duplicate nav.**
- **Real sidebar items** (from `src/components/supplier-workspace/nav.ts`, Solo plan): `Overview · Requests · Jobs · Calendar · Services · Messages · Finance · Accounting · Automations · Profile · Compliance · Affiliate · Workspace settings`. **Help is NOT a sidebar item** — it is reachable via the top-bar life-buoy and `/supplier/help`. Inbox + Schedule exist as routes but are folded into Messages + Calendar in the nav.
- **`/suppliers/:slug` is PUBLIC** (marketplace public group `(marketplace-public)/marketplace/suppliers/[slug]`), NOT a supplier-sidebar page. Public listing exposes only approved public-safe fields.
- **Plan gate:** `plan_type: 'solo' | 'team'`. Build Solo now; keep Team-extensible.
- **All uploads are upload-only** (drag-drop / file-picker). **No URL-based file inputs.** Storage under `supplier-workspaces/{supplierWorkspaceId}/…`, private by default.
- **Every control wired:** real action, or typed stub + toast + audit-log scaffold + `TODO` if backend unfinished. No dead buttons.

## Status legend

- **BUILT** — route exists and is substantially implemented; image is an enhancement/alignment target.
- **THIN** — route exists but is a stub/short; needs significant build to match image.
- **MISSING** — no route yet; must be created.

---

## Batch 1 — Conversation, request, quote, job detail (images 38–45)

| # | File | Page title | Target route | Active sidebar | Key components | Panel / wizard state | Existing status |
|---|------|-----------|--------------|----------------|----------------|---------------------|-----------------|
| 38 | `09_23_00 PM (1)` | Message Thread Detail | `/supplier/inbox/threads/[threadId]` (canonical) / `/supplier/messages/conversations/[conversationId]` | Messages | 3-col: thread list · conversation · right linked-record + SLA panel | desktop default | `messages/conversations/[conversationId]` exists (THIN); `inbox/threads/[threadId]` MISSING |
| 39 | `09_23_02 PM (2)` | Mobile Message Thread / Field View | `/supplier/inbox/threads/[threadId]?view=mobile` | Messages | phone frame, chat-first, quick-action chips, "Mark update complete" | `view=mobile` | MISSING |
| 40 | `09_23_03 PM (3)` | Request Detail | `/supplier/requests/[requestId]` | Requests | tabs Overview/Scope/Files/Messages/Quote/Timeline · customer + property cards · budget/deadline/win-prob KPIs · risk flags · right quote rail | tab=Overview | exists (THIN, 108 lines) |
| 41 | `09_23_07 PM (4)` | Quote Builder — Step 1 Scope & Line Items | `/supplier/quotes/new?step=scope` | Requests | stepper · line-item table · right price summary · margin preview | `step=scope` | `QuoteBuilderWizard.tsx` exists in features; `/quotes/new` route MISSING |
| 42 | `09_23_07 PM (5)` | Quote Builder — Step 2 Pricing / Terms / Send | `/supplier/quotes/new?step=pricing-send` | Requests | price summary · warranty/availability/deposit/payment terms · PDF preview · "Ready to send" | `step=pricing-send` | MISSING (wizard component exists) |
| 43 | `09_23_07 PM (6)` | Quote Detail | `/supplier/quotes/[quoteId]` | Requests | tabs Overview/Line Items/Messages/Versions/Activity · status/value/expiry/win-chance · "Convert to job" | tab=Overview | exists (THIN, 74 lines) |
| 44 | `09_23_07 PM (7)` | Job Detail — Overview | `/supplier/jobs/[id]` | Jobs | tabs Overview/Schedule/Evidence/Messages/Costs/Invoice/Sign-off/Timeline · customer/property/route · escrow/payment · evidence + materials checklists · right action rail | tab=Overview | exists (BUILT, 581 lines) |
| 45 | `09_23_07 PM (8)` | Mobile On-Site Job View | `/supplier/jobs/[id]?view=mobile` | Jobs | phone frame · Call/Maps · access code · evidence checklist · photo uploads · Start/Mark complete · payout-blocker warning | `view=mobile` | needs `view=mobile` branch on BUILT page |

---

## Batch 2 — Evidence, sign-off, invoicing, payouts (images 46–53)

| # | File | Page title | Target route | Active sidebar | Key components | Panel / wizard state | Existing status |
|---|------|-----------|--------------|----------------|----------------|---------------------|-----------------|
| 46 | `09_23_58 PM (1)` | Job Evidence Upload | `/supplier/jobs/[id]/evidence` (or `?tab=evidence`) | Jobs | quality-score + escrow KPIs · evidence checklist before/after · upload queue (upload-only) · escrow release requirements · "Submit evidence" | evidence tab/subroute | `/supplier/evidence` hub exists (THIN, 63 lines); per-job evidence subroute MISSING |
| 47 | `09_23_58 PM (2)` | Job Completion / Sign-off | `/supplier/jobs/[id]/sign-off` (or `?tab=sign-off`) | Jobs | completion/evidence/customer-review/payment KPIs · completion checklist · evidence summary · customer sign-off card · warranty/recommendations · "Request sign-off" | sign-off tab/subroute | sign-off is a tab on BUILT job page; dedicated view MISSING |
| 48 | `09_23_58 PM (3)` | Invoice Creation Wizard — Step 1 Job + Customer | `/supplier/finance/invoices/new?step=job` | Finance | "Invoice Creation Wizard" · select completed job + customer · right INVOICE preview · readiness status | `step=job` | MISSING |
| 49 | `09_23_58 PM (4)` | New Invoice — Step 2 Line Items | `/supplier/finance/invoices/new?step=line-items` | Finance | line-item table · discounts/adjustments · VAT · invoice summary · validation checks | `step=line-items` | MISSING |
| 50 | `09_23_58 PM (5)` | Create Invoice — Step 3 Review & Send | `/supplier/finance/invoices/new?step=review` | Finance | invoice PDF preview · payment details · readiness checklist · "Send invoice" | `step=review` | MISSING |
| 51 | `09_23_58 PM (6)` | Invoice Detail | `/supplier/finance/invoices/[invoiceId]` | Finance | tabs Invoice details/Payments & payouts/Files · customer/operator · line items · VAT breakdown · audit summary | status=Paid | exists (THIN, 71 lines) |
| 52 | `09_23_58 PM (7)` | Payout Detail | `/supplier/payouts/[payoutId]` | Finance | linked jobs in payout · escrow release conditions · blockers · fee breakdown · audit trail · "Resolve blockers" | status=Awaiting | `/supplier/payouts` hub exists (THIN, 91 lines); `[payoutId]` MISSING |
| 53 | `09_23_58 PM (8)` | Payout Blocker Resolution | `/supplier/payouts/[payoutId]/blockers` | Finance | blocker list (missing photos, sign-off, invoice, insurance cert, payment terms) · resolution progress · upload/resolve actions | status=Blocked | MISSING |

---

## Batch 3 — Public listing, profile, service, compliance uploads, verification, insurance (images 54–61)

| # | File | Page title | Target route | Active sidebar | Key components | Panel / wizard state | Existing status |
|---|------|-----------|--------------|----------------|----------------|---------------------|-----------------|
| 54 | `09_24_20 PM (1)` | **PUBLIC** Supplier Listing — Morgan Heating & Plumbing | `/marketplace/suppliers/[slug]` (public, **NOT** supplier sidebar) | — (public marketplace nav) | hero · service categories · featured work · pricing · reviews · trust & safety · coverage map · "Request a quote" | public, approved-fields only | exists in `(marketplace-public)` (verify against image) |
| 55 | `09_24_20 PM (2)` | Public Profile Preview (supplier-side) | `/supplier/profile/preview` (or `/supplier/profile?tab=preview`) | Profile | visibility status · desktop + mobile preview frames · "Improve your profile" checklist · "Edit listing" | preview mode | MISSING (profile page exists) |
| 56 | `09_24_20 PM (3)` | Service Detail — Boiler service / Annual maintenance | `/supplier/services/[id]` | Services | tabs Overview/Pricing/Packages/Availability/Coverage/Reviews/Performance · service+pricing summary · packages · coverage map · public visibility · perf/revenue charts · activity timeline | tab=Overview | exists (THIN→mid, 194 lines) |
| 57 | `09_24_20 PM (4)` | Upload Compliance Document | `/supplier/compliance/upload` (or modal on `/supplier/compliance`) | Compliance | document details · drag-drop upload (**upload-only**) · type select · valid-from/expiry · secure storage note · submission checklist · verification standards · "Submit & queue review" | upload form | MISSING |
| 58 | `09_24_21 PM (5)` | Verification Upload — Hub / Checks Overview | `/supplier/verification` (or `/supplier/compliance/verification`) | Compliance | verification checks (identity, business, address, bank, phone/email, right-to-work, background) · status per check · "Why verification matters" · trust badge tier | hub | `/supplier/verification` exists (THIN, 135 lines) |
| 59 | `09_24_21 PM (6)` | Verification Upload — Step Business Verification | `/supplier/verification/business?step=upload` | Compliance | stepper (Business/Upload proof/Review & submit) · upload (**upload-only**) · doc details · business checklist · "Continue to review" | `step=upload` | MISSING |
| 60 | `09_24_22 PM (7)` | Verification Upload — Step Review & Submit | `/supplier/verification/business?step=review` | Compliance | Gas safety cert (CP12) · review checklist · uploaded file · verification details · declaration · audit notice · "Submit verification" | `step=review` | MISSING |
| 61 | `09_24_26 PM (8)` | Insurance Renewal — Step 1 Policy Details | `/supplier/insurance/renew?step=policy` | Compliance | stepper (Policy/Coverage/Upload/Review) · current policy summary (Active/Good) · policy-details form · coverage by service · impact on eligibility · "Continue to upload" | `step=policy` | `/supplier/insurance` exists (THIN, 135 lines); renew wizard MISSING |

---

## Batch 4 — Insurance steps, licence/document detail, onboarding, readiness, help (images 62–68)

| # | File | Page title | Target route | Active sidebar | Key components | Panel / wizard state | Existing status |
|---|------|-----------|--------------|----------------|----------------|---------------------|-----------------|
| 62 | `09_24_40 PM (1)` | Insurance Renewal — Step 2 Upload Policy | `/supplier/insurance/renew?step=upload` | Compliance | current policy summary · upload new policy (**upload-only**) · document checks · coverage validation · expiry validation · current-vs-new comparison · "Continue to review" | `step=upload` | MISSING |
| 63 | `09_24_41 PM (2)` | Insurance Renewal — Step 3 Review & Submit | `/supplier/insurance/renew?step=review` | Compliance | policy summary · trust-badge impact (Excellent) · service eligibility · declaration · reviewer checklist · "Submit insurance" | `step=review` | MISSING |
| 64 | `09_24_41 PM (3)` | Licence Detail — Gas Safe Register Licence | `/supplier/compliance/licences/[licenceId]` | Compliance | status verified · days-to-expiry · tabs Verification/Documents/Reminders/Audit · linked services · uploaded certificates · licence history · audit trail | tab=Verification | MISSING |
| 65 | `09_24_41 PM (4)` | Document Detail — Gas Safe Certificate | `/supplier/compliance/documents/[documentId]` | Compliance | document preview · tabs Overview/Links/History/Audit · approval status · linked services & jobs · replacement history · approval history · audit trail · secure-access note | tab=Overview | exists (THIN, 70 lines) |
| 66 | `09_24_41 PM (5)` | Onboarding Complete | `/supplier/onboarding/complete` | (onboarding flow) | "Congratulations" · setup 100% · profile/trust/services/coverage stats · onboarding checklist · quick start · get-first-job · marketplace visibility toggle · "Go to marketplace" | complete state | `/supplier/onboarding` exists (195 lines); `complete` step MISSING |
| 67 | `09_24_41 PM (6)` | First Job Readiness Checklist | `/supplier/onboarding/readiness` | (onboarding flow) | readiness % · categories (Availability, Services, Pricing, Coverage, Compliance, Payment setup, Message response, Evidence quality, Job ratings) · per-item status + actions · missing-actions panel · "Start receiving jobs" | checklist | MISSING |
| 68 | `09_24_41 PM (7)` | Help & Guidance Centre | `/supplier/help` | (top-bar life-buoy; not sidebar) | search · category tabs · featured guides · learn-with-videos · quick links · support tickets · popular questions · marketplace visibility · support status | hub | exists (THIN, 92 lines) |

---

## Cross-cutting observations & ambiguities

1. **Inbox vs Messages duality.** Image 38/39 (thread detail + mobile field view) live conceptually under the bespoke `/supplier/inbox` surface, but the nav points `Messages` at `/supplier/messages/conversations/[id]`. **Decision:** build canonical thread detail at `/supplier/inbox/threads/[threadId]` (the prompt's stated route) and ensure `Messages` nav item highlights for it; keep `messages/conversations/[id]` as an alias/redirect. Confirm before divergence.
2. **Job sub-views (evidence 46, sign-off 47, mobile 45).** Job detail (44) is already BUILT with these as tabs. Images 45/46/47 are full-page treatments. **Decision:** implement as dedicated subroutes (`/jobs/[id]/evidence`, `/jobs/[id]/sign-off`, `?view=mobile`) that reuse the job-detail data layer, AND keep the in-page tabs. Avoids duplication.
3. **Compliance is the home for verification, insurance, licences, documents, uploads** (images 57–65). Nav has a single `Compliance` item; all these are children of `/supplier/compliance/*` or sibling top-level (`/supplier/verification`, `/supplier/insurance`) that highlight Compliance. Need to confirm whether to consolidate `/supplier/verification` + `/supplier/insurance` under `/supplier/compliance/*` for a clean tree, or keep top-level. **Leaning:** keep existing top-level routes (already built) + add children; set `Compliance` active for all.
4. **Public listing (54)** must be verified against the existing `(marketplace-public)/marketplace/suppliers/[slug]` page and the live `/stays /suppliers /services /emergency` marketplace chrome — do NOT rebuild marketplace nav. Only public-safe fields. This is the one image NOT in the supplier sidebar.
5. **Onboarding flow (66, 67)** — `complete` and `readiness` are terminal steps of the existing `/supplier/onboarding` wizard. Confirm whether they are wizard steps (`?step=`) or dedicated routes; image framing suggests dedicated celebratory pages → use subroutes.
6. **Wizards need 17 source images re-attached** (noted in prior supplier-sweep memory) — the 31 here cover the final detail/wizard set; cross-check none are the missing 17.
7. **Plan gating:** every page built Solo-first. Team-only surfaces (multi-member assignment on jobs, team payout splits) stubbed behind `plan_type === 'team'` guards.

## Build status (live)

All routes reuse the existing `(supplier-workspace)/supplier/` shell — **no new chrome/nav**. Full-project `tsc --noEmit` is **0 errors**. Pages with no live backend yet use 42P01-safe seed/stub data with clearly-marked `TODO(...)` hooks + audit-log scaffolding; all uploads are upload-only.

- [x] Manifest written (this file) — **gate cleared**
- [x] **Batch 1 (38–45)** — thread detail+mobile (`/supplier/inbox/threads/[threadId]`, `?view=mobile`), request detail (enhanced), quote builder route (`/supplier/quotes/new`), quote detail (enhanced), job detail (existing) + job mobile field view (`?view=mobile`)
- [x] **Batch 2 (46–53)** — job evidence (`/jobs/[id]/evidence`), sign-off (`/jobs/[id]/sign-off`), invoice wizard (`/finance/invoices/new` 3 steps), invoice detail (enhanced), payout detail (`/payouts/[payoutId]`), blocker resolution (`/payouts/[payoutId]/blockers`)
- [x] **Batch 3 (54–61)** — profile preview (`/profile/preview`), compliance upload (`/compliance/upload`), verification business wizard (`/verification/business` steps 59/60), insurance renew step 1 (`/insurance/renew?step=policy`). *Already present & functional (left as-is): public listing `/marketplace/suppliers/[slug]` (54), service detail (56), verification hub (58).*
- [x] **Batch 4 (62–68)** — insurance renew steps 2/3 (`/insurance/renew` 62/63), licence detail (`/compliance/licences/[licenceId]`), document detail (enhanced), onboarding complete (`/onboarding/complete`), first-job readiness (`/onboarding/readiness`). *Already present & functional (left as-is): help centre `/supplier/help` (68).*
- [ ] **Supabase `supplier_*` schema + RLS + storage + edge-fn stubs** — deliberately deferred. The app is aligned to a LIVE schema gated by `node scripts/audit-queries.mjs`; adding ~60 tables + RLS + ~50 edge fns must be a reviewed migration phase, not a blind batch. Frontend `TODO(...)` hooks mark every wire-up point.
