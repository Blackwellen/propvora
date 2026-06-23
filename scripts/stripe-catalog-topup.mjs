/**
 * Propvora Stripe catalog TOP-UP (non-destructive).
 *
 * Unlike stripe-setup-catalog.mjs (which archives + recreates EVERYTHING and
 * would break live subscriptions), this script:
 *
 *   1. Adds `metadata.plan = <tier>` to every existing PLAN price so the
 *      webhook can map a Stripe subscription back to a Propvora tier
 *      (api/webhooks/stripe reads item.price.metadata.plan).
 *   2. Creates a product + price ONLY for add-ons whose priceId is still null
 *      in src/lib/billing/catalog.generated.json. Existing add-ons are left
 *      exactly as they are.
 *   3. Writes the updated price-ID map back to catalog.generated.json.
 *
 * It never archives, never deletes, never touches customers/subscriptions.
 * Re-running it is safe (idempotent): already-created add-ons are skipped.
 *
 * Run:  node scripts/stripe-catalog-topup.mjs
 *       node scripts/stripe-catalog-topup.mjs --dry-run
 */
import Stripe from "stripe"
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const DRY = process.argv.includes("--dry-run")

function envFromFile() {
  const txt = readFileSync(join(root, ".env.local"), "utf8")
  return (k) => {
    const m = txt.match(new RegExp("^" + k + "=(.*)$", "m"))
    return m ? m[1].trim() : ""
  }
}

const get = envFromFile()
const key = get("STRIPE_SECRET_KEY")
if (!key) {
  console.error("STRIPE_SECRET_KEY missing in .env.local")
  process.exit(1)
}
const stripe = new Stripe(key)
const MODE = key.startsWith("sk_live") ? "LIVE" : "TEST"

const catalogPath = join(root, "src", "lib", "billing", "catalog.generated.json")
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"))

// Display names/descriptions for add-ons (kept in sync with the dashboard).
// Only used when CREATING a missing add-on product.
const ADDON_META = {
  open_banking:            { name: "Propvora — Open Banking",           desc: "Live bank feeds and reconciliation via Open Banking." },
  whatsapp_business:       { name: "Propvora — WhatsApp Business",       desc: "Messaging over WhatsApp Business (conversation usage extra)." },
  esignature:              { name: "Propvora — eSignature",             desc: "Send documents for e-signature (envelope usage extra)." },
  accounting_sync:         { name: "Propvora — Xero / QuickBooks Sync",  desc: "Two-way accounting sync with Xero or QuickBooks." },
  mtd_itsa:                { name: "Propvora — MTD ITSA Pack",           desc: "Making Tax Digital for Income Tax Self Assessment pack." },
  booking_pages:           { name: "Propvora — Booking Pages",          desc: "Public direct-booking pages (included on Scale+)." },
  automation_pack:         { name: "Propvora — Automation Pack",         desc: "More recipes, runs and nodes beyond your plan cap." },
  api_access:              { name: "Propvora — API Access",             desc: "REST API access with full read/write endpoints." },
  country_pack_beta:       { name: "Propvora — Country Pack (Beta)",     desc: "Legal/tax/compliance depth for an additional country (beta)." },
  supplier_pro_profile:    { name: "Propvora — Supplier Pro Profile",    desc: "Richer media, case studies, packages and profile analytics." },
  supplier_team:           { name: "Propvora — Supplier Team",          desc: "Team members, team calendar and job assignment." },
  supplier_emergency:      { name: "Propvora — Emergency Availability",  desc: "24/7 badge, emergency dispatch and response-time SLA fields." },
  supplier_verified_plus:  { name: "Propvora — Verified Plus Review",    desc: "Manual admin evidence review for insurance and licences." },
  supplier_promoted:       { name: "Propvora — Promoted Local Placement",desc: "Sponsored, clearly-labelled rotation in local results." },
  supplier_extra_area:     { name: "Propvora — Extra Coverage Area",     desc: "An additional service-area pack." },
  supplier_automation_pack:{ name: "Propvora — Supplier Automation Pack",desc: "Quote follow-ups, evidence reminders and invoice nudges." },
  supplier_ai_assistant:   { name: "Propvora — Supplier AI Assistant",   desc: "Quote drafting, job summaries and message drafting." },
}

async function setPlanMetadata() {
  console.log("\n1) Tagging plan prices with metadata.plan…")
  for (const [tier, plan] of Object.entries(catalog.plans)) {
    for (const interval of ["monthly", "annual"]) {
      const p = plan[interval]
      if (!p?.priceId) continue
      const lookup = `propvora_${tier}_${interval === "monthly" ? "monthly" : "annual"}`
      if (DRY) {
        console.log(`  [dry] would set ${p.priceId} -> { plan:"${tier}" }`)
        continue
      }
      await stripe.prices.update(p.priceId, {
        metadata: { app: "propvora", plan: tier, lookup, interval },
      })
      console.log(`  tagged ${tier} ${interval}: ${p.priceId} -> plan="${tier}"`)
    }
  }
}

async function createMissingAddons() {
  console.log("\n2) Creating missing add-on prices…")
  let created = 0
  let skipped = 0
  for (const [key, a] of Object.entries(catalog.addons)) {
    if (a.priceId) { skipped++; continue }
    const meta = ADDON_META[key] ?? { name: `Propvora — ${key}`, desc: "" }
    if (DRY) {
      console.log(`  [dry] would create ${key} (${a.amount} ${a.interval ?? "one-time"})`)
      created++
      continue
    }
    const product = await stripe.products.create({
      name: meta.name,
      description: meta.desc || undefined,
      metadata: { app: "propvora", kind: "addon", addon: key },
    })
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: a.amount,
      currency: "gbp",
      ...(a.interval ? { recurring: { interval: a.interval } } : {}),
      lookup_key: `propvora_addon_${key}`,
      transfer_lookup_key: true,
      metadata: { app: "propvora", kind: "addon", addon: key },
    })
    a.productId = product.id
    a.priceId = price.id
    created++
    console.log(`  created ${key}: ${price.id}`)
  }
  console.log(`  (${created} created, ${skipped} already existed)`)
}

;(async () => {
  console.log(`\n=== Propvora Stripe catalog TOP-UP (${MODE})${DRY ? " — DRY RUN" : ""} ===`)
  if (MODE === "LIVE" && !DRY) {
    console.log("  ⚠ Operating on the LIVE Stripe account (non-destructive: create + tag only).")
  }
  await setPlanMetadata()
  await createMissingAddons()
  if (!DRY) {
    catalog.toppedUpAt = new Date().toISOString()
    writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n")
    console.log("\n✓ Updated", catalogPath)
  }
  const remaining = Object.entries(catalog.addons).filter(([, a]) => !a.priceId).map(([k]) => k)
  console.log(`\nAdd-ons still without a price: ${remaining.length ? remaining.join(", ") : "none ✓"}`)
})().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})
