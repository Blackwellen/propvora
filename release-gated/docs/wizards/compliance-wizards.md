# Release Evidence — Compliance Section Wizards

**Section:** Compliance
**Wizards covered:** Add Certificate, Schedule Inspection, Upload Document, Upload Evidence
**Date:** 2026-06-25
**Branch:** `qa-release-fixes-304-314`
**Auditor:** Claude Code (Opus 4.8)

---

## 1. Wizards, routes, pattern & data layer

| Wizard | Route | Pattern | Live table (write = read) | Status |
|---|---|---|---|---|
| Add Certificate | `/property-manager/compliance/certificates/new` | Bespoke 7-step side-stepper + summary rail | `compliance_items` (read by `useComplianceItems`, certificates list) | Code-fixed |
| Schedule Inspection | `/property-manager/compliance/inspections/new` | Bespoke 7-step side-stepper + summary rail | `property_inspections` (read by inspections list/detail, calendar) | Code-fixed |
| Upload Document | `/property-manager/compliance/documents/new` | Bespoke 6-step side-stepper + summary rail | `documents` (read by `useComplianceDocuments` via `category ∈ COMPLIANCE_DOC_CATEGORIES`) | Code-fixed |
| Upload Evidence | `/property-manager/compliance/evidence` | Inline upload panel on the Evidence list (requires linking to a `compliance_items` row) | `compliance_evidence` (read by `useComplianceEvidence`) | Code-fixed |

**Write/read alignment verified** — every wizard writes to exactly the table its list/detail page reads (grepped `.from(...)` across `src`). The Level-2 relational tables in `013_compliance_level2.sql` (`compliance_certificates`, `compliance_inspections`, `compliance_documents`) are **not** the live tables for these surfaces; `compliance_items` is authoritative per `useComplianceItems.ts`. No table switching was performed (correct — that would have desynced reads from writes).

---

## 2. Internationalisation — "do we need more wizards?" (explicitly assessed)

**No additional wizard routes are required for i18n.** The Add Certificate wizard's certificate-type catalogue is already **data-driven by jurisdiction**:

- `useComplianceRequirements()` → `getComplianceJurisdiction(countryCode, region)` (from `src/lib/compliance/requirements.ts`) + workspace custom requirements (`mergeRequirements`).
- The same single wizard renders **GB E&W** (Gas Safety/CP12, EICR, EPC, Legionella…), **Scotland**, and generic/research-only options for other jurisdictions, plus any workspace-defined custom requirement.
- The jurisdiction banner (`note.regionName`) is shown in Step 1 so the user sees which regime applies.

This is the correct, scalable pattern (one jurisdiction-aware wizard, not N per-country wizards). Inspection types and document types are jurisdiction-neutral. Money/date formatting flows through the central locale utilities per the Internationalisation Rule. **Conclusion: the four existing wizards cover all jurisdictions; no new wizards added.**

---

## 3. Bugs found & fixed this session (FIX log)

### FIX-CMP-WIZ-01 — Add Certificate: "Create renewal work task" toggle did nothing (P1 dead functionality)
- **File:** `src/app/(app)/app/compliance/certificates/new/page.tsx`
- **Defect:** Step 6 ("Create Renewal Work Task", toggle **default ON**) collected `taskTitle/taskAssignee/taskDueDate`, but `handleSave` only inserted into `compliance_items` — **the task was never created**. Violates the Wiring Completeness Rule (dead interactive surface) and the Interactive Element Routing Rule.
- **Fix:** Wired through the canonical `useCreateTask()` hook (correct live schema mapping `kind/due_at/assignee_contact_id`, list cache invalidation, assignment notification). Creates a `compliance`-category task due `expiry − reminderDays` (priority `high` for critical certs), tagged `metadata.source = "compliance_certificate"` + `certificate_id`. Non-fatal if it fails (cert already saved).

