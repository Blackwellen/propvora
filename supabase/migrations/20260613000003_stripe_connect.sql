-- Stripe Connect (Standard) — lets a workspace OWNER connect their OWN Stripe
-- account to receive tenant/customer invoice payments through Propvora.
--
-- This is entirely SEPARATE from Propvora's SaaS subscription billing:
--   - SaaS billing  = Blackwellen Ltd's platform Stripe account (workspaces.stripe_customer_id).
--   - Connect       = the workspace owner's own Standard connected account (here).
-- Propvora never holds these funds; payments settle to the owner's account.
--
-- Feature-flagged OFF (NEXT_PUBLIC_FF_STRIPE_CONNECT) until activated + tested.

CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stripe_account_id  text NOT NULL,
  account_type       text NOT NULL DEFAULT 'standard'
                       CHECK (account_type IN ('standard', 'express', 'custom')),
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'active', 'restricted', 'disabled')),
  charges_enabled    boolean NOT NULL DEFAULT false,
  payouts_enabled    boolean NOT NULL DEFAULT false,
  details_submitted  boolean NOT NULL DEFAULT false,
  country            text,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS stripe_connect_one_per_workspace
  ON public.stripe_connect_accounts (workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS stripe_connect_account_id_uniq
  ON public.stripe_connect_accounts (stripe_account_id);

-- RLS: workspace members may READ their workspace's connect status. All writes
-- happen via the service role (onboarding API + account.updated webhook).
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sca_select_members ON public.stripe_connect_accounts;
CREATE POLICY sca_select_members ON public.stripe_connect_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = stripe_connect_accounts.workspace_id
        AND wm.user_id = auth.uid()
    )
  );
