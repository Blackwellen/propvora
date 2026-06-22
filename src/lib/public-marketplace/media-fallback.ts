/**
 * Deterministic media fallbacks for the public marketplace.
 *
 * Live supplier rows often have no uploaded hero/logo yet, which made cards
 * render an empty gradient initial. These helpers pick a real, trade-relevant
 * Unsplash photo (and a portrait avatar) deterministically from a seed string,
 * so the same supplier always shows the same image. Only images.unsplash.com is
 * used (the sole approved remote image domain besides Supabase).
 */

const HERO = "?w=800&q=80&auto=format&fit=crop"
const AVATAR = "?w=160&h=160&q=80&auto=format&fit=facearea&facepad=3"

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick(pool: string[], seed: string): string {
  return pool[hash(seed) % pool.length]
}

// ── Trade-relevant hero pools (Unsplash photo IDs) ─────────────────────────
const TRADE_HEROES: Record<string, string[]> = {
  cleaning: [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136",
    "https://images.unsplash.com/photo-1527515545081-5db817172677",
  ],
  plumbing: [
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39",
    "https://images.unsplash.com/photo-1585704032915-c3400ca199e7",
    "https://images.unsplash.com/photo-1621905251918-48416bd8575a",
  ],
  electrical: [
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
    "https://images.unsplash.com/photo-1565608438257-fac3c27beb36",
  ],
  heating: [
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12",
    "https://images.unsplash.com/photo-1635424709845-66ec8e15b343",
  ],
  gardening: [
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b",
    "https://images.unsplash.com/photo-1558904541-efa843a96f01",
  ],
  handyman: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c",
    "https://images.unsplash.com/photo-1572981779307-38b8cabb2407",
  ],
  painting: [
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f",
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828",
  ],
  roofing: [
    "https://images.unsplash.com/photo-1632759145351-1d592919f522",
    "https://images.unsplash.com/photo-1635424239131-1f0a4a7f6c2f",
  ],
  general: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd",
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189",
    "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e",
  ],
}

const AVATARS = [
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a",
]

function tradeKey(trade: string | null | undefined): string {
  const t = (trade ?? "").toLowerCase()
  if (t.includes("clean")) return "cleaning"
  if (t.includes("plumb")) return "plumbing"
  if (t.includes("electric")) return "electrical"
  if (t.includes("heat") || t.includes("gas") || t.includes("boiler")) return "heating"
  if (t.includes("garden") || t.includes("landscap")) return "gardening"
  if (t.includes("paint") || t.includes("decor")) return "painting"
  if (t.includes("roof")) return "roofing"
  if (t.includes("handy") || t.includes("maintenance") || t.includes("build") || t.includes("carpen")) return "handyman"
  return "general"
}

/** Trade-relevant hero image for a supplier/service. */
export function heroFallback(trade: string | null | undefined, seed: string): string {
  return pick(TRADE_HEROES[tradeKey(trade)], seed) + HERO
}

/** Portrait avatar for a supplier/provider. */
export function avatarFallback(seed: string): string {
  return pick(AVATARS, seed) + AVATAR
}

/** Fill empty hero/logo on a provider-shaped object. */
export function withProviderMedia<T extends { heroImage: string; logo: string; trade: string; slug: string }>(p: T): T {
  return {
    ...p,
    heroImage: p.heroImage || heroFallback(p.trade, p.slug),
    logo: p.logo || avatarFallback(p.slug + "-logo"),
  }
}

/** Fill empty hero/avatar on a service-offer-shaped object. */
export function withServiceMedia<T extends { heroImage: string; providerAvatar: string; category: string; slug: string }>(s: T): T {
  return {
    ...s,
    heroImage: s.heroImage || heroFallback(s.category, s.slug),
    providerAvatar: s.providerAvatar || avatarFallback(s.providerAvatar || s.slug + "-av"),
  }
}

/** Fill empty hero/avatar on an emergency-service-shaped object. */
export function withEmergencyMedia<T extends { heroImage: string; providerAvatar: string; category: string; slug: string }>(s: T): T {
  return {
    ...s,
    heroImage: s.heroImage || heroFallback(s.category, s.slug),
    providerAvatar: s.providerAvatar || avatarFallback(s.slug + "-av"),
  }
}
