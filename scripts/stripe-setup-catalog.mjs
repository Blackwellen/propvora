/**
 * Propvora Stripe catalog builder.
 *
 *  1. Archives ALL existing active products + prices (clean slate).
 *  2. Creates the canonical Propvora plan + add-on catalog (GBP).
 *  3. Writes the resulting price-ID map to src/lib/billing/catalog.generated.json
 *
 * Customers, subscriptions and payments are never touched. Archiving is
 * reversible (set active:true again in the dashboard).
 *
 * Run:  node scripts/stripe-setup-catalog.mjs
 */
import Stripe from "stripe"
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

function envFromFile() {
  const txt = readFileSync(join(root, ".env.local"), "utf8")
  const get = (k) => {
    const m = txt.match(new RegExp("^" + k + "=(.*)$", "m"))
    return m ? m[1].trim() : ""
  }
  return get
}

const get = envFromFile()
const key = get("STRIPE_SECRET_KEY")
if (!key) {
  console.error("STRIPE_SECRET_KEY missing")
  process.exit(1)
}
const stripe = new Stripe(key)
const MODE = key.startsWith("sk_live") ? "LIVE" : "TEST"

// ── Catalog definition (GBP). Edit freely in the dashboard afterwards. ────────
const PLANS = [
  { tier: "starter",    name: "Propvora Starter",     desc: "For individual landlords getting organised.",        monthly: 2900,  annual: 29000 },
  { tier: "operator",   name: "Propvora Operator",    desc: "For active portfolio operators.",                    monthly: 7900,  annual: 79000 },
  { tier: "scale",      name: "Propvora Scale",       desc: "For growing portfolios and small teams.",            monthly: 14900, annual: 149000 },
  { tier: "pro_agency", name: "Propvora Pro / Agency",desc: "For letting agencies and managed portfolios.",       monthly: 29900, annual: 299000 },
  { tier: "enterprise", name: "Propvora Enterprise",  desc: "Custom limits, SSO, SLAs and onboarding.",           monthly: null,  annual: null },
]

const ADDONS = [
  { key: "extra_seat",     name: "Propvora — Extra Team Seat",        desc: "One additional team member seat.",              amount: 900,   interval: "month" },
  { key: "extra_props_10", name: "Propvora — +10 Properties",         desc: "Increase your property allowance by 10.",       amount: 1900,  interval: "month" },
  { key: "white_label",    name: "Propvora — White-Label Branding",   desc: "Your brand on portals, emails and documents.",  amount: 4900,  interval: "month" },
  { key: "ai_credits_1k",  name: "Propvora — AI Credit Pack (1,000)", desc: "One-time top-up of 1,000 AI credits.",          amount: 1500,  interval: null },
  { key: "onboarding",     name: "Propvora — Onboarding & Migration", desc: "Guided setup and data migration (one-time).",   amount: 49900, interval: null },
]

async function archiveAll() {
  let archivedPrices = 0
  let archivedProducts = 0
  for (;;) {
    const prods = await stripe.products.list({ limit: 100, active: true })
    if (!prods.data.length) break
    for (const p of prods.data) {
      const prices = await stripe.prices.list({ product: p.id, limit: 100, active: true })
      for (const pr of prices.data) {
        // A default price can't be archived directly — archiving the product
        // (below) removes it from the catalog regardless, so skip on error.
        try {
          await stripe.prices.update(pr.id, { active: false })
          archivedPrices++
        } catch { /* default price — handled by product archive */ }
      }
      await stripe.products.update(p.id, { active: false })
      archivedProducts++
      console.log("  archived:", p.name)
    }
    if (!prods.has_more) break
  }
  console.log(`Archived ${archivedProducts} products / ${archivedPrices} prices.`)
}

async function createPrice(productId, amount, interval, lookup) {
  return stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: "gbp",
    ...(interval ? { recurring: { interval } } : {}),
    lookup_key: lookup,
    metadata: { app: "propvora", lookup },
  })
}

async function build() {
  const out = { mode: MODE, generatedAt: new Date().toISOString(), plans: {}, addons: {} }

  for (const plan of PLANS) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.desc,
      metadata: { app: "propvora", kind: "plan", tier: plan.tier },
    })
    const entry = { productId: product.id, tier: plan.tier }
    if (plan.monthly != null) {
      const m = await createPrice(product.id, plan.monthly, "month", `propvora_${plan.tier}_monthly`)
      entry.monthly = { priceId: m.id, amount: plan.monthly }
    }
    if (plan.annual != null) {
      const y = await createPrice(product.id, plan.annual, "year", `propvora_${plan.tier}_annual`)
      entry.annual = { priceId: y.id, amount: plan.annual }
    }
    out.plans[plan.tier] = entry
    console.log("  created plan:", plan.name)
  }

  for (const a of ADDONS) {
    const product = await stripe.products.create({
      name: a.name,
      description: a.desc,
      metadata: { app: "propvora", kind: "addon", addon: a.key },
    })
    const price = await createPrice(product.id, a.amount, a.interval, `propvora_addon_${a.key}`)
    out.addons[a.key] = { productId: product.id, priceId: price.id, amount: a.amount, interval: a.interval }
    console.log("  created add-on:", a.name)
  }

  return out
}

;(async () => {
  console.log(`\n=== Propvora Stripe catalog (${MODE}) ===`)
  console.log("\n1) Archiving existing catalog…")
  await archiveAll()
  console.log("\n2) Creating Propvora catalog…")
  const map = await build()
  const dest = join(root, "src", "lib", "billing", "catalog.generated.json")
  writeFileSync(dest, JSON.stringify(map, null, 2))
  console.log("\n✓ Wrote", dest)
  console.log("\nPrice IDs:")
  console.log(JSON.stringify(map, null, 2))
})().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
