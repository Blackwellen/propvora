# Propvora Supabase Schema & RLS Overview

**Supabase project:** `oovgfknmzjcgbilwumch.supabase.co`
**Migration files:** `supabase/migrations/001–004`

---

## Migration Files

| File | Purpose |
|------|---------|
| `001_core_schema.sql` | All table definitions + feature_flags seed |
| `002_indexes.sql` | Performance indexes on all hot query paths |
| `003_rls_policies.sql` | Enable RLS + all row-level security policies |
| `004_functions.sql` | updated_at triggers, handle_new_user, portfolio summary |

---

## Table Overview

| Table | Scope | RLS Pattern | Demo Data |
|-------|-------|-------------|-----------|
| `profiles` | per-user | Own row only | No |
| `workspaces` | per-workspace | Members read, owner writes | No |
| `workspace_members` | per-workspace | Members read own, admin manages | No |
| `properties` | per-workspace | Workspace member | Yes (is_demo) |
| `property_units` | per-workspace | Workspace member | Yes |
| `tenancies` | per-workspace | Workspace member | Yes |
| `contacts` | per-workspace | Workspace member | Yes |
| `tasks` | per-workspace | Workspace member | Yes |
| `jobs` | per-workspace | Workspace member | Yes |
| `planning_sets` | per-workspace | Workspace member | Yes |
| `planning_assumptions` | via planning_sets | Via parent FK | No |
| `planning_income_lines` | via planning_sets | Via parent FK | No |
| `planning_room_lines` | via planning_sets | Via parent FK | No |
| `planning_expense_lines` | via planning_sets | Via parent FK | No |
| `planning_bill_lines` | via planning_sets | Via parent FK | No |
| `planning_upfront_costs` | via planning_sets | Via parent FK | No |
| `planning_landlord_offers` | per-workspace | Workspace member | Yes |
| `income_records` | per-workspace | Workspace member | Yes |
| `expense_records` | per-workspace | Workspace member | Yes |
| `invoices` | per-workspace | Workspace member | Yes |
| `calendar_events` | per-workspace | Workspace member | Yes |
| `conversations` | per-workspace | Workspace member | Yes |
| `messages` | per-workspace | Workspace member | Yes |
| `ai_chat_threads` | per-user + workspace | Own user_id | No |
| `ai_chat_messages` | per-workspace | Workspace member | No |
| `ai_action_logs` | per-user + workspace | Own user_id | No |
| `supplier_portal_access` | per-workspace | Workspace member + own user | No |
| `supplier_jobs` | per-workspace | Workspace member | No |
| `supplier_invoices` | per-workspace | Workspace member | No |
| `affiliates` | per-user | Own user_id | No |
| `affiliate_clicks` | via affiliate | Own affiliate | No |
| `affiliate_referrals` | via affiliate | Own affiliate | No |
| `affiliate_commissions` | via affiliate | Own affiliate | No |
| `documents` | per-workspace | Workspace member | Yes |
| `subscriptions` | per-workspace | Read: member, Write: admin | No |
| `audit_logs` | platform | Admin read only, system insert | No |
| `activity_logs` | per-workspace | Workspace member | Yes |
| `notifications` | per-user | Own user_id | No |
| `feature_flags` | platform | No RLS (public read in app) | Pre-seeded |

---

## RLS Helper Functions

```sql
is_workspace_member(ws_id UUID) → BOOLEAN
user_workspace_ids() → SETOF UUID
is_platform_admin() → BOOLEAN
```

All defined as `SECURITY DEFINER` to prevent RLS recursion.

---

## Triggers

| Trigger | Table | Action |
|---------|-------|--------|
| `on_auth_user_created` | `auth.users` | Creates profile row automatically |
| `update_*_updated_at` | All tables with `updated_at` | Sets `updated_at = now()` |

---

## Demo Data System

- All demo records carry `is_demo = true`
- Seed: `POST /api/demo/seed` with `{ workspaceId, variant }`
- Reset: `POST /api/demo/reset` with `{ workspaceId }`
- Both require `owner` or `admin` role membership
- Seeder code: `src/lib/demo/seed.ts`
- Reset code: `src/lib/demo/reset.ts`

---

## TypeScript Types

All types defined in `src/types/database.ts`:
- Row types: `Profile`, `Workspace`, `Property`, etc.
- Insert types: `InsertProperty`, `InsertContact`, etc.
- Update types: `UpdateProperty`, `UpdateContact`, etc.
- `Database` interface for Supabase generics
