import type { OfferStatus, PackStatus } from "@/lib/context/context-types"
import type { Locale } from "./config"

export type MeasurementSystem = "metric" | "imperial"
export type TaxScheme =
  | "vat"
  | "vat_oss"
  | "gst"
  | "sales_tax"
  | "consumption_tax"
  | "none"

export interface CountryProfile {
  countryCode: string
  displayName: string
  defaultLocale: Locale
  defaultCurrency: string
  supportedLocales: Locale[]
  measurementSystem: MeasurementSystem
  areaUnit: "sqm" | "sqft"
  dateFormat: string
  addressModelId: string
  phoneCountryCode: string
  offerStatus: OfferStatus
  stripeBillingSupported: boolean
  connectPayoutSupported: boolean
  taxScheme: TaxScheme
  taxName: string
  standardTaxRate: number | null
  taxIdLabel: string | null
  b2bReverseCharge: boolean
  privacyRegime: string
  dsarResponseDays: number | null
  breachNotifyHours: number | null
  consentModel: "opt_in" | "opt_out" | "mixed"
  representativeRequired: boolean
  dpoRequired: boolean
  transferMechanism: string
  b2cWithdrawalDays: number | null
  withdrawalButtonRequired: boolean
  autoRenewalDisclosure: boolean
  propertyFeaturesStatus: PackStatus
  legalPackStatus: PackStatus
  taxReviewStatus: PackStatus
  privacyReviewStatus: PackStatus
  supportStatus: PackStatus
  legalDisclaimer: string
}

const genericDisclaimer =
  "This country pack is not reviewed. Propvora will only provide generic records, documents, tasks and evidence tracking until qualified local review is recorded."

const reviewedDisclaimer =
  "United Kingdom property, compliance and legal workflows are the reviewed V1 baseline. This is not legal, tax or financial advice."

