/**
 * ============================================================================
 * Propvora PHONE ENGINE — country-aware phone entry + display.
 * ============================================================================
 * Lightweight, dependency-free phone formatting keyed off the country's dialling
 * code (from country_profiles.phone_country_code). This is deliberately NOT a
 * full libphonenumber — it validates length/shape loosely and formats for
 * display so the address/contact forms can show the right prefix and a plausible
 * example per country without a heavy dependency.
 * ============================================================================
 */

interface PhoneMeta {
  /** E.164 dialling prefix, e.g. '+44'. */
  dialCode: string
  /** National significant number digit count(s) accepted (loose). */
  nsnLengths: number[]
  /** A formatting example shown as placeholder. */
  example: string
  /** National trunk prefix stripped when composing E.164 (e.g. '0' for GB). */
  trunkPrefix?: string
}

const PHONE_META: Record<string, PhoneMeta> = {
  GB: { dialCode: "+44", nsnLengths: [10], example: "07123 456789", trunkPrefix: "0" },
  IE: { dialCode: "+353", nsnLengths: [9], example: "087 123 4567", trunkPrefix: "0" },
  US: { dialCode: "+1", nsnLengths: [10], example: "(202) 555-0147" },
  CA: { dialCode: "+1", nsnLengths: [10], example: "(416) 555-0147" },
  AU: { dialCode: "+61", nsnLengths: [9], example: "0412 345 678", trunkPrefix: "0" },
  NZ: { dialCode: "+64", nsnLengths: [8, 9], example: "021 123 4567", trunkPrefix: "0" },
  FR: { dialCode: "+33", nsnLengths: [9], example: "06 12 34 56 78", trunkPrefix: "0" },
  ES: { dialCode: "+34", nsnLengths: [9], example: "612 34 56 78" },
  DE: { dialCode: "+49", nsnLengths: [10, 11], example: "0151 23456789", trunkPrefix: "0" },
  IT: { dialCode: "+39", nsnLengths: [9, 10], example: "312 345 6789" },
  NL: { dialCode: "+31", nsnLengths: [9], example: "06 12345678", trunkPrefix: "0" },
  AE: { dialCode: "+971", nsnLengths: [9], example: "050 123 4567", trunkPrefix: "0" },
}

const GENERIC: PhoneMeta = { dialCode: "", nsnLengths: [], example: "" }

export function getPhoneMeta(countryCode: string | null | undefined): PhoneMeta {
  const c = (countryCode ?? "").toUpperCase().trim()
  return PHONE_META[c] ?? GENERIC
}

/** Strip everything but digits and a leading +. */
function digits(input: string): string {
  return input.replace(/[^\d+]/g, "")
}

/**
 * Normalise a national or local phone number to E.164 for a given country.
 * Returns null when it cannot produce a plausible E.164 number.
 */
export function toE164(input: string, countryCode: string): string | null {
  const meta = getPhoneMeta(countryCode)
  let raw = digits(input)
  if (!raw) return null
  // Already E.164.
  if (raw.startsWith("+")) {
    return /^\+\d{6,15}$/.test(raw) ? raw : null
  }
  if (!meta.dialCode) return null
  // Strip national trunk prefix.
  if (meta.trunkPrefix && raw.startsWith(meta.trunkPrefix)) {
    raw = raw.slice(meta.trunkPrefix.length)
  }
  const candidate = `${meta.dialCode}${raw}`
  return /^\+\d{6,15}$/.test(candidate) ? candidate : null
}

/** Loose validity check for a national number in a country. */
export function isPlausiblePhone(input: string, countryCode: string): boolean {
  const meta = getPhoneMeta(countryCode)
  let raw = digits(input).replace(/^\+/, "")
  if (meta.dialCode && raw.startsWith(meta.dialCode.replace("+", ""))) {
    raw = raw.slice(meta.dialCode.replace("+", "").length)
  } else if (meta.trunkPrefix && raw.startsWith(meta.trunkPrefix)) {
    raw = raw.slice(meta.trunkPrefix.length)
  }
  if (!meta.nsnLengths.length) return raw.length >= 6 && raw.length <= 15
  return meta.nsnLengths.includes(raw.length)
}

/** Placeholder/example string for an input field. */
export function phonePlaceholder(countryCode: string | null | undefined): string {
  return getPhoneMeta(countryCode).example || "Phone number"
}

/** The dialling prefix for display, e.g. '+44'. */
export function phoneDialCode(countryCode: string | null | undefined): string {
  return getPhoneMeta(countryCode).dialCode
}
