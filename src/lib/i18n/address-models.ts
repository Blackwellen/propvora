import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * ============================================================================
 * Propvora ADDRESS ENGINE — dynamic, country-aware address models.
 * ============================================================================
 * An address model is a declarative description of the address form for a
 * country: ordered fields, labels, required flags, the postcode/region labels,
 * and (for US/CA/AE) the region option list. The engine renders the right form
 * per country WITHOUT branching UI code.
 *
 * Source of truth is the `address_models` table; this module ships a static
 * mirror of the seeded models so the engine works with zero DB round-trip
 * (and in environments where the table isn't present yet). GB is always the
 * 'gb' model; unknown countries fall back to 'generic'.
 * ============================================================================
 */

export type AddressFieldType = "text" | "select"

export interface AddressField {
  key: string
  label: string
  required: boolean
  type: AddressFieldType
  options?: string[]
}

export interface AddressModel {
  id: string
  name: string
  /** Ordered field keys to render. */
  fieldOrder: string[]
  fields: Record<string, { label: string; required?: boolean; type?: AddressFieldType; options?: string[] }>
  postcodeLabel: string | null
  regionLabel: string | null
  regionRequired: boolean
  regionOptions: string[]
  example: Record<string, string>
}

/** Static mirror of the seeded address_models (kept in lock-step with the migration). */
export const STATIC_ADDRESS_MODELS: Record<string, AddressModel> = {
  gb: {
    id: "gb",
    name: "UK address",
    fieldOrder: ["address_line1", "address_line2", "city", "county", "postcode"],
    fields: {
      address_line1: { label: "Address line 1", required: true },
      address_line2: { label: "Address line 2", required: false },
      city: { label: "Town / city", required: true },
      county: { label: "County", required: false },
      postcode: { label: "Postcode", required: true },
    },
    postcodeLabel: "Postcode",
    regionLabel: "County",
    regionRequired: false,
    regionOptions: [],
    example: { address_line1: "10 Downing Street", city: "London", postcode: "SW1A 2AA" },
  },
  us: {
    id: "us",
    name: "US address",
    fieldOrder: ["address_line1", "address_line2", "city", "state", "zip"],
    fields: {
      address_line1: { label: "Street address", required: true },
      address_line2: { label: "Apt / suite", required: false },
      city: { label: "City", required: true },
      state: { label: "State", required: true, type: "select" },
      zip: { label: "ZIP code", required: true },
    },
    postcodeLabel: "ZIP code",
    regionLabel: "State",
    regionRequired: true,
    regionOptions: [
      "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
    ],
    example: { address_line1: "1600 Pennsylvania Ave NW", city: "Washington", state: "DC", zip: "20500" },
  },
  ca: {
    id: "ca",
    name: "Canada address",
    fieldOrder: ["address_line1", "address_line2", "city", "province", "postal_code"],
    fields: {
      address_line1: { label: "Street address", required: true },
      address_line2: { label: "Unit", required: false },
      city: { label: "City", required: true },
      province: { label: "Province / territory", required: true, type: "select" },
      postal_code: { label: "Postal code", required: true },
    },
    postcodeLabel: "Postal code",
    regionLabel: "Province",
    regionRequired: true,
    regionOptions: ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"],
    example: { address_line1: "111 Wellington St", city: "Ottawa", province: "ON", postal_code: "K1A 0A6" },
  },
  ae: {
    id: "ae",
    name: "UAE address",
    fieldOrder: ["address_line1", "area", "city", "emirate", "po_box"],
    fields: {
      address_line1: { label: "Building / street", required: true },
      area: { label: "Area / district", required: false },
      city: { label: "City", required: true },
      emirate: { label: "Emirate", required: true, type: "select" },
      po_box: { label: "PO Box", required: false },
    },
    postcodeLabel: "PO Box",
    regionLabel: "Emirate",
    regionRequired: true,
    regionOptions: ["Abu Dhabi","Dubai","Sharjah","Ajman","Umm Al Quwain","Ras Al Khaimah","Fujairah"],
    example: { address_line1: "Burj Khalifa", city: "Dubai", emirate: "Dubai" },
  },
  generic: {
    id: "generic",
    name: "Generic address",
    fieldOrder: ["address_line1", "address_line2", "city", "region", "postal_code"],
    fields: {
      address_line1: { label: "Address line 1", required: true },
      address_line2: { label: "Address line 2", required: false },
      city: { label: "City", required: true },
      region: { label: "Region / state", required: false },
      postal_code: { label: "Postal / ZIP code", required: false },
    },
    postcodeLabel: "Postal code",
    regionLabel: "Region",
    regionRequired: false,
    regionOptions: [],
    example: {},
  },
}

/** Resolve a model by id (static). Defaults to 'generic'. */
export function getAddressModel(id: string | null | undefined): AddressModel {
  const key = (id ?? "generic").toLowerCase().trim()
  return STATIC_ADDRESS_MODELS[key] ?? STATIC_ADDRESS_MODELS.generic
}

/** Flatten a model into an ordered, rendered field list (for form engines). */
export function addressFields(model: AddressModel): AddressField[] {
  return model.fieldOrder.map((key) => {
    const f = model.fields[key] ?? { label: key }
    const type: AddressFieldType = f.type ?? "text"
    // A select field without explicit options uses the model's region options
    // (US states / CA provinces / AE emirates).
    const options =
      f.options ?? (type === "select" && model.regionOptions.length ? model.regionOptions : undefined)
    return { key, label: f.label, required: Boolean(f.required), type, options }
  })
}

/** Validate an address value object against a model; returns missing required keys. */
export function validateAddress(
  model: AddressModel,
  value: Record<string, unknown>
): { ok: boolean; missing: string[] } {
  const missing = addressFields(model)
    .filter((f) => f.required)
    .filter((f) => {
      const v = value[f.key]
      return v === undefined || v === null || String(v).trim() === ""
    })
    .map((f) => f.key)
  return { ok: missing.length === 0, missing }
}

/** Format an address value object into display lines using the model's order. */
export function formatAddressLines(model: AddressModel, value: Record<string, unknown>): string[] {
  return model.fieldOrder
    .map((key) => value[key])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
}

/**
 * Live fetch of an address model from the DB (admin/edit tooling). Tolerant:
 * falls back to the static model on any error.
 */
export async function fetchAddressModel(
  supabase: SupabaseClient,
  id: string
): Promise<AddressModel> {
  try {
    const { data, error } = await supabase
      .from("address_models")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error || !data) return getAddressModel(id)
    return {
      id: String(data.id),
      name: String(data.name ?? id),
      fieldOrder: Array.isArray(data.field_order) ? (data.field_order as string[]) : [],
      fields: (data.fields as AddressModel["fields"]) ?? {},
      postcodeLabel: (data.postcode_label as string | null) ?? null,
      regionLabel: (data.region_label as string | null) ?? null,
      regionRequired: Boolean(data.region_required),
      regionOptions: Array.isArray(data.region_options) ? (data.region_options as string[]) : [],
      example: (data.example as Record<string, string>) ?? {},
    }
  } catch {
    return getAddressModel(id)
  }
}
