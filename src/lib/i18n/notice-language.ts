/**
 * Notice & document language requirements (dimension 25).
 *
 * Official-language notice duties: Wales bilingual (EN/CY), Belgium regional
 * language, Quebec French, Switzerland cantonal. Drives Messages/Email templates
 * + Portals + statutory notices. SOURCED / indicative — NOT legal advice.
 */

export interface NoticeLanguageRule {
  jurisdiction: string
  /** BCP-47 language tags the notice should be issued in. */
  languages: string[]
  /** True when the notice must be bilingual/multilingual. */
  bilingual: boolean
  note: string
  citation: string
}

const RULES: Record<string, NoticeLanguageRule> = {
  "GB:WLS": rule("GB-WLS", ["en", "cy"], true, "Wales: tenant-facing documents should be available bilingually (English/Welsh).", "gov.wales — Welsh language"),
  BE: rule("BE", ["nl", "fr", "de"], false, "Belgium: use the region's official language (Dutch/French/German).", "BE — regional language law"),
  CH: rule("CH", ["de", "fr", "it"], false, "Switzerland: use the canton's official language.", "CH — cantonal language"),
  CA: rule("CA", ["en", "fr"], false, "Canada: Quebec requires French; elsewhere English/French.", "CA — Quebec Charter of the French Language"),
}

function rule(jurisdiction: string, languages: string[], bilingual: boolean, note: string, citation: string): NoticeLanguageRule {
  return { jurisdiction, languages, bilingual, note, citation }
}

export function requiredNoticeLanguages(countryCode: string | null | undefined, region?: string | null): NoticeLanguageRule {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB" && (rg === "WLS" || rg === "WALES")) return RULES["GB:WLS"]
  return RULES[cc] ?? { jurisdiction: cc, languages: ["en"], bilingual: false, note: "Single-language notices; verify any local-language duty.", citation: "Verify local rules" }
}
