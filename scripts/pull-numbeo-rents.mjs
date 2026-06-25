/**
 * pull-numbeo-rents.mjs
 * Fetches global city rent data from the Numbeo API and writes it to
 * src/lib/market-data/global-rents.json
 *
 * Usage:
 *   NUMBEO_API_KEY=your_key_here node scripts/pull-numbeo-rents.mjs
 *
 * Get a free API key at: https://www.numbeo.com/api/
 * Free tier: 1,000 requests/month — enough for a full refresh of ~600 cities.
 *
 * Run quarterly to keep the data fresh.
 */

import { writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = resolve(__dirname, "../src/lib/market-data/global-rents.json")

const API_KEY = process.env.NUMBEO_API_KEY
if (!API_KEY) {
  console.error("ERROR: Set NUMBEO_API_KEY env var before running this script.")
  console.error("  Get a free key at https://www.numbeo.com/api/")
  process.exit(1)
}

const BASE = "https://www.numbeo.com/api"

// Numbeo price item indices for rent
const RENT_INDICES = {
  "1bed_city": 27,   // Apartment (1 bedroom) in City Centre, per month
  "1bed_out": 28,    // Apartment (1 bedroom) Outside of Centre, per month
  "3bed_city": 29,   // Apartment (3 bedrooms) in City Centre, per month
  "3bed_out": 30,    // Apartment (3 bedrooms) Outside of Centre, per month
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function getCities() {
  const data = await fetchJson(`${BASE}/cities?api_key=${API_KEY}`)
  return data.cities ?? []
}

async function getCityPrices(city, country) {
  try {
    const encoded = encodeURIComponent(`${city}, ${country}`)
    const data = await fetchJson(`${BASE}/city_prices?api_key=${API_KEY}&query=${encoded}&currency=USD`)
    if (!data.prices?.length) return null

    const result = {}
    for (const [key, idx] of Object.entries(RENT_INDICES)) {
      const item = data.prices.find(p => p.item_id === idx)
      result[key] = item ? Math.round(item.average_price) : null
    }
    // only include if we have all 4 values
    if (Object.values(result).some(v => v === null)) return null
    result.currency = data.currency ?? "USD"
    return result
  } catch {
    return null
  }
}

// ISO2 country code map for Numbeo country names
function toIso2(countryName) {
  const MAP = {
    "United Kingdom": "GB", "United States": "US", "Australia": "AU",
    "Canada": "CA", "Germany": "DE", "France": "FR", "Spain": "ES",
    "Netherlands": "NL", "Singapore": "SG", "Japan": "JP",
    "South Africa": "ZA", "Nigeria": "NG", "India": "IN",
    "United Arab Emirates": "AE", "Italy": "IT", "Portugal": "PT",
    "Sweden": "SE", "Norway": "NO", "Denmark": "DK", "Switzerland": "CH",
    "Ireland": "IE", "Belgium": "BE", "Austria": "AT", "Poland": "PL",
    "Czech Republic": "CZ", "Romania": "RO", "Hungary": "HU",
    "Brazil": "BR", "Mexico": "MX", "Argentina": "AR", "Chile": "CL",
    "Colombia": "CO", "Indonesia": "ID", "Malaysia": "MY", "Thailand": "TH",
    "Vietnam": "VN", "Philippines": "PH", "China": "CN", "Hong Kong": "HK",
    "South Korea": "KR", "Taiwan": "TW", "New Zealand": "NZ",
    "Kenya": "KE", "Ghana": "GH", "Egypt": "EG", "Morocco": "MA",
    "Pakistan": "PK", "Bangladesh": "BD", "Sri Lanka": "LK",
    "Israel": "IL", "Turkey": "TR", "Saudi Arabia": "SA", "Qatar": "QA",
    "Kuwait": "KW", "Bahrain": "BH",
  }
  return MAP[countryName] ?? null
}

async function main() {
  console.log("Fetching city list from Numbeo…")
  const cities = await getCities()
  console.log(`Found ${cities.length} cities`)

  const result = {
    _meta: {
      source: "Numbeo City Cost of Living",
      note: "Run scripts/pull-numbeo-rents.mjs to refresh with live data",
      last_updated: new Date().toISOString().slice(0, 10),
      indices: {
        "27": "1-bed city centre /mo",
        "28": "1-bed outside centre /mo",
        "29": "3-bed city centre /mo",
        "30": "3-bed outside centre /mo",
      },
    },
  }

  let fetched = 0
  let skipped = 0

  for (const { city, country } of cities) {
    const iso = toIso2(country)
    if (!iso) { skipped++; continue }

    process.stdout.write(`  ${country} / ${city}… `)
    const prices = await getCityPrices(city, country)
    if (!prices) { console.log("no data"); skipped++; continue }

    if (!result[iso]) result[iso] = {}
    result[iso][city] = prices
    console.log(`✓ 1-bed £${prices["1bed_city"]}`)
    fetched++

    // Rate limit: ~1 req/sec to stay within free tier
    await new Promise(r => setTimeout(r, 1100))
  }

  writeFileSync(OUT_PATH, JSON.stringify(result, null, 2))
  console.log(`\nDone. ${fetched} cities fetched, ${skipped} skipped.`)
  console.log(`Written to: ${OUT_PATH}`)
}

main().catch(e => { console.error(e); process.exit(1) })
