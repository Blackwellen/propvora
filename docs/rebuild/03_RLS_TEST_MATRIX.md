# Propvora RLS Test Matrix

**56-point checklist** — to be run after applying migrations to Supabase.

Legend: `PASS` | `TODO` | `FAIL`

---

## 1. Profiles

| # | Test | Status |
|---|------|--------|
| 1 | Authenticated user can SELECT own profile | TODO |
| 2 | Authenticated user cannot SELECT another user's profile | TODO |
| 3 | Authenticated user can UPDATE own profile | TODO |
| 4 | Unauthenticated request returns 0 rows on SELECT | TODO |
| 5 | Platform admin can SELECT any profile | TODO |

---

## 2. Workspaces & Members

| # | Test | Status |
|---|------|--------|
| 6 | Workspace member can SELECT their workspace | TODO |
| 7 | Non-member cannot SELECT workspace | TODO |
| 8 | Owner can UPDATE workspace settings | TODO |
| 9 | Non-owner member cannot UPDATE workspace | TODO |
| 10 | Member can SELECT workspace_members for their workspace | TODO |
| 11 | Non-member cannot SELECT workspace_members | TODO |
| 12 | Admin/owner can INSERT new workspace_member | TODO |
| 13 | Regular member cannot INSERT workspace_member | TODO |

---

## 3. Properties

| # | Test | Status |
|---|------|--------|
| 14 | Workspace member can SELECT properties | TODO |
| 15 | Non-member cannot SELECT properties (returns empty) | TODO |
| 16 | Workspace member can INSERT property | TODO |
| 17 | Workspace member can UPDATE property | TODO |
| 18 | Workspace member can DELETE property | TODO |
| 19 | Platform admin can SELECT all properties across workspaces | TODO |

---

## 4. Tenancies & Units

| # | Test | Status |
|---|------|--------|
| 20 | Workspace member can SELECT tenancies | TODO |
| 21 | Non-member cannot SELECT tenancies | TODO |
| 22 | Workspace member can INSERT/UPDATE/DELETE tenancies | TODO |
| 23 | Workspace member can SELECT property_units | TODO |
| 24 | Non-member cannot SELECT property_units | TODO |

---

## 5. Contacts

| # | Test | Status |
|---|------|--------|
| 25 | Workspace member can SELECT contacts | TODO |
| 26 | Non-member cannot SELECT contacts | TODO |
| 27 | Workspace member can INSERT contact | TODO |
| 28 | Workspace member can UPDATE contact | TODO |

---

## 6. Tasks & Jobs

| # | Test | Status |
|---|------|--------|
| 29 | Workspace member can SELECT tasks | TODO |
| 30 | Non-member cannot SELECT tasks | TODO |
| 31 | Workspace member can INSERT/UPDATE/DELETE tasks | TODO |
| 32 | Workspace member can SELECT jobs | TODO |
| 33 | Non-member cannot SELECT jobs | TODO |
| 34 | Workspace member can INSERT/UPDATE/DELETE jobs | TODO |

---

## 7. Planning Engine

| # | Test | Status |
|---|------|--------|
| 35 | Workspace member can SELECT planning_sets | TODO |
| 36 | Non-member cannot SELECT planning_sets | TODO |
| 37 | Member can INSERT/UPDATE/DELETE planning_sets | TODO |
| 38 | Member can SELECT planning_income_lines via parent | TODO |
| 39 | Member can SELECT planning_room_lines via parent | TODO |
| 40 | Member can SELECT planning_expense_lines via parent | TODO |
| 41 | Member can SELECT planning_upfront_costs via parent | TODO |
| 42 | Non-member cannot SELECT any planning sub-table lines | TODO |

---

## 8. Money (Income, Expenses, Invoices)

| # | Test | Status |
|---|------|--------|
| 43 | Workspace member can SELECT income_records | TODO |
| 44 | Non-member cannot SELECT income_records | TODO |
| 45 | Workspace member can SELECT expense_records | TODO |
| 46 | Workspace member can SELECT invoices | TODO |
| 47 | Non-member cannot SELECT invoices | TODO |

---

## 9. AI

| # | Test | Status |
|---|------|--------|
| 48 | User can SELECT only their own ai_chat_threads | TODO |
| 49 | User cannot SELECT another user's ai_chat_threads | TODO |
| 50 | User can SELECT ai_chat_messages for their workspace | TODO |
| 51 | Non-member cannot SELECT ai_chat_messages | TODO |

---

## 10. Affiliates

| # | Test | Status |
|---|------|--------|
| 52 | User can SELECT own affiliate record | TODO |
| 53 | User cannot SELECT another user's affiliate record | TODO |
| 54 | User can SELECT own affiliate_clicks / referrals / commissions | TODO |
| 55 | Platform admin can SELECT all affiliate records | TODO |

---

## 11. Notifications

| # | Test | Status |
|---|------|--------|
| 56 | User can SELECT only their own notifications | TODO |

---

## How to Run

Use Supabase SQL Editor or a test script with the `@supabase/supabase-js` client:

```typescript
// Example test pattern
const { data, error } = await supabaseAsUserA
  .from('properties')
  .select('id')
  .eq('workspace_id', workspaceOfUserB)

// Should return: data = [], error = null (RLS silently filters)
assert(data?.length === 0, 'Cross-workspace data leak detected')
```

For admin tests, use the service-role key only in the test environment — never in client code.
