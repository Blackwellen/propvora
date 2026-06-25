-- ============================================================================
-- Demo seeder idempotency guard (W-WIZ-OPEN-06 root-cause prevention)
--
-- `public.seed_full_demo_workspace(workspace_id, user_id)` builds a full demo
-- substrate (properties/units/tenancies/...) on each call but had no
-- early-return guard. Calling it twice on the same workspace — or alongside the
-- separate `enterprise_full_seed.sql` — produced DUPLICATE demo properties
-- (e.g. "42 Sycamore Road" ×2). The function already sets
-- `workspaces.demo_data_loaded = true` when it finishes; this guard simply
-- honours that flag so a re-seed is a safe no-op.
--
-- We patch the *live* function in place rather than re-embedding its 500+ line
-- body: read the current definition with pg_get_functiondef(), inject the guard
-- immediately before the existing "Membership guard" comment, and recreate it.
-- This is robust to the body being patched by later migrations
-- (e.g. 20260623_add_planning_to_demo_seed), and is idempotent via the marker
-- check so re-running the migration is harmless.
--
-- Security note: the guard runs BEFORE the membership check, but a non-member
-- can still never SEED — on an unseeded workspace the guard passes through to
-- the membership RAISE. It only converts the "already-loaded" case from an
-- error into a silent no-op, which is harmless. Returning NULL is safe: both
-- callers (/api/demo/seed and workspace.ts via _v2) only inspect `error`.
-- ============================================================================

DO $mig$
DECLARE
  v_def text;
BEGIN
  v_def := pg_get_functiondef('public.seed_full_demo_workspace(uuid,uuid)'::regprocedure);

  IF position('Idempotency guard (W-WIZ-OPEN-06)' in v_def) = 0 THEN
    v_def := replace(
      v_def,
      '  -- Membership guard: only seed workspaces the caller belongs to.',
           '  -- Idempotency guard (W-WIZ-OPEN-06): never re-seed a workspace that already'
      || E'\n  -- carries demo data, or a second call builds a full duplicate substrate'
      || E'\n  -- (duplicate demo properties / units / tenancies). The seeder sets'
      || E'\n  -- demo_data_loaded = true when it finishes; reset_demo_data clears it.'
      || E'\n  IF (SELECT demo_data_loaded FROM workspaces WHERE id = p_workspace_id) THEN'
      || E'\n    RETURN NULL;'
      || E'\n  END IF;'
      || E'\n'
      || E'\n  -- Membership guard: only seed workspaces the caller belongs to.'
    );
    EXECUTE v_def;
    RAISE NOTICE 'seed_full_demo_workspace: idempotency guard installed';
  ELSE
    RAISE NOTICE 'seed_full_demo_workspace: idempotency guard already present, skipping';
  END IF;
END
$mig$;
