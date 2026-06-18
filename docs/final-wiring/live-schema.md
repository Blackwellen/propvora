# Propvora — Live DB Schema Map

_Generated 2026-06-18T02:49:48.483Z from the live Supabase project. Source of truth for aligning the seeder and app data layer._

## Enums (42)

- **app_contact_role**: `landlord, tenant, guarantor, supplier, agent, owner_occupier, investor, other`
- **app_role**: `owner, admin, manager, member, accountant`
- **audit_action**: `create, update, delete, archive, restore, share, revoke, invite, remove_member, role_change, plan_change, login, logout, export, import, ai_action_run, automation_run`
- **automation_recipe**: `rent_due_reminder, arrears_chase, compliance_due_chase, tenancy_end_chase, maintenance_sla_breach, supplier_quote_chase, monthly_owner_report, weekly_team_digest, share_link_expiry_warning, document_signature_chase`
- **chat_member_role**: `member, admin`
- **compliance_item_status**: `valid, due_soon, expired, missing, exempt`
- **compliance_kind**: `gas_safety, eicr, epc, pat, fire_alarm, emergency_lighting, legionella, hmo_licence, selective_licence, insurance, deposit_protection, right_to_rent, smoke_co_alarm, fire_door, other`
- **compliance_status**: `ok, due_soon, overdue, missing, exempt`
- **contact_type**: `tenant, guarantor, supplier, owner, agent, accountant, other`
- **email_outbox_status**: `queued, sending, sent, failed, cancelled`
- **evidence_kind**: `certificate, photo, invoice, report, other`
- **file_grant_role**: `viewer, editor, owner`
- **file_kind**: `image, document, evidence, invoice, report, other`
- **file_status**: `pending, ready, failed, deleted`
- **inspection_status**: `scheduled, in_progress, completed, cancelled, overdue`
- **intl_breach_state**: `open, assessing, notified_authority, notified_subjects, closed, no_notification`
- **intl_offer_status**: `offer, restricted, banned, unknown`
- **intl_pack_status**: `disabled, generic_only, research_only, beta, reviewed, enabled`
- **intl_privacy_request_status**: `received, identity_check, in_progress, extended, fulfilled, refused, withdrawn`
- **intl_release_state**: `locked, in_review, staged, enabled, suspended`
- **intl_tax_scheme**: `vat, vat_oss, gst, sales_tax, consumption_tax, none`
- **money_category**: `rent, deposit, service_charge, utility_recharge, reimbursement, maintenance, compliance, cleaning, management_fee, mortgage, insurance, tax, professional_fees, marketing, other`
- **money_direction**: `in, out`
- **notification_channel**: `inapp, email`
- **notification_severity**: `info, success, warning, danger`
- **operation_type**: `student_let, rent_to_rent, rent_to_sa, serviced_accommodation, hmo, single_let, social_housing, commercial, mixed_use, leasehold_portfolio, agency_managed, other`
- **plan_tier**: `starter, operator, scale, pro_agency, enterprise`
- **portal_share_capability**: `view, download, upload, sign, comment`
- **portal_share_resource**: `document, documents, invoice, job, work_order, tenancy, property`
- **property_status**: `active, void, off_market, archived`
- **property_template**: `standard_rental, hmo, r2r, sa_lite, student_let`
- **report_kind**: `compliance, margin, arrears, portfolio, custom`
- **report_status**: `draft, ready, shared, archived`
- **share_link_kind**: `intake_form, document_pack, report, evidence_request, custom`
- **share_link_status**: `active, expired, revoked`
- **supplier_job_status**: `draft, quoted, approved, scheduled, in_progress, completed, invoiced, paid, cancelled`
- **task_dependency_kind**: `FS, SS, FF, SF`
- **task_kind**: `general, maintenance, compliance, admin, inspection, turnover`
- **task_priority**: `low, normal, high, urgent`
- **task_status**: `todo, in_progress, blocked, done, cancelled`
- **tenancy_status**: `draft, active, ended, terminated, uncollectable`
- **work_entity_kind**: `task, supplier_job`

## Tables (431)

### accommodation_amenities

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| slug | text | **N** |  |
| label | text | **N** |  |
| category | text | **N** | `'general'::text` |
| icon | text | Y |  |
| sort_order | int4 | **N** | `100` |
| active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |

### account_deletion_requests

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| user_id | uuid | **N** |  |
| workspace_id | uuid | Y |  |
| request_type | text | **N** | `'user_account'::text` |
| requested_by | uuid | **N** |  |
| requested_at | timestamptz | **N** | `now()` |
| scheduled_for | timestamptz | **N** | `(now() + '30 days'::interval)` |
| completed_at | timestamptz | Y |  |
| status | text | **N** | `'pending'::text` |
| retention_reason | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### account_rate_limits

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| user_id | uuid | **N** |  |
| action | text | **N** |  |
| created_at | timestamptz | **N** | `now()` |

### activity_logs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | Y |  |
| action | text | **N** |  |
| description | text | Y |  |
| resource_type | text | Y |  |
| resource_id | uuid | Y |  |
| metadata | jsonb | Y |  |
| is_demo | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |

### address_models

| column | type | null | default |
|---|---|---|---|
| id | text | **N** |  |
| name | text | **N** |  |
| field_order | jsonb | **N** | `'[]'::jsonb` |
| fields | jsonb | **N** | `'{}'::jsonb` |
| postcode_label | text | Y |  |
| region_label | text | Y |  |
| region_required | bool | **N** | `false` |
| region_options | jsonb | **N** | `'[]'::jsonb` |
| example | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### admin_broadcasts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| audience_scope | text | **N** |  |
| audience_value | text | Y |  |
| title | text | **N** |  |
| body | text | Y |  |
| link | text | Y |  |
| severity | notification_severity _(enum: info/success/warning/danger)_ | **N** | `'info'::notification_severity` |
| recipient_count | int4 | **N** | `0` |
| status | text | **N** | `'sent'::text` |
| error | text | Y |  |
| sent_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### admin_evidence

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| subject_type | text | **N** |  |
| subject_id | uuid | Y |  |
| title | text | **N** |  |
| note | text | Y |  |
| object_key | text | **N** |  |
| file_name | text | Y |  |
| mime_type | text | Y |  |
| size_bytes | int8 | Y |  |
| uploaded_by | uuid | **N** | `auth.uid()` |
| created_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### admin_impersonations

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| admin_user_id | uuid | **N** |  |
| target_user_id | uuid | **N** |  |
| target_email | text | Y |  |
| reason | text | **N** |  |
| started_at | timestamptz | **N** | `now()` |
| ended_at | timestamptz | Y |  |
| ended_by | uuid | Y |  |
| ip_address | text | Y |  |
| user_agent | text | Y |  |

### admin_settings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| singleton | bool | **N** | `true` |
| general | jsonb | **N** | `'{}'::jsonb` |
| branding | jsonb | **N** | `'{}'::jsonb` |
| limits | jsonb | **N** | `'{}'::jsonb` |
| feature_defaults | jsonb | **N** | `'{}'::jsonb` |
| email | jsonb | **N** | `'{}'::jsonb` |
| webhooks | jsonb | **N** | `'{}'::jsonb` |
| integrations | jsonb | **N** | `'{}'::jsonb` |
| danger | jsonb | **N** | `'{}'::jsonb` |
| updated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### admin_settings_audit

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| section | text | **N** |  |
| previous_payload | jsonb | Y |  |
| new_payload | jsonb | **N** |  |
| summary | text | Y |  |
| actor_user_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### affiliate_applications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| full_name | text | **N** |  |
| email | text | **N** |  |
| company | text | Y |  |
| website | text | Y |  |
| audience_type | text | Y |  |
| promotion_plan | text | Y |  |
| estimated_audience | text | Y |  |
| country | text | Y |  |
| existing_customer | bool | **N** | `false` |
| referral_code | text | Y |  |
| status | text | **N** | `'pending_review'::text` |
| reviewed_at | timestamptz | Y |  |
| reviewed_by | uuid | Y |  |
| notes | text | Y |  |
| ip_hash | text | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### affiliate_commissions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| affiliate_user_id | uuid | Y |  |
| referred_workspace_id | uuid | Y |  |
| commission_type | text | Y | `'subscription'::text` |
| amount | numeric | Y | `0` |
| currency | text | **N** | `'GBP'::text` |
| status | text | **N** | `'pending'::text` |
| approved_at | timestamptz | Y |  |
| paid_at | timestamptz | Y |  |
| stripe_transfer_id | text | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### affiliate_payouts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| affiliate_workspace_id | uuid | **N** |  |
| period | text | Y |  |
| amount_pence | int8 | **N** |  |
| status | text | **N** | `'scheduled'::text` |
| paid_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| requested_at | timestamptz | Y |  |
| requested_by | uuid | Y |  |
| reviewed_at | timestamptz | Y |  |
| reviewed_by | uuid | Y |  |
| payout_email | text | Y |  |
| payout_method | text | Y |  |
| payout_reference | text | Y |  |
| review_note | text | Y |  |
| cleared_snapshot_pence | int8 | Y |  |
| updated_at | timestamptz | Y | `now()` |

### affiliate_referrals

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| affiliate_workspace_id | uuid | **N** |  |
| referred_workspace_id | uuid | **N** |  |
| status | text | **N** | `'pending'::text` |
| first_invoice_at | timestamptz | Y |  |
| initial_commission_pence | int8 | **N** | `0` |
| recurring_commission_pence | int8 | **N** | `0` |
| recurring_months_remaining | int4 | **N** | `12` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### affiliates

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| enrolled | bool | **N** | `false` |
| approved | bool | **N** | `false` |
| public_handle | citext | Y |  |
| payout_email | text | Y |  |
| band | text | **N** | `'Bronze'::text` |
| active_referrals_count | int4 | **N** | `0` |
| pending_pence | int8 | **N** | `0` |
| cleared_pence | int8 | **N** | `0` |
| paid_pence | int8 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| origin | text | **N** | `'internal'::text` |
| referral_code | text | Y |  |
| applied_at | timestamptz | Y |  |

### agency_landlord_clients

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | Y |  |
| properties_managed | int4 | Y | `0` |
| management_fee_pct | numeric | Y |  |
| start_date | date | Y |  |
| status | text | Y | `'active'::text` |

### agency_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| agency_name | text | **N** |  |
| license_number | text | Y |  |
| coverage_areas | _text | Y |  |
| commission_pct | numeric | Y | `10` |
| created_at | timestamptz | Y | `now()` |

### agency_supplier_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| agency_workspace_id | uuid | **N** |  |
| supplier_name | text | **N** |  |
| contact_name | text | Y |  |
| email | text | Y |  |
| phone | text | Y |  |
| specialisms | _text | Y |  |
| availability_status | text | **N** | `'available'::text` |
| rating | numeric | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### agency_workspaces

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| business_name | text | **N** |  |
| trading_name | text | Y |  |
| registration_no | text | Y |  |
| vat_number | text | Y |  |
| description | text | Y |  |
| website | text | Y |  |
| logo_url | text | Y |  |
| cover_image_url | text | Y |  |
| service_areas | _text | Y |  |
| specialisms | _text | Y |  |
| status | text | **N** | `'pending'::text` |
| is_verified | bool | **N** | `false` |
| verification_date | timestamptz | Y |  |
| avg_rating | numeric | Y |  |
| network_profile_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### agreement_signatures

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| agreement_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | Y |  |
| signer_name | text | **N** |  |
| signer_email | text | **N** |  |
| role | text | **N** | `'tenant'::text` |
| status | text | **N** | `'pending'::text` |
| signed_at | timestamptz | Y |  |
| ip_address | text | Y |  |
| docuseal_submitter_id | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### agreements

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| tenancy_id | uuid | Y |  |
| property_id | uuid | Y |  |
| template_id | uuid | Y |  |
| title | text | **N** |  |
| status | text | **N** | `'draft'::text` |
| body_md | text | Y |  |
| pdf_file_id | uuid | Y |  |
| docuseal_submission_id | text | Y |  |
| docuseal_url | text | Y |  |
| sent_at | timestamptz | Y |  |
| signed_at | timestamptz | Y |  |
| expires_at | timestamptz | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| created_by | uuid | Y |  |
| deleted_at | timestamptz | Y |  |

### ai_action_logs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| action_type | text | **N** |  |
| context | jsonb | Y |  |
| result | jsonb | Y |  |
| approved | bool | Y |  |
| approved_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### ai_actions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| action_kind | text | **N** |  |
| linked_kind | text | Y |  |
| linked_id | uuid | Y |  |
| input | jsonb | Y |  |
| output | jsonb | Y |  |
| tokens_in | int4 | **N** | `0` |
| tokens_out | int4 | **N** | `0` |
| model | text | Y |  |
| status | text | **N** |  |
| approved_by | uuid | Y |  |
| approved_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| action_type | text | Y |  |
| input_context | jsonb | Y | `'{}'::jsonb` |
| output_result | jsonb | Y | `'{}'::jsonb` |
| tokens_used | int4 | Y |  |
| duration_ms | int4 | Y |  |
| triggered_by | uuid | Y |  |
| recipe_id | uuid | Y |  |

### ai_approval_queue

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| source | text | **N** |  |
| action_type | text | **N** |  |
| target_table | text | Y |  |
| target_id | uuid | Y |  |
| summary | text | **N** |  |
| rationale | text | Y |  |
| payload | jsonb | **N** | `'{}'::jsonb` |
| status | text | **N** | `'pending'::text` |
| confidence | numeric | Y |  |
| suggested_by | uuid | Y |  |
| decided_by | uuid | Y |  |
| decided_at | timestamptz | Y |  |
| decision_note | text | Y |  |
| expires_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ai_approval_requests

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| action_type | text | **N** |  |
| title | text | **N** |  |
| description | text | Y |  |
| category | text | **N** | `'General'::text` |
| confidence_score | int4 | **N** | `80` |
| payload | jsonb | Y |  |
| property_address | text | Y |  |
| status | text | **N** | `'pending'::text` |
| reviewed_at | timestamptz | Y |  |
| reviewed_by | uuid | Y |  |
| reviewed_by_name | text | Y |  |
| ai_model | text | Y |  |
| prompt_tokens | int4 | Y |  |
| completion_tokens | int4 | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ai_chat_messages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| thread_id | uuid | **N** |  |
| workspace_id | uuid | Y |  |
| role | text | **N** |  |
| content | text | **N** | `''::text` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### ai_chat_threads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| user_id | uuid | **N** |  |
| title | text | Y |  |
| context_route | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ai_duplicate_candidates

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| entity_kind | text | **N** |  |
| left_id | uuid | **N** |  |
| right_id | uuid | **N** |  |
| score | numeric | **N** | `0` |
| suggested_winner_id | uuid | Y |  |
| status | text | **N** | `'pending'::text` |
| payload | jsonb | **N** | `'{}'::jsonb` |
| decision_note | text | Y |  |
| decided_by | uuid | Y |  |
| decided_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ai_models

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| provider_id | uuid | **N** |  |
| model_id | text | **N** |  |
| label | text | **N** |  |
| input_cost_pence_per_1k | numeric | **N** | `0` |
| output_cost_pence_per_1k | numeric | **N** | `0` |
| enabled | bool | **N** | `true` |
| is_default | bool | **N** | `false` |
| sort_order | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ai_providers

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| slug | text | **N** |  |
| name | text | **N** |  |
| base_url | text | Y |  |
| api_key_env | text | Y |  |
| enabled | bool | **N** | `true` |
| sort_order | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ai_rate_counters

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| window_start | timestamptz | **N** |  |
| count | int4 | **N** | `0` |
| updated_at | timestamptz | **N** | `now()` |

### ai_token_usage

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| day | date | **N** |  |
| tokens_in | int8 | **N** | `0` |
| tokens_out | int8 | **N** | `0` |
| cost_pence | int8 | **N** | `0` |
| updated_at | timestamptz | **N** | `now()` |

### ai_triage_items

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| type | text | **N** | `'maintenance'::text` |
| title | text | **N** |  |
| description | text | Y |  |
| ai_recommendation | text | Y |  |
| severity | text | **N** | `'medium'::text` |
| status | text | **N** | `'open'::text` |
| property | text | Y |  |
| assigned_to | uuid | Y |  |
| related_id | uuid | Y |  |
| related_table | text | Y |  |
| payload | jsonb | Y |  |
| detected_at | timestamptz | **N** | `now()` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ai_usage_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | Y |  |
| provider | text | **N** |  |
| model | text | **N** |  |
| tokens_in | int4 | **N** | `0` |
| tokens_out | int4 | **N** | `0` |
| cost_pence | numeric | **N** | `0` |
| route | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### ai_usage_logs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| ai_action_id | uuid | Y |  |
| model | text | **N** |  |
| prompt_tokens | int4 | Y | `0` |
| completion_tokens | int4 | Y | `0` |
| total_tokens | int4 | Y | `0` |
| estimated_cost_usd | numeric | Y | `0` |
| created_at | timestamptz | Y | `now()` |
| feature | text | Y |  |
| cost_usd | numeric | Y |  |
| session_id | text | Y |  |
| metadata | jsonb | Y | `'{}'::jsonb` |

### ai_usage_metering

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| action_type | text | **N** |  |
| model | text | **N** | `'gpt-4o'::text` |
| input_tokens | int4 | **N** | `0` |
| output_tokens | int4 | **N** | `0` |
| cost_usd | numeric | **N** | `0` |
| entity_type | text | Y |  |
| entity_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### analytics_event

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| user_id | uuid | Y |  |
| event_name | text | **N** |  |
| entity_type | text | Y |  |
| entity_id | uuid | Y |  |
| properties | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### announcement_dismissals

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| announcement_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| dismissed_at | timestamptz | **N** | `now()` |

### announcements

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| title | text | **N** |  |
| body_html | text | Y |  |
| severity | text | **N** | `'info'::text` |
| audience | text | **N** | `'all'::text` |
| starts_at | timestamptz | Y |  |
| ends_at | timestamptz | Y |  |
| dismissible | bool | **N** | `true` |
| published | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### api_keys

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| key_hash | text | **N** |  |
| key_prefix | text | **N** |  |
| scopes | _text | Y | `'{}'::text[]` |
| last_used_at | timestamptz | Y |  |
| expires_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| revoked_at | timestamptz | Y |  |
| created_at | timestamptz | Y | `now()` |
| is_active | bool | **N** | `true` |
| updated_at | timestamptz | **N** | `now()` |

### app_rate_limits

| column | type | null | default |
|---|---|---|---|
| key | text | **N** |  |
| window_start | timestamptz | **N** |  |
| count | int4 | **N** | `0` |
| updated_at | timestamptz | **N** | `now()` |

### arrears_records

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| invoice_id | uuid | Y |  |
| amount_due | numeric | Y | `0` |
| amount_paid | numeric | Y | `0` |
| amount_outstanding | numeric | Y | `0` |
| due_date | date | Y |  |
| days_overdue | int4 | Y | `0` |
| status | text | **N** | `'open'::text` |
| last_chased_at | timestamptz | Y |  |
| next_chase_at | timestamptz | Y |  |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### audit_log

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| actor_user_id | uuid | Y |  |
| action | text | **N** |  |
| target_kind | text | Y |  |
| target_id | uuid | Y |  |
| summary | text | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| ip | inet | Y |  |
| ua | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### audit_logs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| user_id | uuid | Y |  |
| action | text | **N** |  |
| resource_type | text | Y |  |
| resource_id | uuid | Y |  |
| metadata | jsonb | Y |  |
| ip | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| old_data | jsonb | Y |  |
| new_data | jsonb | Y |  |
| ip_address | text | Y |  |

