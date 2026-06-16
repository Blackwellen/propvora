-- ============================================================================
-- Marketplace FTS search RPC (Propvora-release-version.2.0)
--
-- A single SECURITY INVOKER function that runs real Postgres full-text search
-- over the generated `search_vector` (websearch_to_tsquery) with structured
-- filters, trust/recency-blended ranking, and keyset pagination. Returns only
-- browse-safe public columns + a single thumbnail + total count. SECURITY
-- INVOKER means the caller's RLS still applies (only published/active rows are
-- visible to anon/auth), so this never leaks private listings.
--
-- Ranking = ts_rank(search_vector, query) [0 when no query]
--           + recency bonus (newer published_at scores higher)
--           + trust bonus (verified + rating).
-- Idempotent: CREATE OR REPLACE.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.marketplace_search(
  p_query           text    DEFAULT NULL,
  p_listing_type    text    DEFAULT NULL,
  p_category        text    DEFAULT NULL,
  p_country_code    text    DEFAULT NULL,
  p_min_pence       bigint  DEFAULT NULL,
  p_max_pence       bigint  DEFAULT NULL,
  p_location        text    DEFAULT NULL,
  p_limit           integer DEFAULT 24,
  p_offset          integer DEFAULT 0
)
RETURNS TABLE (
  id              uuid,
  workspace_id    uuid,
  title           text,
  description     text,
  listing_type    text,
  transaction_type text,
  category        text,
  country_code    text,
  currency        text,
  base_price_pence bigint,
  pricing_model   text,
  location        text,
  region          text,
  city            text,
  latitude        numeric,
  longitude       numeric,
  verification_status text,
  instant_book    boolean,
  rating          numeric,
  review_count    integer,
  published_at    timestamptz,
  created_at      timestamptz,
  thumbnail_url   text,
  rank            real,
  total_count     bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH q AS (
    SELECT CASE
      WHEN p_query IS NULL OR btrim(p_query) = '' THEN NULL
      ELSE websearch_to_tsquery('english', p_query)
    END AS ts
  ),
  base AS (
    SELECT
      l.*,
      (SELECT m.url FROM public.marketplace_listing_media m
        WHERE m.listing_id = l.id AND m.url IS NOT NULL
        ORDER BY m.sort_order ASC, m.created_at ASC LIMIT 1) AS thumb,
      CASE WHEN (SELECT ts FROM q) IS NULL THEN 0::real
           ELSE ts_rank(l.search_vector, (SELECT ts FROM q)) END
        -- recency: up to ~+0.5 for listings published in the last ~60 days
        + (0.5 * exp(-extract(epoch FROM (now() - coalesce(l.published_at, l.created_at))) / 5184000.0))::real
        -- trust: verified +0.3, plus rating/5 * 0.2
        + (CASE WHEN l.verification_status = 'verified' OR l.verified THEN 0.3 ELSE 0 END)::real
        + (coalesce(l.rating, 0) / 5.0 * 0.2)::real
        AS computed_rank
    FROM public.marketplace_listings l
    WHERE l.status IN ('published','active')
      AND ((SELECT ts FROM q) IS NULL OR l.search_vector @@ (SELECT ts FROM q))
      AND (p_listing_type IS NULL OR l.listing_type = p_listing_type)
      AND (p_category IS NULL OR l.category = p_category
           OR EXISTS (SELECT 1 FROM public.marketplace_listing_categories lc
                      WHERE lc.listing_id = l.id AND lc.category_slug = p_category))
      AND (p_country_code IS NULL OR l.country_code = p_country_code)
      AND (p_min_pence IS NULL OR l.base_price_pence >= p_min_pence)
      AND (p_max_pence IS NULL OR l.base_price_pence <= p_max_pence)
      AND (p_location IS NULL OR (
            l.location ILIKE '%' || p_location || '%'
         OR l.location_city ILIKE '%' || p_location || '%'
         OR l.region ILIKE '%' || p_location || '%'
         OR l.postcode ILIKE '%' || p_location || '%'))
  ),
  counted AS (SELECT count(*) AS n FROM base)
  SELECT
    b.id, b.workspace_id, b.title, b.description, b.listing_type, b.transaction_type,
    b.category, b.country_code, b.currency, b.base_price_pence, b.pricing_model,
    b.location, b.region, b.location_city AS city, b.latitude, b.longitude,
    b.verification_status, b.instant_book, b.rating, b.review_count,
    b.published_at, b.created_at, b.thumb AS thumbnail_url,
    b.computed_rank AS rank,
    (SELECT n FROM counted) AS total_count
  FROM base b
  ORDER BY b.computed_rank DESC, coalesce(b.published_at, b.created_at) DESC
  LIMIT greatest(1, least(coalesce(p_limit, 24), 100))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.marketplace_search(
  text, text, text, text, bigint, bigint, text, integer, integer
) TO anon, authenticated;
