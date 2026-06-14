-- Supplier ratings, preferred-supplier marking, and tenant complaint / reopen
-- flow (MAX-RELEASE 165–170). Lean: an internal rating model + a lightweight
-- issue/escalation — NOT a full disputes platform.
--
-- THREE tables. All three are scoped to a workspace and gated by the existing
-- is_workspace_member(workspace_id) helper (see 003_rls_policies.sql), which is
-- the same boundary the rest of the app (jobs/contacts/tenancies) already uses.
--
-- WHY new tables rather than reusing supplier_reviews / supplier_profiles:
--   * supplier_reviews is a public-marketplace-style single-rating review
--     (rating/title/body/verified/moderated/hidden). The internal model needs
--     SEVEN distinct 1–5 dimensions + would_use_again + internal_notes, owned by
--     the operator team. Co-opting supplier_reviews would muddy that table.
--   * supplier_profiles (which DOES have preferred_supplier/internal_rating)
--     is keyed by contact_id but is NOT populated by this app's supplier flow —
--     suppliers here are `contacts` rows (type='supplier'). So preferred
--     metadata is stored against the supplier CONTACT id in supplier_preferences.
--
-- Suppliers in the app are contacts; jobs raised by tenants live in `jobs`.
-- The columns below reference those by id (no FK to contacts/jobs to stay
-- tolerant of seed/demo ids and avoid coupling).

-- ── 1. supplier_ratings — internal multi-dimension rating, by the operator team
CREATE TABLE IF NOT EXISTS public.supplier_ratings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_contact_id uuid NOT NULL,            -- the supplier `contacts` row
  -- 1–5 dimensions (nullable: a partial rating is allowed)
  quality             smallint CHECK (quality            BETWEEN 1 AND 5),
  speed               smallint CHECK (speed              BETWEEN 1 AND 5),
  communication       smallint CHECK (communication      BETWEEN 1 AND 5),
  reliability         smallint CHECK (reliability        BETWEEN 1 AND 5),
  price_value         smallint CHECK (price_value        BETWEEN 1 AND 5),
  compliance          smallint CHECK (compliance         BETWEEN 1 AND 5),
  tenant_satisfaction smallint CHECK (tenant_satisfaction BETWEEN 1 AND 5),
  would_use_again     boolean,
  internal_notes      text,
  last_job_id         uuid,                     -- optional: the job this rates
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supplier_ratings_supplier_idx
  ON public.supplier_ratings (workspace_id, supplier_contact_id, created_at DESC);

-- ── 2. supplier_preferences — preferred / blocked marking + metadata
-- One row per supplier contact per workspace. Holds the richer marking the
-- tags-based "preferred" flag can't express (reason, categories, review date,
-- blocked). The list/detail pages keep showing the badge from this table.
CREATE TABLE IF NOT EXISTS public.supplier_preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_contact_id uuid NOT NULL,
  preferred           boolean NOT NULL DEFAULT false,
  blocked             boolean NOT NULL DEFAULT false,
  reason              text,
  categories          text[] NOT NULL DEFAULT '{}',
  review_date         date,            -- when to re-review the preferred status
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, supplier_contact_id)
);

CREATE INDEX IF NOT EXISTS supplier_preferences_workspace_idx
  ON public.supplier_preferences (workspace_id, supplier_contact_id);

-- ── 3. job_complaints — tenant raises an issue / reopens a completed job
CREATE TABLE IF NOT EXISTS public.job_complaints (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_id            uuid NOT NULL,             -- the `jobs` row the tenant portal uses
  tenant_contact_id uuid,                      -- the tenant `contacts` row
  category          text,
  description       text NOT NULL,
  severity          text NOT NULL DEFAULT 'medium'
                      CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')),
  resolution_notes  text,
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_complaints_workspace_idx
  ON public.job_complaints (workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS job_complaints_job_idx
  ON public.job_complaints (job_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- All three are workspace-member scoped via the existing helper. In this V1 a
-- tenant is a signed-in Supabase user resolved to a contact in their managing
-- agent's workspace (see tenant-context.ts) — i.e. a workspace member — so the
-- same boundary the tenant portal already uses for `jobs` applies here. Tenant
-- scoping to *their own* tenancy/job is enforced in the query layer, exactly as
-- the maintenance page scopes jobs to the tenant's property ids.
ALTER TABLE public.supplier_ratings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_complaints        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_ratings_member_all ON public.supplier_ratings;
CREATE POLICY supplier_ratings_member_all ON public.supplier_ratings
  FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS supplier_preferences_member_all ON public.supplier_preferences;
CREATE POLICY supplier_preferences_member_all ON public.supplier_preferences
  FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS job_complaints_member_all ON public.job_complaints;
CREATE POLICY job_complaints_member_all ON public.job_complaints
  FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- updated_at touch triggers (reuse the shared update_updated_at() from 004)
DROP TRIGGER IF EXISTS update_supplier_ratings_updated_at ON public.supplier_ratings;
CREATE TRIGGER update_supplier_ratings_updated_at
  BEFORE UPDATE ON public.supplier_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_supplier_preferences_updated_at ON public.supplier_preferences;
CREATE TRIGGER update_supplier_preferences_updated_at
  BEFORE UPDATE ON public.supplier_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_job_complaints_updated_at ON public.job_complaints;
CREATE TRIGGER update_job_complaints_updated_at
  BEFORE UPDATE ON public.job_complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
