/**
 * Comprehensive UK supplier / trade service-category list for the contact
 * (supplier / contractor) create wizard.
 *
 * DB mapping:
 *   - These are free-text labels stored against the supplier contact
 *     (e.g. `contacts.tags` / a future `service_categories` text[] / the
 *     supplier `category` text column). None of these are DB enums, so the
 *     list can be enriched freely without migrations.
 *   - The DB `contact_type` enum (tenant/landlord/supplier/…) is unchanged —
 *     this list only enriches the supplier's *service categories*, not the
 *     contact type itself.
 *
 * Grouped by trade family so the wizard can render labelled sections.
 */

export interface SupplierCategoryGroup {
  group: string
  options: string[]
}

export const SUPPLIER_CATEGORY_GROUPS: SupplierCategoryGroup[] = [
  {
    group: "Plumbing, Heating & Gas",
    options: [
      "Plumber",
      "Gas Engineer (Gas Safe)",
      "Heating / Boiler Engineer",
      "Drainage Specialist",
      "HVAC / Air Conditioning",
    ],
  },
  {
    group: "Electrical",
    options: [
      "Electrician",
      "EICR Electrician",
      "Security & Alarms",
      "Appliance Repair",
    ],
  },
  {
    group: "Building & Structural",
    options: [
      "Builder / General Contractor",
      "Roofer",
      "Plasterer",
      "Carpenter / Joiner",
      "Bricklayer",
      "Scaffolder",
      "Damp & Timber Specialist",
      "Groundworks",
    ],
  },
  {
    group: "Finishing & Interiors",
    options: [
      "Painter & Decorator",
      "Tiler",
      "Flooring Specialist",
      "Glazier",
      "Kitchen & Bathroom Fitter",
      "Plumbing & Fittings",
    ],
  },
  {
    group: "Maintenance & Grounds",
    options: [
      "Handyman",
      "Locksmith",
      "Cleaner",
      "Window Cleaner",
      "Gardener / Landscaper",
      "Pest Control",
      "Waste Removal / Clearance",
    ],
  },
  {
    group: "Compliance & Safety",
    options: [
      "Gas Safety Engineer (CP12)",
      "Fire Safety Specialist",
      "EPC Assessor",
      "Surveyor",
      "Inventory Clerk",
      "Legionella / Water Hygiene",
      "Asbestos Specialist",
    ],
  },
  {
    group: "Utilities & Other",
    options: [
      "Broadband / Telecoms",
      "Utilities Provider",
      "Emergency Repairs",
      "Removals",
      "Other",
    ],
  },
]

/** Flat list of every supplier service category. */
export const SUPPLIER_CATEGORIES: string[] =
  SUPPLIER_CATEGORY_GROUPS.flatMap((g) => g.options)

/** Lower-cased set of known supplier categories, for matching free-text tags. */
const SUPPLIER_CATEGORY_LOOKUP = new Map(
  SUPPLIER_CATEGORIES.map((c) => [c.toLowerCase(), c] as const),
)

/**
 * Derive a supplier contact's service categories from its live fields.
 * Reads (in priority order, de-duplicated, original casing preserved):
 *   - `category` / `subcategory` free-text columns
 *   - any `tags` that match a known supplier service category
 */
export function deriveSupplierCategories(input: {
  category?: string | null
  subcategory?: string | null
  tags?: string[] | null
}): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (raw: string | null | undefined) => {
    const val = (raw ?? "").trim()
    if (!val) return
    const key = val.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(SUPPLIER_CATEGORY_LOOKUP.get(key) ?? val)
  }
  push(input.category)
  push(input.subcategory)
  for (const t of input.tags ?? []) {
    if (SUPPLIER_CATEGORY_LOOKUP.has((t ?? "").trim().toLowerCase())) push(t)
  }
  return out
}
