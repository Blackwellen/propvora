-- Bug reporter / "bug catcher" store (MAX-RELEASE item 197).
--
-- Captures two kinds of report:
--   * kind = 'error'        — auto-captured from the client error boundaries
--                             (src/app/error.tsx, src/app/global-error.tsx).
--   * kind = 'user_report'  — user-submitted bug reports.
--
-- Written ONLY by the service role via /api/bug-report (see
-- src/app/api/bug-report/route.ts, which uses createAdminClient). RLS is enabled
-- with NO policies, so the table is deny-all to anon/authenticated clients — it
-- must never be reachable from the browser. The admin inbox
-- (src/app/(admin)/admin/bugs/page.tsx) also reads via the service role.
--
-- SAFETY: this table never stores secrets, tokens, or full stack traces. The API
-- caps the message length, strips secret-looking keys from `context`, and keeps
-- only a short `digest` (Next.js error digest) rather than a stack trace.
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid       NULL,
  user_id     uuid        NULL,
  kind        text        NOT NULL DEFAULT 'error'
                          CHECK (kind IN ('error', 'user_report')),
  route       text        NULL,
  message     text        NULL,
  digest      text        NULL,
  context     jsonb       NULL,
  user_agent  text        NULL,
  status      text        NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new', 'triaged', 'resolved', 'ignored')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Deny-all: enable RLS and define no policies. Only the service role bypasses RLS.
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Inbox sort/filter index: newest-first within each status.
CREATE INDEX IF NOT EXISTS bug_reports_status_created_idx
  ON public.bug_reports (status, created_at DESC);
