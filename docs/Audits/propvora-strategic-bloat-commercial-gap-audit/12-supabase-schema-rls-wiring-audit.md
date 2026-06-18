# 12 — Supabase Schema, RLS & Wiring Audit

**Status:** Draft · 2026-06-18 · Author: platform/data architect
**Conforms to:** `_shared-strategic-brief.md` (verdict = staged property OS; layer map §3; infra §6).
**Sources of truth:** `docs/final-wiring/live-schema.md` / `.json` (live Supabase project, generated 2026-06-18T02:49:48Z), `scripts/audit-queries.mjs`, `src/lib/portal/session.ts`, `src/lib/admin/guard.ts`.

---

## 0. Executive summary

The live database is **431 base tables** (the brief's "433" rounds this; the schema header itself says `## Tables (431)` plus 42 enums — the delta is two views/relations not counted as base tables). [VERIFY] the "433" figure in the brief against the 431 base-table count; both refer to the same project.

The schema is **not bloated by accident — it is a fully-built multi-sided platform persisted ahead of its go-to-market.** Roughly:

| Bucket | ~Tables | Layer | V1 disposition |
|---|---:|---|---|
| Core operator app (auth/workspace, portfolio, work, money basics, compliance/legal, docs, messaging, contacts) | ~150 | **A** | KEEP — wired, RLS via `workspace_members` |
| Portals (tenant/landlord/supplier external + share links + sessions) | ~20 | **B** | KEEP — RLS-exempt, guarded by `portal_sessions` |
| Suppliers — operator-side coordination | ~25 | **B** | KEEP (operator-facing subset) |
| Planning engine (multi-profile strategy) | ~15 | **C** | PROTECT, gate as premium |
| Automations (recipes + full canvas/webhooks/v2) | ~25 | **C-lite / D** | KEEP recipes; HIDE+FLAG canvas/webhooks |
| Affiliates | ~6 | **B/C** | KEEP, payouts flag OFF |
| AI (copilot, approvals, usage, triage, dedupe) | ~20 | **C** | gate by `aiCopilot` |
| Accounting full double-entry GL (`ledger_*`) | ~5 | **D** | HIDE+FLAG — position as Xero/QuickBooks integration |
| Marketplace / booking / escrow / disputes | ~70 | **D** | KEEP CODE, `marketplaceEnabled` OFF |
| Independent supplier-as-SaaS (`supplier_workspace_*`, mirrored accounting/automations) | ~60 | **D/C** | TRIM hard; flag OFF |
| Customer / guest consumer | ~10 | **D** | HIDE (`customerWorkspace` OFF) |
| International / country packs / tax / sanctions | ~35 | **D** | HIDE+FLAG (`globalCountryPacks`/`contextEngine` OFF) |
| Admin / audit / platform ops | ~25 | **Ops** | KEEP (control plane) |

**Headline:** ~190 tables (~44%) back the **V1 wedge** (Layers A + B + the operator-side of suppliers). The remaining ~240 tables back **V1.5/V2 layers (C/D)** that are *already coded and flag-hidden* — meaning the deprecation plan is mostly flag config, not migrations. **Almost nothing is a true orphan; the risk is surface clarity, not dead schema.**

---

## 1. RLS / authorization model (cite before reading the domain tables)

There are **two distinct authorization boundaries**, and every table below belongs to exactly one:

1. **Workspace-member RLS (the operator app).** RLS policies key off `workspace_members` (and `supplier_workspace_members` for the supplier-as-SaaS surface). The authenticated user's membership row scopes every row. This covers Layers A/B/C operator surfaces. [ASSUMPTION] RLS policies themselves are not in the schema dump (which lists columns only); the membership-keyed model is asserted by `src/lib/portal/session.ts` lines 7-20 ("RLS — which keys off workspace_members").
2. **Portal-session authorization (the external magic-link surface).** External portal users (tenant/landlord/supplier magic-link recipients) have **no Supabase auth session**, so RLS cannot authorize them. `src/lib/portal/session.ts` is the **only** boundary: signed HMAC cookie → `portal_sessions.session_token_hash` (SHA-256) lookup → revoke/expiry check → service-role query strictly filtered to `scope.workspaceId`. Tables read on this path are reached via **service-role (RLS-bypassing)** with app-level scoping, **not** RLS.

A third, narrow boundary: **platform-admin** reads use the service-role client gated by `src/lib/admin/guard.ts` (`profiles.platform_role='admin'` OR `platform_admins` row, plus AAL2 MFA). Admin/audit tables sit here.

**Wiring gate:** `scripts/audit-queries.mjs` statically parses every `.from("table").select(...)` against `live-schema.json` and fails on any column that does not exist (the 42703 silent-failure class). Per MEMORY this gate is currently **0** — i.e. every selected column is schema-aligned. This gate proves *column* alignment; it does **not** prove a table is reached by a route (that is the wired/orphan judgement below).

---

## 2. Domain-by-domain table map

Legend — **Wiring:** Wired (route + lib read/write), Partial (lib exists, surface flagged/incomplete), Orphan (no app reference found). **RLS dep:** WM = `workspace_members`, SWM = `supplier_workspace_members`, PS = `portal_sessions` (service-role + app scope), ADM = admin service-role, PUB = public/anon-readable reference.

### 2.1 Auth / workspace / billing — **Layer A · V1 · KEEP**
Representative: `workspaces`, `workspace_members`, `workspace_settings`, `workspace_subscriptions`, `workspace_billing`, `workspace_addons`, `workspace_feature_overrides`, `workspace_invitations`/`workspace_invites`/`invites`, `workspace_role_permissions`, `user_roles`, `user_preferences`, `profiles`, `organisations`, `entitlement_overrides`, `usage_counters`, `plan`/`feature_flags`, `feature_flag_audit`, `platform_feature_flags`, `platform_settings`, `platform_admins`, `api_keys`, `sso_configurations`, `mfa_recovery_codes`, `account_rate_limits`, `app_rate_limits`, `edge_rate_limit`.
- **Used by:** every operator surface; billing gates `src/lib/billing/*`; admin.
- **RLS:** WM (ADM for `platform_*`). **Wiring:** Wired.
- **Flag note:** `workspace_invitations` **and** `workspace_invites` **and** `invites` (three invite tables) are a **MERGE candidate** — likely two legacy + one current. [VERIFY] which is canonical; consolidate to one.

### 2.2 Portfolio / property / tenancy — **Layer A · V1 · KEEP**
`properties`, `property_units`/`units`, `property_categories`, `property_compliance_items`, `property_documents`, `property_inspections`, `property_media`/`unit_media`, `property_tasks`, `property_suppliers`, `templates_property`, `tenancies`, `tenancy_parties`, `rent_schedules`, `deposits`, `agreements`/`agreement_signatures`, `contacts`, `contact_*` (activity/categories/links/notes/requests/portal_access), `portfolio_audit_log`.
- **Used by:** `(app)/app/portfolio/*`, tenancies, contacts. **RLS:** WM. **Wiring:** Wired.
- **Note:** `property_units` vs `units` and `property_tasks` vs `tasks` are duplicate-lineage pairs — **MERGE candidates** ([VERIFY] which the live app reads; the gate confirms columns, not which one routes use).

### 2.3 Work / maintenance / jobs — **Layer A · V1 · KEEP**
`tasks`, `task_*` (attachments/checklist/comments/dependencies/documents/links), `work_items`, `work_audit_log`, `jobs`, `job_*` (complaints/documents/links/schedules), `procurement_requests`, `quote_requests`, `ppm_plans`, `move_plans`/`move_tasks`, `logistics_events`.
- **RLS:** WM. **Wiring:** Wired (`smart_rules`/`move_plans` confirmed referenced — grep hit `src/lib/automation`, `src/lib/network`). `move_plans`/`logistics_events` are **B/C edge** (relocation feature) — KEEP but verify it is in V1 nav or flag.

### 2.4 Money / accounting — **split A vs D**
- **Money basics (Layer A · KEEP):** `money_transactions`, `transactions`, `invoices`/`invoice_lines`, `bills`/`bill_lines`, `expense_records`, `arrears_records`, `debt_snapshots`, `payments`, `payouts`, `payout_ledger`, `rent_schedules`, `deposits`, `money_forecast_records`, `reconciliation_items`, `fx_rates`, `report_runs`/`saved_reports`. RLS: WM. Wired.
- **Full double-entry GL (Layer D · HIDE+FLAG):** `ledger_accounts`, `ledger_journal_entries`, `ledger_journal_lines`, plus `src/lib/accounting/ledger.ts` (12 refs) and route `(app)/app/accounting/ledger/accounts/[accountId]/page.tsx`. **This is wired and live** — contradicting the brief's "HIDE+FLAG as Xero/QuickBooks integration". **Contradiction flagged (§4).** The GL belongs behind an `accountingGL`/integration flag, not in V1 operator nav.

### 2.5 Compliance / legal — **Layer A (core) / C (advanced) · V1 · KEEP**
`compliance_items`, `compliance_checklists`, `compliance_evidence`, `property_compliance_items`, `hmo_licences`, `possession_cases`/`possession_evidence`, `inspection_*`, `legal_acceptances`, `regional_terms_*`, `identity_verifications`, `verification_checks`/`verification_documents`.
- **RLS:** WM. **Wiring:** Wired. **USP MOAT** — protect (brief §2). HMO + possession (RRA-2026) depth is the wedge differentiator.

### 2.6 Documents / files / messaging / calendar — **Layer A · V1 · KEEP**
`documents`, `document_templates`, `generated_documents`, `files`, `file_*` (grants/versions/tags/activity), `email_*` (accounts/grants/messages/outbox/threads/attachments/send_audit), `mail_oauth_states`, `message_threads`/`messages`/`message_thread_participants`, `chat_*` (channels/members/messages/attachments/audit), `notifications`/`notification_preferences`, `calendar_events`/`calendar_settings`/`calendar_reminders`/`calendar_ical_tokens`.
- **RLS:** WM. **Wiring:** Wired. **Calendar = MERGE views to toggles** (brief §3) — schema is fine; the route-count is the problem (doc 07/10).

### 2.7 Suppliers — **operator-side (B, KEEP) vs supplier-as-SaaS (D/C, TRIM)**
- **Operator-side coordination (Layer B · KEEP):** `suppliers`, `supplier_directory`, `preferred_suppliers`, `supplier_jobs`/`supplier_job_*` (assignments/quotes/events/evidence/sla), `supplier_invoices`, `supplier_quotes`/`supplier_quote_approvals`, `supplier_ratings`/`supplier_reviews`, `supplier_documents`, `supplier_availability`, `supplier_message_threads`/`supplier_messages`, `supplier_invites`, `supplier_portal_access`. RLS: WM. Wired.
- **Independent supplier workspace (Layer D/C · TRIM HARD, flag `supplierWorkspace` OFF):** `supplier_workspace_*` (members/roles/permissions/profiles/services/packages/invoices/coverage_areas/onboarding_state/availability), `supplier_network_profiles`, `supplier_automation_*` (mirrored automations — **CUT from supplier** per brief §3), `supplier_statement_lines`/`supplier_statements`/`supplier_tax_summaries` (mirrored accounting — **CUT**), `supplier_worker_*` (profiles/availability/checks/qualifications/training), `supplier_business_verifications`/`supplier_identity_*`/`supplier_licence_verifications`/`supplier_accreditations`/`supplier_insurance_policies`, `supplier_insight_*`, `supplier_reputation_*`, `supplier_emergency_rota`/`supplier_out_of_hours_rules`, `supplier_service_*`/`supplier_zone_*`. RLS: SWM. **Wiring:** Partial (built, behind `supplierWorkspace`). ~60 tables — the single largest deferrable cluster.

### 2.8 Marketplace / booking / escrow — **Layer D · V2 · KEEP CODE, FLAG OFF**
`marketplace_*` (listings/categories/orders/messages/reviews/disputes/transactions/commission_ledger/fee_rules/risk_signals/trust_scores/saved_items/search_events/terms_acceptance/policy_acceptance/legal_documents/admin_roles/enquiries), `booking_*` (~30: listings/pages/availability/availability_days/blocked_dates/price_rules/pricing_profiles/requests/revenue_entries/reviews/enquiries/issues/legal_*/access_codes/keyless_locks/ical_*/guest_tokens), `bookings`, `escrow_*` (orders/holds/milestones/payments/ledger_entries/disputes/evidence), `hold_ledger_entries`, `payment_release_blocks`, `dispute_actions`, `rate_plans`, `accommodation_amenities`.
- **RLS:** WM (+ PUB for public listings/booking pages). **Wiring:** Partial (built; `marketplaceEnabled` master + sub-flags OFF). **~70 tables — the second-largest deferrable cluster; do not delete (V2 platform optionality).**

### 2.9 Customer / guest (consumer) — **Layer D · V2 · HIDE (`customerWorkspace` OFF)**
`customer_profiles`, `customer_workspace_members`, `customer_message_threads`/`customer_messages`, `customer_notifications`, `customer_saved_listings`/`customer_saved_searches`.
- **RLS:** dedicated customer membership. **Wiring:** Partial (the `(customer)/*` routes exist — ~45 pages — but flag OFF). Consumer side bet, not V1.

### 2.10 AI — **Layer C · V1.5 · gate by `aiCopilot`**
`ai_actions`/`ai_action_logs`, `ai_approval_queue`/`ai_approval_requests`, `ai_chat_threads`/`ai_chat_messages`, `ai_triage_items`, `ai_duplicate_candidates`, `ai_models`/`ai_providers`, `ai_usage_events`/`ai_usage_logs`/`ai_usage_metering`/`ai_token_usage`/`ai_rate_counters`.
- **RLS:** WM (models/providers = ADM). **Wiring:** Wired. **Redundancy:** there are **5 AI-usage tables** (`ai_usage_events`, `ai_usage_logs`, `ai_usage_metering`, `ai_token_usage`, plus `usage_counters`) and **2 approval tables** (`ai_approval_queue` + `ai_approval_requests`) and **`ai_actions` itself carries duplicate `tokens_in/tokens_out` AND `tokens_used` columns** — a clear **MERGE/consolidate** target ([VERIFY] which the admin AI-usage route reads; collapse to one usage ledger).

### 2.11 Automations — **C-lite (KEEP) vs D (HIDE+FLAG)**
- **Recipe-level (Layer C-lite · `canvasLite` · KEEP small):** `automation_rules` (enum `automation_recipe`), `automation_recipes`, `automation_runs`/`automation_run_steps`/`automation_run_events`, `automation_caps_usage`/`automation_plan_limits`, `automation_templates`, `automation_approvals`. RLS: WM. Wired.
- **Full canvas/v2 (Layer D · HIDE+FLAG):** `automation_definitions`/`automation_versions`/`automation_nodes`/`automation_edges`/`automation_node_runs`/`automation_node_registry`/`automation_v2_runs`/`automation_errors`/`automation_events`/`automation_integrations`/`automation_webhook_endpoints`/`automation_webhook_deliveries`. **Wiring:** Wired (`src/lib/automation/engine.ts`, `actions.ts`) but Zapier-clone scope — flag OFF for V1. **~13 canvas tables deferrable.**

### 2.12 Affiliates — **Layer B/C · V1.5 · KEEP, payouts flag OFF**
`affiliates`, `affiliate_applications`, `affiliate_referrals`, `affiliate_commissions`, `affiliate_payouts`.
- **RLS:** WM (+ ADM review). **Wiring:** Wired (admin `affiliates/*` + customer `affiliate/*`). Payouts gated OFF (matches MEMORY affiliate note).

### 2.13 International / country packs / tax / sanctions — **Layer D · HIDE+FLAG (`globalCountryPacks`/`contextEngine` OFF)**
`country_packs`/`country_pack_versions`/`country_pack_reviews`/`country_pack_audit_events`/`country_release_gates`, `country_profiles`/`country_regions`/`country_consumer_rules`/`country_invoice_rules`/`country_privacy_profiles`/`country_representatives`/`country_tax_profiles`/`country_tax_rates`/`country_tax_rules`, `jurisdiction_profiles`, `address_models`, `billing_country_matrix`, `connect_payout_country_matrix`, `sanctions_country_rules`/`sanctions_screenings`, `data_transfer_mechanisms`, `subprocessor_register`, `intl_translation_*`, `module_release_statuses`, `regional_terms_versions`.
- **RLS:** mostly PUB/reference + ADM. **Wiring:** Partial (reference data + admin `global/*`). **~35 tables — a whole multi-country engine behind `contextEngine` "Off = V1 single-context".** Large flag-hidden cluster; correct for V1 UK-only.

### 2.14 Planning engine — **Layer C · V1.5 · PROTECT (premium)**
`planning_sets`, `planning_profiles`/`planning_profile_templates`, `planning_assumptions`, `planning_income_lines`/`planning_expense_lines`/`planning_bill_lines`/`planning_room_lines`/`planning_upfront_costs`, `planning_scenarios`/`planning_sensitivity_runs`, `planning_landlord_offers`.
- **RLS:** WM. **Wiring:** Wired (Income Builder per MEMORY). **The differentiator — do NOT cut; price as premium, gate entry** (brief §2.2).

### 2.15 Admin / audit / platform ops — **Layer Ops · V1 · KEEP (control plane)**
`audit_log`/`audit_logs`/`activity_logs`/`role_audit_log`/`admin_settings_audit`/`feature_flag_audit`/`fee_rule_audit`, `admin_settings`/`admin_broadcasts`/`admin_evidence`/`admin_impersonations`, `announcements`/`announcement_dismissals`, `changelog_entries`, `bug_reports`, `data_export_requests`/`account_deletion_requests`/`privacy_requests`/`privacy_request_events`/`cookie_consent_log`, `risk_events`/`risk_rules`/`risk_scores`, `stripe_*` (accounts/connect_accounts/payment_intents/webhook_events), `payments_webhook_events`, `webhook_*`, `insight_snapshots`/`saved_insights`, `waitlist_entries`/`newsletter_subscribers`/`public_enquiries`/`contact_requests`, `guided_help_state`, `saved_views`, `analytics_event`.
- **RLS:** ADM / WM (some PUB intake). **Wiring:** Wired. **Note the triple audit lineage** (`audit_log` + `audit_logs` + `activity_logs`) — **MERGE candidate**; pick one canonical audit sink ([VERIFY] which the admin `audit` route reads — `src/lib/admin/audit.ts`).

### 2.16 Portals (external) — **Layer B · V1 · KEEP (retention engine)**
`portal_sessions`, `portal_access_tokens`, `portal_profiles`, `portal_purposes`, `portal_share_links`/`portal_share_uploads`, `portal_verify_attempts`, `share_links`/`share_link_*` (events/views/targets/submissions/rate_limits)/`share_evidence_uploads`/`share_help_reports`, `contact_portal_access`, `supplier_portal_access`.
- **RLS:** **PS (service-role + app scope)** — the *only* tables deliberately outside workspace-member RLS. **Wiring:** Wired but the magic-link surface is **flag-gated OFF** by `isExternalPortalEnabled()` (`NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED`, `src/lib/portal/flags.ts`). See doc 14.

---

## 3. Orphan / unused / over-provisioned flags

I found **no confirmed dead tables** by static grep of the highest-risk candidates (`ledger_*`, `escrow_*`, `smart_rules`, `move_plans`, `organisations`, `partner_relationships` all returned app references). The real findings are **redundancy clusters**, not orphans:

| Cluster | Tables | Issue | Action |
|---|---|---|---|
| Audit sinks | `audit_log`, `audit_logs`, `activity_logs` | 3 overlapping logs | MERGE → 1 canonical [VERIFY] |
| AI usage | `ai_usage_events`, `ai_usage_logs`, `ai_usage_metering`, `ai_token_usage`, `usage_counters` | 5 usage ledgers + dup cols on `ai_actions` | MERGE → 1 [VERIFY] |
| AI approvals | `ai_approval_queue`, `ai_approval_requests` | 2 queues | MERGE → 1 |
| Invite tables | `invites`, `workspace_invites`, `workspace_invitations` | 3 invite paths | MERGE → 1 [VERIFY] |
| Property/work duplicates | `units` vs `property_units`; `tasks` vs `property_tasks` | lineage forks | confirm canonical, archive other [VERIFY] |
| Supplier mirror | `supplier_automation_*`, `supplier_statement*`/`supplier_tax_summaries` | mirrored automations + accounting on supplier-as-SaaS | CUT from supplier scope (brief §3) |

**Future-flag (not delete) clusters:** marketplace/booking/escrow (~70), supplier-workspace (~60), international/country (~35), automation-canvas (~13), customer (~10), GL (~5). These are V2/V1.5 platform optionality — **keep the schema, hide the surface via the existing flag registry.**

---

## 4. Contradictions with the brief (must reconcile in `19`)

1. **Full GL is wired & routed, brief says HIDE+FLAG.** `ledger_accounts/journal_entries/journal_lines` have a live lib (`src/lib/accounting/ledger.ts`, 12 refs) and a live route (`accounting/ledger/accounts/[accountId]`). The brief (§3) wants this hidden behind an integration flag. **There is no `accountingGL` flag in the registry per brief §6.** → Recommend adding one; this is the one place where "flag config not deletion" requires a *new* flag, not just flipping an existing one.
2. **"433 tables" vs live `## Tables (431)`.** The dump counts 431 base tables. Minor, but the canonical number should be corrected to 431 (+42 enums) so downstream docs don't over-count.
3. **Automation canvas is wired, not dormant.** Brief treats it as "HIDE+FLAG"; the engine is live (`src/lib/automation/engine.ts`). Confirm `canvasLite` actually hides the canvas routes, not just the marketing of them.

---

## 5. Recommendations (Reason · Risk · Action)

1. **Add `accountingGL` flag, default OFF.** *Reason:* GL is ERP jargon on the surface (violates brief §4 30-second clarity). *Risk:* a live route already reads it — flipping off must redirect, not 404. *Action:* gate `accounting/ledger/*` behind the flag; surface money-basics only in V1 nav; position GL as "export to Xero/QuickBooks".
2. **Consolidate the redundancy clusters (audit/AI-usage/invites/units/tasks).** *Reason:* duplicate sinks cause split-brain data and confuse the audit gate's "which table is canonical". *Risk:* a migration that drops the wrong one breaks a live read. *Action:* run a per-route grep to confirm canonical, deprecate the others with a view shim, never hard-drop pre-V1.
3. **Keep `scripts/audit-queries.mjs` as a CI gate (currently 0).** *Reason:* it is the only automated guarantee against 42703 silent failures across 431 tables. *Risk:* it checks columns, not table-reachability. *Action:* extend it with an "unreferenced base table" report to catch true orphans introduced later.
4. **Do not migrate-away the ~240 Layer C/D tables.** *Reason:* they are the staged-platform optionality the verdict depends on. *Risk:* deletion forecloses V2. *Action:* leave schema intact; enforce surface-hiding via the flag registry only.
5. **Document the dual-RLS model in code-adjacent docs.** *Reason:* the portal tables are deliberately *outside* workspace-member RLS and rely solely on `src/lib/portal/session.ts`; a future dev adding a `.from()` on the service-role path could leak cross-workspace. *Risk:* security. *Action:* add a lint/comment convention that any portal-path `.from()` must be preceded by a `scope.workspaceId` filter.
