-- ============================================================================
-- 20260625120000_ai_embeddings_rag.sql
-- Intelligence Layer Phase 2 — retrieval (RAG) over workspace records/docs.
--
-- pgvector embeddings + a hybrid (semantic + full-text) match function, all
-- RLS-scoped so retrieval can NEVER surface a record the caller can't see.
-- Embeddings are 1024-dim (NVIDIA NIM `baai/bge-m3`, GDPR-compliant US infra).
-- ADDITIVE + idempotent.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.ai_embeddings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- what this chunk came from: 'property' | 'tenancy' | 'document' | 'task' | …
  source_type   text NOT NULL,
  source_id     text NOT NULL,
  chunk_index   int  NOT NULL DEFAULT 0,
  content       text NOT NULL,
  -- generated full-text vector for the BM25-style half of hybrid search
  content_tsv   tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED,
  embedding     vector(1024),
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, source_type, source_id, chunk_index)
);

-- Vector ANN index (cosine) + full-text GIN + source lookup.
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_vec
  ON public.ai_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_tsv
  ON public.ai_embeddings USING gin (content_tsv);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_ws_source
  ON public.ai_embeddings (workspace_id, source_type, source_id);

ALTER TABLE public.ai_embeddings ENABLE ROW LEVEL SECURITY;

-- Members read their own workspace's embeddings; writes are server-side
-- (service role) so the index can't be poisoned by a client.
DROP POLICY IF EXISTS ai_embeddings_ws_read ON public.ai_embeddings;
CREATE POLICY ai_embeddings_ws_read ON public.ai_embeddings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_embeddings.workspace_id AND wm.user_id = auth.uid()));

-- ── Hybrid match function ────────────────────────────────────────────────────
-- SECURITY INVOKER → runs as the caller, so the RLS policy above still applies
-- (a member can only ever match rows in their own workspace). Fuses cosine
-- similarity with full-text rank; weight favours semantic but rewards lexical
-- hits. Returns the source ref so the UI can deep-link + the answer can cite.
CREATE OR REPLACE FUNCTION public.ai_match_embeddings(
  p_workspace uuid,
  p_embedding vector(1024),
  p_query     text,
  p_k         int DEFAULT 8
)
RETURNS TABLE (
  id          uuid,
  source_type text,
  source_id   text,
  content     text,
  similarity  float,
  score       float
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT e.id, e.source_type, e.source_id, e.content,
         1 - (e.embedding <=> p_embedding) AS similarity,
         (1 - (e.embedding <=> p_embedding)) * 0.7
           + COALESCE(ts_rank(e.content_tsv, websearch_to_tsquery('english', p_query)), 0) * 0.3 AS score
  FROM public.ai_embeddings e
  WHERE e.workspace_id = p_workspace
    AND e.embedding IS NOT NULL
  ORDER BY score DESC
  LIMIT GREATEST(1, LEAST(p_k, 50));
$$;
