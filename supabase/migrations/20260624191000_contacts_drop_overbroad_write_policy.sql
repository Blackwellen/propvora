-- Contacts RLS hardening.
--
-- The table carried a legacy catch-all policy:
--   [ALL] "Members write contacts"  USING is_workspace_member(workspace_id)
-- Because Postgres OR's permissive policies, this overrode the intended
-- role-scoped gates: any workspace member (any role) could INSERT/UPDATE/DELETE
-- contacts, defeating contacts_insert_ops / contacts_update_ops (ops roles only)
-- and contacts_delete_admin (owner/admin only).
--
-- Dropping it lets the role-scoped policies take effect:
--   SELECT  -> any workspace member            (contacts_select_members)
--   INSERT  -> owner/admin/manager/member      (contacts_insert_ops)
--   UPDATE  -> owner/admin/manager/member      (contacts_update_ops)
--   DELETE  -> owner/admin                     (contacts_delete_admin)
--
-- Idempotent: safe to re-run / reproduce on a fresh database.

drop policy if exists "Members write contacts" on public.contacts;