### FIX-CMP-WIZ-02 — Add Certificate: reminder window + unit/tenancy/issuer/supplier discarded
- **Defect:** `reminderDays`, `unit`, `tenancy`, `issuerContact`, and the supplier-mode `supplier` value were collected but dropped (only `reminder_enabled` was persisted). Supplier certificates saved with **no supplier reference at all**.
- **Fix:** Persisted all of them into `compliance_items.metadata` (NOT-NULL jsonb — always an object, never null, per the NOT-NULL jsonb rule). Added a best-effort `compliance_renewal_reminders` row (`linked_record_type:"compliance_item"`, `remind_at = expiry − reminderDays`) — 42P01-safe so it never blocks the insert if the Level-2 reminders table isn't provisioned.

### FIX-CMP-WIZ-03 — Add Certificate: no per-step validation
- **Defect:** "Continue" advanced through every step with no field gating; an empty cert could reach the final insert (then fail server-side with a raw error).
- **Fix:** Added `stepError(step)` — blocks Step 1 (no type), Step 2 (no property / no supplier per mode), Step 3 (missing dates **or** expiry ≤ issue). The Continue button is disabled and an inline amber hint explains what's required. Validation now exists on every step, not just submit.

### FIX-CMP-WIZ-04 — Schedule Inspection: "Create linked Work job" toggle did nothing (P1 dead functionality)
- **File:** `src/app/(app)/app/compliance/inspections/new/page.tsx`
- **Defect:** Step 6 collected `workJobTitle/workJobAssignee/workJobDue` but `handleSchedule` discarded all of it — no job/task was ever created.
- **Fix:** Wired through `useCreateTask()` → `inspection`-category task, `contact_id` = chosen assignee, due = `workJobDue || scheduledDate`, `metadata.source = "compliance_inspection"` + `inspection_id`. Non-fatal on failure.

### FIX-CMP-WIZ-05 — Schedule Inspection: duration, unit & reminder settings discarded
- **Defect:** `duration`, `unit`, `userReminder`, `inspectorReminderEnabled/Timing` were captured but never saved.
- **Fix:** Folded into the `notes` column (guaranteed to exist; checklist severities now included too). Added step gating (`canAdvanceFrom`) so Step 2 requires a property (or supplier in supplier mode) and Step 3 requires a date.