const PROFILES: Record<string, CountryProfile> = {
  GB: {
    countryCode: "GB",
    displayName: "United Kingdom",
    defaultLocale: "en-GB",
    defaultCurrency: "GBP",
    supportedLocales: ["en-GB"],
    measurementSystem: "metric",
    areaUnit: "sqm",
    dateFormat: "dd/MM/yyyy",
    addressModelId: "gb",
    phoneCountryCode: "+44",
    offerStatus: "offer",
    stripeBillingSupported: true,
    connectPayoutSupported: true,
    taxScheme: "vat",
    taxName: "VAT",
    standardTaxRate: 20,
    taxIdLabel: "VAT number",
    b2bReverseCharge: false,
    privacyRegime: "uk_gdpr",
    dsarResponseDays: 30,
    breachNotifyHours: 72,
    consentModel: "opt_in",
    representativeRequired: false,
    dpoRequired: true,
    transferMechanism: "uk_idta",
    b2cWithdrawalDays: 14,
    withdrawalButtonRequired: false,
    autoRenewalDisclosure: false,
    propertyFeaturesStatus: "enabled",
    legalPackStatus: "reviewed",
    taxReviewStatus: "reviewed",
    privacyReviewStatus: "reviewed",
    supportStatus: "reviewed",
    legalDisclaimer: reviewedDisclaimer,
  },
  IE: euProfile("IE", "Ireland", "en-IE", "EUR", 23, "+353", ["en-IE"]),
  FR: euProfile("FR", "France", "fr-FR", "EUR", 20, "+33", ["fr-FR"]),
  ES: euProfile("ES", "Spain", "es-ES", "EUR", 21, "+34", ["es-ES"]),
  DE: euProfile("DE", "Germany", "de-DE", "EUR", 19, "+49", ["de-DE"]),
  IT: euProfile("IT", "Italy", "it-IT", "EUR", 22, "+39", ["it-IT"]),
  NL: euProfile("NL", "Netherlands", "nl-NL", "EUR", 21, "+31", ["nl-NL"]),
  BE: euProfile("BE", "Belgium", "fr-FR", "EUR", 21, "+32", ["fr-FR", "nl-NL"]),
  AT: euProfile("AT", "Austria", "de-DE", "EUR", 20, "+43", ["de-DE"]),
  PT: euProfile("PT", "Portugal", "pt-BR", "EUR", 23, "+351", ["pt-BR"]),
  SE: euProfile("SE", "Sweden", "sv-SE", "SEK", 25, "+46", ["sv-SE"]),
  FI: euProfile("FI", "Finland", "fi-FI", "EUR", 25.5, "+358", ["fi-FI"]),
  DK: euProfile("DK", "Denmark", "da-DK", "DKK", 25, "+45", ["da-DK"]),
  CZ: euProfile("CZ", "Czech Republic", "cs-CZ", "CZK", 21, "+420", ["cs-CZ"]),
  HR: euProfile("HR", "Croatia", "hr-HR", "EUR", 25, "+385", ["hr-HR"]),
  HU: euProfile("HU", "Hungary", "hu-HU", "HUF", 27, "+36", ["hu-HU"]),
  RO: euProfile("RO", "Romania", "en-GB", "RON", 19, "+40", ["en-GB"]),
  GR: euProfile("GR", "Greece", "en-GB", "EUR", 24, "+30", ["en-GB"]),
  AU: commonLawProfile("AU", "Australia", "en-AU", "AUD", 10, "GST", "ABN", "+61"),
  NZ: commonLawProfile("NZ", "New Zealand", "en-NZ", "NZD", 15, "GST", "IRD / NZBN", "+64"),
  CA: {
    ...commonLawProfile("CA", "Canada", "en-CA", "CAD", 5, "GST/HST", "GST/HST number", "+1"),
    supportedLocales: ["en-CA", "fr-CA"],
    privacyRegime: "pipeda_law25",
    consentModel: "mixed",
    autoRenewalDisclosure: true,
  },
  US: {
    ...researchProfile("US", "United States", "en-US", "USD", "+1"),
    measurementSystem: "imperial",
    areaUnit: "sqft",
    taxScheme: "sales_tax",
    taxName: "Sales Tax",
    taxIdLabel: "EIN / sales tax ID",
    privacyRegime: "ccpa_patchwork",
    consentModel: "opt_out",
    autoRenewalDisclosure: true,
  },
  CH: researchProfile("CH", "Switzerland", "de-DE", "CHF", "+41", {
    representativeRequired: true,
    privacyRegime: "fadp",
    transferMechanism: "swiss_scc",
  }),
  JP: researchProfile("JP", "Japan", "ja-JP", "JPY", "+81", {
    taxScheme: "consumption_tax",
    taxName: "Consumption Tax",
    standardTaxRate: 10,
    privacyRegime: "appi",
  }),
  TH: researchProfile("TH", "Thailand", "th-TH", "THB", "+66", {
    privacyRegime: "pdpa_th",
    breachNotifyHours: 72,
    legalDisclaimer:
      "Thailand property and short-let guidance is research-only. Propvora must not confirm short-let legality without qualified local review.",
  }),
  BR: researchProfile("BR", "Brazil", "pt-BR", "BRL", "+55", {
    taxScheme: "none",
    taxName: "ISS / indirect tax",
    privacyRegime: "lgpd",
    dpoRequired: true,
    b2cWithdrawalDays: 7,
  }),
  MX: researchProfile("MX", "Mexico", "es-ES", "MXN", "+52"),
  AE: researchProfile("AE", "United Arab Emirates", "en-GB", "AED", "+971"),
  SA: researchProfile("SA", "Saudi Arabia", "en-GB", "SAR", "+966", {
    taxScheme: "vat",
    taxName: "VAT",
    standardTaxRate: 15,
    taxIdLabel: "VAT number",
  }),
  GL: researchProfile("GL", "Greenland", "da-DK", "DKK", "+299", {
    // Greenland is part of the Kingdom of Denmark but outside the EU/EU VAT area.
    privacyRegime: "eu_gdpr",
  }),
  TR: restrictedProfile("TR", "Turkey", "tr-TR", "TRY", "+90", { privacyRegime: "kvkk" }),
  IN: restrictedProfile("IN", "India", "en-GB", "INR", "+91", { privacyRegime: "dpdp" }),
  ID: restrictedProfile("ID", "Indonesia", "en-GB", "IDR", "+62"),
  ZA: restrictedProfile("ZA", "South Africa", "en-GB", "ZAR", "+27", { privacyRegime: "popia" }),
  NG: restrictedProfile("NG", "Nigeria", "en-GB", "NGN", "+234", { privacyRegime: "ndpa" }),
  KE: restrictedProfile("KE", "Kenya", "en-GB", "KES", "+254", { privacyRegime: "ke_dpa" }),
  PK: restrictedProfile("PK", "Pakistan", "en-GB", "PKR", "+92", { privacyRegime: "none_yet" }),
  RU: bannedProfile("RU", "Russia", "ru-RU", "RUB", "+7"),
  IR: bannedProfile("IR", "Iran", "fa-IR", "IRR", "+98"),
  KP: bannedProfile("KP", "North Korea", "ko-KP", "KPW", "+850"),
  SY: bannedProfile("SY", "Syria", "ar-SY", "SYP", "+963"),
  CU: bannedProfile("CU", "Cuba", "es-ES", "CUP", "+53"),
  BY: bannedProfile("BY", "Belarus", "en-GB", "BYN", "+375"),
  VE: bannedProfile("VE", "Venezuela", "es-ES", "VES", "+58"),
  NI: bannedProfile("NI", "Nicaragua", "es-ES", "NIO", "+505"),
  AF: bannedProfile("AF", "Afghanistan", "en-GB", "AFN", "+93"),
  MM: bannedProfile("MM", "Myanmar", "en-GB", "MMK", "+95"),
  YE: bannedProfile("YE", "Yemen", "en-GB", "YER", "+967"),
  SD: bannedProfile("SD", "Sudan", "en-GB", "SDG", "+249"),
  SO: bannedProfile("SO", "Somalia", "en-GB", "SOS", "+252"),
  CN: bannedProfile("CN", "China (mainland)", "en-GB", "CNY", "+86"),
}

