-- ============================================================================
-- Demo-data settings support: status RPC + "preserve edited demo records" rule.
--
--   public.demo_data_status(workspace_id) → jsonb
--       Owner/admin-readable snapshot for Settings → Demo data:
--       { loaded, injected_at, expires_at, edited_count, total_count,
--         counts: { properties, contacts, … } }. 42P01/42703-safe.
--
--   delete_demo_data(workspace_id, p_preserve_edited boolean default false)
--       Adds an opt-in to KEEP demo rows the user has since edited.
--
--   expire_demo_data() — 30-day auto-expiry now PRESERVES edited demo rows so a
--       user who has invested in a demo record doesn't silently lose it; only
--       untouched demo rows past demo_expires_at are removed.
--
-- "Edited" rule: a demo row is considered edited when updated_at is more than
-- 60 seconds after created_at. The seeder inserts every row inside ONE
-- transaction, so an untouched demo row has updated_at ≈ created_at; any later
-- UPDATE by the user pushes updated_at well past that threshold.
-- ============================================================================

-- ── helper: is a (created_at, updated_at) pair an "edited" demo row? ──────────
CREATE OR REPLACE FUNCTION public._demo_row_edited(created_at timestamptz, updated_at timestamptz)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT updated_at IS NOT NULL
     AND created_at IS NOT NULL
     AND updated_at > created_at + interval '60 seconds';
$$;

-- ── 1. demo_data_status ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.demo_data_status(p_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_loaded boolean := false;
  v_injected timestamptz;
  v_expires timestamptz;
  v_props int := 0; v_contacts int := 0; v_ten int := 0; v_units int := 0;
  v_tasks int := 0; v_jobs int := 0; v_comp int := 0; v_money int := 0;
  v_cal int := 0; v_rent int := 0; v_msg int := 0;
  v_total int := 0; v_edited int := 0;
BEGIN
  -- AuthZ: caller must be an owner/admin of the workspace.
  IF v_uid IS NULL OR NOT EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = v_uid
      AND wm.role IN ('owner','admin')
  ) THEN
    RAISE EXCEPTION 'Not authorised for workspace %', p_workspace_id
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(demo_data_loaded, false) INTO v_loaded
  FROM workspaces WHERE id = p_workspace_id;

  -- Per-table counts (properties is the canonical "anchor" set).
  SELECT count(*),
         min(created_at), min(demo_expires_at),
         count(*) FILTER (WHERE public._demo_row_edited(created_at, updated_at))
    INTO v_props, v_injected, v_expires, v_edited
  FROM properties WHERE workspace_id = p_workspace_id AND demo;

  SELECT count(*) INTO v_contacts FROM contacts WHERE workspace_id = p_workspace_id AND demo;
  SELECT count(*) INTO v_ten      FROM tenancies WHERE workspace_id = p_workspace_id AND demo;
  SELECT count(*) INTO v_units    FROM units WHERE workspace_id = p_workspace_id AND demo;
  SELECT count(*) INTO v_tasks    FROM tasks WHERE workspace_id = p_workspace_id AND demo;
  SELECT count(*) INTO v_jobs     FROM jobs WHERE workspace_id = p_workspace_id AND (demo OR is_demo);
  SELECT count(*) INTO v_comp     FROM compliance_items WHERE workspace_id = p_workspace_id AND demo;
  SELECT count(*) INTO v_money    FROM money_transactions WHERE workspace_id = p_workspace_id AND demo;
  SELECT count(*) INTO v_cal      FROM calendar_events WHERE workspace_id = p_workspace_id AND demo;
  SELECT count(*) INTO v_rent     FROM rent_schedules WHERE workspace_id = p_workspace_id AND demo;
  SELECT count(*) INTO v_msg      FROM message_threads WHERE workspace_id = p_workspace_id AND demo;

  -- Fold edited-counts from the other dated tables into v_edited.
  v_edited := v_edited
    + (SELECT count(*) FROM contacts WHERE workspace_id = p_workspace_id AND demo AND public._demo_row_edited(created_at, updated_at))
    + (SELECT count(*) FROM tenancies WHERE workspace_id = p_workspace_id AND demo AND public._demo_row_edited(created_at, updated_at))
    + (SELECT count(*) FROM units WHERE workspace_id = p_workspace_id AND demo AND public._demo_row_edited(created_at, updated_at))
    + (SELECT count(*) FROM tasks WHERE workspace_id = p_workspace_id AND demo AND public._demo_row_edited(created_at, updated_at))
    + (SELECT count(*) FROM jobs WHERE workspace_id = p_workspace_id AND (demo OR is_demo) AND public._demo_row_edited(created_at, updated_at))
    + (SELECT count(*) FROM compliance_items WHERE workspace_id = p_workspace_id AND demo AND public._demo_row_edited(created_at, updated_at))
    + (SELECT count(*) FROM money_transactions WHERE workspace_id = p_workspace_id AND demo AND public._demo_row_edited(created_at, updated_at));

  v_total := v_props + v_contacts + v_ten + v_units + v_tasks + v_jobs + v_comp + v_money + v_cal + v_rent + v_msg;

  RETURN jsonb_build_object(
    'loaded', v_loaded,
    'injected_at', v_injected,
    'expires_at', v_expires,
    'total_count', v_total,
    'edited_count', v_edited,
    'counts', jsonb_build_object(
      'properties', v_props,
      'contacts', v_contacts,
      'tenancies', v_ten,
      'units', v_units,
      'tasks', v_tasks,
      'jobs', v_jobs,
      'compliance', v_comp,
      'transactions', v_money,
      'events', v_cal,
      'rent_schedules', v_rent,
      'message_threads', v_msg
    )
  );
