/* ──────────────────────────────────────────────────────────────────────────
   Supplier Services — shared domain types (Catalogue / Packages).
   Money is integer pence throughout.
─────────────────────────────────────────────────────────────────────────── */

export type ServiceCategory =
  | "heating"
  | "electrical"
  | "plumbing"
  | "gas"
  | "general"
  | "ev"
  | "drainage"

export type PricingModel = "fixed" | "range" | "quote_only"

export interface CatalogueService {
  id: string
  name: string
  category: ServiceCategory
  categories: ServiceCategory[]
  imageHue: string
  pricingModel: PricingModel
  pricePence: number | null
  priceMinPence: number | null
  priceMaxPence: number | null
  instantPay: boolean
  emergency: boolean
  docsCount: number
  coverage: string
  rating: number
  jobsCount: number
  revenuePence: number
  visible: boolean
}

export interface CatalogueData {
  services: CatalogueService[]
  supplier: {
    name: string
    verified: boolean
    rating: number
    reviews: number
  }
  kpis: {
    activeServices: number
    quoteOnlyServices: number
    instantPayServices: number
    emergencyServices: number
    topRevenueServiceName: string
    topRevenuePence: number
  }
}

export interface PackageLine {
  id: string
  label: string
  pricePence: number
  costPence: number
}

export interface PackageAddon {
  id: string
  name: string
  pricePence: number
  attached: boolean
  attachRate: number
}

export interface ServicePackage {
  id: string
  name: string
  description: string
  imageHue: string
  pricingModel: PricingModel
  pricePence: number | null
  priceMinPence: number | null
  priceMaxPence: number | null
  marginPence: number
  attachRate: number
  bookings: number
  rating: number
  health: "on_track" | "at_risk"
  mostPopular: boolean
  active: boolean
  recurring: boolean
  lines: PackageLine[]
  addons: PackageAddon[]
  materialsIncluded: string[]
  materialsExcluded: string[]
  upsells: { id: string; label: string; attachPct: number }[]
}

export interface PackagesData {
  packages: ServicePackage[]
  kpis: {
    activePackages: number
    mostBookedPackage: string
    packageRevenuePence: number
    addOnAttachRate: number
  }
}
