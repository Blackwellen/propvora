// Premium seed data for the Listing Creation Wizard. Used as the initial draft
// state and as 42P01-safe fallback for the property selector and forecast.

import type {
  ListingDraft,
  PropertyOption,
  PricingForecastPoint,
} from "./types"

export const ACCOMMODATION_TYPES = [
  "Entire apartment",
  "Entire house",
  "Private room",
  "Studio",
  "Serviced apartment",
  "Townhouse",
  "Loft",
  "Cottage",
]

export const CHECK_IN_METHODS = [
  "Smart lock",
  "Key lockbox",
  "Self check-in",
  "Meet host / concierge",
  "Building reception",
]

export const CANCELLATION_POLICIES = [
  "Flexible",
  "Moderate",
  "Firm",
  "Strict",
  "Non-refundable",
]

export const SEED_PROPERTIES: PropertyOption[] = [
  { id: "seed-prop-1", label: "Riverside Loft 12B", address: "12B Wharf Lane, Manchester M3 4LZ" },
  { id: "seed-prop-2", label: "Camden Garden Flat", address: "8 Rochester Sq, London NW1 9SA" },
  { id: "seed-prop-3", label: "Harbour View Apartment", address: "44 Marina Walk, Bristol BS1 5UH" },
  { id: "seed-prop-4", label: "The Old Mill Cottage", address: "2 Mill Race, Bath BA2 6QP" },
]

export const SEED_FORECAST: PricingForecastPoint[] = [
  { month: "Jan", revenuePence: 268000, occupancyPct: 62 },
  { month: "Feb", revenuePence: 291000, occupancyPct: 68 },
  { month: "Mar", revenuePence: 334000, occupancyPct: 74 },
  { month: "Apr", revenuePence: 358000, occupancyPct: 79 },
  { month: "May", revenuePence: 402000, occupancyPct: 84 },
  { month: "Jun", revenuePence: 446000, occupancyPct: 90 },
  { month: "Jul", revenuePence: 471000, occupancyPct: 93 },
  { month: "Aug", revenuePence: 468000, occupancyPct: 92 },
  { month: "Sep", revenuePence: 421000, occupancyPct: 86 },
  { month: "Oct", revenuePence: 372000, occupancyPct: 80 },
  { month: "Nov", revenuePence: 318000, occupancyPct: 71 },
  { month: "Dec", revenuePence: 356000, occupancyPct: 77 },
]

export const ESSENTIAL_AMENITIES = [
  "Wi-Fi",
  "Kitchen",
  "Washer",
  "Free parking",
  "Air conditioning",
  "Heating",
  "Dedicated workspace",
  "TV",
  "Hair dryer",
  "Iron",
  "Smoke alarm",
  "Carbon monoxide alarm",
]