### automation_approvals

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| run_id | uuid | Y |  |
| definition_id | uuid | Y |  |
| node_key | text | Y |  |
| node_type | text | **N** |  |
| category | text | **N** | `'approval'::text` |
| risk | text | **N** | `'high'::text` |
| title | text | **N** |  |
| summary | text | Y |  |
| payload | jsonb | **N** | `'{}'::jsonb` |
| status | text | **N** | `'pending'::text` |
| requested_by | uuid | Y |  |
| decided_by | uuid | Y |  |
| decided_at | timestamptz | Y |  |
| decision_note | text | Y |  |
| due_at | timestamptz | Y |  |
| escalated_at | timestamptz | Y |  |
| escalate_to | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### automation_caps_usage

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| period_start | date | **N** |  |
| runs_count | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### automation_definitions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| trigger | jsonb | **N** | `'{}'::jsonb` |
| conditions | jsonb | **N** | `'{}'::jsonb` |
| actions | jsonb | **N** | `'[]'::jsonb` |
| enabled | bool | **N** | `true` |
| version | int4 | **N** | `1` |
| source | text | **N** | `'builder'::text` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### automation_edges

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| version_id | uuid | **N** |  |
| source_key | text | **N** |  |
| target_key | text | **N** |  |
| branch_label | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### automation_errors

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| definition_id | uuid | Y |  |
| run_id | uuid | Y |  |
| node_key | text | Y |  |
| node_type | text | Y |  |
| severity | text | **N** | `'error'::text` |
| code | text | Y |  |
| message | text | **N** |  |
| context | jsonb | **N** | `'{}'::jsonb` |
| resolved | bool | **N** | `false` |
| resolved_by | uuid | Y |  |
| resolved_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### automation_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| event_type | text | **N** |  |
| entity_type | text | Y |  |
| entity_id | uuid | Y |  |
| payload | jsonb | **N** | `'{}'::jsonb` |
| processed | bool | **N** | `false` |
| processed_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### automation_integrations

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| provider | text | **N** |  |
| name | text | **N** |  |
| status | text | **N** | `'disconnected'::text` |
| config | jsonb | **N** | `'{}'::jsonb` |
| secret_ref | text | Y |  |
| last_used_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### automation_node_registry

| column | type | null | default |
|---|---|---|---|
| node_type | text | **N** |  |
| label | text | **N** |  |
| category | text | **N** |  |
| scope | text | **N** | `'workspace'::text` |
| risk | text | **N** | `'low'::text` |
| min_plan | text | **N** | `'Starter'::text` |
| requires_approval | bool | **N** | `false` |
| blocked_from_autorun | bool | **N** | `false` |
| enabled | bool | **N** | `true` |
| description | text | Y |  |
| config_schema | jsonb | **N** | `'{}'::jsonb` |
| updated_at | timestamptz | **N** | `now()` |

### automation_node_runs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| run_id | uuid | **N** |  |
| node_key | text | **N** |  |
| node_type | text | **N** |  |
| category | text | **N** | `'utility'::text` |
| seq | int4 | **N** | `0` |
| status | text | **N** | `'pending'::text` |
| input | jsonb | **N** | `'{}'::jsonb` |
| output | jsonb | **N** | `'{}'::jsonb` |
| error | text | Y |  |
| approval_id | uuid | Y |  |
| started_at | timestamptz | Y |  |
| finished_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### automation_nodes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| version_id | uuid | **N** |  |
| node_key | text | **N** |  |
| node_type | text | **N** |  |
| category | text | **N** | `'utility'::text` |
| label | text | Y |  |
| config | jsonb | **N** | `'{}'::jsonb` |
| risk | text | **N** | `'low'::text` |
| pos_x | float8 | **N** | `0` |
| pos_y | float8 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |

### automation_plan_limits

| column | type | null | default |
|---|---|---|---|
| plan | text | **N** |  |
| max_active | int4 | **N** | `0` |
| max_runs_month | int4 | **N** | `0` |
| max_nodes | int4 | **N** | `0` |
| max_webhooks | int4 | **N** | `0` |
| retention_days | int4 | **N** | `7` |
| canvas_access | text | **N** | `'none'::text` |
| ai_access | text | **N** | `'none'::text` |
| nl_access | text | **N** | `'none'::text` |
| updated_at | timestamptz | **N** | `now()` |

### automation_recipes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| trigger_type | text | **N** |  |
| trigger_config | jsonb | Y | `'{}'::jsonb` |
| conditions | jsonb | Y | `'[]'::jsonb` |
| actions | jsonb | Y | `'[]'::jsonb` |
| is_active | bool | Y | `true` |
| run_count | int4 | Y | `0` |
| last_run_at | timestamptz | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| is_system | bool | **N** | `false` |
| error_count | int4 | **N** | `0` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| archived_at | timestamptz | Y |  |
| status | text | **N** | `'active'::text` |
| last_run_status | text | Y |  |
| runs_total | int4 | **N** | `0` |
| runs_success | int4 | **N** | `0` |
| runs_failed | int4 | **N** | `0` |
| template_id | text | Y |  |
| category | text | Y |  |

### automation_rules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| recipe | automation_recipe _(enum: rent_due_reminder/arrears_chase/compliance_due_chase/tenancy_end_chase/maintenance_sla_breach/supplier_quote_chase/monthly_owner_report/weekly_team_digest/share_link_expiry_warning/document_signature_chase)_ | **N** |  |
| enabled | bool | **N** | `false` |
| config | jsonb | **N** | `'{}'::jsonb` |
| last_run_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### automation_run_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| run_id | uuid | **N** |  |
| level | text | **N** | `'info'::text` |
| event_type | text | **N** |  |
| node_key | text | Y |  |
| message | text | Y |  |
| data | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### automation_run_steps

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| run_id | uuid | **N** |  |
| step_index | int4 | **N** | `0` |
| action_type | text | **N** |  |
| status | text | **N** | `'pending'::text` |
| input | jsonb | **N** | `'{}'::jsonb` |
| output | jsonb | **N** | `'{}'::jsonb` |
| error | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### automation_runs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| rule_id | uuid | **N** |  |
| ran_at | timestamptz | **N** | `now()` |
| status | text | **N** |  |
| items_processed | int4 | **N** | `0` |
| notes | text | Y |  |
| payload | jsonb | Y |  |
| recipe_id | uuid | Y |  |
| triggered_by | text | **N** | `'schedule'::text` |
| actor_id | uuid | Y |  |
| records_affected | int4 | **N** | `0` |
| run_log | jsonb | **N** | `'[]'::jsonb` |
| started_at | timestamptz | **N** | `now()` |

### automation_templates

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| slug | text | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| domain | text | **N** | `'general'::text` |
| min_plan | text | **N** | `'Operator'::text` |
| graph | jsonb | **N** | `'{}'::jsonb` |
| recommended | bool | **N** | `false` |
| active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### automation_v2_runs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| definition_id | uuid | Y |  |
| status | text | **N** | `'queued'::text` |
| trigger_context | jsonb | **N** | `'{}'::jsonb` |
| started_at | timestamptz | Y |  |
| finished_at | timestamptz | Y |  |
| error | text | Y |  |
| is_dry_run | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |

### automation_versions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| definition_id | uuid | **N** |  |
| version | int4 | **N** | `1` |
| status | text | **N** | `'draft'::text` |
| compiled | jsonb | **N** | `'{}'::jsonb` |
| validation | jsonb | **N** | `'{}'::jsonb` |
| is_active | bool | **N** | `false` |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### automation_webhook_deliveries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| endpoint_id | uuid | **N** |  |
| received_at | timestamptz | **N** | `now()` |
| source_ip | text | Y |  |
| payload | jsonb | **N** | `'{}'::jsonb` |
| run_id | uuid | Y |  |
| status | text | **N** | `'accepted'::text` |

### automation_webhook_endpoints

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| definition_id | uuid | Y |  |
| name | text | **N** |  |
| token | text | **N** |  |
| secret_hash | text | Y |  |
| active | bool | **N** | `true` |
| last_triggered_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### bill_lines

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| bill_id | uuid | **N** |  |
| description | text | **N** | `''::text` |
| quantity | numeric | Y | `1` |
| unit_price | numeric | Y | `0` |
| tax_rate | numeric | Y | `0` |
| line_total | numeric | Y | `0` |
| sort_order | int4 | Y | `0` |
| created_at | timestamptz | Y | `now()` |

### billing_country_matrix

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| billing_supported | bool | **N** | `false` |
| manual_review | bool | **N** | `false` |
| currency | text | Y |  |
| notes | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### bills

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| bill_number | text | Y |  |
| bill_type | text | **N** | `'supplier_invoice'::text` |
| supplier_contact_id | uuid | Y |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| job_id | uuid | Y |  |
| planning_set_id | uuid | Y |  |
| status | text | **N** | `'received'::text` |
| issue_date | date | Y |  |
| due_date | date | Y |  |
| subtotal | numeric | Y | `0` |
| tax_amount | numeric | Y | `0` |
| total | numeric | Y | `0` |
| currency | text | **N** | `'GBP'::text` |
| document_id | uuid | Y |  |
| stripe_transfer_id | text | Y |  |
| approved_at | timestamptz | Y |  |
| paid_at | timestamptz | Y |  |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### booking_access_code_audit

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| access_code_id | uuid | Y |  |
| booking_id | uuid | Y |  |
| workspace_id | uuid | **N** |  |
| event | text | **N** |  |
| actor | text | Y |  |
| detail | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### booking_access_codes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| booking_id | uuid | **N** |  |
| listing_id | uuid | Y |  |
| workspace_id | uuid | **N** |  |
| lock_id | uuid | Y |  |
| provider | text | **N** | `'manual_code'::text` |
| code | text | **N** |  |
| valid_from | timestamptz | **N** |  |
| valid_to | timestamptz | **N** |  |
| status | text | **N** | `'pending'::text` |
| released_at | timestamptz | Y |  |
| provider_ref | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_availability

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| available_from | date | **N** |  |
| available_to | date | Y |  |
| status | text | **N** | `'available'::text` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### booking_availability_days

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| date | date | **N** |  |
| status | text | **N** | `'available'::text` |
| price_override_pence | int8 | Y |  |
| min_nights | int4 | Y |  |
| max_nights | int4 | Y |  |
| checkin_allowed | bool | **N** | `true` |
| checkout_allowed | bool | **N** | `true` |
| prep_time_days | int4 | **N** | `0` |
| advance_notice_days | int4 | **N** | `0` |
| cut_off_days | int4 | **N** | `0` |
| booking_id | uuid | Y |  |
| note | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_blocked_dates

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| date | date | **N** |  |
| reason | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### booking_enquiries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| booking_page_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| email | text | **N** |  |
| phone | text | Y |  |
| message | text | Y |  |
| preferred_date | date | Y |  |
| status | text | Y | `'new'::text` |
| created_at | timestamptz | Y | `now()` |

### booking_guest_tokens

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| booking_id | uuid | **N** |  |
| token | text | **N** |  |
| guest_email | text | **N** |  |
| expires_at | timestamptz | Y |  |
| last_used_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### booking_ical_connections

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| direction | text | **N** |  |
| channel | text | **N** | `'other'::text` |
| import_url | text | Y |  |
| export_token | text | Y |  |
| active | bool | **N** | `true` |
| last_synced_at | timestamptz | Y |  |
| last_status | text | Y |  |
| last_error | text | Y |  |
| last_event_count | int4 | **N** | `0` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_ical_sync_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| connection_id | uuid | **N** |  |
| listing_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| direction | text | **N** |  |
| status | text | **N** |  |
| events_parsed | int4 | **N** | `0` |
| days_blocked | int4 | **N** | `0` |
| conflicts | int4 | **N** | `0` |
| detail | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### booking_issues

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| booking_id | uuid | **N** |  |
| workspace_id | uuid | Y |  |
| category | text | **N** | `'other'::text` |
| severity | text | **N** | `'normal'::text` |
| subject | text | **N** |  |
| detail | text | Y |  |
| status | text | **N** | `'open'::text` |
| reported_by | text | **N** | `'guest'::text` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_keyless_locks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| provider | text | **N** | `'manual_code'::text` |
| device_ref | text | Y |  |
| instructions | text | Y |  |
| static_code | text | Y |  |
| active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_legal_acceptances

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| booking_id | uuid | **N** |  |
| workspace_id | uuid | Y |  |
| document_type | text | **N** |  |
| document_version | text | Y |  |
| accepted | bool | **N** | `true` |
| snapshot | jsonb | **N** | `'{}'::jsonb` |
| ip | text | Y |  |
| user_agent | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### booking_legal_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| slug | text | **N** |  |
| title | text | **N** |  |
| audience | text | **N** | `'guest'::text` |
| version | text | **N** |  |
| jurisdiction | text | **N** | `'GB'::text` |
| effective_from | date | **N** | `CURRENT_DATE` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_listing_amenities

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| amenity_key | text | **N** |  |
| amenity_group | text | Y |  |
| value | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| amenity_slug | text | Y |  |

### booking_listing_legal

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| house_rules_text | text | Y |  |
| safety_notes | text | Y |  |
| cancellation_tier | text | **N** | `'flexible'::text` |
| deposit_required | bool | **N** | `false` |
| deposit_amount_pence | int8 | Y |  |
| deposit_policy_text | text | Y |  |
| required_documents | jsonb | **N** | `'[]'::jsonb` |
| host_terms_version | text | Y |  |
| host_terms_accepted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_listing_photos

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| url | text | Y |  |
| r2_key | text | Y |  |
| caption | text | Y |  |
| room_tag | text | Y |  |
| sort_order | int4 | **N** | `0` |
| is_cover | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |

### booking_listings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| listing_type | text | **N** | `'entire_home'::text` |
| title | text | **N** | `'Untitled listing'::text` |
| slug | text | Y |  |
| summary | text | Y |  |
| description | text | Y |  |
| status | text | **N** | `'draft'::text` |
| booking_mode | text | **N** | `'request'::text` |
| max_guests | int4 | **N** | `2` |
| bedrooms | int4 | **N** | `1` |
| beds | int4 | **N** | `1` |
| bathrooms | numeric | **N** | `1` |
| amenities | jsonb | **N** | `'[]'::jsonb` |
| house_rules | jsonb | **N** | `'{}'::jsonb` |
| check_in_window | text | Y |  |
| checkout_time | text | Y |  |
| cancellation_policy_id | uuid | Y |  |
| cancellation_policy | text | **N** | `'flexible'::text` |
| deposit_policy_id | uuid | Y |  |
| pricing_profile_id | uuid | Y |  |
| availability_profile_id | uuid | Y |  |
| country_code | text | **N** | `'GB'::text` |
| currency | text | **N** | `'GBP'::text` |
| timezone | text | **N** | `'Europe/London'::text` |
| compliance_status | text | **N** | `'pending'::text` |
| marketplace_listing_id | uuid | Y |  |
| cover_photo_id | uuid | Y |  |
| published_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| accommodation_category | text | **N** | `'short_stay'::text` |
| let_type | text | **N** | `'entire'::text` |
| type_details | jsonb | **N** | `'{}'::jsonb` |

### booking_pages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| title | text | **N** |  |
| slug | text | **N** |  |
| description | text | Y |  |
| is_active | bool | Y | `true` |
| created_at | timestamptz | Y | `now()` |

### booking_price_rules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| pricing_profile_id | uuid | Y |  |
| name | text | **N** | `'Rule'::text` |
| rule_type | text | **N** | `'seasonal'::text` |
| date_from | date | Y |  |
| date_to | date | Y |  |
| days_before_min | int4 | Y |  |
| days_before_max | int4 | Y |  |
| nights_min | int4 | Y |  |
| nights_max | int4 | Y |  |
| adjust_kind | text | **N** | `'pct'::text` |
| adjust_value | numeric | **N** | `0` |
| priority | int4 | **N** | `100` |
| is_active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |

### booking_pricing_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| listing_id | uuid | Y |  |
| name | text | **N** | `'Standard pricing'::text` |
| currency | text | **N** | `'GBP'::text` |
| base_nightly_pence | int8 | **N** | `0` |
| weekend_pence | int8 | Y |  |
| weekly_discount_pct | numeric | **N** | `0` |
| monthly_discount_pct | numeric | **N** | `0` |
| min_nights | int4 | **N** | `1` |
| max_nights | int4 | Y |  |
| cleaning_fee_pence | int8 | **N** | `0` |
| extra_guest_fee_pence | int8 | **N** | `0` |
| extra_guest_after | int4 | **N** | `2` |
| security_deposit_pence | int8 | **N** | `0` |
| is_active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_requests

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| enquiry_id | uuid | Y |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| requester_name | text | **N** |  |
| requester_email | text | **N** |  |
| requester_phone | text | Y |  |
| requested_from | date | **N** |  |
| requested_to | date | Y |  |
| num_guests | int4 | Y | `1` |
| total_amount | numeric | Y |  |
| status | text | **N** | `'pending'::text` |
| approved_by | uuid | Y |  |
| approved_at | timestamptz | Y |  |
| notes | text | Y |  |
| gdpr_consent | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### booking_revenue_entries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| booking_id | uuid | Y |  |
| payment_id | uuid | Y |  |
| entry_type | text | **N** |  |
| amount_pence | int8 | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| journal_entry_id | uuid | Y |  |
| recognised_on | date | Y |  |
| memo | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### booking_reviews

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| booking_id | uuid | **N** |  |
| listing_id | uuid | Y |  |
| workspace_id | uuid | Y |  |
| rating | int4 | **N** |  |
| title | text | Y |  |
| body | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### bookings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | Y |  |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| guest_name | text | **N** |  |
| guest_email | text | **N** |  |
| guest_phone | text | Y |  |
| check_in | date | **N** |  |
| check_out | date | **N** |  |
| nights | int4 | **N** |  |
| guests_count | int4 | **N** | `1` |
| currency | text | **N** | `'GBP'::text` |
| subtotal_pence | int8 | **N** | `0` |
| fees_pence | int8 | **N** | `0` |
| total_pence | int8 | **N** | `0` |
| platform_fee_pence | int8 | **N** | `0` |
| status | text | **N** | `'hold'::text` |
| transaction_id | uuid | Y |  |
| hold_expires_at | timestamptz | Y |  |
| source | text | **N** | `'direct'::text` |
| session_token | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| customer_workspace_id | uuid | Y |  |
| booking_listing_id | uuid | Y |  |
| booking_ref | text | Y |  |
| deposit_pence | int8 | **N** | `0` |
| guests_breakdown | jsonb | **N** | `'{}'::jsonb` |
| arrival_time | text | Y |  |
| guest_message | text | Y |  |
| payment_status | text | **N** | `'unpaid'::text` |

### breach_incident_clocks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| country_code | text | Y |  |
| regime | text | Y |  |
| title | text | **N** |  |
| state | intl_breach_state _(enum: open/assessing/notified_authority/notified_subjects/closed/no_notification)_ | **N** | `'open'::intl_breach_state` |
| discovered_at | timestamptz | **N** | `now()` |
| notify_within_hours | int4 | Y |  |
| authority_due_at | timestamptz | Y |  |
| authority_notified_at | timestamptz | Y |  |
| subjects_notified_at | timestamptz | Y |  |
| severity | text | **N** | `'medium'::text` |
| description | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### bug_reports

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| user_id | uuid | Y |  |
| kind | text | **N** | `'error'::text` |
| route | text | Y |  |
| message | text | Y |  |
| digest | text | Y |  |
| context | jsonb | Y |  |
| user_agent | text | Y |  |
| status | text | **N** | `'new'::text` |
| created_at | timestamptz | **N** | `now()` |

### calendar_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| title | text | **N** |  |
| type | text | **N** | `'general'::text` |
| description | text | Y |  |
| property_id | uuid | Y |  |
| property_address | text | Y |  |
| start_date | date | **N** |  |
| start_time | time | Y |  |
| end_time | time | Y |  |
| all_day | bool | Y | `false` |
| priority | text | Y | `'medium'::text` |
| related_type | text | Y |  |
| related_id | uuid | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| event_type | text | **N** | `'event'::text` |
| start_at | timestamptz | Y |  |
| end_at | timestamptz | Y |  |
| attendees | jsonb | Y | `'[]'::jsonb` |
| recurrence_rule | text | Y |  |
| colour | text | Y |  |
| external_id | text | Y |  |
| metadata | jsonb | Y | `'{}'::jsonb` |
| archived_at | timestamptz | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### calendar_ical_tokens

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| label | text | **N** | `'Calendar feed'::text` |
| token_hash | text | **N** |  |
| scopes | jsonb | **N** | `'{"tasks": true, "schedules": true, "sup` |
| last_used_at | timestamptz | Y |  |
| revoked_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### calendar_reminders

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| event_id | uuid | Y |  |
| title | text | **N** |  |
| reminder_type | text | **N** | `'standard'::text` |
| channel | text | **N** | `'in_app'::text` |
| due_at | timestamptz | **N** |  |
| status | text | **N** | `'pending'::text` |
| sent_at | timestamptz | Y |  |
| error | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### calendar_settings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| default_view | text | **N** | `'month'::text` |
| timezone | text | **N** | `'Europe/London'::text` |
| working_hours_json | jsonb | **N** | `'{}'::jsonb` |
| default_reminder_offsets_json | jsonb | **N** | `'[]'::jsonb` |
| visible_layers_json | jsonb | **N** | `'{}'::jsonb` |
| ai_suggestions_enabled | bool | **N** | `true` |
| external_sync_enabled | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### changelog_entries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| version | text | Y |  |
| title | text | **N** |  |
| body_html | text | Y |  |
| category | text | Y |  |
| tags | _text | **N** | `'{}'::text[]` |
| published | bool | **N** | `false` |
| published_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### chat_channel_members

