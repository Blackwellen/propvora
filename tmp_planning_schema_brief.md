# Planning Section — LIVE DB Schema Brief (verified via Supabase mgmt API)

This is the ground truth. Edit ONLY files under `src/app/(app)/app/planning/**` (and the planning-only libs/components named in your task). Do NOT touch money/legal/portfolio/work/compliance shared code.

## Tables that EXIST in live DB (real)
- `planning_sets` — cols: id, workspace_id, title, operation_profile (text, no CHECK), status (CHECK: draft|active|paused|converted|archived), property_id, address, postcode, gross_monthly_income, gross_annual_income, total_monthly_expenses, net_monthly_income, net_annual_income, gross_yield, net_yield, roi, upfront_cash_required, breakeven_month, risk_score (0-100), notes, is_demo, created_by, created_at, updated_at, demo, demo_batch_id, demo_expires_at
- `planning_assumptions` — FK **planning_set_id**. cols: id, planning_set_id, property_purchase_price, property_value, monthly_mortgage, landlord_monthly_rent, contract_length_months, break_clause_months, rent_review_months, void_allowance_pct, management_fee_pct, occupancy_rate_pct, average_daily_rate, created_at, updated_at  (NOTE: NO workspace_id, NO assumption_type/label/value/unit/confidence/source columns)
- `planning_bill_lines` — FK **planning_set_id**. cols: id, planning_set_id, label, monthly_amount, provider, notes, sort_order
- `planning_room_lines` — FK **planning_set_id**. cols: id, planning_set_id, room_label, room_type, monthly_rent, bills_included, notes, sort_order
- `planning_income_lines` — FK **profile_id** (NO planning_set_id!). cols: id, profile_id, source, monthly_amount, notes, sort_order, workspace_id, label, amount, frequency, updated_at
- `planning_expense_lines` — FK **profile_id** (NO planning_set_id!). cols: id, profile_id, category, monthly_amount, notes, sort_order, workspace_id, label, amount, frequency, is_variable, updated_at
- `planning_upfront_costs` — FK **profile_id** (NO planning_set_id!). cols: id, workspace_id, profile_id, label, amount, notes, sort_order, created_at
- `planning_scenarios` — FK **profile_id** (NO planning_set_id!). cols: id, profile_id, name, type (CHECK: base|optimistic|pessimistic|custom), occupancy_pct, income_adjustment_pct, expense_adjustment_pct, notes, workspace_id, scenario_type, calculated_net_profit, calculated_margin_pct, updated_at, demo, demo_batch_id, demo_expires_at
- `planning_sensitivity_runs` — FK profile_id. cols: id, workspace_id, profile_id, run_name, results_json, created_at
- `planning_profiles` — FK workspace_id. (the profile-scoped model; NO rows exist live)
- `planning_landlord_offers` — FK workspace_id. cols: id, workspace_id, planning_set_id, landlord_contact_id, property_address, proposed_rent, proposed_term_months, break_clause_months, management_fee_included, bills_included, notes, status (CHECK: draft|sent|accepted|rejected|negotiating|expired), sent_at, responded_at, is_demo, created_by, created_at, updated_at
- `money_forecast_records` — cols: id, workspace_id, property_id, planning_set_id, record_type, category, description, forecast_amount, actual_amount, variance, period_start, period_end, status (CHECK: forecast|planned|confirmed|actual|ignored), created_by, created_at, updated_at, metadata

## PHANTOM tables — DO NOT EXIST (any query 42P01s → silently empty list):
planning_activity, planning_ai_reviews, planning_bills (use planning_bill_lines), planning_compliance_items, planning_conversion_checklists, planning_documents, planning_forecasts, planning_notes, planning_offers (use planning_landlord_offers), planning_offer_versions, planning_risks, planning_tasks, planning_units_rooms (use planning_room_lines), planning_wizard_drafts

## KEY MISMATCHES to fix
1. Pages under `sets/[id]/*` that query `planning_income_lines`/`planning_expense_lines`/`planning_upfront_costs`/`planning_scenarios` with `.eq('planning_set_id', id)` — these tables have NO planning_set_id column (they are profile-scoped). The query errors (42703). Since the live V1 model is set-based and these tables are profile-orphaned with no rows, the correct fix is: make the query resilient (wrap so an error yields an empty array — `const { data, error } = ...; if (error) setRows([])`), and render an HONEST EMPTY STATE. Do NOT fabricate a profile linkage. Keep `.from('planning_room_lines')`/`planning_bill_lines`/`planning_assumptions` queries by planning_set_id (those are correct) but fix any wrong column names per the schema above (e.g. planning_bills → planning_bill_lines; planning_units_rooms → planning_room_lines with room_label/room_type/monthly_rent/bills_included).
2. Pages querying phantom tables (activity, risks, tasks, documents, compliance, forecasts, ai_reviews, conversion_checklists, offers, notes, wizard_drafts): the queries already 42P01 to empty. Ensure the page renders an honest empty/loading state when the array is empty (no crash, no mock fill). If easy to repoint to a real table, do so; otherwise leave the safe query and ensure empty-state UX.

## TASK 2 — remove hardcoded mock
Delete every `const MOCK_*/DEMO_*/SAMPLE_*/FALLBACK_*/SEED_*` array and any `data.length ? data : MOCK` / `?? MOCK` / `|| DEMO` / `[...SEED_ROWS, ...dbRows]` fallback merge. Render ONLY real query results. Replace removed mock displays with honest empty states ("No X yet" + relevant CTA) and loading skeletons. Charts must compute from live data; if no data, show an empty-chart placeholder, not fabricated series. (Generated sine-wave/`generateTrendData` mock series count as mock — remove or drive from real data.)

## TASK 3 — mobile @375px
No horizontal overflow. Tables wrapped in `overflow-x-auto`. KPI/stat grids use `grid-cols-2` (not fixed multi-col) at base, scaling up with `md:`/`xl:`. Action bars `flex-wrap`. Modals `max-w` + `p-4` + scroll. Dropdowns height-capped with internal scroll. NO `dark:` classes anywhere — strip any you see.

## Rules
- All Supabase queries MUST be `.eq('workspace_id', ...)` scoped where the table has workspace_id; set-scoped child tables scope by planning_set_id (the parent set is already workspace-scoped).
- Keep TypeScript clean (no new tsc errors). Use types from `@/types/database` where they match live; if a type is wrong vs live schema, prefer inline-correct field access over fighting the type (cast narrowly).
- Preserve the visual design/layout; only swap mock data → real data + empty states, fix queries, and apply responsive classes.