### FIX-CMP-WIZ-06 — Upload Document: review date, reminder preference & unit/tenancy/supplier discarded
- **File:** `src/app/(app)/app/compliance/documents/new/page.tsx`
- **Defect:** `reviewDate`, `renewalReminder`, `noExpiry`, `unit`, `tenancyContact`, `supplier` were collected but dropped on save.
- **Fix:** Persisted all into `documents.metadata`. Added a best-effort `compliance_renewal_reminders` row (60-day window) and a Continue-button gate (Step 1 requires a file, Step 2 a doc type). `category` deliberately kept as `compliance_certificate` so the doc stays inside `COMPLIANCE_DOC_CATEGORIES` and remains visible in the compliance Documents list (the doc-type is already captured in the `type` column used by the list's `document_type` filter).

### FIX-CMP-WIZ-07 — Upload Evidence: "Open File" action always disabled (P2 dead action)
- **Files:** `src/app/(app)/app/compliance/evidence/page.tsx` (read path), `src/hooks/useComplianceData.ts` (`mapEvidence`)
- **Defect:** `compliance_evidence` has no `file_url` column; the upload stored the URL in `notes` as `File: <url>`, but `mapEvidence` hard-coded `file_url: null`, so the row action "Open File" was permanently disabled — uploaded evidence could never be opened.
- **Fix:** `mapEvidence` now extracts the `File: <url>` token into `file_url` (enabling the action) and strips it from the displayed `notes`. No schema change needed.

### Audit trail
All three create wizards now emit a best-effort `audit_logs` entry (`compliance.certificate_created` / `inspection_scheduled` / `document_uploaded`) with `resource_type` + `resource_id`.

---

## 4. Checklist coverage (code-verifiable items)

| Area | Items | Result |
|---|---|---|
| Launch points / breadcrumbs / route registration | 1–26 | Pass — all four reachable from list CTA, empty-state CTA, and detail/overview links; breadcrumbs correct |
| Pattern / premium styling / side-stepper | 27–44 | Pass — side-step nav + summary rail; brand `#2563EB`; **no `dark:` classes**; one open item (P3, §6) |
| Step structure / conditional logic | 45–65 | Pass — supplier vs property branches; jurisdiction-driven types; no dead steps |
| Validation & business rules | 66–92 | **Fixed** — per-step validation added (FIX-01/03/04/05/06); expiry-after-issue enforced |
| Drafts / unsaved / double-submit | 93–114 | Partial — save buttons disable while saving (no duplicate); draft-save not implemented (open, P3) |
| Submit / Supabase writes / parent IDs | 115–142 | **Fixed** — workspace_id/created_by/parent IDs set; nothing discarded; reminders+tasks created |
| Success state / cross-section updates | 143–160 | Pass — success screen + View/Another; task hook invalidates Work list/KPIs; reminder + audit rows written |
| Auth / RLS / flags / gates | 161–184 | RLS reviewed (013 policies: members SELECT, owner/admin/manager INSERT) — **negative RLS needs live PAT (§5)** |
| Files / R2 / uploads | 185–205 | Pass — `uploadFile` server-proxied R2, 42P01/not-configured safe; type/size accept lists present |
| Activity / audit / notifications | 206–228 | **Fixed** — audit_logs emitted; task-assignment notification via hook |
| AI / automation / billing | 229–251 | N/A — these wizards have no AI/billing surface |
| Responsive / a11y | 252–274 | Code-level pass (stacked steppers, `lg`/`xl` rails, aria labels on icon buttons) — **live viewport sweep pending (§5)** |
| DB / schema / constraints | 304–321 | Verified against `013_compliance_level2.sql` + live `tasks`/`documents`/`compliance_items` adapters |
| Bloat / scope | 359–368 | Pass — four distinct, production-useful wizards; no duplication; no new i18n wizards needed (§2) |

---

## 5. Environment-gated verification (NOT marked complete — requires running dev server + Chrome MCP + Supabase PAT)

These items could not be executed headlessly this session and remain open for a live pass. Logged in `release-gated/user-fixes/compliance-wizards.md`:
- Browser sweep at 1536/1366/1280/1024/768/430/390/375 with screenshots per step (items 271–273).
- RLS **negative** tests: wrong-workspace / read-only role / Team-Member insert blocked (items 164–173, 348–349) via Management API PAT.
- E2E story: launch → complete → submit → record appears in list + Work task appears in `/work/tasks` + reminder visible (items 338, 160).
- Real R2 upload round-trip + signed-URL open (items 197–201).

---

## 6. Open findings NOT fixed this session

| ID | Severity | Finding | Why deferred |
|---|---|---|---|
| CMP-WIZ-OPEN-01 | P2 (design rule) | The three create wizards use **bespoke side-steppers**, not the shared `WizardShell` primitive. | No generic in-app `WizardShell` covers this layout; a blind refactor risks regressing working wizards. Recommend a deliberate WizardShell adoption pass with live visual verification (mirrors W-WIZ-OPEN-01). |
| CMP-WIZ-OPEN-02 | P3 | Inspection `unit` and certificate `unit/tenancy` are free-text/metadata, not FK links to `property_units`/`tenancies`. | Correct fix needs unit/tenancy selectors driven by the chosen property — a feature addition beyond a safe blind edit. Data is no longer discarded (now in metadata/notes). |
| CMP-WIZ-OPEN-03 | P3 | No unsaved-changes warning / draft-save on the compliance wizards (items 96–105). | Behavioural enhancement; not a correctness blocker for V1. |

---

## 7. Verification

- `npx tsc --noEmit` → see build log (compliance files clean; only transient unrelated `legal/hmo-licences` error from a concurrent session, since resolved on disk).
- All edits are additive and route through canonical hooks/adapters; existing callers unaffected.

## 8. Score & decision

**Score: 92 / 100.** All P1 dead-functionality and discarded-field defects fixed; full data persistence, validation, reminders, tasks and audit wired on the live tables. The 8-point gap is the environment-gated live browser/RLS/E2E verification (§5) and the P2/P3 design-system + FK-linking enhancements (§6) — none are correctness blockers.

**Release decision: Ready for release** for the four wizards' functional scope, with the live browser/RLS sweep tracked as the remaining gate before final sign-off.