| column | type | null | default |
|---|---|---|---|
| channel_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| role | chat_member_role _(enum: member/admin)_ | **N** | `'member'::chat_member_role` |
| last_read_at | timestamptz | Y |  |
| muted | bool | **N** | `false` |
| joined_at | timestamptz | **N** | `now()` |

### chat_channels

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| slug | citext | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| is_private | bool | **N** | `false` |
| is_archived | bool | **N** | `false` |
| created_by | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### chat_direct_threads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_lo | uuid | **N** |  |
| user_hi | uuid | **N** |  |
| last_message_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| user_lo_last_read_at | timestamptz | **N** | `now()` |
| user_hi_last_read_at | timestamptz | **N** | `now()` |

### chat_message_attachments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| message_id | uuid | **N** |  |
| file_id | uuid | **N** |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### chat_message_audit

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| message_id | uuid | **N** |  |
| channel_id | uuid | Y |  |
| workspace_id | uuid | **N** |  |
| actor_user_id | uuid | **N** |  |
| action | text | **N** |  |
| before | jsonb | Y |  |
| after | jsonb | Y |  |
| reason | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### chat_messages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| channel_id | uuid | Y |  |
| parent_id | uuid | Y |  |
| user_id | uuid | **N** |  |
| body | text | **N** |  |
| attachments | jsonb | **N** | `'[]'::jsonb` |
| mentions | _uuid | **N** | `'{}'::uuid[]` |
| edited_at | timestamptz | Y |  |
| deleted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| direct_thread_id | uuid | Y |  |

### compliance_checklists

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| applies_to_template | property_template _(enum: standard_rental/hmo/r2r/sa_lite/student_let)_ | Y |  |
| kinds | _compliance_kind | **N** | `'{}'::compliance_kind[]` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### compliance_evidence

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| compliance_item_id | uuid | **N** |  |
| kind | evidence_kind _(enum: certificate/photo/invoice/report/other)_ | **N** |  |
| label | text | Y |  |
| file_id | uuid | Y |  |
| issued_on | date | Y |  |
| expires_on | date | Y |  |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### compliance_items

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| kind | compliance_kind _(enum: gas_safety/eicr/epc/pat/fire_alarm/emergency_lighting/legionella/hmo_licence/selective_licence/insurance/deposit_protection/right_to_rent/smoke_co_alarm/fire_door/other)_ | **N** |  |
| title | text | **N** |  |
| status | compliance_status _(enum: ok/due_soon/overdue/missing/exempt)_ | **N** | `'missing'::compliance_status` |
| due_date | date | Y |  |
| last_completed_at | date | Y |  |
| recurrence_months | int4 | Y |  |
| assignee_user_id | uuid | Y |  |
| vendor_contact_id | uuid | Y |  |
| cost | numeric | Y |  |
| reference_no | text | Y |  |
| notes | text | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### connect_payout_country_matrix

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| payout_supported | bool | **N** | `false` |
| manual_review | bool | **N** | `false` |
| notes | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### contact_activity

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | **N** |  |
| activity_type | text | **N** |  |
| title | text | **N** |  |
| description | text | Y |  |
| linked_type | text | Y |  |
| linked_id | uuid | Y |  |
| performed_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### contact_categories

| column | type | null | default |
|---|---|---|---|
| slug | text | **N** |  |
| label | text | **N** |  |
| parent_slug | text | Y |  |
| kind | text | **N** |  |
| sort | int4 | **N** | `0` |
| icon | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### contact_links

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | **N** |  |
| linked_type | text | **N** |  |
| linked_id | uuid | **N** |  |
| relationship_type | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### contact_notes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | **N** |  |
| content | text | **N** |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### contact_portal_access

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | **N** |  |
| access_type | text | **N** | `'supplier'::text` |
| linked_type | text | Y |  |
| linked_id | uuid | Y |  |
| status | text | **N** | `'created'::text` |
| purpose | text | Y |  |
| expires_at | timestamptz | Y |  |
| last_opened_at | timestamptz | Y |  |
| token_hash | text | Y |  |
| email_sent_at | timestamptz | Y |  |
| revoked_at | timestamptz | Y |  |
| revoked_by | uuid | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### contact_requests

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| name | text | **N** |  |
| email | text | **N** |  |
| message | text | **N** |  |
| source | text | **N** | `'contact_form'::text` |
| status | text | **N** | `'new'::text` |
| ip_hash | text | Y |  |
| user_agent | text | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### contacts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| type | contact_type _(enum: tenant/guarantor/supplier/owner/agent/accountant/other)_ | **N** |  |
| display_name | text | **N** |  |
| company | text | Y |  |
| email | citext | Y |  |
| phone | text | Y |  |
| address | text | Y |  |
| notes | text | Y |  |
| tags | _text | **N** | `'{}'::text[]` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| search_tsv | tsvector | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |
| category | text | Y |  |
| subcategory | text | Y |  |
| website | text | Y |  |
| vat_number | text | Y |  |
| companies_house_number | text | Y |  |
| avatar_file_id | uuid | Y |  |
| is_business | bool | **N** | `false` |
| business_name | text | Y |  |
| roles | _app_contact_role | **N** | `ARRAY[]::app_contact_role[]` |
| category_slug | text | Y |  |
| subcategory_slug | text | Y |  |
| lat | numeric | Y |  |
| lng | numeric | Y |  |
| service_radius_km | numeric | Y |  |
| service_hours | jsonb | Y |  |
| hourly_rate_pence | int4 | Y |  |
| callout_pence | int4 | Y |  |
| sla_hours | int4 | Y |  |
| payment_terms_days | int4 | Y |  |
| rating | numeric | Y |  |
| availability_status | text | Y |  |
| demo | bool | **N** | `false` |
| address_line1 | text | Y |  |
| city | text | Y |  |
| postcode | text | Y |  |
| avatar_url | text | Y |  |
| status | text | Y | `'active'::text` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### cookie_consent_log

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| client_id | text | Y |  |
| user_id | uuid | Y |  |
| policy_version | int4 | **N** | `1` |
| necessary | bool | **N** | `true` |
| analytics | bool | **N** | `false` |
| marketing | bool | **N** | `false` |
| ip | text | Y |  |
| user_agent | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### country_consumer_rules

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| b2c_withdrawal_days | int4 | Y |  |
| withdrawal_button_required | bool | **N** | `false` |
| auto_renewal_disclosure | bool | **N** | `false` |
| cooling_off_applies | bool | **N** | `false` |
| distance_selling_regime | text | Y |  |
| notes | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### country_invoice_rules

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| required_fields | jsonb | **N** | `'[]'::jsonb` |
| sequential_numbering | bool | **N** | `false` |
| tax_breakdown_required | bool | **N** | `true` |
| supplier_tax_id_required | bool | **N** | `false` |
| buyer_tax_id_required | bool | **N** | `false` |
| legal_footer | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### country_pack_audit_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | Y |  |
| actor_user_id | uuid | Y |  |
| action | text | **N** |  |
| detail | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### country_pack_reviews

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | **N** |  |
| domain | text | **N** |  |
| verdict | text | **N** | `'pending'::text` |
| reviewer | uuid | Y |  |
| reviewer_name | text | Y |  |
| reviewed_at | timestamptz | Y |  |
| evidence_url | text | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### country_pack_versions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | **N** |  |
| version | int4 | **N** |  |
| snapshot | jsonb | **N** | `'{}'::jsonb` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### country_packs

| column | type | null | default |
|---|---|---|---|
| code | text | **N** |  |
| name | text | **N** |  |
| default_currency | text | **N** | `'GBP'::text` |
| default_locale | text | **N** | `'en-GB'::text` |
| measurement_system | text | **N** | `'metric'::text` |
| address_model | text | **N** | `'generic'::text` |
| offer_status | text | **N** | `'restricted'::text` |
| legal_status | text | **N** | `'disabled'::text` |
| tax_status | text | **N** | `'disabled'::text` |
| privacy_status | text | **N** | `'disabled'::text` |
| payment_status | text | **N** | `'disabled'::text` |
| support_status | text | **N** | `'disabled'::text` |
| property_features_status | text | **N** | `'disabled'::text` |
| compliance_modules | jsonb | **N** | `'{}'::jsonb` |
| tax_config | jsonb | **N** | `'{}'::jsonb` |
| privacy_config | jsonb | **N** | `'{}'::jsonb` |
| invoice_fields | jsonb | **N** | `'{}'::jsonb` |
| disclaimers | jsonb | **N** | `'{}'::jsonb` |
| representative_required | bool | **N** | `false` |
| dpo_required | bool | **N** | `false` |
| reviewed_by | uuid | Y |  |
| reviewed_at | timestamptz | Y |  |
| version | int4 | **N** | `1` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| currency_code | text | Y |  |
| currency_symbol | text | Y |  |
| locale_default | text | Y |  |
| date_format | text | Y |  |
| address_format | jsonb | **N** | `'{}'::jsonb` |
| tax_system | text | Y |  |
| standard_tax_rate | numeric | Y |  |
| tax_label | text | Y |  |
| legal_framework | jsonb | **N** | `'{}'::jsonb` |
| right_to_rent_regime | text | Y |  |

### country_privacy_profiles

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| regime | text | **N** | `'research_only'::text` |
| dsar_response_days | int4 | Y |  |
| breach_notify_hours | int4 | Y |  |
| consent_model | text | **N** | `'mixed'::text` |
| representative_required | bool | **N** | `false` |
| dpo_required | bool | **N** | `false` |
| transfer_mechanism | text | **N** | `'none'::text` |
| lawful_bases | jsonb | **N** | `'[]'::jsonb` |
| status | intl_pack_status _(enum: disabled/generic_only/research_only/beta/reviewed/enabled)_ | **N** | `'research_only'::intl_pack_status` |
| notes | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### country_profiles

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| display_name | text | **N** |  |
| default_locale | text | **N** | `'en-GB'::text` |
| default_currency | text | **N** | `'GBP'::text` |
| supported_locales | jsonb | **N** | `'["en-GB"]'::jsonb` |
| measurement_system | text | **N** | `'metric'::text` |
| area_unit | text | **N** | `'sqm'::text` |
| date_format | text | **N** | `'dd/MM/yyyy'::text` |
| number_format | text | **N** | `'en-GB'::text` |
| phone_country_code | text | Y |  |
| address_model_id | text | Y |  |
| offer_status | intl_offer_status _(enum: offer/restricted/banned/unknown)_ | **N** | `'restricted'::intl_offer_status` |
| stripe_billing_supported | bool | **N** | `false` |
| connect_payout_supported | bool | **N** | `false` |
| offer_pack_status | intl_pack_status _(enum: disabled/generic_only/research_only/beta/reviewed/enabled)_ | **N** | `'research_only'::intl_pack_status` |
| property_features_status | intl_pack_status _(enum: disabled/generic_only/research_only/beta/reviewed/enabled)_ | **N** | `'research_only'::intl_pack_status` |
| legal_status | intl_pack_status _(enum: disabled/generic_only/research_only/beta/reviewed/enabled)_ | **N** | `'research_only'::intl_pack_status` |
| tax_status | intl_pack_status _(enum: disabled/generic_only/research_only/beta/reviewed/enabled)_ | **N** | `'research_only'::intl_pack_status` |
| privacy_status | intl_pack_status _(enum: disabled/generic_only/research_only/beta/reviewed/enabled)_ | **N** | `'research_only'::intl_pack_status` |
| consumer_status | intl_pack_status _(enum: disabled/generic_only/research_only/beta/reviewed/enabled)_ | **N** | `'research_only'::intl_pack_status` |
| tax_scheme | intl_tax_scheme _(enum: vat/vat_oss/gst/sales_tax/consumption_tax/none)_ | **N** | `'none'::intl_tax_scheme` |
| tax_name | text | **N** | `'Tax'::text` |
| standard_tax_rate | numeric | Y |  |
| tax_id_label | text | Y |  |
| tax_id_regex | text | Y |  |
| b2b_reverse_charge | bool | **N** | `false` |
| privacy_regime | text | **N** | `'research_only'::text` |
| dsar_response_days | int4 | Y |  |
| breach_notify_hours | int4 | Y |  |
| consent_model | text | **N** | `'mixed'::text` |
| representative_required | bool | **N** | `false` |
| dpo_required | bool | **N** | `false` |
| transfer_mechanism | text | **N** | `'none'::text` |
| b2c_withdrawal_days | int4 | Y |  |
| withdrawal_button_required | bool | **N** | `false` |
| auto_renewal_disclosure | bool | **N** | `false` |
| requires_local_review | bool | **N** | `true` |
| legal_disclaimer | text | **N** | `''::text` |
| notes | text | Y |  |
| reviewed_by | uuid | Y |  |
| reviewed_at | timestamptz | Y |  |
| version | int4 | **N** | `1` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### country_regions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | **N** |  |
| code | text | **N** |  |
| name | text | **N** |  |
| region_type | text | Y |  |
| sort_order | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |

### country_release_gates

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| state | intl_release_state _(enum: locked/in_review/staged/enabled/suspended)_ | **N** | `'locked'::intl_release_state` |
| required_reviews | jsonb | **N** | `'["legal", "tax", "privacy", "sanctions"` |
| enabled_at | timestamptz | Y |  |
| enabled_by | uuid | Y |  |
| suspended_reason | text | Y |  |
| notes | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### country_representatives

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | **N** |  |
| rep_type | text | **N** | `'eu_representative'::text` |
| name | text | Y |  |
| organisation | text | Y |  |
| email | text | Y |  |
| phone | text | Y |  |
| address | text | Y |  |
| appointed_at | date | Y |  |
| status | text | **N** | `'not_appointed'::text` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### country_tax_profiles

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| scheme | intl_tax_scheme _(enum: vat/vat_oss/gst/sales_tax/consumption_tax/none)_ | **N** | `'none'::intl_tax_scheme` |
| tax_name | text | **N** | `'Tax'::text` |
| standard_rate | numeric | Y |  |
| reduced_rates | jsonb | **N** | `'[]'::jsonb` |
| registration_threshold | numeric | Y |  |
| tax_id_label | text | Y |  |
| tax_id_regex | text | Y |  |
| b2b_reverse_charge | bool | **N** | `false` |
| oss_eligible | bool | **N** | `false` |
| status | intl_pack_status _(enum: disabled/generic_only/research_only/beta/reviewed/enabled)_ | **N** | `'research_only'::intl_pack_status` |
| notes | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### country_tax_rates

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | **N** |  |
| region_code | text | Y |  |
| rate_name | text | **N** |  |
| rate | numeric | **N** |  |
| applies_to | text | **N** | `'standard'::text` |
| valid_from | date | Y |  |
| valid_to | date | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### country_tax_rules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | **N** |  |
| tax_type | text | **N** |  |
| name | text | **N** |  |
| rate | numeric | **N** |  |
| applies_to | text | **N** | `'standard'::text` |
| valid_from | date | Y |  |
| valid_to | date | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### customer_message_threads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| customer_workspace_id | uuid | **N** |  |
| host_workspace_id | uuid | Y |  |
| booking_id | uuid | Y |  |
| subject | text | Y |  |
| last_message | text | Y |  |
| last_sender | text | Y |  |
| last_message_at | timestamptz | Y |  |
| unread_for_customer | int4 | **N** | `0` |
| archived | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### customer_messages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| thread_id | uuid | **N** |  |
| customer_workspace_id | uuid | **N** |  |
| sender_role | text | **N** | `'customer'::text` |
| sender_id | uuid | Y |  |
| sender_name | text | Y |  |
| body | text | **N** |  |
| read_by_customer | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |

### customer_notifications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| customer_workspace_id | uuid | **N** |  |
| user_id | uuid | Y |  |
| kind | text | **N** | `'general'::text` |
| title | text | **N** |  |
| body | text | Y |  |
| href | text | Y |  |
| severity | text | **N** | `'info'::text` |
| entity_type | text | Y |  |
| entity_id | uuid | Y |  |
| read_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### customer_profiles

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| display_name | text | Y |  |
| email | text | Y |  |
| phone | text | Y |  |
| preferences | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### customer_saved_listings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| listing_id | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |

### customer_saved_searches

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| customer_workspace_id | uuid | **N** |  |
| label | text | **N** |  |
| query | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### customer_workspace_members

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| role | text | **N** | `'member'::text` |
| created_at | timestamptz | **N** | `now()` |

### data_export_requests

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| user_id | uuid | **N** |  |
| workspace_id | uuid | Y |  |
| status | text | **N** | `'pending'::text` |
| requested_at | timestamptz | **N** | `now()` |
| ready_at | timestamptz | Y |  |
| expires_at | timestamptz | Y |  |
| download_key | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### data_transfer_mechanisms

| column | type | null | default |
|---|---|---|---|
| id | text | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| regimes | jsonb | **N** | `'[]'::jsonb` |
| status | text | **N** | `'active'::text` |
| updated_at | timestamptz | **N** | `now()` |

### debt_snapshots

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| lender_name | text | Y |  |
| loan_type | text | Y | `'mortgage'::text` |
| current_balance | numeric | Y | `0` |
| monthly_payment | numeric | Y | `0` |
| interest_rate | numeric | Y | `0` |
| rate_type | text | Y | `'fixed'::text` |
| fixed_rate_end_date | date | Y |  |
| estimated_property_value | numeric | Y |  |
| estimated_ltv | numeric | Y |  |
| next_review_date | date | Y |  |
| status | text | **N** | `'active'::text` |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### deposits

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| deposit_type | text | **N** | `'tenant_deposit'::text` |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| planning_set_id | uuid | Y |  |
| amount | numeric | Y | `0` |
| currency | text | **N** | `'GBP'::text` |
| status | text | **N** | `'expected'::text` |
| received_date | date | Y |  |
| due_date | date | Y |  |
| protection_scheme | text | Y |  |
| reference_number | text | Y |  |
| held_by | text | Y |  |
| return_due_date | date | Y |  |
| document_id | uuid | Y |  |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### dispute_actions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| dispute_id | uuid | **N** |  |
| action | text | **N** |  |
| actor_id | uuid | Y |  |
| actor_role | text | Y |  |
| amount_pence | int8 | **N** | `0` |
| detail | text | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### document_templates

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| slug | text | **N** |  |
| jurisdiction | text | Y |  |
| category | text | **N** | `'general'::text` |
| body_html | text | **N** | `''::text` |
| merge_fields | jsonb | **N** | `'[]'::jsonb` |
| status | text | **N** | `'draft'::text` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| deleted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| name | text | **N** |  |
| type | text | Y |  |
| category | text | Y |  |
| mime_type | text | Y |  |
| size_bytes | int8 | Y |  |
| r2_key | text | **N** |  |
| r2_bucket | text | **N** | `'propvora-documents'::text` |
| url | text | Y |  |
| checksum | text | Y |  |
| expires_at | date | Y |  |
| status | text | **N** | `'active'::text` |
| tags | _text | Y | `'{}'::text[]` |
| metadata | jsonb | Y | `'{}'::jsonb` |
| archived_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### edge_rate_limit

| column | type | null | default |
|---|---|---|---|
| bucket | text | **N** |  |
| key | text | **N** |  |
| window_start | timestamptz | **N** |  |
| hits | int4 | **N** | `0` |

