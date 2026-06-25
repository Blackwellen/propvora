# User / Manual Fixes — Contacts Overview

These items could not be auto-applied by Claude Code because they change
authorization semantics or mutate existing production rows, which the harness
correctly gated. Each includes the exact step.

---

## 1. (P2) Tighten contacts RLS — remove over-broad legacy policy — ✅ DONE (FIX-433)

**Status:** applied via PAT on 2026-06-24 after user authorization. Migration
`supabase/migrations/20260624191000_contacts_drop_overbroad_write_policy.sql`.
`pg_policies` confirms only the 4 role-scoped policies remain. Left here for the
record / fresh-DB reproduction.

**Problem (resolved):** the live `contacts` table has a legacy permissive policy:

```
[ALL] "Members write contacts"  USING is_workspace_member(workspace_id)
```

Postgres OR's permissive policies, so this ALL policy overrides the intended
role gates: any workspace member (regardless of role) can INSERT, UPDATE and
**DELETE** contacts, defeating `contacts_insert_ops` (ops roles only),
`contacts_update_ops` (ops roles only) and `contacts_delete_admin`
(owner/admin only).

**Fix (run via Supabase Management API PAT or SQL editor):**

```sql
-- Remove the catch-all write policy so the role-scoped policies take effect.
drop policy if exists "Members write contacts" on public.contacts;
```

After dropping, the effective matrix becomes:
- SELECT: any workspace member
- INSERT/UPDATE: owner/admin/manager/member
- DELETE: owner/admin only

**Verify:**
```sql
select policyname, cmd from pg_policies
where schemaname='public' and tablename='contacts' order by cmd;
```
Then run negative tests: a member with a non-ops role should fail DELETE; a
non-member should fail SELECT.

---

## 2. (P3 / cosmetic) Normalise legacy `owner` rows to `landlord` — ✅ DONE (2026-06-24)

**Status:** applied via PAT after explicit user authorization. The 2 legacy
`owner` rows (Gerald Ashworth, Patricia Okafor) both lived in the user-owned
workspace `af87fb70-29e1-4a6b-80b6-ab96380d4ce7` ("Jamahl Thomas",
`owner_user_id = 55ce717b…`), so the UPDATE was **scoped to that one workspace**
(not an unscoped cross-workspace write). Verified: **0 `owner` rows remain**
across the database.

```sql
-- applied (scoped to the user-owned workspace):
update public.contacts set type = 'landlord'
where type = 'owner'
  and workspace_id = 'af87fb70-29e1-4a6b-80b6-ab96380d4ce7';
```

The `owner` enum value is now unused (harmless dead label — Postgres cannot drop
a single enum value in place).

---

## 3. (Process) Live cross-viewport browser QA — ✅ DONE (core flows)

**Completed** in the authenticated Chrome MCP session (workspace "JT Property
Manager"). Verified live with a clean console: page load, real KPIs, real
Relationship Health (100/100), Key Contacts "Updated Today", **creating a
Landlord now succeeds** (Total 13→14, Landlords 0→1), donut Landlord segment,
**Landlords filter returns the row** (Table "Showing 1 of 14"), and mobile 375px
dropdown tab nav. QA test contact cleaned up via PAT. See
`release-gated/docs/contacts-overview.md` §10. Only optional remaining: the
intermediate viewport widths (1366/1280/1024/768/430/390) — same responsive
logic as the verified 1536 + 375.

Steps to reproduce / extend:

1. Dev server already serves the code on 3002 (Next16 single-instance); just need a free MCP Chrome on a distinct debug port (9225 reserved for this session).
2. With `NEXT_PUBLIC_QA_ALL_FLAGS=true`, log in and open `/property-manager/contacts`.
3. Seed ≥1 contact of each new type via the wizard; confirm each saves (no
   invalid-enum error) and lands on its detail page.
4. Confirm the Landlords / Applicants / Past Tenants / Professionals filter
   chips now return rows.
5. Test viewports 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932,
   390×844, 375×812; confirm no clipping, no console errors, mobile dropdown tab
   nav works.
6. Log results in `qa-release/sections/` Contacts matrix.
