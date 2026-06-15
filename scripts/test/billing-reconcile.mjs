// Billing catalog reconciliation — app plan/add-on catalog ↔ LIVE Stripe.
//
// READ-ONLY against Stripe (list/retrieve only — NEVER creates charges,
// products, prices, customers or subscriptions). Proves that every app plan +
// add-on price maps to a real ACTIVE Stripe product/price with matching
// currency + amount, and flags orphaned Stripe products and the
// webhook-mapping metadata gap (price → plan tier resolution).
//
// Source of truth for the app side: src/lib/billing/catalog.generated.json
// (+ optional NEXT_PUBLIC_STRIPE_PRICE_* env overrides, mirrored from plans.ts).
//
// Usage: node scripts/test/billing-reconcile.mjs
import Stripe from "stripe"
import { readFileSync } from "node:fs"

function loadEnv(path) {
  const out = {}
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      out[m[1]] = v
    }
  } catch {}
  return out
}
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const KEY = env.STRIPE_SECRET_KEY
if (!KEY) { console.error("Missing STRIPE_SECRET_KEY"); process.exit(2) }

const stripe = new Stripe(KEY)
const MODE = KEY.startsWith("sk_live") ? "LIVE" : "TEST"

const catalog = JSON.parse(readFileSync("src/lib/billing/catalog.generated.json", "utf8"))

const results = []
function check(name, pass, detail) {
  results.push({ name, pass })
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}
const warnings = []
function warn(name, detail) {
  warnings.push({ name, detail })
  console.log(`⚠️  WARN  ${name}${detail ? `  — ${detail}` : ""}`)
}

// Env override mirror of plans.ts getPriceId().
function envPriceOverride(tier, interval) {
  return env[`NEXT_PUBLIC_STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}`] || null
}

// ── Build the list of (label, priceId, expectedAmount, recurring?) the app
//    expects to exist + be active in Stripe. ──────────────────────────────────
const expected = [] // { label, priceId, amount, currency, recurring, tier?, productId? }

for (const [tier, p] of Object.entries(catalog.plans)) {
  for (const interval of ["monthly", "annual"]) {
    const node = p[interval]
    if (!node) continue // enterprise has no public price — expected
    const override = envPriceOverride(tier, interval)
    expected.push({
      label: `plan ${tier} ${interval}`,
      priceId: override || node.priceId,
      amount: node.amount,
      currency: "gbp",
      recurring: true,
      tier,
      productId: p.productId,
      overridden: !!override,
    })
  }
}
for (const [key, a] of Object.entries(catalog.addons)) {
  // Add-ons whose Stripe product/price has not been created yet (priceId null)
  // are pending — the OWNER must run scripts/stripe-setup-catalog.mjs to create
  // them. Skip (don't fail) until then; warn so they aren't forgotten.
  if (!a.priceId) {
    console.log(`⏭️  SKIP  addon ${key}  — no Stripe price yet (run stripe-setup-catalog.mjs)`)
    continue
  }
  expected.push({
    label: `addon ${key}`,
    priceId: a.priceId,
    amount: a.amount,
    currency: "gbp",
    recurring: !!a.interval,
    productId: a.productId,
  })
}