### email_account_grant_audit

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| account_id | uuid | **N** |  |
| actor_user_id | uuid | Y |  |
| target_user_id | uuid | **N** |  |
| action | text | **N** |  |
| old_role | text | Y |  |
| new_role | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### email_account_grants

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| account_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| role | text | **N** |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### email_accounts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| provider | text | **N** |  |
| account_email | citext | **N** |  |
| display_name | text | Y |  |
| status | text | **N** | `'pending'::text` |
| tokens_encrypted | bytea | Y |  |
| sync_state | jsonb | **N** | `'{}'::jsonb` |
| last_sync_at | timestamptz | Y |  |
| last_error | text | Y |  |
| created_by | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### email_attachment_downloads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| attachment_id | uuid | **N** |  |
| account_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| ip | text | Y |  |
| user_agent | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### email_attachments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| message_id | uuid | **N** |  |
| account_id | uuid | **N** |  |
| filename | text | **N** |  |
| mime | text | Y |  |
| size_bytes | int8 | Y |  |
| storage_key | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### email_messages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| thread_id | uuid | **N** |  |
| account_id | uuid | **N** |  |
| remote_message_id | text | **N** |  |
| direction | text | **N** |  |
| from_addr | citext | Y |  |
| to_addrs | _citext | **N** | `'{}'::citext[]` |
| cc_addrs | _citext | **N** | `'{}'::citext[]` |
| bcc_addrs | _citext | **N** | `'{}'::citext[]` |
| subject | text | Y |  |
| body_html | text | Y |  |
| body_text | text | Y |  |
| raw_headers | jsonb | Y |  |
| sent_at | timestamptz | Y |  |
| received_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### email_outbox

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| to_email | citext | **N** |  |
| to_name | text | Y |  |
| from_email | citext | Y |  |
| from_name | text | Y |  |
| reply_to | citext | Y |  |
| subject | text | **N** |  |
| html | text | Y |  |
| text_body | text | Y |  |
| template_key | text | Y |  |
| template_data | jsonb | **N** | `'{}'::jsonb` |
| status | email_outbox_status _(enum: queued/sending/sent/failed/cancelled)_ | **N** | `'queued'::email_outbox_status` |
| provider_message_id | text | Y |  |
| error | text | Y |  |
| scheduled_for | timestamptz | **N** | `now()` |
| sent_at | timestamptz | Y |  |
| attempts | int4 | **N** | `0` |
| linked_kind | text | Y |  |
| linked_id | uuid | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### email_send_audit

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| account_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| message_id | uuid | Y |  |
| to_addrs | _citext | **N** | `'{}'::citext[]` |
| subject | text | Y |  |
| status | text | **N** |  |
| error | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### email_threads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| account_id | uuid | **N** |  |
| remote_thread_id | text | **N** |  |
| subject | text | Y |  |
| snippet | text | Y |  |
| participants | _citext | **N** | `'{}'::citext[]` |
| labels | _text | **N** | `'{}'::text[]` |
| folder | text | **N** | `'inbox'::text` |
| unread_count | int4 | **N** | `0` |
| message_count | int4 | **N** | `0` |
| last_message_at | timestamptz | Y |  |
| linked_entity | jsonb | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### entitlement_overrides

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| feature_key | text | **N** |  |
| is_enabled | bool | **N** | `true` |
| reason | text | Y |  |
| expires_at | timestamptz | Y |  |
| set_by | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |

### escrow_disputes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| order_id | uuid | **N** |  |
| raised_by | uuid | Y |  |
| reason | text | **N** |  |
| description | text | Y |  |
| status | text | **N** | `'open'::text` |
| resolution | text | Y |  |
| resolved_at | timestamptz | Y |  |
| created_at | timestamptz | Y | `now()` |
| escrow_order_id | uuid | Y |  |
| opened_by | uuid | Y |  |
| resolution_notes | text | Y |  |
| resolved_by | uuid | Y |  |
| updated_at | timestamptz | **N** | `now()` |
| workspace_id | uuid | Y |  |
| evidence_r2_keys | _text | Y | `'{}'::text[]` |

### escrow_evidence

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| escrow_order_id | uuid | **N** |  |
| milestone_id | uuid | Y |  |
| file_id | uuid | Y |  |
| uploader_id | uuid | **N** |  |
| evidence_type | text | **N** | `'completion'::text` |
| description | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### escrow_holds

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| payment_id | uuid | **N** |  |
| amount_pence | int8 | **N** |  |
| status | text | **N** | `'held'::text` |
| release_condition | text | Y |  |
| released_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| hold_type | text | **N** | `'payment'::text` |
| workspace_id | uuid | Y |  |
| booking_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| deposit_id | uuid | Y |  |
| reason | text | Y |  |
| deducted_pence | int8 | **N** | `0` |

### escrow_ledger_entries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| escrow_order_id | uuid | **N** |  |
| entry_type | text | **N** |  |
| amount | numeric | **N** |  |
| description | text | Y |  |
| reference | text | Y |  |
| actor_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### escrow_milestones

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| order_id | uuid | **N** |  |
| title | text | **N** |  |
| description | text | Y |  |
| amount | numeric | **N** |  |
| status | text | **N** | `'pending'::text` |
| due_date | date | Y |  |
| completed_at | timestamptz | Y |  |
| released_at | timestamptz | Y |  |
| sort_order | int4 | Y | `0` |
| escrow_order_id | uuid | Y |  |
| submitted_at | timestamptz | Y |  |
| approved_at | timestamptz | Y |  |
| approved_by | uuid | Y |  |
| updated_at | timestamptz | **N** | `now()` |
| workspace_id | uuid | Y |  |
| position | int4 | **N** | `0` |
| evidence_r2_keys | _text | Y | `'{}'::text[]` |
| notes | text | Y |  |

### escrow_orders

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| marketplace_order_id | uuid | Y |  |
| supplier_id | uuid | Y |  |
| property_id | uuid | Y |  |
| title | text | **N** |  |
| total_amount | numeric | **N** |  |
| held_amount | numeric | Y | `0` |
| released_amount | numeric | Y | `0` |
| status | text | **N** | `'pending'::text` |
| terms | text | Y |  |
| stripe_payment_intent_id | text | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| escrow_ref | text | Y |  |
| amount_held | numeric | **N** | `0` |
| currency | text | **N** | `'GBP'::text` |
| held_at | timestamptz | Y |  |
| released_at | timestamptz | Y |  |
| notes | text | Y |  |

### escrow_payments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| transaction_id | uuid | Y |  |
| booking_id | uuid | Y |  |
| payer_email | text | Y |  |
| amount_pence | int8 | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| platform_fee_pence | int8 | **N** | `0` |
| stripe_payment_intent_id | text | Y |  |
| capture_method | text | **N** | `'manual'::text` |
| status | text | **N** | `'requires_payment'::text` |
| escrow | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| payment_model | text | **N** | `'platform_hold'::text` |
| flow | text | Y |  |
| refundable_until | timestamptz | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |

### expense_records

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| job_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| category | text | **N** | `'maintenance'::text` |
| description | text | Y |  |
| amount | numeric | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| date | date | **N** |  |
| status | text | **N** | `'paid'::text` |
| reference | text | Y |  |
| receipt_url | text | Y |  |
| notes | text | Y |  |
| is_demo | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### feature_flag_audit

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| flag_key | text | **N** |  |
| flag_id | uuid | Y |  |
| changed_by | uuid | **N** |  |
| before_enabled | bool | Y |  |
| after_enabled | bool | Y |  |
| before_rollout | int4 | Y |  |
| after_rollout | int4 | Y |  |
| before_audience | text | Y |  |
| after_audience | text | Y |  |
| reason | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### feature_flags

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| key | text | **N** |  |
| label | text | **N** |  |
| description | text | Y |  |
| default_enabled | bool | **N** | `false` |
| audience | text | **N** | `'all'::text` |
| rollout_percent | int4 | **N** | `100` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |

### fee_rule_audit

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| fee_rule_id | uuid | Y |  |
| action | text | **N** |  |
| actor_id | uuid | Y |  |
| before | jsonb | Y |  |
| after | jsonb | Y |  |
| created_at | timestamptz | **N** | `now()` |

### file_activity

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| file_id | uuid | Y |  |
| user_id | uuid | Y |  |
| event | text | **N** |  |
| meta | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### file_grants

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| file_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| role | file_grant_role _(enum: viewer/editor/owner)_ | **N** | `'viewer'::file_grant_role` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### file_tag_links

| column | type | null | default |
|---|---|---|---|
| file_id | uuid | **N** |  |
| tag_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### file_tags

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| slug | text | **N** |  |
| color | text | **N** | `'slate'::text` |
| description | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### file_versions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| file_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| version | int4 | **N** |  |
| bucket | text | **N** |  |
| object_key | text | **N** |  |
| filename | text | **N** |  |
| mime_type | text | Y |  |
| size_bytes | int8 | Y |  |
| sha256 | text | Y |  |
| note | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### files

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| kind | file_kind _(enum: image/document/evidence/invoice/report/other)_ | **N** | `'document'::file_kind` |
| status | file_status _(enum: pending/ready/failed/deleted)_ | **N** | `'pending'::file_status` |
| label | text | Y |  |
| filename | text | **N** |  |
| mime_type | text | **N** |  |
| size_bytes | int8 | Y |  |
| sha256 | text | Y |  |
| bucket | text | **N** |  |
| object_key | text | **N** |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| compliance_item_id | uuid | Y |  |
| supplier_job_id | uuid | Y |  |
| money_transaction_id | uuid | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |
| sort_order | int4 | **N** | `0` |
| is_cover | bool | **N** | `false` |
| alt_text | text | Y |  |
| task_id | uuid | Y |  |

### fx_rates

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| base_currency | text | **N** |  |
| quote_currency | text | **N** |  |
| rate_micros | int8 | **N** |  |
| as_of | date | **N** | `CURRENT_DATE` |
| source | text | **N** | `'manual'::text` |
| workspace_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### generated_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| template_id | uuid | **N** |  |
| file_id | uuid | Y |  |
| merge_data | jsonb | **N** | `'{}'::jsonb` |
| property_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### guided_help_state

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| user_id | uuid | **N** |  |
| workspace_id | uuid | Y |  |
| key | text | **N** |  |
| status | text | **N** | `'seen'::text` |
| snoozed_until | timestamptz | Y |  |
| updated_at | timestamptz | **N** | `now()` |
| created_at | timestamptz | **N** | `now()` |

### hmo_licences

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | **N** |  |
| licence_type | text | **N** | `'mandatory'::text` |
| licence_number | text | Y |  |
| issuing_council | text | Y |  |
| issue_date | date | Y |  |
| expiry_date | date | **N** |  |
| max_occupants | int4 | Y |  |
| max_households | int4 | Y |  |
| conditions | jsonb | **N** | `'[]'::jsonb` |
| document_path | text | Y |  |
| status | text | **N** | `'active'::text` |
| renewal_reminder_days | int4 | **N** | `90` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| arrangement_type | text | **N** | `'standard'::text` |
| occupancy_current | int4 | Y |  |
| r2r_agreement_end | date | Y |  |

### hold_ledger_entries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| hold_id | uuid | Y |  |
| deposit_id | uuid | Y |  |
| booking_id | uuid | Y |  |
| entry_type | text | **N** |  |
| amount_pence | int8 | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| journal_entry_id | uuid | Y |  |
| memo | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### identity_verifications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| subject_type | text | **N** |  |
| subject_id | uuid | **N** |  |
| workspace_id | uuid | Y |  |
| kind | text | **N** | `'individual'::text` |
| provider | text | **N** | `'stripe_identity'::text` |
| provider_ref | text | Y |  |
| status | text | **N** | `'not_started'::text` |
| risk_level | text | Y |  |
| verified_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### insight_snapshots

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| insight_id | uuid | Y |  |
| taken_at | timestamptz | **N** | `now()` |
| period_from | date | Y |  |
| period_to | date | Y |  |
| payload | jsonb | **N** |  |
| file_id | uuid | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### intl_translation_keys

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| namespace_id | text | **N** |  |
| key | text | **N** |  |
| source_text | text | **N** | `''::text` |
| description | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### intl_translation_namespaces

| column | type | null | default |
|---|---|---|---|
| id | text | **N** |  |
| description | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### intl_translation_strings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| key_id | uuid | **N** |  |
| locale | text | **N** |  |
| value | text | **N** | `''::text` |
| status | text | **N** | `'untranslated'::text` |
| updated_by | uuid | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### invites

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| token_hash | text | **N** |  |
| email_lower | text | **N** |  |
| recipient_name | text | Y |  |
| role | app_role _(enum: owner/admin/manager/member/accountant)_ | **N** | `'member'::app_role` |
| max_uses | int4 | Y |  |
| use_count | int4 | **N** | `0` |
| expires_at | timestamptz | Y |  |
| accepted_at | timestamptz | Y |  |
| accepted_by | uuid | Y |  |
| revoked_at | timestamptz | Y |  |
| invited_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### invoice_lines

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| invoice_id | uuid | **N** |  |
| description | text | **N** | `''::text` |
| quantity | numeric | Y | `1` |
| unit_price | numeric | Y | `0` |
| tax_rate | numeric | Y | `0` |
| line_total | numeric | Y | `0` |
| sort_order | int4 | Y | `0` |
| created_at | timestamptz | Y | `now()` |

### invoices

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| invoice_number | text | Y |  |
| contact_id | uuid | Y |  |
| property_id | uuid | Y |  |
| job_id | uuid | Y |  |
| invoice_type | text | **N** | `'outbound'::text` |
| issue_date | date | **N** | `CURRENT_DATE` |
| due_date | date | Y |  |
| subtotal | numeric | **N** | `0` |
| tax_amount | numeric | **N** | `0` |
| total | numeric | **N** | `0` |
| currency | text | **N** | `'GBP'::text` |
| status | text | **N** | `'draft'::text` |
| paid_at | timestamptz | Y |  |
| paid_amount | numeric | Y |  |
| notes | text | Y |  |
| is_demo | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |
| country_code | text | Y |  |
| tax_scheme | text | Y |  |
| tax_id | text | Y |  |

### job_complaints

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| job_id | uuid | **N** |  |
| tenant_contact_id | uuid | Y |  |
| category | text | Y |  |
| description | text | **N** |  |
| severity | text | **N** | `'medium'::text` |
| status | text | **N** | `'open'::text` |
| resolution_notes | text | Y |  |
| resolved_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### job_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| job_id | uuid | Y |  |
| name | text | **N** |  |
| file_url | text | **N** |  |
| file_type | text | Y |  |
| file_size | int8 | Y |  |
| category | text | Y |  |
| uploaded_by | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### job_links

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_job_id | uuid | **N** |  |
| linked_kind | text | **N** |  |
| linked_id | uuid | **N** |  |
| relation | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### job_schedules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| kind | text | **N** |  |
| title | text | **N** |  |
| description | text | Y |  |
| rrule | text | **N** |  |
| dtstart | timestamptz | **N** | `now()` |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| supplier_contact_id | uuid | Y |  |
| default_duration_min | int4 | Y | `60` |
| default_priority | text | Y | `'med'::text` |
| lead_time_days | int4 | **N** | `1` |
| auto_approve_under_pence | int4 | Y |  |
| next_run_at | timestamptz | Y |  |
| last_run_at | timestamptz | Y |  |
| active | bool | **N** | `true` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### jobs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| title | text | **N** |  |
| description | text | Y |  |
| status | text | **N** | `'new'::text` |
| priority | text | **N** | `'medium'::text` |
| category | text | Y |  |
| property_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| supplier_contact_id | uuid | Y |  |
| assigned_to | uuid | Y |  |
| scheduled_date | date | Y |  |
| completed_date | date | Y |  |
| quoted_amount | numeric | Y |  |
| approved_amount | numeric | Y |  |
| invoiced_amount | numeric | Y |  |
| reference | text | Y |  |
| notes | text | Y |  |
| is_demo | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### jurisdiction_profiles

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| display_name | text | **N** |  |
| supported | bool | **N** | `false` |
| status | text | **N** | `'research_only'::text` |
| notes | jsonb | **N** | `'{}'::jsonb` |
| updated_at | timestamptz | **N** | `now()` |

### ledger_accounts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| code | text | **N** |  |
| name | text | **N** |  |
| type | text | **N** |  |
| normal_side | text | **N** |  |
| parent_id | uuid | Y |  |
| description | text | Y |  |
| is_system | bool | **N** | `false` |
| archived | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ledger_journal_entries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| entry_no | int8 | **N** |  |
| date | date | **N** | `CURRENT_DATE` |
| memo | text | Y |  |
| source_type | text | Y |  |
| source_id | uuid | Y |  |
| posted | bool | **N** | `false` |
| posted_at | timestamptz | Y |  |
| reversed_of | uuid | Y |  |
| reversed_by | uuid | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ledger_journal_lines

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| entry_id | uuid | **N** |  |
| account_id | uuid | **N** |  |
| debit_pence | int8 | **N** | `0` |
| credit_pence | int8 | **N** | `0` |
| memo | text | Y |  |
| property_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### legal_acceptances

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| user_id | uuid | **N** |  |
| document_type | text | **N** |  |
| document_version | text | **N** |  |
| context | text | **N** | `'signup'::text` |
| ip | text | Y |  |
| user_agent | text | Y |  |
| accepted_at | timestamptz | **N** | `now()` |
| created_at | timestamptz | **N** | `now()` |

### logistics_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| plan_id | uuid | Y |  |
| event_type | text | **N** | `'other'::text` |
| title | text | **N** |  |
| scheduled_at | timestamptz | Y |  |
| completed_at | timestamptz | Y |  |
| supplier_id | uuid | Y |  |
| cost | numeric | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### mail_oauth_states

| column | type | null | default |
|---|---|---|---|
| state | text | **N** |  |
| user_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| provider | text | **N** |  |
| return_to | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### marketplace_admin_roles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| role | text | **N** | `'marketplace_admin'::text` |
| created_at | timestamptz | **N** | `now()` |

### marketplace_categories

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| slug | text | **N** |  |
| label | text | **N** |  |
| parent_slug | text | Y |  |
| transaction_type | text | Y |  |
| sort_order | int4 | **N** | `0` |

### marketplace_commission_ledger

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| transaction_id | uuid | **N** |  |
| entry_type | text | **N** |  |
| amount_pence | int8 | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| created_at | timestamptz | **N** | `now()` |

### marketplace_disputes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| transaction_id | uuid | Y |  |
| raised_by_workspace_id | uuid | **N** |  |
| against_workspace_id | uuid | Y |  |
| reason | text | Y |  |
| detail | text | Y |  |
| status | text | **N** | `'open'::text` |
| resolution | text | Y |  |
| assigned_admin | uuid | Y |  |
| resolved_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| dispute_type | text | **N** | `'marketplace'::text` |
| booking_id | uuid | Y |  |
| supplier_assignment_id | uuid | Y |  |
| payment_id | uuid | Y |  |
| amount_disputed_pence | int8 | **N** | `0` |
| amount_refunded_pence | int8 | **N** | `0` |
| payout_held | bool | **N** | `false` |
| priority | text | **N** | `'normal'::text` |
| evidence_requested_at | timestamptz | Y |  |
| workspace_id | uuid | Y |  |

### marketplace_enquiries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| buyer_workspace_id | uuid | Y |  |
| buyer_user_id | uuid | Y |  |
| buyer_name | text | **N** |  |
| buyer_email | text | **N** |  |
| buyer_phone | text | Y |  |
| message | text | Y |  |
| status | text | **N** | `'new'::text` |
| is_spam | bool | **N** | `false` |
| gdpr_consent | bool | **N** | `false` |
| ip_address | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### marketplace_fee_rules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | Y |  |
| transaction_type | text | Y |  |
| plan_tier | text | Y |  |
| category | text | Y |  |
| fee_percent | numeric | **N** | `2.5` |
| minimum_fee_pence | int4 | Y |  |
| maximum_fee_pence | int4 | Y |  |
| provider_fee_pass_through | bool | **N** | `true` |
| tax_inclusive | bool | **N** | `false` |
| active | bool | **N** | `true` |
| priority | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### marketplace_legal_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| slug | text | **N** |  |
| title | text | **N** |  |
| version | text | **N** |  |
| jurisdiction | text | **N** | `'GB'::text` |
| effective_from | date | **N** | `CURRENT_DATE` |
| body_ref | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### marketplace_listing_availability

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| starts_on | date | Y |  |
| ends_on | date | Y |  |
| rule | jsonb | Y |  |
| is_blocked | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |

### marketplace_listing_categories

| column | type | null | default |
|---|---|---|---|
| listing_id | uuid | **N** |  |
| category_slug | text | **N** |  |
| created_at | timestamptz | **N** | `now()` |

### marketplace_listing_media

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| r2_key | text | Y |  |
| url | text | Y |  |
| kind | text | Y |  |
| sort_order | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |

