-- Comms: product Changelog + Announcements (MAX-RELEASE 198, 199, 201).
--
-- Three tables:
--   changelog_entries     — public, versioned release notes. Published entries
--                           are world-readable; only the service role writes.
--   announcements         — global (workspace_id IS NULL) or workspace-scoped
--                           in-app banners with severity / schedule / audience.
--                           Published + in-window + audience-matched rows are
--                           readable by members; only the service role writes.
--   announcement_dismissals — per-user dismissal record so a banner stays gone.
--
-- body_html on both content tables is sanitised in the application layer
-- (src/lib/comms/sanitize.ts) before it is ever stored or rendered.

-- ── Changelog ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version       text,
  title         text NOT NULL,
  body_html     text,
  category      text,
  tags          text[] NOT NULL DEFAULT '{}',
  published     boolean NOT NULL DEFAULT false,
  published_at  timestamptz,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS changelog_entries_published_idx
  ON public.changelog_entries (published, published_at DESC);

-- ── Announcements ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE, -- NULL = global
  title         text NOT NULL,
  body_html     text,
  severity      text NOT NULL DEFAULT 'info'
                  CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  audience      text NOT NULL DEFAULT 'all',
  starts_at     timestamptz,
  ends_at       timestamptz,
  dismissible   boolean NOT NULL DEFAULT true,
  published     boolean NOT NULL DEFAULT false,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_active_idx
  ON public.announcements (published, workspace_id, starts_at, ends_at);

-- ── Dismissals ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  dismissed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS announcement_dismissals_user_idx
  ON public.announcement_dismissals (user_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.changelog_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals  ENABLE ROW LEVEL SECURITY;

-- Changelog: anyone (incl. anon) may read PUBLISHED entries. No write policy is
-- defined, so all INSERT/UPDATE/DELETE are denied to anon/authenticated and
-- only the service role (which bypasses RLS) can write.
DROP POLICY IF EXISTS changelog_select_published ON public.changelog_entries;
CREATE POLICY changelog_select_published ON public.changelog_entries
  FOR SELECT
  USING (published);

-- Announcements: a row is readable if it is published AND either global
-- (workspace_id IS NULL) or the caller is a member of its workspace. Window /
-- audience filtering is applied in the query layer; RLS enforces the workspace
-- boundary. No write policy → service-role-only writes.
DROP POLICY IF EXISTS announcements_select_visible ON public.announcements;
CREATE POLICY announcements_select_visible ON public.announcements
  FOR SELECT
  USING (
    published
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = announcements.workspace_id
          AND wm.user_id = auth.uid()
      )
    )
  );

-- Dismissals: a user manages only their own rows.
DROP POLICY IF EXISTS dismissals_select_own ON public.announcement_dismissals;
CREATE POLICY dismissals_select_own ON public.announcement_dismissals
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS dismissals_insert_own ON public.announcement_dismissals;
CREATE POLICY dismissals_insert_own ON public.announcement_dismissals
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
