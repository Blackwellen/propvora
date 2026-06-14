-- GDPR account-lifecycle request capture: erasure (right to be forgotten) and
-- data export (subject access request). These tables record the REQUEST; the
-- destructive erasure / export generation is performed by an admin-reviewed
-- worker (kept separate so deletion is never accidental).

-- ── Account / workspace deletion requests ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id    uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  request_type    text NOT NULL DEFAULT 'user_account'
                    CHECK (request_type IN ('user_account', 'workspace')),
  requested_by    uuid NOT NULL,
  requested_at    timestamptz NOT NULL DEFAULT now(),
  scheduled_for   timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  completed_at    timestamptz,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'scheduled', 'cancelled', 'completed')),
  retention_reason text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Data export (SAR) requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'ready', 'expired', 'failed')),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  ready_at      timestamptz,
  expires_at    timestamptz,
  download_key  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Only one open request of each kind per user (prevents spam / duplicates).
CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_one_open_per_user
  ON public.account_deletion_requests (user_id)
  WHERE status IN ('pending', 'scheduled');
CREATE UNIQUE INDEX IF NOT EXISTS data_export_one_open_per_user
  ON public.data_export_requests (user_id)
  WHERE status IN ('pending', 'processing', 'ready');

-- ── RLS: a user sees and creates only their own requests. The service role
--    (admin worker) bypasses RLS to process them. ─────────────────────────────
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS adr_select_own ON public.account_deletion_requests;
CREATE POLICY adr_select_own ON public.account_deletion_requests
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS adr_insert_own ON public.account_deletion_requests;
CREATE POLICY adr_insert_own ON public.account_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());
-- Allow a user to CANCEL their own pending/scheduled request.
DROP POLICY IF EXISTS adr_update_own ON public.account_deletion_requests;
CREATE POLICY adr_update_own ON public.account_deletion_requests
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS der_select_own ON public.data_export_requests;
CREATE POLICY der_select_own ON public.data_export_requests
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS der_insert_own ON public.data_export_requests;
CREATE POLICY der_insert_own ON public.data_export_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());