### marketplace_listing_pricing

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| rule_type | text | Y |  |
| amount_pence | int8 | Y |  |
| min_nights | int4 | Y |  |
| conditions | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### marketplace_listings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| company_name | text | **N** |  |
| trades | _text | Y | `'{}'::text[]` |
| description | text | Y |  |
| coverage_postcodes | _text | Y |  |
| rating | numeric | Y | `0` |
| review_count | int4 | Y | `0` |
| verified | bool | Y | `false` |
| price_range_from | numeric | Y |  |
| price_range_to | numeric | Y |  |
| contact_email | text | Y |  |
| contact_phone | text | Y |  |
| website | text | Y |  |
| status | text | Y | `'active'::text` |
| created_at | timestamptz | Y | `now()` |
| listing_type | text | **N** | `'service'::text` |
| title | text | Y |  |
| category_id | uuid | Y |  |
| price | numeric | Y |  |
| price_unit | text | Y | `'fixed'::text` |
| location_city | text | Y |  |
| location_postcode | text | Y |  |
| images | _text | Y |  |
| is_featured | bool | **N** | `false` |
| view_count | int4 | **N** | `0` |
| enquiry_count | int4 | **N** | `0` |
| published_at | timestamptz | Y |  |
| expires_at | timestamptz | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_by | uuid | Y |  |
| updated_at | timestamptz | **N** | `now()` |
| property_id | uuid | Y |  |
| price_period | text | Y | `'month'::text` |
| currency | text | **N** | `'GBP'::text` |
| bedrooms | int4 | Y |  |
| bathrooms | int4 | Y |  |
| floor_area_sqm | numeric | Y |  |
| available_from | date | Y |  |
| media_r2_keys | _text | Y | `'{}'::text[]` |
| features | _text | Y | `'{}'::text[]` |
| portals | _text | Y | `'{}'::text[]` |
| views_count | int4 | **N** | `0` |
| enquiries_count | int4 | **N** | `0` |
| archived_at | timestamptz | Y |  |
| transaction_type | text | Y |  |
| category | text | Y |  |
| country_code | text | Y |  |
| base_price_pence | int8 | Y |  |
| pricing_model | text | Y |  |
| location | text | Y |  |
| latitude | numeric | Y |  |
| longitude | numeric | Y |  |
| visibility | text | **N** | `'public'::text` |
| verification_status | text | **N** | `'unverified'::text` |
| region | text | Y |  |
| postcode | text | Y |  |
| service_area | text | Y |  |
| instant_book | bool | **N** | `false` |
| request_to_book | bool | **N** | `true` |
| request_quote_enabled | bool | **N** | `false` |
| reviews_enabled | bool | **N** | `true` |
| disputes_enabled | bool | **N** | `true` |
| payments_enabled | bool | **N** | `true` |
| holds_enabled | bool | **N** | `true` |
| platform_fee_percent | numeric | Y |  |
| search_vector | tsvector | Y |  |

### marketplace_messages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| order_id | uuid | **N** |  |
| sender_id | uuid | **N** |  |
| body | text | **N** |  |
| read_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### marketplace_orders

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| listing_id | uuid | Y |  |
| work_item_id | uuid | Y |  |
| property_id | uuid | Y |  |
| title | text | **N** |  |
| description | text | Y |  |
| total_amount | numeric | Y |  |
| status | text | **N** | `'pending'::text` |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| seller_workspace_id | uuid | Y |  |
| buyer_workspace_id | uuid | Y |  |
| enquiry_id | uuid | Y |  |
| order_ref | text | Y |  |
| amount | numeric | **N** | `0` |
| start_date | date | Y |  |
| end_date | date | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| transaction_id | uuid | Y |  |
| transaction_type | text | Y |  |
| gross_pence | int8 | **N** | `0` |
| fee_pence | int8 | **N** | `0` |
| payout_pence | int8 | **N** | `0` |
| currency | text | **N** | `'GBP'::text` |

### marketplace_policy_acceptance

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| user_id | uuid | **N** |  |
| document_slug | text | **N** |  |
| version | text | **N** |  |
| context | text | **N** | `'checkout'::text` |
| ip | text | Y |  |
| accepted_at | timestamptz | **N** | `now()` |
| created_at | timestamptz | **N** | `now()` |

### marketplace_reviews

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| listing_id | uuid | **N** |  |
| order_id | uuid | Y |  |
| rating | int4 | **N** |  |
| title | text | Y |  |
| body | text | Y |  |
| created_at | timestamptz | Y | `now()` |
| reviewer_id | uuid | Y |  |
| review_type | text | **N** | `'buyer_to_seller'::text` |
| is_flagged | bool | **N** | `false` |
| verified | bool | Y | `false` |
| hidden | bool | Y | `false` |
| transaction_id | uuid | Y |  |
| reviewer_workspace_id | uuid | Y |  |
| subject_workspace_id | uuid | Y |  |
| status | text | **N** | `'published'::text` |
| updated_at | timestamptz | **N** | `now()` |

### marketplace_risk_signals

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| signal_type | text | **N** |  |
| severity | text | **N** |  |
| detail | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### marketplace_saved_items

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| listing_id | uuid | **N** |  |
| saved_by | uuid | Y |  |
| note | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### marketplace_search_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| user_id | uuid | Y |  |
| query | text | Y |  |
| filters | jsonb | **N** | `'{}'::jsonb` |
| result_count | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |

### marketplace_terms_acceptance

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| terms_version | text | **N** |  |
| accepted_by | uuid | Y |  |
| accepted_at | timestamptz | **N** | `now()` |
| ip | text | Y |  |

### marketplace_transactions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| buyer_workspace_id | uuid | **N** |  |
| seller_workspace_id | uuid | **N** |  |
| listing_id | uuid | Y |  |
| transaction_type | text | **N** |  |
| gross_pence | int8 | **N** |  |
| platform_fee_pence | int8 | **N** |  |
| provider_fee_pence | int8 | **N** | `0` |
| seller_payout_pence | int8 | **N** |  |
| net_platform_revenue_pence | int8 | **N** |  |
| platform_fee_percent | numeric | Y |  |
| applied_fee_rule_id | text | Y |  |
| currency | text | **N** | `'GBP'::text` |
| status | text | **N** | `'pending'::text` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### marketplace_trust_scores

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| score | numeric | **N** | `0` |
| review_count | int4 | **N** | `0` |
| avg_rating | numeric | Y |  |
| signals | jsonb | **N** | `'{}'::jsonb` |
| updated_at | timestamptz | **N** | `now()` |

### message_thread_participants

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| thread_id | uuid | **N** |  |
| user_id | uuid | Y |  |
| external_email | text | Y |  |
| role | text | Y | `'participant'::text` |
| joined_at | timestamptz | Y | `now()` |

### message_threads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| title | text | **N** |  |
| type | text | **N** | `'team'::text` |
| property_id | uuid | Y |  |
| related_type | text | Y |  |
| related_id | uuid | Y |  |
| archived | bool | Y | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### messages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| thread_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| sender_id | uuid | Y |  |
| sender_name | text | **N** |  |
| content | text | **N** |  |
| read_by | _uuid | Y | `'{}'::uuid[]` |
| attachments | jsonb | Y | `'[]'::jsonb` |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### mfa_recovery_codes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| user_id | uuid | **N** |  |
| code_hash | text | **N** |  |
| used_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### module_release_statuses

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| module_key | text | **N** |  |
| status | text | **N** | `'inactive'::text` |
| activated_at | timestamptz | Y |  |
| activated_by | uuid | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### money_forecast_records

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| planning_set_id | uuid | Y |  |
| record_type | text | **N** | `'income'::text` |
| category | text | Y |  |
| description | text | Y |  |
| forecast_amount | numeric | Y | `0` |
| actual_amount | numeric | Y | `0` |
| variance | numeric | Y |  |
| period_start | date | Y |  |
| period_end | date | Y |  |
| status | text | **N** | `'forecast'::text` |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### money_transactions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| direction | money_direction _(enum: in/out)_ | **N** |  |
| category | money_category _(enum: rent/deposit/service_charge/utility_recharge/reimbursement/maintenance/compliance/cleaning/management_fee/mortgage/insurance/tax/professional_fees/marketing/other)_ | **N** |  |
| amount | numeric | **N** |  |
| currency | bpchar | **N** | `'GBP'::bpchar` |
| occurred_on | date | **N** |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| supplier_job_id | uuid | Y |  |
| description | text | Y |  |
| reference | text | Y |  |
| evidence_file_id | uuid | Y |  |
| reconciled | bool | **N** | `false` |
| reconciled_at | timestamptz | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| compliance_item_id | uuid | Y |  |
| reconciliation_source | jsonb | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### move_plans

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| tenancy_id | uuid | Y |  |
| property_id | uuid | Y |  |
| plan_type | text | **N** | `'move_in'::text` |
| planned_date | date | Y |  |
| status | text | **N** | `'planning'::text` |
| notes | text | Y |  |
| estimated_cost | numeric | Y |  |
| actual_cost | numeric | Y |  |
| created_by | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### move_tasks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| plan_id | uuid | **N** |  |
| title | text | **N** |  |
| category | text | **N** | `'general'::text` |
| status | text | **N** | `'pending'::text` |
| due_date | date | Y |  |
| assigned_to | uuid | Y |  |
| notes | text | Y |  |
| sort_order | int4 | **N** | `0` |
| completed_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### network_messages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| profile_id | uuid | Y |  |
| sender_id | uuid | **N** |  |
| body | text | **N** |  |
| read_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### newsletter_subscribers

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| email | citext | **N** |  |
| status | text | **N** | `'pending'::text` |
| consent | bool | **N** | `false` |
| source | text | Y |  |
| confirm_token | uuid | Y | `gen_random_uuid()` |
| confirmed_at | timestamptz | Y |  |
| unsubscribed_at | timestamptz | Y |  |
| ip | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### notification_preferences

| column | type | null | default |
|---|---|---|---|
| user_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| kind | text | **N** |  |
| lead_time_minutes | int4 | **N** | `60` |
| channel | text | **N** | `'inapp'::text` |
| updated_at | timestamptz | **N** | `now()` |

### notifications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| kind | text | **N** |  |
| title | text | **N** |  |
| body | text | Y |  |
| link | text | Y |  |
| severity | notification_severity _(enum: info/success/warning/danger)_ | **N** | `'info'::notification_severity` |
| linked_kind | text | Y |  |
| linked_id | uuid | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| read_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| read | bool | Y | `false` |
| href | text | Y |  |
| entity_type | text | Y |  |
| entity_id | uuid | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### organisations

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| organisation_type | text | **N** | `'other'::text` |
| email | text | Y |  |
| phone | text | Y |  |
| website | text | Y |  |
| address_line1 | text | Y |  |
| city | text | Y |  |
| postcode | text | Y |  |
| country | text | Y | `'United Kingdom'::text` |
| logo_media_id | uuid | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### partner_relationships

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| partner_workspace_id | uuid | **N** |  |
| relationship_type | text | **N** |  |
| status | text | **N** | `'active'::text` |
| first_interaction_at | timestamptz | Y |  |
| last_interaction_at | timestamptz | Y |  |
| interaction_count | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### payment_release_blocks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| payment_id | uuid | Y |  |
| payout_id | uuid | Y |  |
| transaction_id | uuid | Y |  |
| hold_id | uuid | Y |  |
| block_code | text | **N** |  |
| blocked | bool | **N** | `true` |
| detail | text | Y |  |
| cleared_at | timestamptz | Y |  |
| evaluated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### payments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| payment_type | text | **N** | `'income'::text` |
| linked_type | text | Y |  |
| linked_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| property_id | uuid | Y |  |
| amount | numeric | Y | `0` |
| currency | text | **N** | `'GBP'::text` |
| payment_date | date | **N** | `CURRENT_DATE` |
| payment_method | text | Y | `'bank_transfer'::text` |
| status | text | **N** | `'completed'::text` |
| stripe_payment_id | text | Y |  |
| stripe_transfer_id | text | Y |  |
| reference | text | Y |  |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### payments_webhook_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| stripe_event_id | text | **N** |  |
| type | text | **N** |  |
| payload | jsonb | Y |  |
| processed_at | timestamptz | **N** | `now()` |

### payout_ledger

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| payout_id | uuid | Y |  |
| payment_id | uuid | Y |  |
| entry_type | text | **N** |  |
| amount_pence | int8 | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| created_at | timestamptz | **N** | `now()` |

### payouts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| connect_account_id | text | Y |  |
| amount_pence | int8 | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| stripe_transfer_id | text | Y |  |
| status | text | **N** | `'pending'::text` |
| payment_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### planning_assumptions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| planning_set_id | uuid | **N** |  |
| property_purchase_price | numeric | Y |  |
| property_value | numeric | Y |  |
| monthly_mortgage | numeric | Y |  |
| landlord_monthly_rent | numeric | Y |  |
| contract_length_months | int4 | Y |  |
| break_clause_months | int4 | Y |  |
| rent_review_months | int4 | Y |  |
| void_allowance_pct | numeric | Y | `0.05` |
| management_fee_pct | numeric | Y | `0` |
| occupancy_rate_pct | numeric | Y | `0.90` |
| average_daily_rate | numeric | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### planning_bill_lines

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| planning_set_id | uuid | **N** |  |
| label | text | **N** |  |
| monthly_amount | numeric | **N** | `0` |
| provider | text | Y |  |
| notes | text | Y |  |
| sort_order | int4 | Y | `0` |

### planning_expense_lines

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| profile_id | uuid | **N** |  |
| category | text | **N** |  |
| monthly_amount | numeric | **N** | `0` |
| notes | text | Y |  |
| sort_order | int4 | Y | `0` |
| workspace_id | uuid | Y |  |
| label | text | Y |  |
| amount | numeric | **N** | `0` |
| frequency | text | **N** | `'monthly'::text` |
| is_variable | bool | **N** | `false` |
| updated_at | timestamptz | **N** | `now()` |

### planning_income_lines

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| profile_id | uuid | **N** |  |
| source | text | **N** |  |
| monthly_amount | numeric | **N** | `0` |
| notes | text | Y |  |
| sort_order | int4 | Y | `0` |
| workspace_id | uuid | Y |  |
| label | text | Y |  |
| amount | numeric | **N** | `0` |
| frequency | text | **N** | `'monthly'::text` |
| updated_at | timestamptz | **N** | `now()` |

### planning_landlord_offers

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| planning_set_id | uuid | Y |  |
| landlord_contact_id | uuid | Y |  |
| property_address | text | **N** |  |
| proposed_rent | numeric | **N** |  |
| proposed_term_months | int4 | Y |  |
| break_clause_months | int4 | Y |  |
| management_fee_included | bool | Y | `false` |
| bills_included | bool | Y | `false` |
| notes | text | Y |  |
| status | text | **N** | `'draft'::text` |
| sent_at | timestamptz | Y |  |
| responded_at | timestamptz | Y |  |
| is_demo | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### planning_profile_templates

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| operation_type | operation_type _(enum: student_let/rent_to_rent/rent_to_sa/serviced_accommodation/hmo/single_let/social_housing/commercial/mixed_use/leasehold_portfolio/agency_managed/other)_ | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| defaults_json | jsonb | **N** | `'{}'::jsonb` |
| is_active | bool | **N** | `true` |
| sort_order | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### planning_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| name | text | **N** |  |
| operation_type | text | **N** |  |
| status | text | **N** | `'draft'::text` |
| purchase_price | numeric | Y |  |
| deposit_pct | numeric | Y | `25` |
| occupancy_pct | numeric | Y | `95` |
| void_weeks_per_year | numeric | Y | `2` |
| management_fee_pct | numeric | Y | `10` |
| annual_growth_pct | numeric | Y | `2` |
| notes | text | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| description | text | Y |  |
| units_count | int4 | **N** | `1` |
| rooms_count | int4 | **N** | `1` |
| expected_gross_income | numeric | **N** | `0` |
| landlord_rent_outlay | numeric | **N** | `0` |
| mortgage_cost | numeric | **N** | `0` |
| utilities | numeric | **N** | `0` |
| council_tax | numeric | **N** | `0` |
| internet | numeric | **N** | `0` |
| cleaning | numeric | **N** | `0` |
| maintenance_reserve | numeric | **N** | `0` |
| insurance | numeric | **N** | `0` |
| licensing | numeric | **N** | `0` |
| management_fees | numeric | **N** | `0` |
| platform_channel_fees | numeric | **N** | `0` |
| void_allowance_pct | numeric | **N** | `5.00` |
| occupancy_assumption_pct | numeric | **N** | `85.00` |
| setup_cost | numeric | **N** | `0` |
| deposit_bond | numeric | **N** | `0` |
| furnishings_cost | numeric | **N** | `0` |
| capex | numeric | **N** | `0` |
| monthly_gross_profit | numeric | Y |  |
| monthly_net_profit | numeric | Y |  |
| net_yield_pct | numeric | Y |  |
| breakeven_occupancy_pct | numeric | Y |  |
| tags | _text | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| archived_at | timestamptz | Y |  |

### planning_room_lines

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| planning_set_id | uuid | **N** |  |
| room_label | text | **N** |  |
| room_type | text | Y | `'room'::text` |
| monthly_rent | numeric | **N** | `0` |
| bills_included | bool | Y | `false` |
| notes | text | Y |  |
| sort_order | int4 | Y | `0` |

### planning_scenarios

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| profile_id | uuid | **N** |  |
| name | text | **N** |  |
| type | text | **N** |  |
| occupancy_pct | numeric | Y |  |
| income_adjustment_pct | numeric | Y | `0` |
| expense_adjustment_pct | numeric | Y | `0` |
| notes | text | Y |  |
| workspace_id | uuid | Y |  |
| scenario_type | text | **N** | `'base'::text` |
| calculated_net_profit | numeric | Y |  |
| calculated_margin_pct | numeric | Y |  |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### planning_sensitivity_runs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| profile_id | uuid | **N** |  |
| run_name | text | **N** |  |
| results_json | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### planning_sets

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| title | text | **N** |  |
| operation_profile | text | **N** | `'long_term_let'::text` |
| status | text | **N** | `'draft'::text` |
| property_id | uuid | Y |  |
| address | text | Y |  |
| postcode | text | Y |  |
| gross_monthly_income | numeric | Y | `0` |
| gross_annual_income | numeric | Y | `0` |
| total_monthly_expenses | numeric | Y | `0` |
| net_monthly_income | numeric | Y | `0` |
| net_annual_income | numeric | Y | `0` |
| gross_yield | numeric | Y | `0` |
| net_yield | numeric | Y | `0` |
| roi | numeric | Y | `0` |
| upfront_cash_required | numeric | Y | `0` |
| breakeven_month | int4 | Y | `0` |
| risk_score | int4 | Y | `0` |
| notes | text | Y |  |
| is_demo | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### planning_upfront_costs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| profile_id | uuid | **N** |  |
| label | text | **N** |  |
| amount | numeric | **N** | `0` |
| notes | text | Y |  |
| sort_order | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |

### platform_admins

| column | type | null | default |
|---|---|---|---|
| user_id | uuid | **N** |  |
| granted_at | timestamptz | **N** | `now()` |
| granted_reason | text | Y |  |

### platform_feature_flags

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| flag_key | text | **N** |  |
| name | text | Y |  |
| description | text | Y |  |
| enabled | bool | **N** | `true` |
| enabled_for_plans | _text | Y | `ARRAY['enterprise'::text]` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### platform_settings

| column | type | null | default |
|---|---|---|---|
| key | text | **N** |  |
| value | jsonb | **N** | `'{}'::jsonb` |
| updated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### portal_access_tokens

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| portal_type | text | **N** |  |
| token | text | **N** | `encode(gen_random_bytes(32), 'hex'::text` |
| entity_id | uuid | Y |  |
| entity_type | text | Y |  |
| email | text | Y |  |
| permissions | jsonb | Y | `'["read"]'::jsonb` |
| expires_at | timestamptz | Y |  |
| last_used_at | timestamptz | Y |  |
| revoked | bool | Y | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| token_hash | text | Y |  |

### portal_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| key | text | **N** |  |
| label | text | **N** |  |
| description | text | Y |  |
| access_type | text | **N** | `'supplier'::text` |
| is_default | bool | **N** | `false` |
| is_enabled | bool | **N** | `true` |
| sort_order | int4 | **N** | `0` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### portal_purposes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| key | text | **N** |  |
| label | text | **N** |  |
| description | text | Y |  |
| default_expiry_days | int4 | **N** | `30` |
| is_default | bool | **N** | `false` |
| is_enabled | bool | **N** | `true` |
| sort_order | int4 | **N** | `0` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### portal_sessions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| portal_access_id | uuid | Y |  |
| token_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| portal_type | text | **N** |  |
| scope | jsonb | **N** | `'{}'::jsonb` |
| session_token_hash | text | **N** |  |
| expires_at | timestamptz | **N** |  |
| revoked | bool | **N** | `false` |
| last_seen_at | timestamptz | Y |  |
| ip | text | Y |  |
| user_agent | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### portal_share_links

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | Y |  |
| resource_type | portal_share_resource _(enum: document/documents/invoice/job/work_order/tenancy/property)_ | **N** |  |
| resource_ids | _uuid | **N** | `'{}'::uuid[]` |
| capabilities | _portal_share_capability | **N** | `'{view}'::portal_share_capability[]` |
| title | text | Y |  |
| recipient_label | text | Y |  |
| token_hash | text | **N** |  |
| expires_at | timestamptz | **N** |  |
| revoked_at | timestamptz | Y |  |
| revoked_by | uuid | Y |  |
| last_viewed_at | timestamptz | Y |  |
| view_count | int4 | **N** | `0` |
| upload_count | int4 | **N** | `0` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### portal_share_uploads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| share_link_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| storage_key | text | **N** |  |
| file_name | text | Y |  |
| content_type | text | Y |  |
| size_bytes | int8 | Y |  |
| uploaded_at | timestamptz | **N** | `now()` |

