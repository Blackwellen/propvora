/**
 * Address / postcode geocoding for the marketplace + property maps.
 *
 * Uses MapTiler's geocoding API (same NEXT_PUBLIC_MAPTILER_KEY as the basemap)
 * when available, falling back to OpenStreetMap Nominatim if no key is set.
 * Both hosts are allowed in the CSP `connect-src` (next.config.ts).
 *
 * forward:  "SE1, London" → [{ lat, lng, label }]
 * reverse:  (lat, lng)    → "12 Oakfield Rd, London SE1"
 */

const KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY

export interface GeocodeResult {
  lat: number
  lng: number
  label: string
}

interface MapTilerFeature {
  center: [number, number] // [lng, lat]
  place_name: string
}
interface MapTilerResponse {
  features?: MapTilerFeature[]
}
interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

/**
 * Forward geocode an address / postcode to candidate coordinates.
 *
 * `country` biases/limits results to an ISO-3166 alpha-2 code (e.g. "gb", "es").
 * When omitted, geocoding is GLOBAL — pass the property's `country_code` so a
 * Barcelona / Dubai / Berlin address resolves instead of being filtered to the
 * UK. (Previously this defaulted to "gb", which silently dropped every foreign
 * address → empty property maps.)
 */
export async function geocodeAddress(
  query: string,
  opts?: { country?: string; limit?: number; signal?: AbortSignal },
): Promise<GeocodeResult[]> {
  const q = query.trim()
  if (!q) return []
  const country = (opts?.country ?? "").trim().toLowerCase()
  const limit = opts?.limit ?? 5

  try {
    if (KEY) {
      // MapTiler caps at ISO-3166 alpha-2; only constrain when a country is given.
      const countryParam = country ? `&country=${encodeURIComponent(country)}` : ""
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${KEY}${countryParam}&limit=${limit}`
      const res = await fetch(url, { signal: opts?.signal })
      if (!res.ok) throw new Error(`MapTiler geocode ${res.status}`)
      const data = (await res.json()) as MapTilerResponse
      return (data.features ?? [])
        .filter((f) => Array.isArray(f.center) && f.center.length === 2)
        .map((f) => ({ lng: f.center[0], lat: f.center[1], label: f.place_name }))
    }

    // Fallback — Nominatim (requires a descriptive UA; respect their usage policy).
    const ccParam = country ? `&countrycodes=${encodeURIComponent(country)}` : ""
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}${ccParam}&limit=${limit}`
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: opts?.signal })
    if (!res.ok) return []
    const data = (await res.json()) as NominatimResult[]
    return data.map((d) => ({ lat: Number(d.lat), lng: Number(d.lon), label: d.display_name }))
  } catch {
    return []
  }
}

/** Reverse geocode coordinates to a human-readable place label. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  opts?: { signal?: AbortSignal },
): Promise<string | null> {
  try {
    if (KEY) {
      const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${KEY}&limit=1`
      const res = await fetch(url, { signal: opts?.signal })
      if (!res.ok) return null
      const data = (await res.json()) as MapTilerResponse
      return data.features?.[0]?.place_name ?? null
    }
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: opts?.signal })
    if (!res.ok) return null
    const data = (await res.json()) as { display_name?: string }
    return data.display_name ?? null
  } catch {
    return null
  }
}
