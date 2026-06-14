/**
 * Comprehensive UK property (dwelling) type list for the property create wizard.
 *
 * IMPORTANT — DB mapping:
 *   - `value` populates the FREE-TEXT `properties.category` column (text, nullable).
 *     It is NOT a DB enum, so this list can be enriched freely without migrations.
 *   - `template` maps each dwelling type to a valid `property_template` ENUM value
 *     (standard_rental | hmo | r2r | sa_lite | student_let). These enum values are
 *     fixed by the DB and must NOT change — only the mapping below decides which
 *     existing enum value a dwelling type defaults to.
 *
 * Grouped sensibly (Houses, Flats & Apartments, Specialist / Other) so the wizard
 * can render labelled option groups.
 */

export type PropertyTemplate =
  | "standard_rental"
  | "hmo"
  | "r2r"
  | "sa_lite"
  | "student_let"

export interface PropertyTypeOption {
  /** Stored in the free-text `properties.category` column. */
  value: string
  /** Human label shown in the picker. */
  label: string
  /** Valid `property_template` enum value this dwelling type defaults to. */
  template: PropertyTemplate
}

export interface PropertyTypeGroup {
  group: string
  options: PropertyTypeOption[]
}

export const PROPERTY_TYPE_GROUPS: PropertyTypeGroup[] = [
  {
    group: "Houses",
    options: [
      { value: "detached_house", label: "Detached house", template: "standard_rental" },
      { value: "semi_detached_house", label: "Semi-detached house", template: "standard_rental" },
      { value: "end_of_terrace_house", label: "End-of-terrace house", template: "standard_rental" },
      { value: "mid_terrace_house", label: "Mid-terrace house", template: "standard_rental" },
      { value: "townhouse", label: "Townhouse", template: "standard_rental" },
      { value: "cottage", label: "Cottage", template: "standard_rental" },
      { value: "bungalow", label: "Bungalow", template: "standard_rental" },
      { value: "detached_bungalow", label: "Detached bungalow", template: "standard_rental" },
      { value: "mews_house", label: "Mews house", template: "standard_rental" },
      { value: "mansion", label: "Mansion", template: "standard_rental" },
      { value: "manor_house", label: "Manor house", template: "standard_rental" },
    ],
  },
  {
    group: "Flats & Apartments",
    options: [
      { value: "flat_apartment", label: "Flat / Apartment", template: "standard_rental" },
      { value: "purpose_built_flat", label: "Purpose-built flat", template: "standard_rental" },
      { value: "converted_flat", label: "Converted flat", template: "standard_rental" },
      { value: "studio_flat", label: "Studio flat", template: "standard_rental" },
      { value: "maisonette", label: "Maisonette", template: "standard_rental" },
      { value: "duplex", label: "Duplex", template: "standard_rental" },
      { value: "penthouse", label: "Penthouse", template: "standard_rental" },
      { value: "ground_floor_flat", label: "Ground-floor flat", template: "standard_rental" },
      { value: "bedsit", label: "Bedsit", template: "standard_rental" },
    ],
  },
  {
    group: "Shared & Multi-occupancy",
    options: [
      { value: "hmo", label: "HMO (House in Multiple Occupation)", template: "hmo" },
      { value: "hmo_room", label: "HMO room / Lettable room", template: "hmo" },
      { value: "student_house", label: "Student house", template: "student_let" },
      { value: "student_flat", label: "Student flat", template: "student_let" },
      { value: "co_living", label: "Co-living space", template: "hmo" },
    ],
  },
  {
    group: "Serviced & Short-let",
    options: [
      { value: "serviced_apartment", label: "Serviced apartment", template: "sa_lite" },
      { value: "holiday_let", label: "Holiday let", template: "sa_lite" },
      { value: "aparthotel_unit", label: "Aparthotel unit", template: "sa_lite" },
    ],
  },
  {
    group: "Specialist & Other",
    options: [
      { value: "new_build", label: "New-build", template: "standard_rental" },
      { value: "listed_building", label: "Listed building", template: "standard_rental" },
      { value: "park_home", label: "Park home / Static caravan", template: "standard_rental" },
      { value: "houseboat", label: "Houseboat", template: "standard_rental" },
      { value: "chateau_palace", label: "Château / Palace", template: "standard_rental" },
      { value: "annexe", label: "Annexe", template: "standard_rental" },
      { value: "commercial_unit", label: "Commercial unit", template: "standard_rental" },
      { value: "mixed_use", label: "Mixed-use property", template: "standard_rental" },
      { value: "land_plot", label: "Land / Development plot", template: "standard_rental" },
      { value: "other", label: "Other", template: "standard_rental" },
    ],
  },
]

/** Flat list of every option, for lookups. */
export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] =
  PROPERTY_TYPE_GROUPS.flatMap((g) => g.options)

/** Look up a dwelling-type option by its stored category value. */
export function getPropertyTypeOption(value: string): PropertyTypeOption | undefined {
  return PROPERTY_TYPE_OPTIONS.find((o) => o.value === value)
}

/** Map a dwelling-type category value to a valid `property_template` enum value. */
export function templateForPropertyType(value: string): PropertyTemplate {
  return getPropertyTypeOption(value)?.template ?? "standard_rental"
}
