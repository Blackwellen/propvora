/**
 * Contractor / trade certification (dimension 20).
 *
 * A safety certificate is only valid if issued by the legally competent person.
 * The Suppliers directory must capture the right credential per jurisdiction +
 * work type: UK Gas Safe / NICEIC / Part P, Ireland RGI / Safe Electric, Germany
 * Schornsteinfeger / Meister, Australia licensed trades. Also the supplier
 * tax-ID label (VAT/ABN/EIN). SOURCED / indicative — NOT legal advice.
 */

export type WorkType = "gas" | "electrical" | "energy" | "general"

export interface TradeCredential {
  /** The credential a supplier must hold (e.g. "Gas Safe Register number"). */
  credential: string
  /** Whether it is legally mandatory for this work type. */
  mandatory: boolean
}

const CREDENTIALS: Record<string, Partial<Record<WorkType, TradeCredential>>> = {
  GB: {
    gas: { credential: "Gas Safe Register number", mandatory: true },
    electrical: { credential: "NICEIC / NAPIT / Part P competent person", mandatory: false },
    energy: { credential: "Accredited EPC assessor", mandatory: true },
    general: { credential: "CSCS card (on site)", mandatory: false },
  },
  IE: {
    gas: { credential: "RGI (Registered Gas Installer) number", mandatory: true },
    electrical: { credential: "Safe Electric (RECI) registration", mandatory: true },
    energy: { credential: "BER assessor", mandatory: true },
  },
  DE: {
    gas: { credential: "Schornsteinfeger (district master)", mandatory: true },
    electrical: { credential: "Eingetragener Elektrofachbetrieb", mandatory: true },
    general: { credential: "Meister (master craftsman)", mandatory: false },
  },
  ES: {
    gas: { credential: "Instalador de gas autorizado", mandatory: true },
    electrical: { credential: "Instalador eléctrico autorizado", mandatory: true },
  },
  AU: {
    gas: { credential: "Licensed gasfitter", mandatory: true },
    electrical: { credential: "Licensed electrician", mandatory: true },
    general: { credential: "Builder's licence (state)", mandatory: true },
  },
  US: {
    gas: { credential: "State-licensed plumber/gas fitter", mandatory: true },
    electrical: { credential: "State-licensed electrician", mandatory: true },
    general: { credential: "State contractor licence", mandatory: true },
  },
}

/** The credential a supplier needs for a work type in a jurisdiction. */
export function requiredTradeCredential(countryCode: string | null | undefined, workType: WorkType): TradeCredential | null {
  const cc = (countryCode || "GB").toUpperCase()
  return CREDENTIALS[cc]?.[workType] ?? null
}

const TAX_ID_LABELS: Record<string, string> = {
  GB: "VAT number", IE: "VAT number", DE: "USt-IdNr", FR: "n° TVA", ES: "NIF / CIF", IT: "Partita IVA",
  AU: "ABN", NZ: "NZBN / GST number", US: "EIN", AE: "TRN", CA: "GST/HST number",
}

/** Tax-ID field label for suppliers in a jurisdiction. */
export function taxIdLabel(countryCode: string | null | undefined): string {
  const cc = (countryCode || "GB").toUpperCase()
  return TAX_ID_LABELS[cc] ?? "Tax ID"
}
