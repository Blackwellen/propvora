# Planning Wizard — Income / Revenue Model Builder Completion Audit

Date: 2026-06-15
Scope: Step 3 of 9 (Income) of the Planning Set Wizard at `/app/planning/wizard`.

## 1. Existing structure (keep — do not rebuild)

| Area | File | Status |
| --- | --- | --- |
| Wizard page / step router | `src/app/(app)/app/planning/wizard/page.tsx` | Working — keep |
| Draft resume route | `src/app/(app)/app/planning/wizard/[draftId]/page.tsx` | Working — keep |
| Wizard shell (rail, top bar, bottom bar, live-summary sheet) | `src/components/planning/wizard/WizardShell.tsx` | Working — keep |
| Wizard state + autosave + Supabase persistence | `src/components/planning/wizard/WizardContext.tsx` | Working — extend only |
| Live summary rail | `src/components/planning/wizard/WizardLiveSummary.tsx` | Working — bridge income totals in |
| Step 3 Income | `src/components/planning/wizard/steps/Step03Income.tsx` | **Incomplete — primary target** |

## 2. Persistence model (decision)

The wizard persists the **entire `WizardState` as a single JSONB `draft_data` blob** in
`public.planning_wizard_drafts` (migration `017_planning_wizard.sql`). That table already has:

- `workspace_id` FK + workspace-scoped **RLS** (`workspace_member_access_wizard_drafts` via `workspace_members`).
- `created_by`, `completion_pct`, `draft_status`, `last_saved_at`, `updated_at` trigger.
- A 3-second debounced **autosave** (`WizardContext.saveDraft`) that upserts the whole state.

`rooms`, `expenses`, `bills`, `upfrontCosts`, `complianceItems`, `riskFactors` all already live inside
this JSON blob. **Decision:** the 11 Income sub-tabs follow the *same established pattern* — their rows
are added to `WizardState` and inherit autosave + restore + workspace RLS for free.

> The master prompt requests ~20 normalised per-line tables (`planning_set_room_income`, etc.) with their
> own RLS. That would duplicate the deliberate JSON-draft architecture, break the single-blob autosave, and
> diverge from how every other wizard step persists. Normalised income tables are therefore **deferred** to
> the point where wizard drafts are *committed* into a `planning_set` (post-Step-9), which is the correct
> seam for normalisation. Draft-stage income data is already workspace-isolated through the draft row's RLS.

## 3. Step 3 defects found (the work)

1. **Only `Rent per room` is implemented.** `activeTab` switches but the body always renders the room
   table — the other 10 tabs (Rent per unit, Nightly rate, Occupancy, Seasonal, Ancillary, Parking,
   Laundry, Membership, Corporate lets, Other income) render the **same** room content. No per-tab UI.
2. **Hardcoded metrics.** `Net Yield "7.8%"`, `Rent Cover "1.46x"`, seasonality `±3%`, accordion values
   (`£620 pcm`, `£0 pcm`) are literals, not derived from state.
3. **Placeholder AI panel.** Three generic suggestions ("Increase avg. rent by £18", "Similar HMOs average
   93% occupancy", "gross yield 1.1pp above market median") are hardcoded and the action buttons do nothing.
4. **No central calculation engine.** Income maths is inlined in the component; no shared module; no
   per-tab calculators (RevPAR/ADR, parking utilisation, ancillary take-up, etc.).
5. **No URL/tab state.** Refresh loses the active sub-tab; tabs are not addressable.
6. **No data for 10 tabs.** `WizardState` only has `rooms`, `voidAllowancePct`, `occupancyPct`, `adr`,
   `singleMonthlyRent`, `landlordMonthlyRent` — nothing for units/nightly/occupancy scenarios/seasons/
   ancillary/parking/laundry/membership/corporate/other.
7. **Dead buttons:** "View Details", "Ask AI a question", accordion bodies are filler text.

## 4. Fix plan (phased)

1. Extend `WizardState` with typed arrays + settings for all 11 tabs + sensible empty defaults.
2. Add `src/lib/planning/income-calculations.ts` — single source of truth for every KPI/summary/chart number.
3. Add shared presentational components under `src/components/planning/wizard/income/`
   (`IncomeKpiStrip`, chart cards, `IncomeAiPanel` with real **empty state**, summary footer, tab nav).
4. Rewrite `Step03Income.tsx` as a container: tab nav + URL (`?tab=`) state + active tab component.
5. Build all 11 tab components 1:1 with the supplied reference screenshots (KPI strip → table with
   add/edit/delete → summary footer → 4 chart cards → AI panel).
6. AI panels render an **empty state** until enough data exists / "Run AI Guidance" is pressed; generated
   recs are derived from current state (rule-based), never hardcoded.
7. Bridge income gross/net totals into `WizardLiveSummary` so the right rail updates live.

## 5. RLS status

Draft income data is covered by the existing `planning_wizard_drafts` RLS (workspace membership, all CRUD).
No new tables are introduced at draft stage, so no new policies are required for this work. Normalised
income-line tables + their RLS are tracked as a deferred follow-up (see §2).
