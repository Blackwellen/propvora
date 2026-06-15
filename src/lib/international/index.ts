/**
 * Propvora International — country profiles, tax ESTIMATE engine, and
 * jurisdiction resolution. Defaults to GB; every other jurisdiction is gated by
 * the live `country_packs` status. Tax outputs are operational ESTIMATES, never
 * tax advice or filings. Sanctioned countries (RU/IR/KP/SY) are hard-blocked.
 *
 * Barrel — import from `@/lib/international`.
 */

export * from "./types"
export * from "./countries"
export * from "./tax"
export * from "./jurisdiction"
