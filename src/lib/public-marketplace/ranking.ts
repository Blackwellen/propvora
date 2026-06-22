// ============================================================================
// Marketplace ranking — shared, deterministic algorithms for "featured / top of
// search" and "similar" selections so they:
//   • are NOT always the same set (they rotate on a daily seed), and
//   • stay STABLE within a day so SSR and client agree (no hydration flicker).
//
// All pure functions. Used by stays, long lets, suppliers, services and
// emergency surfaces.
// ============================================================================

/** A stable per-UTC-day integer so selections rotate daily but not per-render. */
export function daySeed(): number {
  return Math.floor(Date.now() / 86_400_000)
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mulberry32 PRNG — deterministic from a seed. */
function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic Fisher–Yates shuffle (does not mutate the input). */
export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice()
  const rand = prng(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Pick the "featured / top of search" set. Prefers items flagged `featured`,
 * but ROTATES which ones surface each day (and within the flagged pool) so the
 * top of the page isn't frozen to the same N forever. Falls back to the whole
 * pool when too few are flagged.
 *
 * @param salt distinguishes independent rails on the same page (e.g. "stays").
 */
export function rotatingFeatured<T extends { featured?: boolean }>(
  items: readonly T[],
  count: number,
  salt = ""
): T[] {
  if (items.length <= count) return items.slice()
  const seed = daySeed() ^ hashStr(salt)
  const flagged = items.filter((i) => i.featured)
  const pool = flagged.length >= count ? flagged : items
  return seededShuffle(pool, seed).slice(0, count)
}

/**
 * Score-rank a pool for similarity to `target`, with a small daily jitter so the
 * order isn't identical every visit. Excludes the target by `id`.
 *
 * @param score returns a higher number for more-similar items (0 = unrelated).
 */
export function similarItems<T extends { id: string }>(
  target: T,
  pool: readonly T[],
  count: number,
  score: (target: T, candidate: T) => number
): T[] {
  const seed = daySeed()
  return pool
    .filter((p) => p.id !== target.id)
    .map((p) => {
      // jitter in [0,1) keyed by item+day — nudges near-ties without overriding
      // a clearly-better match.
      const jitter = prng(hashStr(p.id) ^ seed)() * 0.75
      return { p, s: score(target, p) + jitter }
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.p)
}

// ── Domain scorers ───────────────────────────────────────────────────────────
// Higher = more similar. Tuned so location + type/category dominate, then price
// proximity and rating.

function priceCloseness(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0
  const ratio = Math.min(a, b) / Math.max(a, b) // 1 = identical, →0 far apart
  return ratio * 2 // up to +2
}

export function scoreStay(
  t: { city?: string; location?: string; stayType?: string; pricePerNight?: number; beds?: number },
  c: { city?: string; location?: string; stayType?: string; pricePerNight?: number; beds?: number }
): number {
  let s = 0
  if (t.city && c.city && t.city.toLowerCase() === c.city.toLowerCase()) s += 4
  else if (t.location && c.location && t.location.split(",")[0] === c.location.split(",")[0]) s += 2
  if (t.stayType && c.stayType && t.stayType === c.stayType) s += 3
  s += priceCloseness(t.pricePerNight ?? 0, c.pricePerNight ?? 0)
  if (t.beds != null && c.beds != null && Math.abs(t.beds - c.beds) <= 1) s += 1
  return s
}

export function scoreRental(
  t: { city?: string; location?: string; propertyType?: string; monthlyRentPence?: number; beds?: number },
  c: { city?: string; location?: string; propertyType?: string; monthlyRentPence?: number; beds?: number }
): number {
  let s = 0
  if (t.city && c.city && t.city.toLowerCase() === c.city.toLowerCase()) s += 4
  else if (t.location && c.location && t.location.split(",")[0] === c.location.split(",")[0]) s += 2
  if (t.propertyType && c.propertyType && t.propertyType === c.propertyType) s += 3
  s += priceCloseness(t.monthlyRentPence ?? 0, c.monthlyRentPence ?? 0)
  if (t.beds != null && c.beds != null && Math.abs(t.beds - c.beds) <= 1) s += 1
  return s
}

export function scoreProvider(
  t: { trade?: string; city?: string; rating?: number },
  c: { trade?: string; city?: string; rating?: number }
): number {
  let s = 0
  if (t.trade && c.trade && t.trade.toLowerCase() === c.trade.toLowerCase()) s += 4
  if (t.city && c.city && t.city.toLowerCase() === c.city.toLowerCase()) s += 3
  s += Math.min(c.rating ?? 0, 5) / 5 // up to +1, nudges high-rated
  return s
}

export function scoreOffer(
  t: { category?: string; city?: string; basePrice?: number; rating?: number },
  c: { category?: string; city?: string; basePrice?: number; rating?: number }
): number {
  let s = 0
  if (t.category && c.category && t.category.toLowerCase() === c.category.toLowerCase()) s += 4
  if (t.city && c.city && t.city.toLowerCase() === c.city.toLowerCase()) s += 3
  s += priceCloseness(t.basePrice ?? 0, c.basePrice ?? 0)
  s += Math.min(c.rating ?? 0, 5) / 5
  return s
}

export function scoreEmergency(
  t: { category?: string; location?: string },
  c: { category?: string; location?: string }
): number {
  let s = 0
  if (t.category && c.category && t.category.toLowerCase() === c.category.toLowerCase()) s += 4
  if (t.location && c.location && t.location.split(",")[0] === c.location.split(",")[0]) s += 2
  return s
}
