-- Application-side rate limiting store (MAX-RELEASE items 51-54).
--
-- A small keyed fixed-window counter table written ONLY by the service role
-- (see src/lib/rate-limit.ts, which uses createAdminClient). RLS is enabled with
-- NO policies, so it is deny-all to anon/authenticated clients — the limiter is
-- a server-side guard and must never be reachable from the browser.
--
-- key          = "<route-tag>:<client-ip>" (best-effort IP behind Vercel/CF)
-- window_start = start of the fixed window the request falls into
-- count        = requests seen in that (key, window) so far
--
-- The limiter fails OPEN on any store error, so a logging hiccup never locks a
-- legitimate user out.
CREATE TABLE IF NOT EXISTS public.app_rate_limits (
  key          text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        int         NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, window_start)
);

-- Deny-all: enable RLS and define no policies. Only the service role bypasses RLS.
ALTER TABLE public.app_rate_limits ENABLE ROW LEVEL SECURITY;

-- Cheap sweep index for any future cleanup job of expired windows.
CREATE INDEX IF NOT EXISTS app_rate_limits_window_start_idx
  ON public.app_rate_limits (window_start);
