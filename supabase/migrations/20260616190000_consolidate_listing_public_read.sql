-- ============================================================================
-- Consolidate marketplace_listings PUBLIC-READ policies.
--
-- Before this migration the table carried THREE overlapping SELECT policies:
--   - public_read                      (anon+auth)  USING status = 'active'   [legacy]
--   - marketplace_listings_public_read (anon+auth)  USING status = 'active'   [legacy dup]
--   - mkt_listings_published_read      (auth only)  USING status = 'published'
--
-- Two problems this fixes:
--   1) NEW marketplace listings use the v2 lifecycle status 'published', but the
--      anon public-read policies only matched the LEGACY directory status
--      'active' — so a logged-OUT visitor could not browse published listings,
--      even though the app's search service queries status = 'published'. Public
--      marketplace browse was effectively broken for anonymous users.
--   2) `public_read` and `marketplace_listings_public_read` were exact duplicates.
--
-- Consolidation: a SINGLE anon+authenticated SELECT policy that exposes BOTH the
-- v2 'published' state (new listings) AND the legacy 'active' state (the original
-- supplier-directory rows, which were always intended to be publicly listed).
-- Only safe, public-facing rows are exposed; draft/paused/archived/inactive/
-- suspended remain non-public. Management (insert/update/delete) is unchanged and
-- stays strictly workspace-member scoped.
--
-- Idempotent + non-destructive: drops only the redundant read policies and
-- recreates one canonical policy.
-- ============================================================================

drop policy if exists public_read on public.marketplace_listings;
drop policy if exists marketplace_listings_public_read on public.marketplace_listings;
drop policy if exists mkt_listings_published_read on public.marketplace_listings;

create policy marketplace_listings_public_read
  on public.marketplace_listings
  for select
  to anon, authenticated
  using (status in ('published', 'active'));