### portal_verify_attempts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| bucket | text | **N** |  |
| attempts | int4 | **N** | `1` |
| window_start | timestamptz | **N** | `now()` |
| last_at | timestamptz | **N** | `now()` |

### portfolio_audit_log

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| actor_id | uuid | Y |  |
| entity_type | text | **N** |  |
| entity_id | uuid | **N** |  |
| action | text | **N** |  |
| summary | text | Y |  |
| diff | jsonb | **N** | `'{}'::jsonb` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### possession_cases

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| tenancy_id | uuid | Y |  |
| property_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| ground | text | **N** | `'Ground 8 (rent arrears)'::text` |
| arrears_amount | numeric | Y |  |
| arrears_weeks | numeric | Y |  |
| status | text | **N** | `'gathering_evidence'::text` |
| notice_served_date | date | Y |  |
| notice_expiry_date | date | Y |  |
| court_applied_date | date | Y |  |
| hearing_date | date | Y |  |
| court_reference | text | Y |  |
| evidence_bundle_path | text | Y |  |
| notes | text | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| notice_type | text | **N** | `'section_8'::text` |
| grounds | jsonb | **N** | `'[]'::jsonb` |
| notice_period_days | int4 | Y |  |
| service_method | text | Y |  |
| service_recipient | text | Y |  |
| validity_snapshot | jsonb | Y |  |
| bundle_generated_at | timestamptz | Y |  |

### possession_evidence

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| possession_case_id | uuid | **N** |  |
| evidence_type | text | **N** | `'other'::text` |
| description | text | **N** |  |
| amount | numeric | Y |  |
| event_date | timestamptz | **N** | `now()` |
| document_path | text | Y |  |
| source | text | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### ppm_plans

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| category | text | Y |  |
| status | text | **N** | `'scheduled'::text` |
| priority | text | Y |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| supplier_contact_id | uuid | Y |  |
| supplier_name | text | Y |  |
| frequency | text | Y |  |
| start_date | date | Y |  |
| next_due_date | date | Y |  |
| last_completed_date | date | Y |  |
| estimated_cost | numeric | Y |  |
| auto_generate_job | bool | Y | `false` |
| reference | text | Y |  |
| notes | text | Y |  |
| is_demo | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### preferred_suppliers

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| supplier_id | uuid | **N** |  |
| added_by | uuid | **N** |  |
| added_at | timestamptz | **N** | `now()` |

### privacy_request_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| request_id | uuid | **N** |  |
| event_type | text | **N** |  |
| actor_user_id | uuid | Y |  |
| detail | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### privacy_requests

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| country_code | text | Y |  |
| regime | text | Y |  |
| request_type | text | **N** | `'access'::text` |
| status | intl_privacy_request_status _(enum: received/identity_check/in_progress/extended/fulfilled/refused/withdrawn)_ | **N** | `'received'::intl_privacy_request_status` |
| subject_name | text | Y |  |
| subject_email | text | Y |  |
| received_at | timestamptz | **N** | `now()` |
| due_at | timestamptz | Y |  |
| extended_to | timestamptz | Y |  |
| fulfilled_at | timestamptz | Y |  |
| assigned_to | uuid | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### procurement_requests

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_id | uuid | Y |  |
| property_id | uuid | Y |  |
| title | text | **N** |  |
| description | text | Y |  |
| budget_from | numeric | Y |  |
| budget_to | numeric | Y |  |
| required_by | date | Y |  |
| status | text | **N** | `'open'::text` |
| notes | text | Y |  |
| requested_by | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** |  |
| display_name | text | Y |  |
| avatar_url | text | Y |  |
| locale | text | **N** | `'en-GB'::text` |
| timezone | text | **N** | `'Europe/London'::text` |
| marketing_opt_in | bool | **N** | `false` |
| onboarding_state | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| preferences | jsonb | **N** | `'{}'::jsonb` |
| avatar_path | text | Y |  |
| first_name | text | Y |  |
| last_name | text | Y |  |
| phone | text | Y |  |
| bio | text | Y |  |
| website | text | Y |  |
| date_format | text | **N** | `'YYYY-MM-DD'::text` |
| first_day_of_week | int2 | **N** | `1` |
| currency_display | text | **N** | `'GBP'::text` |
| password_changed_at | timestamptz | Y |  |
| platform_role | text | Y |  |
| shell_preferences | jsonb | **N** | `'{"shell_style": "dark-luxe", "shell_lay` |
| affiliate_ref | text | Y |  |
| current_workspace_id | uuid | Y |  |
| country_code | text | Y |  |

### properties

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| template | property_template _(enum: standard_rental/hmo/r2r/sa_lite/student_let)_ | **N** |  |
| status | property_status _(enum: active/void/off_market/archived)_ | **N** | `'active'::property_status` |
| nickname | text | **N** |  |
| address_line1 | text | **N** |  |
| address_line2 | text | Y |  |
| city | text | Y |  |
| postcode | text | **N** |  |
| country | text | **N** | `'GB'::text` |
| bedrooms | int4 | Y |  |
| bathrooms | int4 | Y |  |
| floor_area_sqm | numeric | Y |  |
| year_built | int4 | Y |  |
| epc_rating | text | Y |  |
| purchase_price | numeric | Y |  |
| current_value | numeric | Y |  |
| notes | text | Y |  |
| cover_file_id | uuid | Y |  |
| search_tsv | tsvector | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| deleted_at | timestamptz | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| latitude | numeric | Y |  |
| longitude | numeric | Y |  |
| geocoded_at | timestamptz | Y |  |
| category | text | Y |  |
| subcategory | text | Y |  |
| tenure | text | Y |  |
| purchase_date | date | Y |  |
| mortgage_balance | numeric | Y |  |
| category_slug | text | Y |  |
| subcategory_slug | text | Y |  |
| ownership_type | text | Y |  |
| lease_years_remaining | int4 | Y |  |
| lease_end_date | date | Y |  |
| ground_rent_amount | numeric | Y |  |
| service_charge_amount | numeric | Y |  |
| service_charge_frequency | text | Y |  |
| council_band | text | Y |  |
| epc_score | int4 | Y |  |
| epc_expiry | date | Y |  |
| parking_spaces | int4 | Y |  |
| garden | text | Y |  |
| furnished_state | text | Y |  |
| accessibility | jsonb | Y |  |
| purchase_costs | numeric | Y |  |
| mortgage_lender | text | Y |  |
| mortgage_rate | numeric | Y |  |
| mortgage_fix_end | date | Y |  |
| mortgage_outstanding | numeric | Y |  |
| insurance_renewal | date | Y |  |
| target_yield | numeric | Y |  |
| tags | _text | **N** | `ARRAY[]::text[]` |
| target_rent_pcm | numeric | Y |  |
| template_synced_at | timestamptz | Y |  |
| template_seed_version | int4 | **N** | `0` |
| hmo_licence_number | text | Y |  |
| hmo_licence_expiry | date | Y |  |
| hmo_max_occupants | int4 | Y |  |
| r2r_headlease_rent_pcm | numeric | Y |  |
| r2r_headlease_end | date | Y |  |
| r2r_break_clause | date | Y |  |
| sa_avg_nightly_rate | numeric | Y |  |
| sa_target_occupancy_pct | int4 | Y |  |
| student_academic_year | text | Y |  |
| demo | bool | **N** | `false` |
| cover_image_url | text | Y |  |
| county | text | Y |  |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |
| country_code | text | **N** | `'GB'::text` |
| legal_jurisdiction | text | **N** | `'england-wales'::text` |
| tax_region | text | Y |  |
| currency | text | **N** | `'GBP'::text` |
| area_unit | text | **N** | `'sqm'::text` |
| local_authority | text | Y |  |
| address_model_id | text | Y |  |
| region_code | text | Y |  |

### property_categories

| column | type | null | default |
|---|---|---|---|
| slug | text | **N** |  |
| label | text | **N** |  |
| parent_slug | text | Y |  |
| kind | text | **N** |  |
| sort | int4 | **N** | `0` |
| icon | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### property_compliance_items

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | **N** |  |
| unit_id | uuid | Y |  |
| kind | text | **N** |  |
| reference | text | Y |  |
| issued_on | date | Y |  |
| expires_on | date | Y |  |
| status | compliance_item_status _(enum: valid/due_soon/expired/missing/exempt)_ | **N** | `'missing'::compliance_item_status` |
| supplier_id | uuid | Y |  |
| document_id | uuid | Y |  |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### property_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| name | text | **N** |  |
| file_url | text | **N** |  |
| file_type | text | Y |  |
| file_size | int8 | Y |  |
| category | text | Y |  |
| uploaded_by | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### property_inspections

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | **N** |  |
| unit_id | uuid | Y |  |
| kind | text | **N** |  |
| scheduled_for | timestamptz | Y |  |
| completed_at | timestamptz | Y |  |
| status | inspection_status _(enum: scheduled/in_progress/completed/cancelled/overdue)_ | **N** | `'scheduled'::inspection_status` |
| inspector_id | uuid | Y |  |
| supplier_id | uuid | Y |  |
| score | numeric | Y |  |
| notes | text | Y |  |
| report_document_id | uuid | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### property_media

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | **N** |  |
| file_id | uuid | **N** |  |
| kind | text | **N** | `'photo'::text` |
| sort_order | int4 | **N** | `0` |
| is_cover | bool | **N** | `false` |
| caption | text | Y |  |
| alt_text | text | Y |  |
| width_px | int4 | Y |  |
| height_px | int4 | Y |  |
| dominant_color | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### property_suppliers

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| category | text | Y |  |
| contact_name | text | Y |  |
| email | text | Y |  |
| phone | text | Y |  |
| address | text | Y |  |
| website | text | Y |  |
| notes | text | Y |  |
| is_active | bool | **N** | `true` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### property_tasks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | **N** |  |
| unit_id | uuid | Y |  |
| title | text | **N** |  |
| description | text | Y |  |
| status | task_status _(enum: todo/in_progress/blocked/done/cancelled)_ | **N** | `'todo'::task_status` |
| priority | task_priority _(enum: low/normal/high/urgent)_ | **N** | `'normal'::task_priority` |
| assignee_id | uuid | Y |  |
| due_on | date | Y |  |
| completed_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### property_units

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | **N** |  |
| unit_name | text | **N** |  |
| unit_type | text | Y |  |
| floor | int4 | Y |  |
| bedrooms | int4 | Y | `1` |
| bathrooms | int4 | Y | `1` |
| floor_area_sqm | numeric | Y |  |
| target_rent | numeric | Y |  |
| status | text | **N** | `'vacant'::text` |
| is_demo | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### public_enquiries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| enquirer_name | text | **N** |  |
| enquirer_email | text | **N** |  |
| enquirer_phone | text | Y |  |
| message | text | Y |  |
| requested_from | date | Y |  |
| requested_to | date | Y |  |
| status | text | **N** | `'new'::text` |
| is_spam | bool | **N** | `false` |
| gdpr_consent | bool | **N** | `false` |
| ip_address | text | Y |  |
| source | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### quote_requests

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_id | uuid | Y |  |
| work_item_id | uuid | Y |  |
| property_id | uuid | Y |  |
| title | text | **N** |  |
| description | text | Y |  |
| required_by | date | Y |  |
| status | text | **N** | `'pending'::text` |
| quoted_amount | numeric | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |

### rate_plans

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| listing_id | uuid | **N** |  |
| name | text | **N** | `'Standard'::text` |
| nightly_rate_pence | int8 | **N** |  |
| min_nights | int4 | **N** | `1` |
| max_nights | int4 | Y |  |
| weekend_uplift_pct | numeric | Y |  |
| active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### reconciliation_items

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| source_type | text | **N** | `'manual'::text` |
| source_reference | text | Y |  |
| amount | numeric | Y | `0` |
| currency | text | **N** | `'GBP'::text` |
| transaction_date | date | Y |  |
| description | text | Y |  |
| matched_type | text | Y |  |
| matched_id | uuid | Y |  |
| status | text | **N** | `'unmatched'::text` |
| reconciled_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### regional_terms_consent_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| user_id | uuid | Y |  |
| country_code | text | Y |  |
| document | text | **N** |  |
| version | text | **N** |  |
| consented_at | timestamptz | **N** | `now()` |
| ip_hash | text | Y |  |
| user_agent | text | Y |  |

### regional_terms_versions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| country_code | text | Y |  |
| document | text | **N** |  |
| version | text | **N** |  |
| effective_from | date | Y |  |
| body_url | text | Y |  |
| status | text | **N** | `'draft'::text` |
| created_at | timestamptz | **N** | `now()` |

### rent_schedules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| tenancy_id | uuid | **N** |  |
| due_date | date | **N** |  |
| amount_due | numeric | **N** |  |
| amount_paid | numeric | **N** | `0` |
| status | text | **N** | `'due'::text` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### report_runs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| saved_report_id | uuid | Y |  |
| kind | text | **N** |  |
| params | jsonb | **N** | `'{}'::jsonb` |
| file_id | uuid | Y |  |
| status | text | **N** | `'ready'::text` |
| row_count | int4 | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### risk_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| event_type | text | **N** |  |
| severity | text | **N** | `'low'::text` |
| score_delta | numeric | **N** | `0` |
| detail | jsonb | **N** | `'{}'::jsonb` |
| source | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### risk_rules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| name | text | **N** |  |
| event_type | text | **N** |  |
| condition | jsonb | **N** | `'{}'::jsonb` |
| weight | numeric | **N** | `1` |
| active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |

### risk_scores

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| score | numeric | **N** | `0` |
| band | text | **N** | `'low'::text` |
| last_event_at | timestamptz | Y |  |
| flagged | bool | **N** | `false` |
| flagged_reason | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### role_audit_log

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| action | text | **N** |  |
| scope | text | **N** |  |
| target_user_id | uuid | **N** |  |
| role_name | text | Y |  |
| reason | text | Y |  |
| actor_user_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| workspace_id | uuid | Y |  |

### sanctions_country_rules

| column | type | null | default |
|---|---|---|---|
| country_code | text | **N** |  |
| classification | text | **N** | `'allowed'::text` |
| programmes | jsonb | **N** | `'[]'::jsonb` |
| block_onboarding | bool | **N** | `false` |
| block_billing | bool | **N** | `false` |
| block_payout | bool | **N** | `false` |
| requires_manual_review | bool | **N** | `false` |
| source | text | Y |  |
| reviewed_at | timestamptz | Y |  |
| notes | text | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### sanctions_screenings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| subject_name | text | **N** |  |
| country_code | text | Y |  |
| matched | bool | **N** | `false` |
| match_detail | jsonb | **N** | `'{}'::jsonb` |
| screened_at | timestamptz | **N** | `now()` |
| screened_by | uuid | Y |  |

### saved_insights

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| slug | text | **N** |  |
| kind | text | **N** |  |
| source | text | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| definition | jsonb | **N** | `'{}'::jsonb` |
| pinned | bool | **N** | `false` |
| owner_user_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### saved_reports

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| kind | text | **N** |  |
| params | jsonb | **N** | `'{}'::jsonb` |
| schedule_cron | text | Y |  |
| last_run_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| deleted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### saved_views

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| owner_user_id | uuid | **N** |  |
| entity | text | **N** |  |
| name | text | **N** |  |
| config | jsonb | **N** | `'{}'::jsonb` |
| is_shared | bool | **N** | `false` |
| is_default | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### share_evidence_uploads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| share_link_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| storage_bucket | text | **N** | `'share-evidence'::text` |
| storage_path | text | **N** |  |
| original_name | text | **N** |  |
| mime_type | text | **N** |  |
| size_bytes | int8 | **N** |  |
| status | text | **N** | `'pending'::text` |
| submitter_ip | inet | Y |  |
| submitter_ua | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### share_help_reports

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| share_link_id | uuid | Y |  |
| sender_email | text | Y |  |
| message | text | **N** |  |
| ip_hash | text | Y |  |
| ua_hash | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### share_link_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| share_link_id | uuid | **N** |  |
| kind | text | **N** |  |
| ip_hash | text | Y |  |
| ua_hash | text | Y |  |
| meta | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### share_link_rate_limits

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| share_link_id | uuid | **N** |  |
| ip_hash | text | **N** |  |
| window_start | timestamptz | **N** | `now()` |
| hits | int4 | **N** | `0` |
| locked_until | timestamptz | Y |  |

### share_link_submissions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| share_link_id | uuid | **N** |  |
| submitted_at | timestamptz | **N** | `now()` |
| submitter_ip | inet | Y |  |
| submitter_ua | text | Y |  |
| payload | jsonb | **N** | `'{}'::jsonb` |
| files | _uuid | **N** | `'{}'::uuid[]` |
| status | text | **N** | `'new'::text` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### share_link_targets

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| share_link_id | uuid | **N** |  |
| target_kind | text | **N** |  |
| target_id | uuid | **N** |  |
| is_primary | bool | **N** | `false` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### share_link_views

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| share_link_id | uuid | **N** |  |
| viewed_at | timestamptz | **N** | `now()` |
| ip | inet | Y |  |
| ua | text | Y |  |

### share_links

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| kind | share_link_kind _(enum: intake_form/document_pack/report/evidence_request/custom)_ | **N** |  |
| status | share_link_status _(enum: active/expired/revoked)_ | **N** | `'active'::share_link_status` |
| token_hash | text | **N** |  |
| linked_kind | text | Y |  |
| linked_id | uuid | Y |  |
| recipient_email | citext | Y |  |
| recipient_name | text | Y |  |
| password_hash | text | Y |  |
| expires_at | timestamptz | **N** |  |
| max_views | int4 | Y |  |
| view_count | int4 | **N** | `0` |
| last_viewed_at | timestamptz | Y |  |
| revoked_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| deleted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### smart_rule_actions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| run_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| action_type | text | **N** |  |
| payload | jsonb | **N** | `'{}'::jsonb` |
| status | text | **N** | `'pending'::text` |
| executed_at | timestamptz | Y |  |
| result | jsonb | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### smart_rule_runs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| rule_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| triggered_at | timestamptz | **N** | `now()` |
| status | text | **N** | `'pending_review'::text` |
| context | jsonb | **N** | `'{}'::jsonb` |
| error | text | Y |  |
| reviewed_by | uuid | Y |  |
| reviewed_at | timestamptz | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### smart_rules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| enabled | bool | **N** | `true` |
| trigger_type | text | **N** |  |
| trigger_config | jsonb | **N** | `'{}'::jsonb` |
| condition_config | jsonb | **N** | `'{}'::jsonb` |
| action_type | text | **N** |  |
| action_config | jsonb | **N** | `'{}'::jsonb` |
| review_required | bool | **N** | `true` |
| template_id | text | Y |  |
| last_evaluated_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### sso_configurations

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| provider | text | **N** | `'saml'::text` |
| is_active | bool | **N** | `false` |
| config_json | jsonb | **N** | `'{}'::jsonb` |
| domain | text | Y |  |
| created_by | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### stripe_accounts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| stripe_account_id | text | Y |  |
| status | text | **N** | `'not_connected'::text` |
| onboarding_url | text | Y |  |
| charges_enabled | bool | Y | `false` |
| payouts_enabled | bool | Y | `false` |
| details_submitted | bool | Y | `false` |
| is_test_mode | bool | Y | `true` |
| connected_at | timestamptz | Y |  |
| last_synced_at | timestamptz | Y |  |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### stripe_connect_accounts

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| stripe_account_id | text | **N** |  |
| account_type | text | **N** | `'standard'::text` |
| status | text | **N** | `'pending'::text` |
| charges_enabled | bool | **N** | `false` |
| payouts_enabled | bool | **N** | `false` |
| details_submitted | bool | **N** | `false` |
| country | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### stripe_payment_intents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| escrow_order_id | uuid | Y |  |
| stripe_payment_intent_id | text | **N** |  |
| stripe_customer_id | text | Y |  |
| amount | int4 | **N** |  |
| currency | text | **N** | `'gbp'::text` |
| status | text | **N** |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### stripe_webhook_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| stripe_event_id | text | **N** |  |
| type | text | **N** |  |
| processed_at | timestamptz | Y | `now()` |
| payload | jsonb | Y |  |

