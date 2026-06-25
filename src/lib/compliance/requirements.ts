/**
 * Per-jurisdiction compliance requirements catalogue.
 *
 * Compliance is the most jurisdiction-specific part of property management — the
 * statutory certificate set differs in every country. This module is the single
 * source of truth for "which compliance requirements apply in this jurisdiction".
 * It is consumed by:
 *   - the compliance section layout (jurisdiction disclaimer note)
 *   - the Add-Certificate wizard (Step 1 requirement picker)
 *
 * V1 selectable jurisdictions (those with an `offer` country_packs row) each have a
 * hand-authored, research-backed requirement set built against current public
 * statutory sources, and are marked `reviewed: true`. Each carries a
 * "this is not legal, tax or financial advice" disclaimer (parity with GB — even
 * the GB baseline is informational, not legal advice). Countries that are not
 * selectable in V1 fall through to `localisedGeneric()` (research-only), which uses
 * the country's real energy-certificate name so the set is still country-specific.
 *
 * Sources reviewed (2026): UK Smoke & CO Alarm (England) Regs 2022, Gas Safety
 * (Installation & Use) Regs 1998, EICR/PRS Regs 2020, MEES; Ireland S.I. 137/2019
 * minimum standards, RTB registration, RGI/Safe Electric; Australia state rental
 * safety regimes (smoke alarms AS 3786, biennial gas/electrical checks, pool
 * safety); NZ Healthy Homes Standards + RTA 1986; US federal lead-based-paint
 * disclosure (Title X §1018) + state smoke/CO + warranty of habitability; Canada
 * provincial fire codes (smoke + CO alarms incl. Ontario 2026) + ESA electrical.
 *
 * Enum safety: every requirement's `kind` is a member of the live `compliance_kind`
 * Postgres enum so inserts never violate the column type. Jurisdiction-specific
 * items with no dedicated enum value map to "other" with a descriptive label.
 */

import { getCountryProfile } from "@/lib/i18n/country-profiles"

// Members of the live `compliance_kind` enum.
export type ComplianceKind =
  | "gas_safety"
  | "eicr"
  | "epc"
  | "fire_alarm"
  | "hmo_licence"
  | "insurance"
  | "pat"
  | "other"

/** Icon key — mapped to a concrete lucide icon + colour at the UI boundary. */
export type ComplianceIconKey =
  | "flame"
  | "zap"
  | "leaf"
  | "fire"
  | "building"
  | "shield"
  | "plug"
  | "droplet"
  | "wind"
  | "home"
  | "file"

export interface ComplianceRequirementDef {
  key: string
  label: string
  helper: string
  /** Statutory / legally-required in this jurisdiction. */
  critical: boolean
  /** Enum-safe value written to compliance_items.kind. */
  kind: ComplianceKind
  icon: ComplianceIconKey
}

export interface ComplianceJurisdictionNote {
  regionName: string
  disclaimer: string
  /** True when this set is built to Propvora's reviewed V1 standard. */
  reviewed: boolean
}

const NOT_ADVICE = "This is not legal, tax or financial advice."

// ── Shared, always-available document types ─────────────────────────────────
const OTHER: ComplianceRequirementDef = {
  key: "other", label: "Other", helper: "Any other compliance document",
  critical: false, kind: "other", icon: "file",
}
const BUILDINGS_INSURANCE: ComplianceRequirementDef = {
  key: "building_insurance", label: "Buildings Insurance", helper: "Buildings insurance policy document",
  critical: false, kind: "insurance", icon: "shield",
}
const LANDLORD_INSURANCE: ComplianceRequirementDef = {
  key: "landlord_insurance", label: "Landlord Insurance", helper: "Landlord liability insurance document",
  critical: false, kind: "insurance", icon: "shield",
}

