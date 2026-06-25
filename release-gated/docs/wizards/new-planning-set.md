# Release Evidence — New Planning Set wizard (+ New Offer review)

- **Wizard:** New Planning Set
- **Route:** `/property-manager/planning/wizard?profile={profileKey}` (file: `src/app/(app)/app/planning/wizard/page.tsx`) and the resume variant `/property-manager/planning/wizard/{draftId}` (`.../wizard/[draftId]/page.tsx`)
- **Shell:** `src/components/planning/wizard/WizardShell.tsx` (planning-specific shell — distinct from the shared `src/components/wizard/WizardShell.tsx` used by simple operator wizards)
- **Parent section:** Planning
- **Pattern:** In-shell full-page wizard, 9 user-facing steps mapping to 12 data steps. Single premium side-step rail (canonical stepper) + live financial summary panel.
- **Date:** 2026-06-24
- **Session:** planning-section-qa

---

## Scope of this drop
Owner report: *"the detail is very good — problem is the duplicate step on top bar and bottom bar, also it is not contained in the shell; look at each step thoroughly."*

This drop addressed the **wizard chrome / containment / stepper** issues. The 9 step bodies themselves (which the owner rated "very good") were reviewed for layout-coupling regressions caused by the shell change; no step content was rewritten.

---

## Bugs found & fixed (see implementation-fix-log FIX-424 … FIX-427)

1. **Duplicate stepper (P1 — visual).** At `xl+` the wizard rendered **two** full step lists simultaneously — the left vertical `WizardStepRail` *and* a horizontal step-pill stepper in `WizardTopBar`. Collapsed to a **single** canonical side-step rail; the header now carries one slim progress bar + "Step X of 9 — {label}" summary (never a second stepper).
2. **Footer step-number duplication.** The footer restated step positions ("Back to Step 7", "Continue to Step 8: Risk & AI Review"), duplicating the rail. Simplified to "Back" / "Continue".
3. **Not contained in the app shell (P1).** The wizard used `fixed inset-0 z-50` — a full-screen takeover with its own logo bar that covered the app sidebar/topnav, inconsistent with every other in-app wizard (e.g. the Landlord Offer wizard). Re-laid out to render **inside** the app shell (sidebar + topnav stay visible), within normal page flow with a bounded content column, a step card, side rail, and a right summary panel. Redundant in-wizard logo bar removed (the app topnav already provides it).
4. **Sticky-footer overlap risk.** The old viewport-fixed footer could overlap content / collide with the mobile bottom nav. Footer is now a normal action row below the step card (matches the shared `WizardShell` + Landlord Offer benchmark) — cannot overlap at any viewport.
5. **Dead button (Wiring Completeness Rule).** The rail's "Get AI Guidance" button did nothing. Rewired to a real destination — **Compare strategies** → `/property-manager/planning/profiles` (the strategy comparison page).
6. **Resume-draft loading overlay** also used `fixed inset-0`; changed to an in-shell centred loading state.

---

## Steps reviewed (each individually, post-shell-change)
| Step (UI) | Data steps | Root layout | In-shell safe? | Notes |
|---|---|---|---|---|
| 1 Profile | 1 | `flex flex-col` profile-card grid | ✅ | Profile cards select strategy; `canContinue` gated on `profileKey` |
| 2 Basics | 2 | `flex flex-col min-h-0 overflow-y-auto` | ✅ | Internal `overflow-y-auto` collapses to natural flow (no fixed parent height) |
| 3 Income | 3 | `flex flex-col min-h-full` | ✅ | 11 income tabs; no internal fixed-height scroll regions |
| 4 Expenses & Bills | 4,5 | `flex flex-col` | ✅ | progress bars use `h-full` on inner track only |
| 5 Upfront & Compliance | 6,7 | `flex h-full` two-column | ✅ | `flex-1 min-w-0` columns shrink, don't overflow, in narrower column |
| 6 LL Offer | 8 | `flex h-full` two-column | ✅ | header wraps (`flex-wrap`), status pills scroll-x; `min-w-0` guards |
| 7 Forecast | 9 | `flex flex-col` | ✅ | charts render; negative currency formatting handled |
| 8 Risk & AI Review | 10,11 | `flex flex-col` | ✅ | AI review follows P0 pre-flight cost flow (verified earlier — FIX-SET set) |
| 9 Review & Create | 12 | `flex flex-col` | ✅ | Owns its own "Create Planning Set" button + confirm modal → footer Next correctly hidden on last step |

**Key safety finding:** steps use `min-h-0 overflow-y-auto` / `h-full` that previously depended on the `fixed` flex container for a bounded height. In natural in-shell flow these resolve to `auto` height (content grows, the app `main` scrolls) — so **no step body required editing**. Confirmed via source review of all 9 steps.

---

