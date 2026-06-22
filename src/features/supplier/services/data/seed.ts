/* Rich demo seed for the supplier Services surfaces (Catalogue + Packages).
   Retained for design previews only — the live data hooks fall back to the
   HONEST EMPTY datasets below, never this fabricated catalogue. Money is
   integer pence. */

import type { CatalogueData, PackagesData } from "./types"

/* ── Honest empty fallbacks (no fabricated supplier / services / packages) ── */
export const EMPTY_CATALOGUE: CatalogueData = {
  supplier: { name: "Your business", verified: false, rating: 0, reviews: 0 },
  services: [],
  kpis: {
    activeServices: 0,
    quoteOnlyServices: 0,
    instantPayServices: 0,
    emergencyServices: 0,
    topRevenueServiceName: "—",
    topRevenuePence: 0,
  },
}

export const EMPTY_PACKAGES: PackagesData = {
  packages: [],
  kpis: {
    activePackages: 0,
    mostBookedPackage: "—",
    packageRevenuePence: 0,
    addOnAttachRate: 0,
  },
}

export const SEED_CATALOGUE: CatalogueData = {
  supplier: { name: "Bristol Heat & Power", verified: true, rating: 4.8, reviews: 212 },
  services: [
    {
      id: "s1", name: "Annual boiler service", category: "heating", categories: ["heating", "gas"],
      imageHue: "from-rose-400 to-orange-400", pricingModel: "fixed", pricePence: 8900,
      priceMinPence: null, priceMaxPence: null, instantPay: true, emergency: false, docsCount: 3,
      coverage: "All areas", rating: 4.9, jobsCount: 184, revenuePence: 1638400, visible: true,
    },
    {
      id: "s2", name: "Emergency plumbing callout", category: "plumbing", categories: ["plumbing"],
      imageHue: "from-sky-400 to-blue-500", pricingModel: "range", pricePence: null,
      priceMinPence: 9500, priceMaxPence: 28000, instantPay: true, emergency: true, docsCount: 2,
      coverage: "All areas", rating: 4.7, jobsCount: 96, revenuePence: 1248000, visible: true,
    },
    {
      id: "s3", name: "EV charger installation", category: "ev", categories: ["ev", "electrical"],
      imageHue: "from-emerald-400 to-teal-500", pricingModel: "quote_only", pricePence: null,
      priceMinPence: 45000, priceMaxPence: null, instantPay: false, emergency: false, docsCount: 4,
      coverage: "All areas", rating: 4.8, jobsCount: 41, revenuePence: 2050000, visible: true,
    },
    {
      id: "s4", name: "Gas safety certificate (CP12)", category: "gas", categories: ["gas"],
      imageHue: "from-amber-400 to-orange-500", pricingModel: "fixed", pricePence: 6500,
      priceMinPence: null, priceMaxPence: null, instantPay: true, emergency: false, docsCount: 1,
      coverage: "All areas", rating: 4.9, jobsCount: 220, revenuePence: 1430000, visible: true,
    },
    {
      id: "s5", name: "Consumer unit upgrade", category: "electrical", categories: ["electrical"],
      imageHue: "from-violet-400 to-indigo-500", pricingModel: "range", pricePence: null,
      priceMinPence: 35000, priceMaxPence: 65000, instantPay: false, emergency: false, docsCount: 5,
      coverage: "All areas", rating: 4.6, jobsCount: 33, revenuePence: 1650000, visible: false,
    },
    {
      id: "s6", name: "Blocked drain clearance", category: "drainage", categories: ["drainage", "plumbing"],
      imageHue: "from-cyan-400 to-sky-500", pricingModel: "fixed", pricePence: 12000,
      priceMinPence: null, priceMaxPence: null, instantPay: true, emergency: true, docsCount: 1,
      coverage: "All areas", rating: 4.5, jobsCount: 58, revenuePence: 696000, visible: true,
    },
  ],
  kpis: {
    activeServices: 5,
    quoteOnlyServices: 1,
    instantPayServices: 4,
    emergencyServices: 2,
    topRevenueServiceName: "EV charger installation",
    topRevenuePence: 2050000,
  },
}