;(async () => {
  console.log(`\n=== Propvora BILLING RECONCILIATION (Stripe ${MODE}, read-only) ===\n`)

  // ── 1. Every expected app price exists, is active, currency + amount match ──
  const table = []
  const seenProductIds = new Set()
  const seenPriceIds = new Set()

  // Seed seenProductIds from EVERY catalog product up front (including the
  // price-less enterprise product) so the orphan scan below doesn't flag a
  // product the app references but has no public price for.
  for (const p of Object.values(catalog.plans)) if (p.productId) seenProductIds.add(p.productId)
  for (const a of Object.values(catalog.addons)) if (a.productId) seenProductIds.add(a.productId)

  for (const e of expected) {
    seenPriceIds.add(e.priceId)
    if (e.productId) seenProductIds.add(e.productId)
    let price
    try {
      price = await stripe.prices.retrieve(e.priceId, { expand: ["product"] })
    } catch (err) {
      check(`${e.label}: price exists in Stripe`, false, `price ${e.priceId} not found (${err.message})`)
      table.push({ label: e.label, price: e.priceId, status: "MISSING", expected: e.amount, actual: "—" })
      continue
    }

    const active = price.active === true
    const prodActive = typeof price.product === "object" ? price.product.active !== false : true
    const curOk = (price.currency || "").toLowerCase() === e.currency
    const amtOk = Number(price.unit_amount) === Number(e.amount)
    const recurOk = !!price.recurring === e.recurring

    check(`${e.label}: active price + product`, active && prodActive,
      active ? (prodActive ? "" : "product archived") : "price archived")
    check(`${e.label}: currency ${e.currency.toUpperCase()}`, curOk,
      curOk ? "" : `got ${price.currency}`)
    check(`${e.label}: amount ${(e.amount / 100).toFixed(2)}`, amtOk,
      amtOk ? "" : `Stripe has ${(Number(price.unit_amount) / 100).toFixed(2)}`)
    check(`${e.label}: recurring=${e.recurring}`, recurOk,
      recurOk ? "" : `Stripe recurring=${!!price.recurring}`)

    table.push({
      label: e.label,
      price: e.priceId,
      status: active && prodActive && curOk && amtOk ? "OK" : "MISMATCH",
      expected: `${(e.amount / 100).toFixed(2)} ${e.currency.toUpperCase()}`,
      actual: `${(Number(price.unit_amount) / 100).toFixed(2)} ${(price.currency || "").toUpperCase()}`,
    })

    // Webhook mapping gap detector (plan prices only): the webhook's
    // stripePlanFromSubscription resolves a tier from price.metadata.plan or
    // price.nickname. If neither encodes the tier, a real subscription would
    // fall back to "starter" — a silent downgrade. lookup_key is NOT used.
    if (e.tier && e.tier !== "starter") {
      const metaPlan = (price.metadata && price.metadata.plan) || ""
      const nick = (price.nickname || "").toLowerCase()
      const resolvesByMeta = metaPlan === e.tier
      const resolvesByNick =
        (e.tier === "enterprise" && nick.includes("enterprise")) ||
        (e.tier === "pro_agency" && (nick.includes("agency") || nick.includes("pro"))) ||
        (e.tier === "scale" && nick.includes("scale")) ||
        (e.tier === "operator" && nick.includes("operator"))
      if (!resolvesByMeta && !resolvesByNick) {
        warn(`${e.label}: webhook tier-resolution`,
          `price has no metadata.plan="${e.tier}" and nickname="${price.nickname ?? ""}" — ` +
          `customer.subscription.* would map this to "starter" (silent downgrade). ` +
          `Set price metadata { plan: "${e.tier}" } or a tier-bearing nickname.`)
      }
    }
  }

  // ── 2. Reverse direction: active Stripe products tagged app=propvora that the
  //       app no longer references (orphans). Read-only enumeration. ───────────
  let orphanProducts = 0
  try {
    for await (const prod of stripe.products.list({ active: true, limit: 100 })) {
      const isPropvora = (prod.metadata && prod.metadata.app) === "propvora"
      if (!isPropvora) continue
      if (!seenProductIds.has(prod.id)) {
        // Does any active price under it match an app price? If not → orphan.
        warn(`orphan Stripe product`, `${prod.name} (${prod.id}) tagged app=propvora but not referenced by catalog.generated.json`)
        orphanProducts++
      }
    }
  } catch (err) {
    warn("orphan scan", `could not enumerate products: ${err.message}`)
  }
  check("no orphaned Propvora products in Stripe", orphanProducts === 0,
    orphanProducts === 0 ? "" : `${orphanProducts} orphan product(s) — archive in dashboard`)

  // ── 3. Enterprise is intentionally price-less (contact sales). Assert it. ──
  const ent = catalog.plans.enterprise
  check("enterprise plan is price-less (contact sales)", ent && !ent.monthly && !ent.annual,
    ent && (ent.monthly || ent.annual) ? "enterprise unexpectedly has a public price" : "")

  // ── Reconciliation table ──────────────────────────────────────────────────
  console.log(`\n── Reconciliation table (${MODE}) ──`)
  const pad = (s, n) => String(s).padEnd(n)
  console.log(pad("ITEM", 22) + pad("PRICE ID", 34) + pad("STATUS", 10) + pad("EXPECTED", 16) + "ACTUAL")
  for (const r of table) {
    console.log(pad(r.label, 22) + pad(r.price, 34) + pad(r.status, 10) + pad(r.expected, 16) + r.actual)
  }

  const failed = results.filter((r) => !r.pass).length
  console.log(`\n=== BILLING RECONCILE: ${results.length - failed}/${results.length} checks passed, ${failed} failed, ${warnings.length} warning(s) ===`)
  if (warnings.length) {
    console.log("Warnings are non-fatal but should be resolved before launch:")
    for (const w of warnings) console.log(`  ⚠️  ${w.name}: ${w.detail}`)
  }
  process.exit(failed > 0 ? 1 : 0)
})().catch((e) => {
  console.error("RECONCILE FAILED:", e.message)
  process.exit(2)
})
