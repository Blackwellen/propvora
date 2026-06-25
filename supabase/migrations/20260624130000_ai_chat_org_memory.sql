-- ============================================================================
-- 20260624130000_ai_chat_org_memory.sql
-- Intelligence Layer Phase 1 — chat organisation (folders, types, pinned entity)
-- and memory tiers (thread / workspace / user).
--
-- ADDITIVE. Extends the existing ai_chat_threads (it does NOT rename it to
-- ai_chats) and adds three memory tables. Embeddings are added later by the
-- RAG migration (pgvector); memory here is key/value + rolling-summary, which
-- is useful on its own and avoids a hard pgvector dependency for Phase 1.
-- Idempotent.
-- ============================================================================

-- ── Chat folders (Gmail-style, nestable, colour-coded) ──────────────────────
CREATE TABLE IF NOT EXISTS public.ai_chat_folders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name             text NOT NULL,
  color            text,
  parent_folder_id uuid REFERENCES public.ai_chat_folders(id) ON DELETE SET NULL,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  position         int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_chat_folders_ws ON public.ai_chat_folders(workspace_id, position);

-- ── Extend ai_chat_threads: type, folder, pinned entity, archive, pin ───────
ALTER TABLE public.ai_chat_threads ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.ai_chat_folders(id) ON DELETE SET NULL;
ALTER TABLE public.ai_chat_threads ADD COLUMN IF NOT EXISTS chat_type text NOT NULL DEFAULT 'standard';
ALTER TABLE public.ai_chat_threads ADD COLUMN IF NOT EXISTS pinned_entity_type text;
ALTER TABLE public.ai_chat_threads ADD COLUMN IF NOT EXISTS pinned_entity_id text;
ALTER TABLE public.ai_chat_threads ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.ai_chat_threads ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.ai_chat_threads ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- chat_type ∈ {standard, property, portfolio, tenant, automation, project}
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_threads_chat_type_chk') THEN
    ALTER TABLE public.ai_chat_threads
      ADD CONSTRAINT ai_chat_threads_chat_type_chk
      CHECK (chat_type IN ('standard','property','portfolio','tenant','automation','project'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_folder ON public.ai_chat_threads(folder_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_pinned_entity ON public.ai_chat_threads(pinned_entity_type, pinned_entity_id);

-- ── Memory tiers ────────────────────────────────────────────────────────────
-- Per-user preferences (tone, default report format, units).
CREATE TABLE IF NOT EXISTS public.ai_memory_user (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key               text NOT NULL,
  value             jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence        numeric(4,3) NOT NULL DEFAULT 0.8,
  source_message_id uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, key)
);

-- Durable facts the engine learns about the portfolio (e.g. "preferred gas
-- contractor = X", "Property 14 is a 6-bed HMO").
CREATE TABLE IF NOT EXISTS public.ai_memory_workspace (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key          text NOT NULL,
  value        jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence   numeric(4,3) NOT NULL DEFAULT 0.8,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

-- Rolling summary + salient facts per chat thread (recalled every turn).
CREATE TABLE IF NOT EXISTS public.ai_memory_thread (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    uuid NOT NULL REFERENCES public.ai_chat_threads(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  summary      text,
  salient      jsonb NOT NULL DEFAULT '{}'::jsonb,
  token_count  int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_memory_workspace_ws ON public.ai_memory_workspace(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_ws_user ON public.ai_memory_user(workspace_id, user_id);

-- ============================================================================
-- RLS — workspace-scoped; user memory additionally user-scoped.
-- ============================================================================
ALTER TABLE public.ai_chat_folders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory_user      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory_workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory_thread    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_chat_folders_rw ON public.ai_chat_folders;
CREATE POLICY ai_chat_folders_rw ON public.ai_chat_folders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_chat_folders.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_chat_folders.workspace_id AND wm.user_id = auth.uid()));

-- User memory: a user may only read/write THEIR OWN rows within a workspace
-- they belong to (no member can read another member's preferences).
DROP POLICY IF EXISTS ai_memory_user_self ON public.ai_memory_user;
CREATE POLICY ai_memory_user_self ON public.ai_memory_user FOR ALL
  USING (user_id = auth.uid()
         AND EXISTS (SELECT 1 FROM public.workspace_members wm
                     WHERE wm.workspace_id = ai_memory_user.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid()
         AND EXISTS (SELECT 1 FROM public.workspace_members wm
                     WHERE wm.workspace_id = ai_memory_user.workspace_id AND wm.user_id = auth.uid()));

-- Workspace memory: members read; writes are server-side (service role) so the
-- engine's learned facts can't be forged by a client.
DROP POLICY IF EXISTS ai_memory_workspace_read ON public.ai_memory_workspace;
CREATE POLICY ai_memory_workspace_read ON public.ai_memory_workspace FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_memory_workspace.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS ai_memory_thread_read ON public.ai_memory_thread;
CREATE POLICY ai_memory_thread_read ON public.ai_memory_thread FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_memory_thread.workspace_id AND wm.user_id = auth.uid()));