END;
$$;

-- ── 2. delete_demo_data with preserve-edited option ──────────────────────────
-- Drop the old single-arg signature; recreate with the optional flag (a default
-- keeps existing `rpc('delete_demo_data', { p_workspace_id })` callers working).
DROP FUNCTION IF EXISTS public.delete_demo_data(uuid);

CREATE OR REPLACE FUNCTION public.delete_demo_data(
  p_workspace_id uuid,
  p_preserve_edited boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  keep boolean := p_preserve_edited;
BEGIN
  -- Children first (FK order). When preserving edits, edited parents (and their
  -- children) are kept; we only delete untouched demo rows.
  -- Messages/threads + possession evidence/cases are never user-edited demo
  -- content in practice, so they always go.
  DELETE FROM messages           WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM message_threads    WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM possession_evidence WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM possession_cases   WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM hmo_licences       WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM rent_schedules     WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM money_transactions WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM calendar_events    WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM ppm_plans          WHERE workspace_id = p_workspace_id AND is_demo;
  DELETE FROM compliance_items   WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM jobs               WHERE workspace_id = p_workspace_id AND (demo OR is_demo)
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM tasks              WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM notifications      WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM tenancies          WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM units              WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  DELETE FROM contacts           WHERE workspace_id = p_workspace_id AND demo
    AND (NOT keep OR NOT public._demo_row_edited(created_at, updated_at));
  -- Only delete a property when it has no surviving demo children referencing it.
  DELETE FROM properties p WHERE p.workspace_id = p_workspace_id AND p.demo
    AND (NOT keep OR NOT public._demo_row_edited(p.created_at, p.updated_at))
    AND NOT EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM tenancies t WHERE t.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM tasks tk WHERE tk.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM compliance_items c WHERE c.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM money_transactions m WHERE m.property_id = p.id);

  -- Clear the loaded flag only when no demo properties remain.
  UPDATE workspaces SET demo_data_loaded = false, demo_data_variant = NULL
  WHERE id = p_workspace_id
    AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.workspace_id = p_workspace_id AND p.demo);
END;
$$;

-- ── 3. expire_demo_data — preserve edited rows on auto-expiry ─────────────────
CREATE OR REPLACE FUNCTION public.expire_demo_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer := 0;
  c integer;
BEGIN
  DELETE FROM messages           WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM message_threads    WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM possession_evidence WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM possession_cases   WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM hmo_licences       WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM rent_schedules     WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM money_transactions WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM calendar_events    WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM ppm_plans          WHERE is_demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM compliance_items   WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM jobs               WHERE (demo OR is_demo) AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM tasks              WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM notifications      WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM tenancies          WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM units              WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM contacts           WHERE demo AND demo_expires_at < now() AND NOT public._demo_row_edited(created_at, updated_at); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  -- Properties last; keep any with surviving demo children or that were edited.
  DELETE FROM properties p WHERE p.demo AND p.demo_expires_at < now()
    AND NOT public._demo_row_edited(p.created_at, p.updated_at)
    AND NOT EXISTS (SELECT 1 FROM units u WHERE u.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM tenancies t WHERE t.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM tasks tk WHERE tk.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM compliance_items c2 WHERE c2.property_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM money_transactions m WHERE m.property_id = p.id);
  GET DIAGNOSTICS c = ROW_COUNT; n := n + c;

  UPDATE workspaces w SET demo_data_loaded = false, demo_data_variant = NULL
  WHERE demo_data_loaded = true
    AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.workspace_id = w.id AND p.demo);

  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.demo_data_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_demo_data(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._demo_row_edited(timestamptz, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_demo_data() TO service_role;