### subprocessor_register

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| name | text | **N** |  |
| purpose | text | Y |  |
| country_code | text | Y |  |
| data_categories | jsonb | **N** | `'[]'::jsonb` |
| transfer_mechanism | text | Y |  |
| status | text | **N** | `'active'::text` |
| dpa_url | text | Y |  |
| added_at | date | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_accreditations

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| issuing_body | text | Y |  |
| reference | text | Y |  |
| expires_at | date | Y |  |
| status | text | Y | `'pending_review'::text` |
| public_badge | bool | Y | `false` |
| linked_services | _uuid | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_adjustment_approvals

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| adjustment_id | uuid | **N** |  |
| decided_by | uuid | Y |  |
| decision | text | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_adjustments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| reference | text | Y |  |
| adj_type | text | Y |  |
| reason | text | Y |  |
| amount_pence | int8 | Y |  |
| status | text | Y | `'pending'::text` |
| approved_by | uuid | Y |  |
| related_invoice_id | uuid | Y |  |
| related_payout_id | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_automation_approvals

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| rule_id | uuid | Y |  |
| reason | text | Y |  |
| requested_by | uuid | Y |  |
| status | text | Y | `'pending'::text` |
| decided_by | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_automation_runs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| rule_id | uuid | Y |  |
| status | text | Y |  |
| detail | text | Y |  |
| ran_at | timestamptz | Y | `now()` |

### supplier_automation_templates

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| customer_impacting | bool | Y | `false` |
| created_at | timestamptz | Y | `now()` |

### supplier_availability

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_id | uuid | **N** |  |
| date | date | **N** |  |
| available | bool | **N** | `true` |
| slots | jsonb | Y | `'[]'::jsonb` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_business_verifications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| legal_name | text | Y |  |
| business_type | text | Y |  |
| registration_country | text | Y |  |
| company_number_masked | text | Y |  |
| vat_number_masked | text | Y |  |
| registered_address | text | Y |  |
| r2_key | text | Y |  |
| status | text | **N** | `'uploaded'::text` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_categories

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| name | text | **N** |  |
| slug | text | **N** |  |
| description | text | Y |  |
| icon | text | Y |  |
| sort_order | int4 | **N** | `0` |
| is_active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |

### supplier_connections

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| operator_workspace_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| status | text | **N** | `'invited'::text` |
| invited_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_directory

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| category_id | uuid | Y |  |
| contact_id | uuid | Y |  |
| name | text | **N** |  |
| trading_name | text | Y |  |
| website | text | Y |  |
| email | text | Y |  |
| phone | text | Y |  |
| address_line1 | text | Y |  |
| address_city | text | Y |  |
| address_postcode | text | Y |  |
| description | text | Y |  |
| specialisms | _text | Y |  |
| service_areas | _text | Y |  |
| status | text | **N** | `'active'::text` |
| is_preferred | bool | **N** | `false` |
| is_verified | bool | **N** | `false` |
| avg_rating | numeric | Y |  |
| review_count | int4 | **N** | `0` |
| notes | text | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_by | uuid | **N** |  |
| updated_by | uuid | Y |  |
| archived_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_disputes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| assignment_id | uuid | **N** |  |
| operator_workspace_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| raised_by_side | text | **N** | `'supplier'::text` |
| raised_by | uuid | Y |  |
| category | text | **N** | `'other'::text` |
| subject | text | **N** |  |
| detail | text | Y |  |
| status | text | **N** | `'open'::text` |
| resolution | text | Y |  |
| resolved_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_id | uuid | **N** |  |
| doc_type | text | **N** | `'other'::text` |
| file_id | uuid | Y |  |
| name | text | **N** |  |
| expiry_date | date | Y |  |
| is_verified | bool | **N** | `false` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### supplier_emergency_rota

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| shift_date | date | **N** |  |
| on_call_worker_id | uuid | Y |  |
| backup_worker_id | uuid | Y |  |
| area | text | Y |  |
| response_sla_mins | int4 | Y |  |
| premium | bool | Y | `false` |
| handover_notes | text | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_identity_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| doc_type | text | **N** |  |
| document_country | text | Y |  |
| document_number_masked | text | Y |  |
| expiry_date | date | Y |  |
| name_on_document | text | Y |  |
| r2_key_front | text | Y |  |
| r2_key_back | text | Y |  |
| r2_key_selfie | text | Y |  |
| ocr_status | text | **N** | `'not_run'::text` |
| status | text | **N** | `'uploaded'::text` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_identity_verifications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| supplier_workspace_id | uuid | **N** |  |
| user_id | uuid | Y |  |
| verification_level | int2 | **N** | `0` |
| status | text | **N** | `'unverified'::text` |
| provider | text | **N** | `'manual'::text` |
| stripe_account_id | text | Y |  |
| document_check_status | text | **N** | `'not_started'::text` |
| selfie_check_status | text | **N** | `'not_started'::text` |
| manual_review_status | text | **N** | `'not_required'::text` |
| risk_flags | jsonb | **N** | `'[]'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| verified_at | timestamptz | Y |  |
| expires_at | timestamptz | Y |  |
| updated_at | timestamptz | **N** | `now()` |

### supplier_insight_recommendations

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| title | text | **N** |  |
| detail | text | Y |  |
| status | text | Y | `'open'::text` |
| created_at | timestamptz | Y | `now()` |

### supplier_insight_snapshots

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| metric | text | **N** |  |
| value | numeric | Y |  |
| dimension | text | Y |  |
| dimension_id | text | Y |  |
| captured_at | timestamptz | Y | `now()` |

### supplier_insurance_policies

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| insurance_type | text | **N** |  |
| provider | text | Y |  |
| policy_number_masked | text | Y |  |
| coverage_amount_pence | int8 | Y |  |
| valid_from | date | Y |  |
| valid_to | date | Y |  |
| r2_key | text | Y |  |
| minimum_cover_met | bool | **N** | `false` |
| status | text | **N** | `'uploaded'::text` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_internal_mentions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| note_id | uuid | **N** |  |
| mentioned_user_id | uuid | **N** |  |
| read | bool | Y | `false` |
| created_at | timestamptz | Y | `now()` |

### supplier_internal_notes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| author_id | uuid | Y |  |
| body | text | **N** |  |
| related_type | text | Y |  |
| related_id | uuid | Y |  |
| resolved | bool | Y | `false` |
| created_at | timestamptz | Y | `now()` |

### supplier_invites

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| invited_email | text | **N** |  |
| invited_name | text | Y |  |
| message | text | Y |  |
| status | text | **N** | `'pending'::text` |
| token | text | **N** | `(gen_random_uuid())::text` |
| expires_at | timestamptz | **N** | `(now() + '7 days'::interval)` |
| invited_by | uuid | **N** |  |
| accepted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### supplier_invoices

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| supplier_job_id | uuid | Y |  |
| contact_id | uuid | **N** |  |
| invoice_number | text | Y |  |
| amount | numeric | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| status | text | **N** | `'submitted'::text` |
| submitted_at | timestamptz | **N** | `now()` |
| approved_at | timestamptz | Y |  |
| paid_at | timestamptz | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### supplier_job_assignments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| quote_id | uuid | Y |  |
| operator_workspace_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| job_id | uuid | Y |  |
| status | text | **N** | `'assigned'::text` |
| scheduled_for | timestamptz | Y |  |
| completed_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_job_attachments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_job_id | uuid | **N** |  |
| file_id | uuid | **N** |  |
| kind | text | **N** | `'evidence'::text` |
| caption | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### supplier_job_dispatch_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| job_id | uuid | **N** |  |
| worker_id | uuid | Y |  |
| dispatcher_id | uuid | Y |  |
| route_order | int4 | Y |  |
| status | text | Y | `'dispatched'::text` |
| created_at | timestamptz | Y | `now()` |

### supplier_job_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| assignment_id | uuid | **N** |  |
| event_type | text | **N** | `'status'::text` |
| from_status | text | Y |  |
| to_status | text | Y |  |
| note | text | Y |  |
| actor_user_id | uuid | Y |  |
| actor_side | text | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### supplier_job_evidence

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| assignment_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| phase | text | **N** | `'during'::text` |
| r2_key | text | **N** |  |
| file_name | text | Y |  |
| content_type | text | Y |  |
| size_bytes | int8 | Y |  |
| caption | text | Y |  |
| uploaded_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### supplier_job_quotes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_job_id | uuid | **N** |  |
| vendor | text | **N** |  |
| amount_pence | int4 | **N** |  |
| doc_file_id | uuid | Y |  |
| is_winning | bool | **N** | `false` |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### supplier_job_routes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| worker_id | uuid | **N** |  |
| date | date | Y |  |
| stops | jsonb | Y | `'[]'::jsonb` |
| total_travel_mins | int4 | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_job_sla_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| job_id | uuid | **N** |  |
| sla_type | text | Y |  |
| due_at | timestamptz | Y |  |
| breached | bool | Y | `false` |
| created_at | timestamptz | Y | `now()` |

### supplier_jobs

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| status | supplier_job_status _(enum: draft/quoted/approved/scheduled/in_progress/completed/invoiced/paid/cancelled)_ | **N** | `'draft'::supplier_job_status` |
| property_id | uuid | **N** |  |
| supplier_contact_id | uuid | **N** |  |
| title | text | **N** |  |
| description | text | Y |  |
| quoted_amount | numeric | Y |  |
| approved_amount | numeric | Y |  |
| invoice_amount | numeric | Y |  |
| scheduled_for | timestamptz | Y |  |
| completed_at | timestamptz | Y |  |
| sla_hours | int4 | Y |  |
| sla_breached_at | timestamptz | Y |  |
| linked_task_id | uuid | Y |  |
| invoice_file_id | uuid | Y |  |
| notes | text | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| deleted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| cover_file_id | uuid | Y |  |
| checklist | jsonb | **N** | `'[]'::jsonb` |
| duration_min | int4 | Y |  |
| recurrence_id | uuid | Y |  |
| invoice_number | text | Y |  |
| invoice_due | date | Y |  |
| rating | int4 | Y |  |
| rating_note | text | Y |  |
| unit_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| priority | text | Y | `'med'::text` |
| labels | _text | **N** | `'{}'::text[]` |
| duration_minutes | int4 | **N** | `60` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### supplier_licence_verifications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| licence_type | text | **N** |  |
| issuing_body | text | Y |  |
| licence_number_masked | text | Y |  |
| country | text | Y |  |
| region | text | Y |  |
| valid_from | date | Y |  |
| valid_to | date | Y |  |
| required_for_categories | _text | **N** | `'{}'::text[]` |
| r2_key | text | Y |  |
| status | text | **N** | `'uploaded'::text` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_marketplace_quotes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| operator_workspace_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| job_id | uuid | Y |  |
| service_id | uuid | Y |  |
| title | text | **N** |  |
| description | text | Y |  |
| status | text | **N** | `'requested'::text` |
| amount_pence | int8 | Y |  |
| currency | text | **N** | `'GBP'::text` |
| valid_until | date | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_message_threads

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| subject | text | **N** |  |
| counterparty_kind | text | **N** | `'operator'::text` |
| counterparty_name | text | Y |  |
| assignment_id | uuid | Y |  |
| lead_id | uuid | Y |  |
| last_message_at | timestamptz | **N** | `now()` |
| supplier_unread_count | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |

### supplier_messages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| thread_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| author_side | text | **N** | `'supplier'::text` |
| author_user_id | uuid | Y |  |
| author_name | text | Y |  |
| body | text | **N** |  |
| created_at | timestamptz | **N** | `now()` |

### supplier_network_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | Y |  |
| category_id | uuid | Y |  |
| business_name | text | **N** |  |
| trading_name | text | Y |  |
| description | text | Y |  |
| website | text | Y |  |
| email | text | Y |  |
| phone | text | Y |  |
| address_city | text | Y |  |
| address_postcode | text | Y |  |
| service_areas | _text | Y |  |
| specialisms | _text | Y |  |
| status | text | **N** | `'pending'::text` |
| is_verified | bool | **N** | `false` |
| verification_date | timestamptz | Y |  |
| avg_rating | numeric | Y |  |
| review_count | int4 | **N** | `0` |
| owner_user_id | uuid | Y |  |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_notifications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| type | text | **N** | `'info'::text` |
| title | text | **N** |  |
| body | text | Y |  |
| href | text | Y |  |
| resource_type | text | Y |  |
| resource_id | uuid | Y |  |
| read_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### supplier_out_of_hours_rules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | Y |  |
| premium_pct | numeric | Y |  |
| applies_from | time | Y |  |
| applies_to | time | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_packages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_id | uuid | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| price | numeric | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| duration_days | int4 | Y |  |
| inclusions | _text | Y |  |
| exclusions | _text | Y |  |
| active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_portal_access

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | **N** |  |
| user_id | uuid | Y |  |
| email | text | Y |  |
| active | bool | **N** | `true` |
| invited_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_preferences

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_contact_id | uuid | **N** |  |
| preferred | bool | **N** | `false` |
| blocked | bool | **N** | `false` |
| reason | text | Y |  |
| categories | _text | **N** | `'{}'::text[]` |
| review_date | date | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| contact_id | uuid | **N** |  |
| service_categories | _text | **N** | `'{}'::text[]` |
| coverage_postcodes | _text | **N** | `'{}'::text[]` |
| coverage_radius | numeric | Y |  |
| hourly_rate | numeric | Y |  |
| callout_fee | numeric | Y |  |
| emergency_available | bool | **N** | `false` |
| preferred_supplier | bool | **N** | `false` |
| backup_supplier | bool | **N** | `false` |
| insurance_expiry | date | Y |  |
| compliance_status | text | **N** | `'unknown'::text` |
| average_response_time | numeric | Y |  |
| jobs_completed | int4 | **N** | `0` |
| internal_rating | int2 | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| metadata | jsonb | Y | `'{}'::jsonb` |

### supplier_quote_approval_comments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| approval_id | uuid | **N** |  |
| author_id | uuid | Y |  |
| body | text | **N** |  |
| created_at | timestamptz | Y | `now()` |

### supplier_quote_approvals

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| quote_id | uuid | **N** |  |
| estimator_id | uuid | Y |  |
| owner_id | uuid | Y |  |
| margin_estimate | numeric | Y |  |
| discount_pct | numeric | Y |  |
| risk_flags | _text | Y |  |
| status | text | Y | `'awaiting'::text` |
| decided_by | uuid | Y |  |
| decided_at | timestamptz | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_quotes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| request_id | uuid | **N** |  |
| supplier_id | uuid | Y |  |
| amount | numeric | **N** | `0` |
| valid_until | date | Y |  |
| status | text | **N** | `'pending'::text` |
| notes | text | Y |  |
| submitted_at | timestamptz | **N** | `now()` |
| created_at | timestamptz | **N** | `now()` |

### supplier_ratings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_contact_id | uuid | **N** |  |
| quality | int2 | Y |  |
| speed | int2 | Y |  |
| communication | int2 | Y |  |
| reliability | int2 | Y |  |
| price_value | int2 | Y |  |
| compliance | int2 | Y |  |
| tenant_satisfaction | int2 | Y |  |
| would_use_again | bool | Y |  |
| internal_notes | text | Y |  |
| last_job_id | uuid | Y |  |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_reputation_disputes

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| reference | text | Y |  |
| customer_name | text | Y |  |
| category | text | Y |  |
| stage | text | Y | `'open'::text` |
| owner_id | uuid | Y |  |
| payout_hold_pence | int8 | Y | `0` |
| trust_impact | int4 | Y | `0` |
| opened_at | timestamptz | Y | `now()` |

### supplier_reputation_trust_scores

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| score | int4 | Y |  |
| response_score | int4 | Y |  |
| captured_at | timestamptz | Y | `now()` |

### supplier_review_responses

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| review_id | uuid | **N** |  |
| responder_id | uuid | Y |  |
| body | text | **N** |  |
| created_at | timestamptz | Y | `now()` |

### supplier_reviews

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_id | uuid | **N** |  |
| rating | int4 | **N** |  |
| title | text | Y |  |
| body | text | Y |  |
| reviewer_id | uuid | **N** |  |
| is_flagged | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| reviewer_name | text | Y |  |
| job_type | text | Y |  |
| verified | bool | Y | `false` |
| moderated | bool | Y | `false` |
| hidden | bool | Y | `false` |

### supplier_service_assignment_rules

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| service_id | uuid | Y |  |
| rule | text | Y |  |
| required_qualification | text | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_service_listings

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| profile_id | uuid | **N** |  |
| category_id | uuid | Y |  |
| title | text | **N** |  |
| description | text | Y |  |
| price_from | numeric | Y |  |
| price_unit | text | Y | `'quote'::text` |
| service_areas | _text | Y |  |
| is_active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_service_slas

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| service_id | uuid | Y |  |
| response_sla_mins | int4 | Y |  |
| completion_sla_hours | int4 | Y |  |
| min_charge_pence | int4 | Y |  |
| emergency_premium_pct | numeric | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_service_zones

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| colour | text | **N** | `'#2563EB'::text` |
| shape_type | text | **N** | `'radius'::text` |
| centre_lat | numeric | Y |  |
| centre_lng | numeric | Y |  |
| radius_km | int4 | Y |  |
| value | text | Y |  |
| polygon | jsonb | Y |  |
| is_active | bool | **N** | `true` |
| priority | int4 | **N** | `0` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_services

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| supplier_id | uuid | **N** |  |
| service_name | text | **N** |  |
| description | text | Y |  |
| price_from | numeric | Y |  |
| price_to | numeric | Y |  |
| price_unit | text | Y | `'job'::text` |
| workspace_id | uuid | Y |  |
| name | text | Y |  |

### supplier_statement_lines

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| statement_id | uuid | **N** |  |
| description | text | Y |  |
| amount_pence | int8 | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_statements

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| period | text | **N** |  |
| net_pence | int8 | Y |  |
| fee_pence | int8 | Y |  |
| vat_pence | int8 | Y |  |
| status | text | Y | `'ready'::text` |
| created_at | timestamptz | Y | `now()` |

### supplier_tax_summaries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| period | text | **N** |  |
| vat_collected_pence | int8 | Y |  |
| vat_on_fees_pence | int8 | Y |  |
| taxable_income_pence | int8 | Y |  |
| deductible_fees_pence | int8 | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_team_activity

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| actor_id | uuid | Y |  |
| action | text | **N** |  |
| related_type | text | Y |  |
| related_id | uuid | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_verification_badges

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| badge_key | text | **N** |  |
| label | text | **N** |  |
| active | bool | **N** | `true` |
| granted_at | timestamptz | **N** | `now()` |
| expires_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_verification_events

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| event_type | text | **N** |  |
| from_status | text | Y |  |
| to_status | text | Y |  |
| actor_user_id | uuid | Y |  |
| actor_role | text | Y |  |
| detail | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### supplier_verification_requirements

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| supplier_workspace_id | uuid | **N** |  |
| risk_tier | text | **N** | `'low'::text` |
| requirement_key | text | **N** |  |
| category | text | Y |  |
| satisfied | bool | **N** | `false` |
| satisfied_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_verification_risk_flags

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| supplier_workspace_id | uuid | **N** |  |
| flag_type | text | **N** |  |
| severity | text | **N** | `'medium'::text` |
| detail | jsonb | **N** | `'{}'::jsonb` |
| resolved | bool | **N** | `false` |
| resolved_at | timestamptz | Y |  |
| resolved_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### supplier_worker_availability

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| worker_id | uuid | **N** |  |
| day_of_week | int4 | Y |  |
| start_time | time | Y |  |
| end_time | time | Y |  |
| available | bool | Y | `true` |
| created_at | timestamptz | Y | `now()` |

### supplier_worker_checks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| worker_id | uuid | **N** |  |
| check_type | text | **N** |  |
| status | text | Y | `'pending'::text` |
| blocked_services | _text | Y |  |
| expires_at | date | Y |  |
| created_at | timestamptz | Y | `now()` |

### supplier_worker_profiles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | Y |  |
| display_name | text | Y |  |
| trade | text | Y |  |
| base_area | text | Y |  |
| status | text | Y | `'active'::text` |
| metadata_json | jsonb | Y | `'{}'::jsonb` |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |

### supplier_worker_qualifications

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| worker_id | uuid | **N** |  |
| qualification | text | **N** |  |
| authority | text | Y |  |
| reference | text | Y |  |
| valid_from | date | Y |  |
| expires_at | date | Y |  |
| status | text | Y | `'pending_review'::text` |
| created_at | timestamptz | Y | `now()` |

### supplier_worker_training

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| worker_id | uuid | **N** |  |
| course | text | **N** |  |
| completed_at | date | Y |  |
| status | text | Y | `'assigned'::text` |
| created_at | timestamptz | Y | `now()` |

### supplier_workspace_availability

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| weekday | int4 | Y |  |
| starts_at | time | Y |  |
| ends_at | time | Y |  |
| date_override | date | Y |  |
| is_available | bool | **N** | `true` |
| note | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### supplier_workspace_coverage_areas

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| area_type | text | **N** |  |
| value | text | Y |  |
| latitude | numeric | Y |  |
| longitude | numeric | Y |  |
| radius_km | int4 | Y |  |
| created_at | timestamptz | **N** | `now()` |

### supplier_workspace_invoices

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| assignment_id | uuid | Y |  |
| invoice_number | text | Y |  |
| amount_pence | int8 | Y |  |
| currency | text | **N** | `'GBP'::text` |
| status | text | **N** | `'draft'::text` |
| submitted_at | timestamptz | Y |  |
| approved_at | timestamptz | Y |  |
| paid_at | timestamptz | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_workspace_members

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| role | text | **N** | `'member'::text` |
| created_at | timestamptz | **N** | `now()` |

### supplier_workspace_onboarding_state

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| step | text | Y |  |
| completed_steps | _text | **N** | `'{}'::text[]` |
| completed | bool | **N** | `false` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_workspace_packages

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| description | text | Y |  |
| price_pence | int8 | Y |  |
| currency | text | **N** | `'GBP'::text` |
| duration_days | int4 | Y |  |
| inclusions | _text | **N** | `'{}'::text[]` |
| exclusions | _text | **N** | `'{}'::text[]` |
| active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_workspace_permissions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| role_id | uuid | Y |  |
| capability | text | **N** |  |
| allowed | bool | **N** | `false` |
| created_at | timestamptz | Y | `now()` |

### supplier_workspace_profiles

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| display_name | text | Y |  |
| bio | text | Y |  |
| trades | _text | **N** | `'{}'::text[]` |
| years_experience | int4 | Y |  |
| insurance_verified | bool | **N** | `false` |
| public_liability_cover_pence | int8 | Y |  |
| service_radius_km | int4 | Y |  |
| base_location | text | Y |  |
| latitude | numeric | Y |  |
| longitude | numeric | Y |  |
| response_time_hours | int4 | Y |  |
| accepts_emergency | bool | **N** | `false` |
| status | text | **N** | `'draft'::text` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_workspace_roles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| supplier_workspace_id | uuid | Y |  |
| name | text | **N** |  |
| capabilities | jsonb | **N** | `'{}'::jsonb` |
| status | text | Y | `'active'::text` |
| metadata_json | jsonb | Y | `'{}'::jsonb` |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |

### supplier_workspace_services

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| category | text | Y |  |
| description | text | Y |  |
| pricing_model | text | **N** | `'quote_required'::text` |
| rate_pence | int8 | Y |  |
| callout_fee_pence | int8 | Y |  |
| active | bool | **N** | `true` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### supplier_zone_assignments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| zone_id | uuid | **N** |  |
| member_id | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |

### suppliers

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| company_name | text | **N** |  |
| trading_name | text | Y |  |
| trades | _text | Y | `'{}'::text[]` |
| contact_name | text | Y |  |
| email | text | Y |  |
| phone | text | Y |  |
| website | text | Y |  |
| address_line1 | text | Y |  |
| address_city | text | Y |  |
| address_postcode | text | Y |  |
| coverage_postcodes | _text | Y |  |
| has_public_liability | bool | Y | `false` |
| public_liability_expiry | date | Y |  |
| has_employers_liability | bool | Y | `false` |
| trade_membership | text | Y |  |
| rating | numeric | Y |  |
| notes | text | Y |  |
| payment_terms_days | int4 | Y | `30` |
| status | text | **N** | `'active'::text` |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |
| name | text | Y |  |
| slug | text | Y |  |
| trade_type | text | Y |  |
| address_line2 | text | Y |  |
| city | text | Y |  |
| country | text | **N** | `'GB'::text` |
| tier | text | **N** | `'standard'::text` |
| rating_avg | numeric | Y |  |
| rating_count | int4 | **N** | `0` |
| certification | _text | Y |  |
| logo_r2_key | text | Y |  |
| archived_at | timestamptz | Y |  |
| created_by | uuid | Y |  |

### task_attachments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| task_id | uuid | **N** |  |
| file_id | uuid | **N** |  |
| caption | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |

### task_checklist_items

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| task_id | uuid | **N** |  |
| position | int4 | **N** | `0` |
| label | text | **N** |  |
| done | bool | **N** | `false` |
| done_at | timestamptz | Y |  |
| done_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### task_comments

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| task_id | uuid | **N** |  |
| parent_id | uuid | Y |  |
| author_user_id | uuid | **N** |  |
| body_md | text | **N** |  |
| mentions | _uuid | **N** | `'{}'::uuid[]` |
| edited_at | timestamptz | Y |  |
| deleted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |

### task_dependencies

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| predecessor_id | uuid | **N** |  |
| predecessor_kind | work_entity_kind _(enum: task/supplier_job)_ | **N** | `'task'::work_entity_kind` |
| successor_id | uuid | **N** |  |
| successor_kind | work_entity_kind _(enum: task/supplier_job)_ | **N** | `'task'::work_entity_kind` |
| kind | task_dependency_kind _(enum: FS/SS/FF/SF)_ | **N** | `'FS'::task_dependency_kind` |
| lag_days | int4 | **N** | `0` |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### task_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `uuid_generate_v4()` |
| workspace_id | uuid | **N** |  |
| task_id | uuid | Y |  |
| name | text | **N** |  |
| file_url | text | **N** |  |
| file_type | text | Y |  |
| file_size | int8 | Y |  |
| category | text | Y |  |
| uploaded_by | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### task_links

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| task_id | uuid | **N** |  |
| linked_kind | text | **N** |  |
| linked_id | uuid | **N** |  |
| relation | text | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### tasks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| kind | task_kind _(enum: general/maintenance/compliance/admin/inspection/turnover)_ | **N** | `'general'::task_kind` |
| title | text | **N** |  |
| description | text | Y |  |
| status | task_status _(enum: todo/in_progress/blocked/done/cancelled)_ | **N** | `'todo'::task_status` |
| priority | task_priority _(enum: low/normal/high/urgent)_ | **N** | `'normal'::task_priority` |
| property_id | uuid | Y |  |
| unit_id | uuid | Y |  |
| assignee_user_id | uuid | Y |  |
| assignee_contact_id | uuid | Y |  |
| due_at | timestamptz | Y |  |
| completed_at | timestamptz | Y |  |
| linked_compliance_id | uuid | Y |  |
| linked_supplier_job_id | uuid | Y |  |
| checklist | jsonb | **N** | `'[]'::jsonb` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |
| deleted_at | timestamptz | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| cover_file_id | uuid | Y |  |
| estimated_minutes | int4 | Y |  |
| actual_minutes | int4 | Y |  |
| recurrence_id | uuid | Y |  |
| watcher_user_ids | _uuid | **N** | `'{}'::uuid[]` |
| labels | _text | **N** | `'{}'::text[]` |
| tenancy_id | uuid | Y |  |
| duration_minutes | int4 | **N** | `60` |
| estimated_cost | numeric | Y |  |
| actual_cost | numeric | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### templates_property

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| template | property_template _(enum: standard_rental/hmo/r2r/sa_lite/student_let)_ | **N** |  |
| name | text | **N** |  |
| defaults | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### tenancies

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | **N** |  |
| unit_id | uuid | Y |  |
| status | tenancy_status _(enum: draft/active/ended/terminated/uncollectable)_ | **N** | `'draft'::tenancy_status` |
| start_date | date | **N** |  |
| end_date | date | Y |  |
| rent_amount | numeric | **N** |  |
| rent_period | text | **N** |  |
| deposit_amount | numeric | Y |  |
| deposit_scheme | text | Y |  |
| deposit_ref | text | Y |  |
| break_clause_date | date | Y |  |
| notes | text | Y |  |
| primary_contact_id | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |
| deposit_protected_at | date | Y |  |
| payment_day | int4 | Y |  |
| payment_method | text | Y |  |
| bills_inclusive | jsonb | Y |  |
| pet_policy | text | Y |  |
| smoking_allowed | bool | Y |  |
| rent_review_period_months | int4 | Y |  |
| rent_review_mechanism | text | Y |  |
| notice_period_days | int4 | Y |  |
| draft | bool | **N** | `false` |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### tenancy_parties

| column | type | null | default |
|---|---|---|---|
| tenancy_id | uuid | **N** |  |
| contact_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| role | text | **N** |  |

### transactions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| type | text | **N** | `'expense'::text` |
| category | text | Y |  |
| subcategory | text | Y |  |
| description | text | **N** |  |
| amount | numeric | **N** |  |
| currency | text | **N** | `'GBP'::text` |
| date | date | **N** |  |
| payment_method | text | Y |  |
| reference | text | Y |  |
| supplier_id | uuid | Y |  |
| invoice_id | uuid | Y |  |
| document_id | uuid | Y |  |
| status | text | **N** | `'completed'::text` |
| tax_deductible | bool | **N** | `false` |
| notes | text | Y |  |
| archived_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |

### unit_media

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| unit_id | uuid | **N** |  |
| file_id | uuid | **N** |  |
| kind | text | **N** | `'photo'::text` |
| sort_order | int4 | **N** | `0` |
| is_cover | bool | **N** | `false` |
| caption | text | Y |  |
| alt_text | text | Y |  |
| width_px | int4 | Y |  |
| height_px | int4 | Y |  |
| dominant_color | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### units

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | **N** |  |
| label | text | **N** |  |
| floor | text | Y |  |
| size_sqm | numeric | Y |  |
| is_ensuite | bool | **N** | `false` |
| status | text | **N** | `'available'::text` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| rent_amount | numeric | Y |  |
| rent_period | text | Y | `'monthly'::text` |
| bedrooms | int4 | Y |  |
| bathrooms | int4 | Y |  |
| bathroom_type | text | Y |  |
| kitchen_access | text | Y |  |
| has_window | bool | Y |  |
| heating_type | text | Y |  |
| furnished_state | text | Y |  |
| accessibility | jsonb | Y |  |
| deposit_amount | numeric | Y |  |
| notes | text | Y |  |
| demo | bool | **N** | `false` |
| demo_batch_id | uuid | Y |  |
| demo_expires_at | timestamptz | Y |  |

### usage_counters

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| metric | text | **N** |  |
| period | text | **N** |  |
| value | int8 | **N** | `0` |
| updated_at | timestamptz | **N** | `now()` |

### user_preferences

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| user_id | uuid | **N** |  |
| workspace_id | uuid | **N** |  |
| calendar | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### user_roles

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| user_id | uuid | **N** |  |
| role | app_role _(enum: owner/admin/manager/member/accountant)_ | **N** |  |
| created_at | timestamptz | **N** | `now()` |

### utility_setups

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| plan_id | uuid | Y |  |
| property_id | uuid | Y |  |
| utility_type | text | **N** |  |
| provider_name | text | Y |  |
| account_ref | text | Y |  |
| status | text | **N** | `'not_started'::text` |
| setup_date | date | Y |  |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### verification_checks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| check_type | text | **N** |  |
| result | text | **N** | `'manual_review'::text` |
| detail | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### verification_documents

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| verification_id | uuid | **N** |  |
| doc_type | text | **N** |  |
| r2_key | text | Y |  |
| status | text | **N** | `'uploaded'::text` |
| notes | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### waitlist_entries

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| email | text | **N** |  |
| name | text | Y |  |
| company | text | Y |  |
| source | text | **N** | `'waitlist'::text` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| ip_hash | text | Y |  |
| created_at | timestamptz | **N** | `now()` |

### webhook_endpoints

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| url | text | **N** |  |
| events | _text | Y | `'{}'::text[]` |
| secret_hash | text | Y |  |
| is_active | bool | Y | `true` |
| failure_count | int4 | Y | `0` |
| last_triggered_at | timestamptz | Y |  |
| created_at | timestamptz | Y | `now()` |

### webhook_events

| column | type | null | default |
|---|---|---|---|
| id | text | **N** |  |
| provider | text | **N** |  |
| type | text | **N** |  |
| received_at | timestamptz | **N** | `now()` |
| processed_at | timestamptz | Y |  |
| payload | jsonb | **N** |  |

### webhooks

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| name | text | **N** |  |
| endpoint_url | text | **N** |  |
| events | _text | **N** | `'{}'::text[]` |
| secret_hash | text | **N** |  |
| is_active | bool | **N** | `true` |
| last_triggered_at | timestamptz | Y |  |
| failure_count | int4 | **N** | `0` |
| created_by | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### work_audit_log

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| actor_id | uuid | Y |  |
| entity_type | text | **N** |  |
| entity_id | uuid | **N** |  |
| action | text | **N** |  |
| summary | text | Y |  |
| diff | jsonb | **N** | `'{}'::jsonb` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |

### work_items

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| property_id | uuid | Y |  |
| tenancy_id | uuid | Y |  |
| title | text | **N** |  |
| description | text | Y |  |
| type | text | **N** | `'task'::text` |
| status | text | **N** | `'open'::text` |
| priority | text | **N** | `'normal'::text` |
| assigned_to | uuid | Y |  |
| supplier_id | uuid | Y |  |
| due_date | date | Y |  |
| completed_at | timestamptz | Y |  |
| cost_estimate | numeric | Y |  |
| cost_actual | numeric | Y |  |
| notes | text | Y |  |
| archived_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| demo | bool | **N** | `false` |

### workspace_addons

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| addon_key | text | **N** |  |
| status | text | **N** | `'active'::text` |
| stripe_subscription_item_id | text | Y |  |
| quantity | int4 | **N** | `1` |
| metadata | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### workspace_billing

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| owner_id | uuid | **N** |  |
| stripe_customer_id | text | Y |  |
| stripe_subscription_id | text | Y |  |
| plan | text | **N** | `'free'::text` |
| billing_cycle | text | Y | `'monthly'::text` |
| trial_ends_at | timestamptz | Y |  |
| current_period_start | timestamptz | Y |  |
| current_period_end | timestamptz | Y |  |
| status | text | Y | `'active'::text` |
| created_at | timestamptz | Y | `now()` |
| updated_at | timestamptz | Y | `now()` |

### workspace_feature_overrides

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| feature_flag_id | uuid | **N** |  |
| enabled | bool | **N** |  |
| note | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| created_by | uuid | Y |  |
| updated_by | uuid | Y |  |

### workspace_invitations

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| email | text | **N** |  |
| role | text | **N** | `'member'::text` |
| token | text | **N** |  |
| invited_by | uuid | Y |  |
| status | text | **N** | `'pending'::text` |
| accepted_at | timestamptz | Y |  |
| accepted_by | uuid | Y |  |
| expires_at | timestamptz | **N** | `(now() + '14 days'::interval)` |
| created_at | timestamptz | **N** | `now()` |

### workspace_invites

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| email | citext | **N** |  |
| role | app_role _(enum: owner/admin/manager/member/accountant)_ | **N** |  |
| token_hash | text | **N** |  |
| expires_at | timestamptz | **N** | `(now() + '7 days'::interval)` |
| accepted_at | timestamptz | Y |  |
| revoked_at | timestamptz | Y |  |
| created_by | uuid | Y |  |
| created_at | timestamptz | **N** | `now()` |

### workspace_members

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| user_id | uuid | **N** |  |
| role | app_role _(enum: owner/admin/manager/member/accountant)_ | **N** |  |
| invited_by | uuid | Y |  |
| invited_at | timestamptz | Y |  |
| accepted_at | timestamptz | Y |  |
| status | text | **N** | `'invited'::text` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### workspace_role_permissions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| role | text | **N** |  |
| permission_key | text | **N** |  |
| allowed | bool | **N** | `false` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |

### workspace_settings

| column | type | null | default |
|---|---|---|---|
| workspace_id | uuid | **N** |  |
| work_approval_threshold_pence | int4 | **N** | `25000` |
| work_default_assignee_id | uuid | Y |  |
| work_default_task_template_key | text | Y |  |
| work_notification_prefs | jsonb | **N** | `'{}'::jsonb` |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| suppliers | jsonb | **N** | `'{}'::jsonb` |
| compliance | jsonb | **N** | `'{}'::jsonb` |
| money | jsonb | **N** | `'{}'::jsonb` |
| chat | jsonb | **N** | `'{}'::jsonb` |
| mail | jsonb | **N** | `'{}'::jsonb` |
| documents | jsonb | **N** | `'{}'::jsonb` |
| ai | jsonb | **N** | `jsonb_build_object('budget_pence_per_mon` |
| insights | jsonb | **N** | `jsonb_build_object('default_period', 'la` |
| calendar | jsonb | **N** | `'{}'::jsonb` |
| team | jsonb | **N** | `jsonb_build_object('seat_limit', 25, 'de` |

### workspace_slug_redirects

| column | type | null | default |
|---|---|---|---|
| old_slug | text | **N** |  |
| workspace_id | uuid | **N** |  |
| created_at | timestamptz | **N** | `now()` |
| created_by | uuid | Y |  |

### workspace_subscriptions

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| workspace_id | uuid | **N** |  |
| plan | plan_tier _(enum: starter/operator/scale/pro_agency/enterprise)_ | **N** |  |
| status | text | **N** |  |
| current_period_end | timestamptz | Y |  |
| cancel_at_period_end | bool | **N** | `false` |
| quantity | int4 | **N** | `1` |
| stripe_price_id | text | Y |  |
| raw | jsonb | Y |  |
| updated_at | timestamptz | **N** | `now()` |
| trial_ends_at | timestamptz | Y |  |
| addons | jsonb | **N** | `'[]'::jsonb` |
| seats | int4 | **N** | `1` |

### workspaces

| column | type | null | default |
|---|---|---|---|
| id | uuid | **N** | `gen_random_uuid()` |
| name | text | **N** |  |
| slug | text | **N** |  |
| owner_user_id | uuid | **N** |  |
| plan | plan_tier _(enum: starter/operator/scale/pro_agency/enterprise)_ | **N** | `'starter'::plan_tier` |
| stripe_customer_id | text | Y |  |
| stripe_subscription_id | text | Y |  |
| trial_ends_at | timestamptz | Y |  |
| settings | jsonb | **N** | `'{}'::jsonb` |
| logo_url | text | Y |  |
| brand_color | text | Y |  |
| created_at | timestamptz | **N** | `now()` |
| updated_at | timestamptz | **N** | `now()` |
| deleted_at | timestamptz | Y |  |
| purge_at | timestamptz | Y |  |
| workspace_type | text | Y | `'property-manager'::text` |
| business_type | text | Y |  |
| operation_interests | _text | **N** | `'{}'::text[]` |
| primary_operation_profile | text | Y |  |
| onboarding_completed | bool | **N** | `false` |
| plan_status | text | **N** | `'trialing'::text` |
| demo_data_loaded | bool | **N** | `false` |
| demo_data_variant | text | Y |  |
| legal_name | text | Y |  |
| company_number | text | Y |  |
| vat_number | text | Y |  |
| address | text | Y |  |
| phone | text | Y |  |
| website | text | Y |  |
| support_email | text | Y |  |
| billing_email | text | Y |  |
| timezone | text | Y | `'Europe/London'::text` |
| currency | text | Y | `'GBP'::text` |
| date_format | text | Y | `'DD/MM/YYYY'::text` |
| brand_colours | jsonb | Y |  |
| type | text | **N** | `'operator'::text` |
| business_country_code | text | **N** | `'GB'::text` |
| tax_country_code | text | **N** | `'GB'::text` |
| legal_entity_country_code | text | **N** | `'GB'::text` |
| data_region | text | **N** | `'uk'::text` |
| default_currency | text | **N** | `'GBP'::text` |
| default_language | text | **N** | `'en-GB'::text` |
| country_pack_code | text | Y |  |
| locale | text | Y |  |
| measurement_system | text | Y |  |
| plan_type | text | **N** | `'solo'::text` |