// ── Localised energy-certificate naming per country ─────────────────────────
const ENERGY_CERT: Record<string, { label: string; helper: string }> = {
  GB: { label: "EPC", helper: "Energy Performance Certificate" },
  IE: { label: "BER", helper: "Building Energy Rating certificate" },
  FR: { label: "DPE", helper: "Diagnostic de Performance Énergétique" },
  DE: { label: "Energieausweis", helper: "Energy performance certificate" },
  AT: { label: "Energieausweis", helper: "Energy performance certificate" },
  ES: { label: "Certificado Energético", helper: "Certificado de eficiencia energética" },
  IT: { label: "APE", helper: "Attestato di Prestazione Energetica" },
  NL: { label: "Energielabel", helper: "Energy label" },
  BE: { label: "EPC / PEB", helper: "Energieprestatiecertificaat / certificat PEB" },
  PT: { label: "Certificado Energético", helper: "Certificado energético" },
  SE: { label: "Energideklaration", helper: "Energy declaration" },
  FI: { label: "Energiatodistus", helper: "Energy certificate" },
  DK: { label: "Energimærke", helper: "Energy label" },
  CZ: { label: "PENB", helper: "Průkaz energetické náročnosti budovy" },
  HR: { label: "Energetski certifikat", helper: "Energy certificate" },
  HU: { label: "Energetikai tanúsítvány", helper: "Energy certificate" },
  RO: { label: "Certificat energetic", helper: "Energy performance certificate" },
  GR: { label: "ΠΕΑ", helper: "Energy Performance Certificate (PEA)" },
  CH: { label: "GEAK / CECB", helper: "Cantonal energy certificate (GEAK/CECB)" },
  US: { label: "Energy Disclosure", helper: "Energy disclosure where required by state/city" },
  CA: { label: "EnerGuide", helper: "EnerGuide energy rating where required" },
}

const EU_CODES = new Set([
  "FR", "ES", "DE", "IT", "NL", "BE", "AT", "PT", "SE", "FI", "DK", "CZ", "HR", "HU", "RO", "GR",
])