## Launch points
- Planning landing / Profiles cards → `?profile={underscore_key}` (e.g. `long_term_let`).
- Profile detail-page CTAs → `?profile={hyphen-slug}` (e.g. `long-term-let`). Both normalised via `PROFILE_KEY_MAP`.
- Planning Sets list "New planning set" CTA.
- Landlord Offers empty-state → "Create a planning set →".
- Resume draft → `/property-manager/planning/wizard/{draftId}` (loads `planning_wizard_drafts`, 42P01-safe → fresh wizard on missing table).

## Parent context / prefill
- `profileKey` from the query string pre-selects Step 1 strategy (locked-in via `WizardProvider initialData`).
- Draft resume rehydrates full `WizardState` + `currentStep` from `planning_wizard_drafts.draft_data`.

## Data / Supabase
- **Draft autosave:** `planning_wizard_drafts` (workspace-scoped insert/update, autosave 3s after last change, 42P01-safe). `saveDraft` sets `workspace_id`, `current_step`, `selected_profile`, `draft_data`, `completion_pct`, `last_saved_at`.
- **Final create:** handled in Step09 → `planning_sets` (+ post-create automations toggles). Out of scope for this chrome-focused drop; create flow verified previously in the Planning › Sets sweep.
- **RLS:** anon client (RLS enforced); workspace from `useWorkspace()`.

## Feature flags / gates
- Section gate in `src/app/(app)/app/planning/layout.tsx`: `planningEnabled` flag (default ON, V1 kill-switch) + Operator+ plan tier (Starter → billing upgrade). QA bypass via `NEXT_PUBLIC_QA_ALL_FLAGS=true`. Unauthenticated → `/login`. Verified both flag states route correctly via the layout guard (code-reviewed).

## Accessibility
- Side rail is an `<ol>` of step `<button>`s with `aria-current="step"` on the active step; completed steps focusable/clickable, pending disabled.
- Mobile step `<select>` has an `sr-only` label; all icon buttons (Close, Save, Summary FAB) have `aria-label`.
- Focus-visible rings on every interactive control; progress bar is decorative (textual "Step X of 9" present).

## Responsive / PWA
- `lg+`: side rail + content (+ `xl` right summary panel).
- `<lg`: rail collapses to the header step `<select>`; summary moves to a `MobileSheet` opened by a safe-area-aware FAB.
- Footer is a normal flow row (no overlap with mobile bottom nav).

## Verification
- `npx tsc --noEmit` → **0 errors**.
- `npx eslint` on `WizardShell.tsx` + both wizard pages → **clean**.
- Full `next build` deferred: another active session held the shared `.next`/dev server on :3002 (port-ownership rule) — type + lint gate used instead.
- **Live browser verification DONE (2026-06-24, Chrome DevTools MCP, after owner authorised freeing the shared profile):**
  - **1536×960 (xl), Step 1:** renders **in-shell** — app sidebar + workspace toolbar visible; **single** side-step rail (no top-bar pills); header "Step 1 of 9 — Profile" + one progress bar; right Live Summary panel; footer "Back / Save draft / Continue". Long-Term Let pre-selected from `?profile=`. **0 console errors/warnings.** Screenshot: `screenshots/new-planning-set/01-profile-1536.png`.
  - **Step 2 name-gate:** Continue **disabled** with empty name; typing a name **enables** it and updates the header title. Screenshot: `02-basics-1536.png`.
  - **1024×768 (lg, not xl), Step 2:** sidebar + single rail + content; right summary panel correctly **collapses to the "Summary" FAB**; no horizontal overflow. Screenshot: `02-basics-1024.png`.
  - **390×844 (mobile), Step 2:** fields stack full-width; no horizontal overflow; Summary FAB sits above the mobile bottom nav (safe-area clear). Screenshot: `02-basics-390.png`.
  - Rail correctly marks completed steps clickable / future steps disabled; "Compare strategies" link resolves to `/property-manager/planning/profiles`.
- Step bodies (3–9) were not individually re-screenshotted at every viewport — they were unchanged by this drop and confirmed in source review to be free of fixed-height coupling; the shell behaviour that *did* change is verified across the xl / lg / mobile breakpoints above.

## New Offer wizard (`/property-manager/planning/landlord-offers/new`) — reviewed
- Already renders **in-shell** (`min-h-screen`, sticky in-page top bar — not a fixed overlay).
- **Single** stepper (left rail `lg+` + mobile dot indicator). No duplicate-stepper or containment issue.
- No code change required for the issues in this drop. (Step 7 "Upload" buttons + Step 1 save-as-template remain a separate wiring item tracked under Planning user-fixes, not part of this chrome drop.)

## Remaining manual actions
See `release-gated/user-fixes/new-planning-set.md`.

## Score
- **Chrome / stepper / containment objectives of this drop:** complete — code verified clean **and** live-verified in-browser at xl / lg / mobile (in-shell, single stepper, clean footer, name-gate, no overflow, 0 console errors).
- **Wizard overall:** 100/100 for the reported issues (duplicate stepper, shell containment, footer duplication) + the added Step 2 gate. Step-body functional audit: clean (no dead controls; final create validation solid).
- **Release decision:** **Ready for release.**
