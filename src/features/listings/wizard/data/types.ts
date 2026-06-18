// Listing Creation Wizard — typed draft model.
// Money is ALWAYS integer pence. Use formatPence() to render.

export type ListingType = "short-term" | "long-term"
export type ChannelKey = "direct" | "airbnb" | "booking" | "vrbo" | "google"

export interface Highlight {
  id: string
  label: string
}

export interface AmenityToggle {
  key: string
  label: string
  on: boolean
}

export interface MediaPhoto {
  id: string
  /** storage path workspaces/{ws}/listings/{listingId}/media/... (no URL inputs) */
  storagePath: string
  fileName: string
  caption: string
  alt: string
  isCover: boolean
  room: string | null // null = general gallery
  widthPx: number
  heightPx: number
  fileSizeBytes: number
  format: string // jpg/png/webp
  lighting: "good" | "fair" | "poor"
}

export interface MediaRoom {
  key: string
  label: string
  photoIds: string[]
}

export interface CustomCharge {
  id: string
  label: string
  amountPence: number
  basis: "per-stay" | "per-night" | "per-guest"
}

export interface SeasonalRule {
  id: string
  name: string
  dateRange: string
  adjustmentPct: number
  colour: string
}

export interface BlackoutRange {
  id: string
  label: string
  from: string
  to: string
}

export interface HouseRule {
  id: string
  label: string
  on: boolean
}

export interface ComplianceLink {
  id: string
  label: string
  status: "verified" | "pending" | "missing"
  reference: string
}

export interface ChannelMapping {
  key: ChannelKey
  label: string
  connected: boolean
  externalId: string
}

export interface AccessCode {
  id: string
  label: string
  code: string
  createdAt: string
}

export interface PricingForecastPoint {
  month: string
  revenuePence: number
  occupancyPct: number
}

export interface ListingDraft {
  // Meta
  draftId: string | null
  listingId: string | null
  currentStep: number
  lastSavedAt: string | null

  // ── Step 1: Basics ──
  listingType: ListingType
  channels: ChannelKey[]
  propertyId: string | null
  propertyLabel: string
  title: string
  shortDescription: string
  accommodationType: string
  guestCapacity: number
  bedrooms: number
  bathrooms: number
  beds: number
  addressLine: string
  city: string
  postcode: string
  lat: number | null
  lng: number | null
  neighbourhoodSummary: string
  highlights: Highlight[]
  amenities: AmenityToggle[]

  // ── Step 2: Media ──
  photos: MediaPhoto[]
  rooms: MediaRoom[]
  autoEnhance: boolean
  videoTourName: string | null
  floorplanName: string | null

  // ── Step 3: Pricing & Availability ──
  currency: string
  baseRatePence: number
  weekdayRatePence: number
  weekendRatePence: number
  smartPricing: boolean
  cleaningFeePence: number
  serviceFeePence: number
  managementFeePence: number
  customCharges: CustomCharge[]
  minStayNights: number
  maxStayNights: number
  lastMinuteHours: number
  advanceNoticeDays: number
  vatPct: number
  cancellationFeePence: number
  weeklyDiscountPct: number
  monthlyDiscountPct: number
  earlyBirdDiscountPct: number
  seasonalRules: SeasonalRule[]
  blackoutDates: BlackoutRange[]
  instantBook: boolean
  channelSync: Record<ChannelKey, boolean>
  forecast: PricingForecastPoint[]

  // ── Step 4: Policies & Operations ──
  checkInMethod: string
  checkInTime: string
  checkOutTime: string
  identityVerification: HouseRule[]
  houseRules: HouseRule[]
  smokingAllowed: boolean
  petsAllowed: boolean
  partiesAllowed: boolean
  cancellationPolicy: string
  damageDepositPence: number
  licenceNumber: string
  licenceVerified: boolean
  compliance: ComplianceLink[]
  selfCheckInInstructions: string
  cleaningTurnaroundHours: number
  assignedHousekeeper: string
  emergencyContact: string
  msgPreEnabled: boolean
  msgDuringEnabled: boolean
  msgPostEnabled: boolean
  accessCodes: AccessCode[]
  operationalNotes: string

  // ── Step 5: Review & Publish ──
  channelMappings: ChannelMapping[]
  visibility: "public" | "unlisted" | "draft"
  published: boolean
}

export interface HookState<T> {
  data: T
  loading: boolean
  error: string | null
  source: "live" | "seed"
  reload: () => void
}

export interface PropertyOption {
  id: string
  label: string
  address: string
}

export interface ValidationItem {
  key: string
  label: string
  complete: boolean
  blocking: boolean
}