function euProfile(
  code: string,
  name: string,
  locale: Locale,
  currency: string,
  vatRate: number,
  phone: string,
  locales: Locale[]
): CountryProfile {
  return researchProfile(code, name, locale, currency, phone, {
    supportedLocales: locales,
    taxScheme: "vat_oss",
    taxName: "VAT",
    standardTaxRate: vatRate,
    taxIdLabel: "VAT number",
    b2bReverseCharge: true,
    privacyRegime: "eu_gdpr",
    representativeRequired: true,
    transferMechanism: "eu_scc",
    b2cWithdrawalDays: 14,
    withdrawalButtonRequired: true,
  })
}

function commonLawProfile(
  code: string,
  name: string,
  locale: Locale,
  currency: string,
  rate: number,
  taxName: string,
  taxIdLabel: string,
  phone: string
): CountryProfile {
  return researchProfile(code, name, locale, currency, phone, {
    taxScheme: "gst",
    taxName,
    standardTaxRate: rate,
    taxIdLabel,
    privacyRegime: code === "AU" ? "app" : code === "NZ" ? "nz_privacy" : "pipeda",
    b2cWithdrawalDays: code === "AU" ? null : 14,
  })
}

function researchProfile(
  code: string,
  name: string,
  locale: Locale,
  currency: string,
  phone: string,
  overrides: Partial<CountryProfile> = {}
): CountryProfile {
  return {
    countryCode: code,
    displayName: name,
    defaultLocale: locale,
    defaultCurrency: currency,
    supportedLocales: [locale],
    measurementSystem: "metric",
    areaUnit: "sqm",
    dateFormat: "yyyy-MM-dd",
    addressModelId: "generic",
    phoneCountryCode: phone,
    offerStatus: "offer",
    stripeBillingSupported: true,
    connectPayoutSupported: true,
    taxScheme: "none",
    taxName: "Tax",
    standardTaxRate: null,
    taxIdLabel: null,
    b2bReverseCharge: false,
    privacyRegime: "research_only",
    dsarResponseDays: 30,
    breachNotifyHours: null,
    consentModel: "mixed",
    representativeRequired: false,
    dpoRequired: false,
    transferMechanism: "none",
    b2cWithdrawalDays: null,
    withdrawalButtonRequired: false,
    autoRenewalDisclosure: false,
    propertyFeaturesStatus: "research_only",
    legalPackStatus: "research_only",
    taxReviewStatus: "research_only",
    privacyReviewStatus: "research_only",
    supportStatus: "research_only",
    legalDisclaimer: genericDisclaimer,
    ...overrides,
  }
}

function restrictedProfile(
  code: string,
  name: string,
  locale: Locale,
  currency: string,
  phone: string,
  overrides: Partial<CountryProfile> = {}
): CountryProfile {
  return {
    ...researchProfile(code, name, locale, currency, phone, overrides),
    offerStatus: "restricted",
    stripeBillingSupported: false,
    connectPayoutSupported: false,
    propertyFeaturesStatus: "research_only",
    legalDisclaimer:
      overrides.legalDisclaimer ??
      "This country is restricted. Manual commercial, payment, sanctions, legal and tax review is required before onboarding or country-specific features are enabled.",
  }
}

function bannedProfile(
  code: string,
  name: string,
  locale: string,
  currency: string,
  phone: string
): CountryProfile {
  const safeLocale = isKnownLocale(locale)
  return {
    ...researchProfile(code, name, safeLocale, currency, phone),
    offerStatus: "banned",
    stripeBillingSupported: false,
    connectPayoutSupported: false,
    taxScheme: "none",
    propertyFeaturesStatus: "disabled",
    legalPackStatus: "disabled",
    taxReviewStatus: "disabled",
    privacyReviewStatus: "disabled",
    supportStatus: "disabled",
    legalDisclaimer:
      "This country is blocked for onboarding and payments until sanctions and legal review explicitly clears it.",
  }
}

function isKnownLocale(locale: string): Locale {
  const supported = [
    "en-GB",
    "en-US",
    "en-AU",
    "en-NZ",
    "en-IE",
    "en-CA",
    "fr-CA",
    "fr-FR",
    "de-DE",
    "es-ES",
    "it-IT",
    "nl-NL",
    "sv-SE",
    "fi-FI",
    "da-DK",
    "cs-CZ",
    "hr-HR",
    "hu-HU",
    "pt-BR",
    "ja-JP",
    "th-TH",
    "tr-TR",
  ]
  return supported.includes(locale) ? (locale as Locale) : "en-GB"
}

export function getCountryProfile(countryCode: string | null | undefined): CountryProfile | null {
  if (!countryCode) return null
  return PROFILES[countryCode.trim().toUpperCase()] ?? null
}

export function listCountryProfiles(): CountryProfile[] {
  return Object.values(PROFILES)
}