// ── England & Wales (reviewed) ──────────────────────────────────────────────
const GB_EW: ComplianceRequirementDef[] = [
  { key: "gas_safety", label: "Gas Safety", helper: "Annual CP12 gas safety record (Gas Safety Regs 1998)", critical: true, kind: "gas_safety", icon: "flame" },
  { key: "eicr", label: "EICR", helper: "Electrical Installation Condition Report (5-yearly, PRS Regs 2020)", critical: true, kind: "eicr", icon: "zap" },
  { key: "epc", label: "EPC", helper: "Energy Performance Certificate (min. band E under MEES)", critical: true, kind: "epc", icon: "leaf" },
  { key: "smoke_co", label: "Smoke & CO Alarms", helper: "Smoke alarm per storey + CO alarm by fixed combustion appliances (2022 Regs)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "fire_risk", label: "Fire Risk", helper: "Fire Risk Assessment (communal areas / HMOs)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "legionella", label: "Legionella Risk", helper: "Legionella / water hygiene risk assessment", critical: true, kind: "other", icon: "droplet" },
  { key: "hmo_licence", label: "HMO Licence", helper: "House in Multiple Occupation licence", critical: true, kind: "hmo_licence", icon: "building" },
  { key: "pat_test", label: "PAT Test", helper: "Portable Appliance Testing certificate", critical: false, kind: "pat", icon: "plug" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Scotland (reviewed) ─────────────────────────────────────────────────────
const GB_SCT: ComplianceRequirementDef[] = [
  { key: "gas_safety", label: "Gas Safety", helper: "Annual CP12 gas safety record", critical: true, kind: "gas_safety", icon: "flame" },
  { key: "eicr", label: "EICR", helper: "Electrical Installation Condition Report (5-yearly) + PAT", critical: true, kind: "eicr", icon: "zap" },
  { key: "epc", label: "EPC", helper: "Energy Performance Certificate", critical: true, kind: "epc", icon: "leaf" },
  { key: "smoke_co", label: "Interlinked Alarms", helper: "Interlinked smoke + heat + CO alarms (Tolerable Standard)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "legionella", label: "Legionella Risk", helper: "Legionella / water hygiene risk assessment", critical: true, kind: "other", icon: "droplet" },
  { key: "repairing_standard", label: "Repairing Standard", helper: "Repairing Standard compliance check", critical: true, kind: "other", icon: "home" },
  { key: "landlord_registration", label: "Landlord Registration", helper: "Scottish Landlord Registration", critical: true, kind: "other", icon: "building" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Ireland (reviewed) ──────────────────────────────────────────────────────
const IE_REQS: ComplianceRequirementDef[] = [
  { key: "ber", label: "BER", helper: "Building Energy Rating (B2 min. for new tenancies)", critical: true, kind: "epc", icon: "leaf" },
  { key: "rtb_registration", label: "RTB Registration", helper: "Register each tenancy with the RTB within 1 month", critical: true, kind: "other", icon: "building" },
  { key: "minimum_standards", label: "Minimum Standards", helper: "Housing minimum standards (S.I. 137/2019)", critical: true, kind: "other", icon: "home" },
  { key: "gas_rgi", label: "Gas Safety (RGI)", helper: "Registered Gas Installer service record", critical: true, kind: "gas_safety", icon: "flame" },
  { key: "electrical_reci", label: "Electrical Safety", helper: "RECI / Safe Electric inspection certificate", critical: true, kind: "eicr", icon: "zap" },
  { key: "smoke_co", label: "Smoke & CO Alarms", helper: "Mains/long-life smoke alarms + CO alarm where required", critical: true, kind: "fire_alarm", icon: "fire" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Australia (reviewed) ────────────────────────────────────────────────────
const AU_REQS: ComplianceRequirementDef[] = [
  { key: "smoke_alarm", label: "Smoke Alarms", helper: "Compliant smoke alarms (AS 3786), annual check", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "gas_safety_check", label: "Gas Safety Check", helper: "Gas appliance safety check (biennial, e.g. VIC)", critical: true, kind: "gas_safety", icon: "flame" },
  { key: "electrical_safety", label: "Electrical Safety Check", helper: "Licensed electrical safety check (biennial, e.g. VIC)", critical: true, kind: "eicr", icon: "zap" },
  { key: "pool_safety", label: "Pool Safety", helper: "Pool barrier + safety certificate (register where required)", critical: true, kind: "other", icon: "droplet" },
  { key: "minimum_standards", label: "Minimum Standards", helper: "Rental minimum standards compliance", critical: true, kind: "other", icon: "home" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── New Zealand (reviewed) ──────────────────────────────────────────────────
const NZ_REQS: ComplianceRequirementDef[] = [
  { key: "healthy_homes", label: "Healthy Homes Statement", helper: "Healthy Homes Standards compliance statement (RTA 1986)", critical: true, kind: "other", icon: "home" },
  { key: "heating", label: "Heating", helper: "Fixed heater able to heat the main living room", critical: true, kind: "other", icon: "flame" },
  { key: "insulation", label: "Insulation", helper: "Ceiling & underfloor insulation to standard", critical: true, kind: "other", icon: "wind" },
  { key: "ventilation", label: "Ventilation & Moisture", helper: "Extractor fans, openable windows, moisture/draught control", critical: true, kind: "other", icon: "droplet" },
  { key: "smoke_alarm", label: "Smoke Alarms", helper: "Working photoelectric smoke alarms within 3m of bedrooms", critical: true, kind: "fire_alarm", icon: "fire" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── United States (reviewed) ────────────────────────────────────────────────
const US_REQS: ComplianceRequirementDef[] = [
  { key: "smoke_detector", label: "Smoke Detectors", helper: "Working smoke detectors (required in all 50 states)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "co_detector", label: "Carbon Monoxide Detectors", helper: "CO detectors where fossil-fuel appliances / attached garage", critical: true, kind: "fire_alarm", icon: "wind" },
  { key: "lead_paint", label: "Lead-Based Paint", helper: "Lead-based paint disclosure (federal, pre-1978 housing)", critical: true, kind: "other", icon: "home" },
  { key: "habitability", label: "Warranty of Habitability", helper: "Implied warranty of habitability / fitness", critical: true, kind: "other", icon: "building" },
  { key: "rental_registration", label: "Rental Registration / C of O", helper: "Local rental registration / certificate of occupancy", critical: false, kind: "other", icon: "building" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Canada (reviewed) ───────────────────────────────────────────────────────
const CA_REQS: ComplianceRequirementDef[] = [
  { key: "smoke_alarm", label: "Smoke Alarms", helper: "Smoke alarms on every storey + outside sleeping areas", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "co_alarm", label: "Carbon Monoxide Alarms", helper: "CO alarms by sleeping areas / each storey (e.g. ON 2026)", critical: true, kind: "fire_alarm", icon: "wind" },
  { key: "electrical_safety", label: "Electrical Safety", helper: "ESA / provincial electrical inspection where required", critical: false, kind: "eicr", icon: "zap" },
  { key: "rental_licence", label: "Rental Licence", helper: "Municipal rental licence where required", critical: false, kind: "other", icon: "building" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── France (reviewed) — DDT diagnostics ─────────────────────────────────────
const FR_REQS: ComplianceRequirementDef[] = [
  { key: "dpe", label: "DPE", helper: "Diagnostic de Performance Énergétique (G interdit à la location)", critical: true, kind: "epc", icon: "leaf" },
  { key: "electricite", label: "Électricité", helper: "Diagnostic électrique (installation > 15 ans)", critical: true, kind: "eicr", icon: "zap" },
  { key: "gaz", label: "Gaz", helper: "Diagnostic gaz (installation > 15 ans)", critical: true, kind: "gas_safety", icon: "flame" },
  { key: "crep_plomb", label: "Plomb (CREP)", helper: "Constat de risque d'exposition au plomb (avant 1949)", critical: true, kind: "other", icon: "home" },
  { key: "amiante", label: "Amiante", helper: "Diagnostic amiante (permis avant juillet 1997)", critical: true, kind: "other", icon: "wind" },
  { key: "daaf", label: "Détecteur de Fumée", helper: "Détecteur autonome avertisseur de fumée (DAAF)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "erp", label: "ERP", helper: "État des Risques et Pollutions", critical: false, kind: "other", icon: "file" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Germany (reviewed) ──────────────────────────────────────────────────────
const DE_REQS: ComplianceRequirementDef[] = [
  { key: "energieausweis", label: "Energieausweis", helper: "Energy performance certificate (10-yr; required on letting/renewal)", critical: true, kind: "epc", icon: "leaf" },
  { key: "rauchmelder", label: "Rauchmelder", helper: "Smoke detectors in bedrooms & escape hallways", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "schornsteinfeger", label: "Schornsteinfeger", helper: "Chimney-sweep inspection of combustion/heating systems", critical: true, kind: "other", icon: "wind" },
  { key: "heizung_gas", label: "Heizung / Gas", helper: "Heating & gas appliance safety check", critical: false, kind: "gas_safety", icon: "flame" },
  { key: "elektropruefung", label: "Elektroprüfung", helper: "Electrical installation check (DIN / DGUV V3)", critical: false, kind: "eicr", icon: "zap" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Italy (reviewed) ────────────────────────────────────────────────────────
const IT_REQS: ComplianceRequirementDef[] = [
  { key: "ape", label: "APE", helper: "Attestato di Prestazione Energetica", critical: true, kind: "epc", icon: "leaf" },
  { key: "impianto_elettrico", label: "Impianto Elettrico", helper: "Dichiarazione di conformità impianto elettrico", critical: true, kind: "eicr", icon: "zap" },
  { key: "impianto_gas", label: "Impianto Gas", helper: "Conformità impianto gas / caldaia", critical: true, kind: "gas_safety", icon: "flame" },
  { key: "gas_co_detectors", label: "Rilevatori Gas/CO", helper: "Rilevatori gas/CO ed estintori (locazioni turistiche)", critical: true, kind: "fire_alarm", icon: "fire" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Spain (reviewed) ────────────────────────────────────────────────────────
const ES_REQS: ComplianceRequirementDef[] = [
  { key: "cee", label: "Certificado Energético", helper: "Certificado de Eficiencia Energética (RD 390/2021)", critical: true, kind: "epc", icon: "leaf" },
  { key: "cedula", label: "Cédula de Habitabilidad", helper: "Habitability certificate (required in tenancy)", critical: true, kind: "other", icon: "home" },
  { key: "boletin_electrico", label: "Boletín Eléctrico", helper: "Certificado de instalación eléctrica", critical: true, kind: "eicr", icon: "zap" },
  { key: "gas", label: "Instalación de Gas", helper: "Revisión de instalación de gas", critical: true, kind: "gas_safety", icon: "flame" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Portugal (reviewed) ─────────────────────────────────────────────────────
const PT_REQS: ComplianceRequirementDef[] = [
  { key: "cert_energetico", label: "Certificado Energético", helper: "Certificado energético (SCE)", critical: true, kind: "epc", icon: "leaf" },
  { key: "licenca_utilizacao", label: "Licença de Utilização", helper: "Habitation / use licence", critical: true, kind: "other", icon: "home" },
  { key: "inspecao_gas", label: "Inspeção de Gás", helper: "Inspeção da instalação de gás", critical: true, kind: "gas_safety", icon: "flame" },
  { key: "instalacao_eletrica", label: "Instalação Elétrica", helper: "Certificado de instalação elétrica", critical: false, kind: "eicr", icon: "zap" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Belgium (reviewed) ──────────────────────────────────────────────────────
const BE_REQS: ComplianceRequirementDef[] = [
  { key: "epc_peb", label: "EPC / PEB", helper: "Energy performance certificate (required before lease)", critical: true, kind: "epc", icon: "leaf" },
  { key: "controle_electrique", label: "Contrôle Électrique", helper: "Electrical compliance inspection (25-yr validity)", critical: true, kind: "eicr", icon: "zap" },
  { key: "controle_gaz", label: "Contrôle Gaz / Chaudière", helper: "Gas / boiler inspection (regional)", critical: false, kind: "gas_safety", icon: "flame" },
  { key: "detecteurs_fumee", label: "Détecteurs de Fumée", helper: "Smoke detectors (regional obligation)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "conformite_logement", label: "Conformité Logement", helper: "Housing conformity / safety standards", critical: true, kind: "other", icon: "home" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Switzerland (reviewed) ──────────────────────────────────────────────────
const CH_REQS: ComplianceRequirementDef[] = [
  { key: "geak", label: "GEAK / CECB", helper: "Cantonal energy certificate", critical: false, kind: "epc", icon: "leaf" },
  { key: "controle_oibt", label: "Contrôle Électrique (OIBT)", helper: "Periodic electrical installation inspection (OIBT/NIV)", critical: true, kind: "eicr", icon: "zap" },
  { key: "chauffage_gaz", label: "Chauffage / Gaz", helper: "Heating & gas appliance safety check", critical: false, kind: "gas_safety", icon: "flame" },
  { key: "detecteurs_fumee", label: "Détecteurs de Fumée", helper: "Smoke detectors", critical: false, kind: "fire_alarm", icon: "fire" },
  { key: "etat_lieux", label: "État des Lieux", helper: "Handover / inventory protocol", critical: true, kind: "other", icon: "home" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Sweden (reviewed) ───────────────────────────────────────────────────────
const SE_REQS: ComplianceRequirementDef[] = [
  { key: "energideklaration", label: "Energideklaration", helper: "Energy declaration (10-yr validity)", critical: true, kind: "epc", icon: "leaf" },
  { key: "sba", label: "Brandskydd (SBA)", helper: "Systematic fire-protection work + smoke alarms", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "elbesiktning", label: "Elbesiktning", helper: "Electrical installation inspection", critical: false, kind: "eicr", icon: "zap" },
  { key: "ovk", label: "OVK", helper: "Mandatory ventilation control (Obligatorisk Ventilationskontroll)", critical: false, kind: "other", icon: "wind" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Finland (reviewed) ──────────────────────────────────────────────────────
const FI_REQS: ComplianceRequirementDef[] = [
  { key: "energiatodistus", label: "Energiatodistus", helper: "Energy certificate (sale/rental of homes > 50 m²)", critical: true, kind: "epc", icon: "leaf" },
  { key: "palovaroittimet", label: "Palovaroittimet", helper: "Smoke alarms (owner duty from 2026)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "sahkotarkastus", label: "Sähkötarkastus", helper: "Electrical installation inspection", critical: false, kind: "eicr", icon: "zap" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Denmark (reviewed) ──────────────────────────────────────────────────────
const DK_REQS: ComplianceRequirementDef[] = [
  { key: "energimaerke", label: "Energimærke", helper: "Energy label (required on letting)", critical: true, kind: "epc", icon: "leaf" },
  { key: "roegalarmer", label: "Røgalarmer", helper: "Smoke alarms (landlord install & maintain)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "indflytningsrapport", label: "Indflytningsrapport", helper: "Move-in inspection report (within 2 weeks)", critical: true, kind: "other", icon: "home" },
  { key: "el_installation", label: "El-installation", helper: "Electrical installation inspection", critical: false, kind: "eicr", icon: "zap" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Greenland (reviewed) — Danish-realm baseline ────────────────────────────
const GL_REQS: ComplianceRequirementDef[] = [
  { key: "energy", label: "Energy Certificate", helper: "Energy performance certificate (local equivalent)", critical: false, kind: "epc", icon: "leaf" },
  { key: "smoke_alarm", label: "Smoke Alarms", helper: "Smoke alarms (landlord install & maintain)", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "el_installation", label: "Electrical Safety", helper: "Electrical installation inspection", critical: false, kind: "eicr", icon: "zap" },
  { key: "move_in", label: "Move-in Inspection", helper: "Move-in inspection report", critical: false, kind: "other", icon: "home" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Czechia (reviewed) ──────────────────────────────────────────────────────
const CZ_REQS: ComplianceRequirementDef[] = [
  { key: "penb", label: "PENB", helper: "Průkaz energetické náročnosti budovy", critical: true, kind: "epc", icon: "leaf" },
  { key: "revize_elektro", label: "Revize Elektro", helper: "Electrical installation revision", critical: true, kind: "eicr", icon: "zap" },
  { key: "revize_plynu", label: "Revize Plynu", helper: "Gas installation revision", critical: true, kind: "gas_safety", icon: "flame" },
  { key: "revize_kominu", label: "Revize Komínů", helper: "Chimney / flue inspection", critical: false, kind: "other", icon: "wind" },
  { key: "hlasic_pozaru", label: "Hlásič Požáru", helper: "Smoke detector", critical: true, kind: "fire_alarm", icon: "fire" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── United Arab Emirates (reviewed) ─────────────────────────────────────────
const AE_REQS: ComplianceRequirementDef[] = [
  { key: "ejari", label: "Ejari Registration", helper: "Tenancy contract registration (Dubai; within 14 days)", critical: true, kind: "other", icon: "building" },
  { key: "dewa", label: "DEWA Connection", helper: "Utility (electricity & water) account activation", critical: true, kind: "other", icon: "plug" },
  { key: "civil_defence", label: "Civil Defence", helper: "Civil Defence fire & life-safety compliance", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "energy", label: "Energy / Estidama", helper: "Energy performance / Estidama document where required", critical: false, kind: "epc", icon: "leaf" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

// ── Saudi Arabia (reviewed) ─────────────────────────────────────────────────
const SA_REQS: ComplianceRequirementDef[] = [
  { key: "ejar", label: "Ejar Registration", helper: "Mandatory tenancy contract registration (Ejar)", critical: true, kind: "other", icon: "building" },
  { key: "civil_defence", label: "Civil Defence", helper: "Civil Defence fire & life-safety compliance", critical: true, kind: "fire_alarm", icon: "fire" },
  { key: "electricity", label: "Electricity (SEC)", helper: "Saudi Electricity Company connection / meter", critical: false, kind: "other", icon: "plug" },
  BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
]

interface NamedSet {
  reqs: ComplianceRequirementDef[]
  regionName: string
  disclaimer: string
}

const NAMED_SETS: Record<string, NamedSet> = {
  IE: {
    reqs: IE_REQS, regionName: "Ireland",
    disclaimer: `Based on Irish residential tenancy law — BER, RTB registration, minimum standards (S.I. 137/2019), RGI gas and Safe Electric. ${NOT_ADVICE}`,
  },
  AU: {
    reqs: AU_REQS, regionName: "Australia",
    disclaimer: `Based on Australian state rental safety regimes — smoke alarms (AS 3786), biennial gas/electrical safety checks and pool safety. Specifics vary by state/territory. ${NOT_ADVICE}`,
  },
  NZ: {
    reqs: NZ_REQS, regionName: "New Zealand",
    disclaimer: `Based on the Healthy Homes Standards and Residential Tenancies Act 1986 — heating, insulation, ventilation, moisture and smoke alarms. ${NOT_ADVICE}`,
  },
  US: {
    reqs: US_REQS, regionName: "United States",
    disclaimer: `Based on federal rules (lead-based-paint disclosure, Title X) and common state requirements (smoke/CO detectors, warranty of habitability). Specifics vary by state and city. ${NOT_ADVICE}`,
  },
  CA: {
    reqs: CA_REQS, regionName: "Canada",
    disclaimer: `Based on Canadian provincial fire and electrical codes — smoke + CO alarms (incl. Ontario 2026) and ESA electrical. Specifics vary by province. ${NOT_ADVICE}`,
  },
  FR: {
    reqs: FR_REQS, regionName: "France",
    disclaimer: `Based on the French Dossier de Diagnostics Techniques — DPE, électricité/gaz (> 15 ans), plomb (CREP), amiante, ERP and smoke detector (DAAF). ${NOT_ADVICE}`,
  },
  DE: {
    reqs: DE_REQS, regionName: "Germany",
    disclaimer: `Based on German rented-sector duties — Energieausweis, Rauchmelder, Schornsteinfeger and electrical checks. Specifics vary by Bundesland. ${NOT_ADVICE}`,
  },
  IT: {
    reqs: IT_REQS, regionName: "Italy",
    disclaimer: `Based on Italian rented-sector duties — APE, electrical & gas conformity and gas/CO detectors (tourist lets). ${NOT_ADVICE}`,
  },
  ES: {
    reqs: ES_REQS, regionName: "Spain",
    disclaimer: `Based on Spanish rented-sector duties — Certificado de Eficiencia Energética, cédula de habitabilidad, electrical and gas. Specifics vary by región. ${NOT_ADVICE}`,
  },
  PT: {
    reqs: PT_REQS, regionName: "Portugal",
    disclaimer: `Based on Portuguese rented-sector duties — certificado energético, licença de utilização, gas and electrical. ${NOT_ADVICE}`,
  },
  BE: {
    reqs: BE_REQS, regionName: "Belgium",
    disclaimer: `Based on Belgian rented-sector duties — EPC/PEB, electrical compliance, gas/boiler, smoke detectors and housing conformity. Specifics vary by region. ${NOT_ADVICE}`,
  },
  CH: {
    reqs: CH_REQS, regionName: "Switzerland",
    disclaimer: `Based on Swiss rented-sector duties — cantonal energy certificate, OIBT electrical inspection, heating/gas and handover protocol. Specifics vary by canton. ${NOT_ADVICE}`,
  },
  SE: {
    reqs: SE_REQS, regionName: "Sweden",
    disclaimer: `Based on Swedish rented-sector duties — energideklaration, systematic fire-protection work (SBA), electrical inspection and OVK ventilation control. ${NOT_ADVICE}`,
  },
  FI: {
    reqs: FI_REQS, regionName: "Finland",
    disclaimer: `Based on Finnish rented-sector duties — energiatodistus, smoke alarms (owner duty from 2026) and electrical inspection. ${NOT_ADVICE}`,
  },
  DK: {
    reqs: DK_REQS, regionName: "Denmark",
    disclaimer: `Based on Danish rented-sector duties — energimærke, smoke alarms, move-in inspection and electrical installation. ${NOT_ADVICE}`,
  },
  GL: {
    reqs: GL_REQS, regionName: "Greenland",
    disclaimer: `Greenland is part of the Danish realm; this pack uses a Danish-style rented-sector baseline — energy, smoke alarms, electrical and move-in inspection. ${NOT_ADVICE}`,
  },
  CZ: {
    reqs: CZ_REQS, regionName: "Czechia",
    disclaimer: `Based on Czech rented-sector duties — PENB, electrical & gas revize, chimney inspection and smoke detector. ${NOT_ADVICE}`,
  },
  AE: {
    reqs: AE_REQS, regionName: "United Arab Emirates",
    disclaimer: `Based on UAE rented-sector duties — Ejari registration, DEWA connection and Civil Defence fire safety. Specifics vary by emirate. ${NOT_ADVICE}`,
  },
  SA: {
    reqs: SA_REQS, regionName: "Saudi Arabia",
    disclaimer: `Based on Saudi rented-sector duties — Ejar registration, Civil Defence fire safety and electricity connection. ${NOT_ADVICE}`,
  },
}

function localisedGeneric(code: string): ComplianceRequirementDef[] {
  const energy = ENERGY_CERT[code] ?? { label: "Energy Certificate", helper: "Energy performance certificate (local equivalent)" }
  const energyCritical = EU_CODES.has(code)
  return [
    { key: "energy", label: energy.label, helper: energy.helper, critical: energyCritical, kind: "epc", icon: "leaf" },
    { key: "gas_safety", label: "Gas Safety", helper: "Gas appliance safety record", critical: false, kind: "gas_safety", icon: "flame" },
    { key: "electrical_safety", label: "Electrical Safety", helper: "Electrical installation inspection", critical: false, kind: "eicr", icon: "zap" },
    { key: "fire_safety", label: "Fire Safety", helper: "Fire safety / smoke-alarm assessment", critical: false, kind: "fire_alarm", icon: "fire" },
    BUILDINGS_INSURANCE, LANDLORD_INSURANCE, OTHER,
  ]
}

interface JurisdictionEntry {
  reqs: ComplianceRequirementDef[]
  note: ComplianceJurisdictionNote
}

const RESEARCH_DISCLAIMER = (region: string) =>
  `Compliance requirements for ${region} are a non-reviewed starting point only. Verify every requirement, frequency and exemption with a qualified local professional. ${NOT_ADVICE}`

function regionLabel(code: string): string {
  return getCountryProfile(code)?.displayName ?? code
}

/**
 * Resolve the compliance requirement set + disclaimer for a workspace country.
 * `countryCode` is ISO-3166-1 alpha-2 (GB default). Optional `region` ("EW",
 * "SCT", "NI") refines GB.
 */
export function getComplianceJurisdiction(
  countryCode: string | null | undefined,
  region?: string | null
): JurisdictionEntry {
  const code = (countryCode || "GB").trim().toUpperCase()
  const reg = (region || "").trim().toUpperCase()

  if (code === "GB" || code === "UK") {
    if (reg === "SCT" || reg === "SCOTLAND") {
      return { reqs: GB_SCT, note: { regionName: "Scotland", disclaimer: `Compliance requirements shown are based on Scotland's rented-sector regulations. ${NOT_ADVICE}`, reviewed: true } }
    }
    if (reg === "NI" || reg === "NORTHERN IRELAND") {
      return { reqs: GB_EW, note: { regionName: "Northern Ireland", disclaimer: RESEARCH_DISCLAIMER("Northern Ireland"), reviewed: false } }
    }
    return { reqs: GB_EW, note: { regionName: "England & Wales", disclaimer: `Compliance requirements shown are based on England & Wales regulations. ${NOT_ADVICE}`, reviewed: true } }
  }

  const named = NAMED_SETS[code]
  if (named) {
    return { reqs: named.reqs, note: { regionName: named.regionName, disclaimer: named.disclaimer, reviewed: true } }
  }

  const name = regionLabel(code)
  return { reqs: localisedGeneric(code), note: { regionName: name, disclaimer: RESEARCH_DISCLAIMER(name), reviewed: false } }
}

export function getComplianceRequirements(
  countryCode: string | null | undefined,
  region?: string | null
): ComplianceRequirementDef[] {
  return getComplianceJurisdiction(countryCode, region).reqs
}

export function getComplianceNote(
  countryCode: string | null | undefined,
  region?: string | null
): ComplianceJurisdictionNote {
  return getComplianceJurisdiction(countryCode, region).note
}