export function createInitialDraft(): ListingDraft {
  return {
    draftId: null,
    listingId: null,
    currentStep: 1,
    lastSavedAt: null,

    // Step 1
    listingType: "short-term",
    channels: ["direct", "airbnb"],
    propertyId: null,
    propertyLabel: "",
    title: "Riverside Loft with Skyline Views",
    shortDescription:
      "A bright, design-led loft moments from the waterfront — perfect for couples and remote workers.",
    accommodationType: "Entire apartment",
    guestCapacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    beds: 2,
    addressLine: "12B Wharf Lane",
    city: "Manchester",
    postcode: "M3 4LZ",
    lat: 53.4808,
    lng: -2.2426,
    neighbourhoodSummary:
      "Vibrant canalside district with independent cafés, a 6-minute walk to the tram and easy access to the city centre.",
    highlights: [
      { id: "h1", label: "Skyline views" },
      { id: "h2", label: "Fast Wi-Fi (300 Mbps)" },
      { id: "h3", label: "Self check-in" },
    ],
    amenities: ESSENTIAL_AMENITIES.map((label, i) => ({
      key: `am-${i}`,
      label,
      on: i < 6,
    })),

    // Step 2
    photos: [
      { id: "p1", storagePath: "media/cover.jpg", fileName: "cover.jpg", caption: "Open-plan living with skyline views", alt: "Loft living room at dusk", isCover: true, room: null, widthPx: 4032, heightPx: 3024, fileSizeBytes: 2_900_000, format: "jpg", lighting: "good" },
      { id: "p2", storagePath: "media/kitchen.jpg", fileName: "kitchen.jpg", caption: "Fully equipped kitchen", alt: "Modern kitchen with island", isCover: false, room: "kitchen", widthPx: 3840, heightPx: 2560, fileSizeBytes: 2_100_000, format: "jpg", lighting: "good" },
      { id: "p3", storagePath: "media/bedroom.jpg", fileName: "bedroom.jpg", caption: "Master bedroom", alt: "King bedroom with city view", isCover: false, room: "bedroom", widthPx: 3200, heightPx: 2133, fileSizeBytes: 1_700_000, format: "jpg", lighting: "fair" },
      { id: "p4", storagePath: "media/bathroom.jpg", fileName: "bathroom.jpg", caption: "Walk-in rainfall shower", alt: "Tiled bathroom", isCover: false, room: "bathroom", widthPx: 2400, heightPx: 1600, fileSizeBytes: 980_000, format: "jpg", lighting: "fair" },
    ],
    rooms: [
      { key: "living", label: "Living room", photoIds: ["p1"] },
      { key: "kitchen", label: "Kitchen", photoIds: ["p2"] },
      { key: "bedroom", label: "Bedroom", photoIds: ["p3"] },
      { key: "bathroom", label: "Bathroom", photoIds: ["p4"] },
      { key: "balcony", label: "Balcony", photoIds: [] },
    ],
    autoEnhance: true,
    videoTourName: null,
    floorplanName: null,

    // Step 3
    currency: "GBP",
    baseRatePence: 14500,
    weekdayRatePence: 13500,
    weekendRatePence: 17500,
    smartPricing: true,
    cleaningFeePence: 4500,
    serviceFeePence: 2000,
    managementFeePence: 0,
    customCharges: [],
    minStayNights: 2,
    maxStayNights: 28,
    lastMinuteHours: 24,
    advanceNoticeDays: 1,
    vatPct: 20,
    cancellationFeePence: 5000,
    weeklyDiscountPct: 10,
    monthlyDiscountPct: 22,
    earlyBirdDiscountPct: 5,
    seasonalRules: [
      { id: "s1", name: "Summer peak", dateRange: "Jun – Aug", adjustmentPct: 18, colour: "#F59E0B" },
      { id: "s2", name: "Winter low", dateRange: "Nov – Feb", adjustmentPct: -12, colour: "#3B82F6" },
    ],
    blackoutDates: [],
    instantBook: true,
    channelSync: { direct: true, airbnb: true, booking: false, vrbo: false, google: false },
    forecast: SEED_FORECAST,

    // Step 4
    checkInMethod: "Smart lock",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    identityVerification: [
      { id: "iv1", label: "Government ID required", on: true },
      { id: "iv2", label: "Selfie verification", on: false },
      { id: "iv3", label: "Phone number confirmed", on: true },
    ],
    houseRules: [
      { id: "hr1", label: "Quiet hours after 10pm", on: true },
      { id: "hr2", label: "No unregistered guests", on: true },
      { id: "hr3", label: "Remove shoes indoors", on: false },
    ],
    smokingAllowed: false,
    petsAllowed: false,
    partiesAllowed: false,
    cancellationPolicy: "Moderate",
    damageDepositPence: 20000,
    licenceNumber: "MAN-STL-2026-00471",
    licenceVerified: true,
    compliance: [
      { id: "cl1", label: "Gas safety certificate", status: "verified", reference: "GSC-8841" },
      { id: "cl2", label: "EICR (electrical)", status: "verified", reference: "EICR-2231" },
      { id: "cl3", label: "Smoke & CO alarms", status: "verified", reference: "ALM-0098" },
      { id: "cl4", label: "Public liability insurance", status: "pending", reference: "" },
      { id: "cl5", label: "Local short-let registration", status: "verified", reference: "MAN-STL-2026-00471" },
    ],
    selfCheckInInstructions:
      "Use the smart lock keypad with the code sent 24h before arrival. The entrance is the blue door on Wharf Lane.",
    cleaningTurnaroundHours: 4,
    assignedHousekeeper: "BrightStay Cleaning Co.",
    emergencyContact: "+44 7700 900482",
    msgPreEnabled: true,
    msgDuringEnabled: true,
    msgPostEnabled: true,
    accessCodes: [
      { id: "ac1", label: "Front door", code: "4821", createdAt: "2026-06-01T09:00:00Z" },
    ],
    operationalNotes:
      "Recycling collected on Tuesdays. Spare linens in hallway cupboard. Concierge on site 8am–8pm.",

    // Step 5
    channelMappings: [
      { key: "airbnb", label: "Airbnb", connected: true, externalId: "ABB-220194" },
      { key: "booking", label: "Booking.com", connected: false, externalId: "" },
      { key: "vrbo", label: "Vrbo", connected: false, externalId: "" },
      { key: "google", label: "Google", connected: true, externalId: "GVR-77120" },
    ],
    visibility: "public",
    published: false,
  }
}
