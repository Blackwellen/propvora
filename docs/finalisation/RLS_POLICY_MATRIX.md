# RLS Policy Matrix — Propvora (live database)

Generated: 2026-06-15 from live introspection via the Supabase Management API
(`pg_class.relrowsecurity` + `pg_policies` + `information_schema.columns`).
Source script: `scripts/test/rls-coverage.mjs`.

Scope: every `public` relation that carries a `workspace_id` column (the tenant
boundary). **195 base tables** and **3 views**.

## Headline result

| Metric | Value |
|---|---|
| Base tables with `workspace_id` | 195 |
| Base tables with RLS **enabled** | 195 / 195 |
| Base tables with RLS **disabled** (CRITICAL holes) | 0 |
| Base tables with RLS on but **0 policies** (default-deny) | 4 |
| Views exposing `workspace_id` (inherit base-table RLS) | 3 |
| IDOR sweep result (cross-workspace SELECT/UPDATE/DELETE/INSERT) | **0 leaks** (96/96 assertions) |
| Anonymous exposure result (anon client, no user) | **0 rows leaked** (31/31 assertions) |

**No table with `workspace_id` has RLS disabled.** Cross-workspace isolation and
anonymous-read blocking were both verified live with seeded real data (see
`idor-sweep.mjs` and `anon-exposure.mjs`).

## Findings (observations — not leaks)

RLS-enabled tables with **zero policies** are *default-deny*: with RLS on and no
policy, PostgreSQL denies all access to `anon` and `authenticated`. This is safe
(no data is exposed) but usually marks an unfinished surface — writes flow only
via the service role.

- `activity_logs` — RLS ENABLED, 0 policies (default-deny; service-role-only surface)
- `bug_reports` — RLS ENABLED, 0 policies (default-deny; service-role-only surface)
- `mail_oauth_states` — RLS ENABLED, 0 policies (default-deny; service-role-only surface)
- `share_link_rate_limits` — RLS ENABLED, 0 policies (default-deny; service-role-only surface)

Views cannot carry RLS themselves; they inherit it from their base tables:

- VIEW `arrears_view` — inherits RLS from base tables
- VIEW `margins_view` — inherits RLS from base tables
- VIEW `v_activity_feed` — inherits RLS from base tables

## Per-table matrix

Legend: **RLS** = row security enabled · **Pol** = policy count · **Cmds** = policy
commands present (ALL covers every command) · **IDOR/Anon** = covered by the live
sweep (`✓` = asserted blocked; `default-deny` = no policy so denied to all;
`view` = inherits).

