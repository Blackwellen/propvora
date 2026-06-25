import rentData from "./global-rents.json"

type CityData = {
  "1bed_city": number
  "1bed_out": number
  "3bed_city": number
  "3bed_out": number
  currency: string
}

type RentDb = Record<string, Record<string, CityData | unknown>>

const db = rentData as RentDb

/** Map common country names → ISO2 codes used in the JSON */
const COUNTRY_TO_ISO: Record<string, string> = {
  "United Kingdom": "GB",
  "UK": "GB",
  "England": "GB",
  "Scotland": "GB",
  "Wales": "GB",
  "Northern Ireland": "GB",
  "United States": "US",
  "USA": "US",
  "United States of America": "US",
  "Australia": "AU",
  "Canada": "CA",
  "Germany": "DE",
  "France": "FR",
  "Spain": "ES",
  "Netherlands": "NL",
  "Singapore": "SG",
  "Japan": "JP",
  "South Africa": "ZA",
  "Nigeria": "NG",
  "India": "IN",
  "UAE": "AE",
  "United Arab Emirates": "AE",
}

function normaliseCity(city: string): string {
  return city.trim().toLowerCase()
}

function isCityData(v: unknown): v is CityData {
  return typeof v === "object" && v !== null && "1bed_city" in v
}

/** Look up Numbeo median rent for a property's location.
 *  Matches on country → nearest city name.
 *  Returns null if no match found (graceful degradation). */
export function lookupMarketRent(
  city: string | null | undefined,
  country: string | null | undefined,
  bedrooms: number | null | undefined,
): { rent1bed: number; rent3bed: number; currency: string; matchedCity: string } | null {
  if (!country) return null

  const iso = COUNTRY_TO_ISO[country] ?? country.toUpperCase().slice(0, 2)
  const countryData = db[iso]
  if (!countryData) return null

  const targetCity = normaliseCity(city ?? "")

  // Exact or partial match
  let bestKey: string | null = null
  let bestScore = 0
  for (const key of Object.keys(countryData)) {
    if (key.startsWith("_")) continue
    const normKey = normaliseCity(key)
    if (normKey === targetCity) { bestKey = key; break }
    // partial: city name contains or is contained
    if (targetCity && (normKey.includes(targetCity) || targetCity.includes(normKey))) {
      const score = Math.min(normKey.length, targetCity.length)
      if (score > bestScore) { bestScore = score; bestKey = key }
    }
  }

  // Fallback: first city in country (national proxy)
  if (!bestKey) {
    const keys = Object.keys(countryData).filter(k => !k.startsWith("_"))
    if (!keys.length) return null
    bestKey = keys[0]
  }

  const entry = countryData[bestKey]
  if (!isCityData(entry)) return null

  return {
    rent1bed: entry["1bed_city"],
    rent3bed: entry["3bed_city"],
    currency: entry.currency,
    matchedCity: bestKey,
  }
}

/** Pick the most relevant benchmark rent given bedroom count */
export function pickBenchmarkRent(
  match: ReturnType<typeof lookupMarketRent>,
  bedrooms: number | null | undefined,
): number | null {
  if (!match) return null
  // ≤2 bed → use 1-bed city as lower bound; ≥3 bed → use 3-bed
  return (bedrooms ?? 1) >= 3 ? match.rent3bed : match.rent1bed
}