export const SEED_PACKAGES: PackagesData = {
  packages: [
    {
      id: "p1", name: "Standard heating care", description: "Annual boiler service + gas safety check for one property.",
      imageHue: "from-rose-400 to-orange-400", pricingModel: "fixed", pricePence: 13900,
      priceMinPence: null, priceMaxPence: null, marginPence: 7100, attachRate: 0.42, bookings: 128,
      rating: 4.8, health: "on_track", mostPopular: true, active: true, recurring: true,
      lines: [
        { id: "l1", label: "Annual boiler service", pricePence: 8900, costPence: 3800 },
        { id: "l2", label: "Gas safety certificate", pricePence: 6500, costPence: 2900 },
      ],
      addons: [
        { id: "a1", name: "Boiler filter fit", pricePence: 4500, attached: true, attachRate: 0.38 },
        { id: "a2", name: "Smart thermostat", pricePence: 12000, attached: false, attachRate: 0.21 },
      ],
      materialsIncluded: ["Service kit", "Test certificate"],
      materialsExcluded: ["Replacement parts", "Magnetic filter"],
      upsells: [
        { id: "u1", label: "Add smart thermostat", attachPct: 21 },
        { id: "u2", label: "3-year cover plan", attachPct: 14 },
      ],
    },
    {
      id: "p2", name: "Premium home cover", description: "Heating + plumbing + electrical safety in one annual visit.",
      imageHue: "from-violet-400 to-indigo-500", pricingModel: "range", pricePence: null,
      priceMinPence: 24900, priceMaxPence: 32900, marginPence: 11200, attachRate: 0.51, bookings: 64,
      rating: 4.9, health: "on_track", mostPopular: false, active: true, recurring: true,
      lines: [
        { id: "l3", label: "Boiler service", pricePence: 8900, costPence: 3800 },
        { id: "l4", label: "Electrical safety check", pricePence: 9900, costPence: 4200 },
        { id: "l5", label: "Plumbing inspection", pricePence: 7900, costPence: 3100 },
      ],
      addons: [
        { id: "a3", name: "Smart thermostat", pricePence: 12000, attached: true, attachRate: 0.33 },
        { id: "a4", name: "Leak sensor pack", pricePence: 6500, attached: false, attachRate: 0.18 },
      ],
      materialsIncluded: ["All test certificates"],
      materialsExcluded: ["Parts over £50"],
      upsells: [{ id: "u3", label: "Priority callout", attachPct: 28 }],
    },
    {
      id: "p3", name: "Boiler + system flush", description: "Full system powerflush with boiler service.",
      imageHue: "from-amber-400 to-orange-500", pricingModel: "fixed", pricePence: 38000,
      priceMinPence: null, priceMaxPence: null, marginPence: 16500, attachRate: 0.29, bookings: 37,
      rating: 4.7, health: "at_risk", mostPopular: false, active: true, recurring: false,
      lines: [
        { id: "l6", label: "Powerflush (up to 10 rads)", pricePence: 29000, costPence: 12000 },
        { id: "l7", label: "Boiler service", pricePence: 8900, costPence: 3800 },
      ],
      addons: [{ id: "a5", name: "Magnetic filter", pricePence: 8500, attached: true, attachRate: 0.44 }],
      materialsIncluded: ["Flush chemicals", "Inhibitor"],
      materialsExcluded: ["Pump replacement"],
      upsells: [{ id: "u4", label: "Annual cover plan", attachPct: 19 }],
    },
    {
      id: "p4", name: "Landlord essentials", description: "CP12 + EICR + boiler service bundle for landlords.",
      imageHue: "from-emerald-400 to-teal-500", pricingModel: "fixed", pricePence: 24500,
      priceMinPence: null, priceMaxPence: null, marginPence: 9800, attachRate: 0.36, bookings: 89,
      rating: 4.8, health: "on_track", mostPopular: false, active: false, recurring: true,
      lines: [
        { id: "l8", label: "Gas safety (CP12)", pricePence: 6500, costPence: 2900 },
        { id: "l9", label: "EICR", pricePence: 12000, costPence: 5200 },
        { id: "l10", label: "Boiler service", pricePence: 8900, costPence: 3800 },
      ],
      addons: [{ id: "a6", name: "Portfolio discount", pricePence: 0, attached: false, attachRate: 0.12 }],
      materialsIncluded: ["All certificates"],
      materialsExcluded: ["Remedial works"],
      upsells: [{ id: "u5", label: "Multi-property plan", attachPct: 31 }],
    },
  ],
  kpis: {
    activePackages: 3,
    mostBookedPackage: "Standard heating care",
    packageRevenuePence: 1842000,
    addOnAttachRate: 0.39,
  },
}
