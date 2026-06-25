/**
 * Propvora — Intelligence Layer pricing (non-destructive).
 *
 * Adds the AI monetisation to the LIVE Stripe catalog WITHOUT touching any
 * existing customer, subscription or price:
 *   1. AI-Pro add-on        — recurring £29/mo (unlocks agentic Copilot on lower tiers)
 *   2. Intelligence pack     — one-off £20 (1,000 Intelligence credits)
 *   3. Action pack           — one-off £15 (1,000 Action credits)
 *   4. Base-price uplift      — NEW Scale (£169/£1690) + Pro (£329/£3290) prices,
 *      set as each product's default_price. Existing subscribers keep their old
 *      price; only NEW checkouts pay the new amount. OLD prices are NOT archived.
 *
 * Idempotent: every price carries a stable lookup_key, so re-running reuses the
 * existing price instead of creating a duplicate. Updates
 * src/lib/billing/catalog.generated.json in place.
 *
 * Run:  node scripts/stripe-add-ai-pricing.mjs
 */
import Stripe from "stripe"
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

function envGet(k) {
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(join(root, f), "utf8")
      const m = txt.match(new RegExp("^" + k + "=(.*)$", "m"))
      if (m) return m[1].trim().replace(/^['"]|['"]$/g, "")
    } catch {}
  }
  return ""
}

const key = envGet("STRIPE_SECRET_KEY")
if (!key) { console.error("STRIPE_SECRET_KEY missing"); process.exit(1) }
const stripe = new Stripe(key)
const MODE = key.startsWith("sk_live") ? "LIVE" : "TEST"
console.log(`Stripe mode: ${MODE}`)

const catalogPath = join(root, "src/lib/billing/catalog.generated.json")
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"))

// ── Helpers ──────────────────────────────────────────────────────────────────
async function findPriceByLookup(lookupKey) {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1, expand: ["data.product"] })
  return res.data[0] || null
}

async function getOrCreateProduct({ metaKey, name, description }) {
  // Reuse a product previously created by this script (tagged in metadata).
  const search = await stripe.products.search({ query: `metadata['propvora_key']:'${metaKey}'`, limit: 1 })
  if (search.data[0]) return search.data[0]
  return stripe.products.create({ name, description, metadata: { propvora_key: metaKey } })
}

async function getOrCreatePrice({ lookupKey, productId, unitAmount, interval, nickname }) {
  const existing = await findPriceByLookup(lookupKey)
  if (existing) return existing
  return stripe.prices.create({
    product: productId,
    currency: "gbp",
    unit_amount: unitAmount,
    nickname,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    ...(interval ? { recurring: { interval } } : {}),
  })
}

// ── 1–3. New add-on products + prices ─────────────────────────────────────────
const ADDONS = [
  { key: "ai_pro",               name: "Propvora — AI Pro",                 desc: "Autonomous AI agents, web/market intelligence, document AI and monitors, with a generous monthly credit allowance.", amount: 2900, interval: "month", lookup: "ai_pro_month" },
  { key: "intelligence_pack_1k", name: "Propvora — Intelligence Credit Pack (1,000)", desc: "1,000 Intelligence credits for web search, market data, document AI and agent runs.", amount: 2000, interval: null, lookup: "intelligence_pack_1k_oneoff" },
  { key: "action_pack_1k",       name: "Propvora — Action Credit Pack (1,000)",       desc: "1,000 Action credits for AI-drafted writes, emails and automation runs.",            amount: 1500, interval: null, lookup: "action_pack_1k_oneoff" },
]

for (const a of ADDONS) {
  const product = await getOrCreateProduct({ metaKey: a.key, name: a.name, description: a.desc })
  const price = await getOrCreatePrice({ lookupKey: a.lookup, productId: product.id, unitAmount: a.amount, interval: a.interval, nickname: a.name })
  catalog.addons[a.key] = { productId: product.id, priceId: price.id, amount: a.amount, interval: a.interval }
  console.log(`✓ addon ${a.key.padEnd(20)} ${product.id} / ${price.id} (£${(a.amount / 100).toFixed(2)}${a.interval ? "/" + a.interval : " one-off"})`)
}

// ── 4. Base-price uplift (new default prices; old prices left active) ─────────
const UPLIFTS = [
  { tier: "scale",      monthly: 16900, annual: 169000 },
  { tier: "pro_agency", monthly: 32900, annual: 329000 },
]

for (const u of UPLIFTS) {
  const productId = catalog.plans[u.tier].productId
  const monthly = await getOrCreatePrice({ lookupKey: `${u.tier}_monthly_v2`, productId, unitAmount: u.monthly, interval: "month", nickname: `${u.tier} monthly (v2)` })
  const annual = await getOrCreatePrice({ lookupKey: `${u.tier}_annual_v2`, productId, unitAmount: u.annual, interval: "year", nickname: `${u.tier} annual (v2)` })
  // Point NEW checkouts at the uplifted monthly price.
  await stripe.products.update(productId, { default_price: monthly.id })
  catalog.plans[u.tier].monthly = { priceId: monthly.id, amount: u.monthly }
  catalog.plans[u.tier].annual = { priceId: annual.id, amount: u.annual }
  console.log(`✓ uplift ${u.tier.padEnd(12)} monthly ${monthly.id} (£${(u.monthly / 100).toFixed(0)}) | annual ${annual.id} (£${(u.annual / 100).toFixed(0)})`)
}

catalog.aiPricingAddedAt = new Date().toISOString()
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n")
console.log(`\n✓ Updated ${catalogPath}`)
console.log("Old prices remain ACTIVE — existing subscribers are unaffected; new checkouts use the new prices.")
