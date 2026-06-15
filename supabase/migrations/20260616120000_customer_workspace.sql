-- ============================================================================
-- P7 — CUSTOMER WORKSPACE: data model (phase P7)
--
-- The buyer/guest-SIDE workspace data layer: a profile and a saved-listings
-- (favourites) list for a workspace whose `workspaces.type = 'customer'`. This
-- is the customer's OWN workspace (where the buyer/guest logs in to see their
-- bookings, marketplace orders, saved listings, messages and profile), NOT any
-- operator-side contact record.
--
-- Membership of a customer workspace is tracked by `customer_workspace_members`
-- (P0 foundation, 20260616010000_v2_foundation.sql); the (customer) route group
-- gates on it. The workspace owner is ALSO bootstrapped into `workspace_members`
-- via the workspaces_bootstrap_owner trigger, so we admit either path.
--
-- Naming mirrors the P3 supplier-workspace decision: DISTINCT new table names
-- (`customer_profiles`, `customer_saved_listings`) — additive, never repurposing
-- existing operator-side tables.
--
-- Also: bookings made as a GUEST (guest_email / guest_name, no account) need to
-- be associable with a logged-in customer once they sign in. We add a nullable
-- `bookings.customer_workspace_id` (ADD COLUMN IF NOT EXISTS) so a customer's
-- own stays can be linked to their customer workspace. The customer booking
-- read path matches EITHER customer_workspace_id = <their ws> OR
-- guest_email = <their account email> — never another customer's rows.
--
-- Fully IDEMPOTENT: create table if not exists + guarded policies/indexes;
-- additive ADD COLUMN IF NOT EXISTS reconciliation; never destructive.
-- ============================================================================

-- ── 0. Helper: is the current user a member of this CUSTOMER workspace? ──────
-- SECURITY DEFINER so it can read customer_workspace_members regardless of the
-- caller's own RLS. Admits the operator/owner workspace-member path too (the
-- owner is bootstrapped into workspace_members), so the customer always sees
-- their own rows. Only ever checks the CURRENT auth.uid().
CREATE OR REPLACE FUNCTION public.is_customer_workspace_member(
  _workspace_id uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    public.is_workspace_member(_workspace_id)
    OR EXISTS (
      SELECT 1
      FROM public.customer_workspace_members cwm
      WHERE cwm.workspace_id = _workspace_id
        AND cwm.user_id = auth.uid()
    );
$$;
REVOKE ALL ON FUNCTION public.is_customer_workspace_member(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_customer_workspace_member(uuid) TO authenticated;

-- ── 1. customer_profiles ─────────────────────────────────────────────────────
-- One profile per customer workspace → workspace_id is the PK.
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  workspace_id  uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  display_name  text,
  email         text,
  phone         text,
  preferences   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- additive reconciliation (no-op on a fresh create; future-proof on re-runs)
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS email        text,
  ADD COLUMN IF NOT EXISTS phone        text,
  ADD COLUMN IF NOT EXISTS preferences  jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

-- ── 2. customer_saved_listings (favourites) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_saved_listings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  listing_id   uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_saved_listings_unique UNIQUE (workspace_id, listing_id)
);
CREATE INDEX IF NOT EXISTS customer_saved_listings_ws_idx
  ON public.customer_saved_listings (workspace_id);
CREATE INDEX IF NOT EXISTS customer_saved_listings_listing_idx
  ON public.customer_saved_listings (listing_id);

-- ── 3. bookings.customer_workspace_id (link guest bookings to a customer) ────
-- Nullable + additive. Lets a logged-in customer's stays be associated with
-- their customer workspace, while legacy guest bookings (email-only) remain
-- reachable via guest_email matching in the read path.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS bookings_customer_workspace_idx
  ON public.bookings (customer_workspace_id);

-- ── 4. updated_at trigger (reuse shared fn if present) ──────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON public.customer_profiles;
    CREATE TRIGGER update_customer_profiles_updated_at
      BEFORE UPDATE ON public.customer_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── 5. RLS — scoped to customer workspace membership ────────────────────────
-- Pattern: is_customer_workspace_member(workspace_id) (admits both the
-- customer_workspace_members path and the operator/owner workspace_members path).

-- 5a. customer_profiles
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_profiles_member_all ON public.customer_profiles;
CREATE POLICY customer_profiles_member_all ON public.customer_profiles
  FOR ALL
  USING (public.is_customer_workspace_member(workspace_id))
  WITH CHECK (public.is_customer_workspace_member(workspace_id));

-- 5b. customer_saved_listings
ALTER TABLE public.customer_saved_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_saved_listings_member_all ON public.customer_saved_listings;
CREATE POLICY customer_saved_listings_member_all ON public.customer_saved_listings
  FOR ALL
  USING (public.is_customer_workspace_member(workspace_id))
  WITH CHECK (public.is_customer_workspace_member(workspace_id));

-- ============================================================================
-- END P7 customer workspace data model
-- ============================================================================