| Table | RLS | Pol | Policy cmds | IDOR/Anon |
|---|---|---|---|---|
| `account_deletion_requests` | ✅ | 3 | INSERT/SELECT/UPDATE | RLS-scoped |
| `activity_logs` | ✅ | 0 | — | default-deny |
| `affiliate_commissions` | ✅ | 3 | INSERT/SELECT/UPDATE | RLS-scoped |
| `affiliates` | ✅ | 5 | ALL/INSERT/SELECT/UPDATE | RLS-scoped |
| `agency_landlord_clients` | ✅ | 1 | ALL | RLS-scoped |
| `agency_profiles` | ✅ | 1 | ALL | RLS-scoped |
| `agency_workspaces` | ✅ | 2 | SELECT/UPDATE | RLS-scoped |
| `agreement_signatures` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `agreements` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `ai_action_logs` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `ai_actions` | ✅ | 8 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `ai_approval_queue` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `ai_approval_requests` | ✅ | 3 | INSERT/SELECT/UPDATE | RLS-scoped |
| `ai_chat_messages` | ✅ | 1 | ALL | RLS-scoped |
| `ai_chat_threads` | ✅ | 1 | ALL | RLS-scoped |
| `ai_duplicate_candidates` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `ai_rate_counters` | ✅ | 1 | SELECT | RLS-scoped |
| `ai_token_usage` | ✅ | 1 | SELECT | RLS-scoped |
| `ai_triage_items` | ✅ | 3 | INSERT/SELECT/UPDATE | RLS-scoped |
| `ai_usage_logs` | ✅ | 3 | ALL/INSERT/SELECT | RLS-scoped |
| `ai_usage_metering` | ✅ | 1 | SELECT | RLS-scoped |
| `analytics_event` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `announcements` | ✅ | 1 | SELECT | RLS-scoped |
| `api_keys` | ✅ | 2 | ALL | RLS-scoped |
| `arrears_records` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `audit_log` | ✅ | 3 | SELECT | RLS-scoped |
| `audit_logs` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `automation_events` | ✅ | 1 | SELECT | RLS-scoped |
| `automation_recipes` | ✅ | 8 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `automation_rules` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `automation_runs` | ✅ | 7 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `bill_lines` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `bills` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `booking_availability` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `booking_enquiries` | ✅ | 1 | ALL | RLS-scoped |
| `booking_pages` | ✅ | 1 | ALL | RLS-scoped |
| `booking_requests` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `bug_reports` | ✅ | 0 | — | default-deny |
| `calendar_events` | ✅ | 9 | ALL/DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `calendar_ical_tokens` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `calendar_reminders` | ✅ | 1 | ALL | RLS-scoped |
| `calendar_settings` | ✅ | 1 | ALL | RLS-scoped |
| `chat_channels` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `chat_direct_threads` | ✅ | 3 | INSERT/SELECT/UPDATE | RLS-scoped |
| `chat_message_attachments` | ✅ | 3 | DELETE/INSERT/SELECT | RLS-scoped |
| `chat_message_audit` | ✅ | 3 | INSERT/SELECT | RLS-scoped |
| `chat_messages` | ✅ | 8 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `compliance_checklists` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `compliance_evidence` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `compliance_items` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `contact_activity` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `contact_links` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `contact_notes` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `contact_portal_access` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `contacts` | ✅ | 5 | ALL/DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `data_export_requests` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `debt_snapshots` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `deposits` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `document_templates` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `documents` | ✅ | 5 | ALL/DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `email_accounts` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `email_outbox` | ✅ | 1 | SELECT | RLS-scoped |
| `entitlement_overrides` | ✅ | 1 | SELECT | RLS-scoped |
| `escrow_disputes` | ✅ | 7 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `escrow_milestones` | ✅ | 6 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `escrow_orders` | ✅ | 6 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `expense_records` | ✅ | 2 | ALL/SELECT | ✓ blocked (live) |
| `file_activity` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `file_grants` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `file_tag_links` | ✅ | 3 | DELETE/INSERT/SELECT | RLS-scoped |
| `file_tags` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `file_versions` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `files` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `generated_documents` | ✅ | 3 | DELETE/INSERT/SELECT | RLS-scoped |
| `guided_help_state` | ✅ | 1 | ALL | RLS-scoped |
| `hmo_licences` | ✅ | 1 | ALL | ✓ blocked (live) |
| `insight_snapshots` | ✅ | 3 | DELETE/INSERT/SELECT | RLS-scoped |
| `invites` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `invoice_lines` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `invoices` | ✅ | 2 | ALL/SELECT | ✓ blocked (live) |
| `job_complaints` | ✅ | 1 | ALL | RLS-scoped |
| `job_documents` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `job_links` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `job_schedules` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `jobs` | ✅ | 2 | ALL/SELECT | ✓ blocked (live) |
| `logistics_events` | ✅ | 1 | ALL | RLS-scoped |
| `mail_oauth_states` | ✅ | 0 | — | default-deny |
| `marketplace_listings` | ✅ | 7 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `marketplace_orders` | ✅ | 6 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `marketplace_reviews` | ✅ | 5 | ALL/INSERT/SELECT | RLS-scoped |
| `message_threads` | ✅ | 2 | INSERT/SELECT | ✓ blocked (live) |
| `messages` | ✅ | 4 | ALL/INSERT/SELECT | ✓ blocked (live) |
| `module_release_statuses` | ✅ | 1 | SELECT | RLS-scoped |
| `money_forecast_records` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `money_transactions` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `move_plans` | ✅ | 1 | ALL | RLS-scoped |
| `move_tasks` | ✅ | 1 | ALL | RLS-scoped |
| `network_messages` | ✅ | 1 | SELECT | RLS-scoped |
| `notification_preferences` | ✅ | 8 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `notifications` | ✅ | 10 | DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `organisations` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `payments` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `planning_expense_lines` | ✅ | 7 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `planning_income_lines` | ✅ | 7 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `planning_landlord_offers` | ✅ | 4 | ALL/SELECT | RLS-scoped |
| `planning_profiles` | ✅ | 9 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `planning_scenarios` | ✅ | 7 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `planning_sensitivity_runs` | ✅ | 1 | ALL | RLS-scoped |
| `planning_sets` | ✅ | 4 | ALL/SELECT | ✓ blocked (live) |
| `planning_upfront_costs` | ✅ | 2 | ALL | RLS-scoped |
| `portal_access_tokens` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `portal_profiles` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `portal_purposes` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `portal_sessions` | ✅ | 1 | SELECT | RLS-scoped |
| `portfolio_audit_log` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `possession_cases` | ✅ | 1 | ALL | ✓ blocked (live) |
| `possession_evidence` | ✅ | 1 | ALL | RLS-scoped |
| `ppm_plans` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `preferred_suppliers` | ✅ | 1 | ALL | RLS-scoped |
| `procurement_requests` | ✅ | 1 | ALL | RLS-scoped |
| `properties` | ✅ | 9 | ALL/DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `property_compliance_items` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `property_documents` | ✅ | 2 | ALL/SELECT | ✓ blocked (live) |
| `property_inspections` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `property_media` | ✅ | 5 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `property_suppliers` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `property_tasks` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `property_units` | ✅ | 1 | ALL | RLS-scoped |
| `public_enquiries` | ✅ | 2 | INSERT/SELECT | RLS-scoped |
| `quote_requests` | ✅ | 1 | ALL | RLS-scoped |
| `reconciliation_items` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `rent_schedules` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `report_runs` | ✅ | 3 | DELETE/INSERT/SELECT | RLS-scoped |
| `role_audit_log` | ✅ | 1 | SELECT | RLS-scoped |
| `saved_insights` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `saved_reports` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `saved_views` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `share_evidence_uploads` | ✅ | 2 | SELECT/UPDATE | RLS-scoped |
| `share_help_reports` | ✅ | 1 | SELECT | RLS-scoped |
| `share_link_events` | ✅ | 3 | DELETE/INSERT/SELECT | RLS-scoped |
| `share_link_rate_limits` | ✅ | 0 | — | default-deny |
| `share_link_submissions` | ✅ | 3 | DELETE/SELECT/UPDATE | RLS-scoped |
| `share_link_targets` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `share_link_views` | ✅ | 1 | SELECT | RLS-scoped |
| `share_links` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `sso_configurations` | ✅ | 1 | ALL | RLS-scoped |
| `stripe_accounts` | ✅ | 3 | INSERT/SELECT/UPDATE | RLS-scoped |
| `stripe_connect_accounts` | ✅ | 1 | SELECT | RLS-scoped |
| `supplier_availability` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `supplier_directory` | ✅ | 3 | INSERT/SELECT/UPDATE | RLS-scoped |
| `supplier_documents` | ✅ | 1 | ALL | RLS-scoped |
| `supplier_invites` | ✅ | 1 | ALL | RLS-scoped |
| `supplier_invoices` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `supplier_job_attachments` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `supplier_job_quotes` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `supplier_jobs` | ✅ | 6 | ALL/DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `supplier_network_profiles` | ✅ | 2 | SELECT/UPDATE | RLS-scoped |
| `supplier_packages` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `supplier_preferences` | ✅ | 1 | ALL | RLS-scoped |
| `supplier_profiles` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `supplier_quotes` | ✅ | 1 | ALL | RLS-scoped |
| `supplier_ratings` | ✅ | 1 | ALL | RLS-scoped |
| `supplier_reviews` | ✅ | 5 | INSERT/SELECT/UPDATE | RLS-scoped |
| `supplier_services` | ✅ | 6 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `suppliers` | ✅ | 5 | ALL/DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `task_attachments` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `task_checklist_items` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `task_comments` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `task_dependencies` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `task_documents` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `task_links` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `tasks` | ✅ | 5 | ALL/DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `templates_property` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `tenancies` | ✅ | 5 | ALL/DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `tenancy_parties` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `transactions` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `unit_media` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `units` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `usage_counters` | ✅ | 1 | SELECT | RLS-scoped |
| `user_preferences` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `utility_setups` | ✅ | 1 | ALL | RLS-scoped |
| `webhook_endpoints` | ✅ | 1 | ALL | RLS-scoped |
| `webhooks` | ✅ | 1 | ALL | RLS-scoped |
| `work_audit_log` | ✅ | 1 | SELECT | RLS-scoped |
| `work_items` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `workspace_addons` | ✅ | 4 | ALL/SELECT | RLS-scoped |
| `workspace_billing` | ✅ | 1 | SELECT | ✓ blocked (live) |
| `workspace_feature_overrides` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `workspace_invitations` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `workspace_invites` | ✅ | 4 | DELETE/INSERT/SELECT/UPDATE | RLS-scoped |
| `workspace_members` | ✅ | 12 | ALL/DELETE/INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `workspace_role_permissions` | ✅ | 2 | ALL/SELECT | RLS-scoped |
| `workspace_settings` | ✅ | 3 | INSERT/SELECT/UPDATE | ✓ blocked (live) |
| `workspace_slug_redirects` | ✅ | 1 | SELECT | RLS-scoped |
| `workspace_subscriptions` | ✅ | 2 | SELECT | RLS-scoped |

### Views (inherit base-table RLS)

| View | Note |
|---|---|
| `arrears_view` | inherits RLS from base tables |
| `margins_view` | inherits RLS from base tables |
| `v_activity_feed` | inherits RLS from base tables |

---
Reproduce: `node scripts/test/rls-coverage.mjs` · `node scripts/test/idor-sweep.mjs` · `node scripts/test/anon-exposure.mjs`
