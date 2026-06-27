import { Suspense } from "react"
import PublicSearchBar from "@/components/public-marketplace/PublicSearchBar"
import PublicFilterChips from "@/components/public-marketplace/PublicFilterChips"
import PublicResultsToolbar from "@/components/public-marketplace/PublicResultsToolbar"
import MarketplaceTrustStrip from "@/components/public-marketplace/MarketplaceTrustStrip"
import ProviderCard from "@/components/public-marketplace/cards/ProviderCard"
import ProviderFeaturedCard from "@/components/public-marketplace/cards/ProviderFeaturedCard"
import ServiceOfferCard from "@/components/public-marketplace/cards/ServiceOfferCard"
import EmergencyServiceCard from "@/components/public-marketplace/cards/EmergencyServiceCard"
import {
  getPublicProviders,
  getFeaturedProviders,
  getPublicServiceOffers,
  getFeaturedServiceOffers,
  getPublicEmergencyServices,
} from "@/lib/public-marketplace/queries"
import type { PublicProvider, PublicServiceOffer, PublicEmergencyService } from "@/lib/public-marketplace/types"
import { Shield, Star, AlertTriangle, Clock, Phone, Siren } from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Unified PM suppliers marketplace — the three tab bodies.
   All three sections are server components that read searchParams for:
     ?q=        — free-text search term
     ?where=    — location filter
     ?trade=    — trade filter (suppliers)
     ?filters=  — comma-separated active filter chips
     ?sort=     — sort option
     ?category= — service category filter
   and apply them in-memory to the data layer.
─────────────────────────────────────────────────────────────────────────── */

type SearchParamsMap = Record<string, string | string[] | undefined>

function sp(params: SearchParamsMap, key: string): string {
  const v = params[key]
  return typeof v === "string" ? v : ""
}

const HUB = "/property-manager/marketplace/suppliers-hub"

/* ── Suppliers filter + sort ──────────────────────────────────────────── */

function filterProviders(
  providers: PublicProvider[],
  params: SearchParamsMap,
): PublicProvider[] {
  const q       = sp(params, "q").toLowerCase().trim()
  const where   = sp(params, "where").toLowerCase().trim()
  const trade   = sp(params, "trade").toLowerCase().trim()
  const filters = sp(params, "filters").split(",").filter(Boolean)
  const sort    = sp(params, "sort")

  let results = providers

  if (q) {
    results = results.filter(
      p =>
        p.companyName.toLowerCase().includes(q) ||
        p.trade.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    )
  }
  if (where) {
    results = results.filter(
      p =>
        p.location.toLowerCase().includes(where) ||
        p.city.toLowerCase().includes(where),
    )
  }
  if (trade) {
    results = results.filter(p => p.trade.toLowerCase().includes(trade))
  }
  if (filters.includes("vetted"))        results = results.filter(p => p.vetted)
  if (filters.includes("emergency"))     results = results.filter(p => p.emergency24h)
  if (filters.includes("insurance"))     results = results.filter(p => p.insured)
  if (filters.includes("gas-safe"))      results = results.filter(p => !!p.gasSafe)
  if (filters.includes("niceic"))        results = results.filter(p => !!p.niceic)
  if (filters.includes("top-rated"))     results = results.filter(p => p.rating >= 4.8)
  if (filters.includes("fast-response")) results = results.filter(p => {
    // responseTime may be e.g. "30 mins" or "1 hour"
    return p.responseTime?.toLowerCase().includes("30") || p.responseTime?.toLowerCase().includes("15")
  })

  if (sort === "Price: Low to High") results = [...results].sort((a, b) => a.fromPrice - b.fromPrice)
  if (sort === "Price: High to Low") results = [...results].sort((a, b) => b.fromPrice - a.fromPrice)
  if (sort === "Rating")             results = [...results].sort((a, b) => b.rating - a.rating)
  if (sort === "Newest")             results = [...results].reverse()

  return results
}

/* ── Services filter + sort ──────────────────────────────────────────── */

function filterServiceOffers(
  offers: PublicServiceOffer[],
  params: SearchParamsMap,
): PublicServiceOffer[] {
  const q        = sp(params, "q").toLowerCase().trim()
  const where    = sp(params, "where").toLowerCase().trim()
  const filters  = sp(params, "filters").split(",").filter(Boolean)
  const category = sp(params, "category").toLowerCase().trim()
  const sort     = sp(params, "sort")

  let results = offers

  if (q) {
    results = results.filter(
      o =>
        o.title.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.providerName.toLowerCase().includes(q),
    )
  }
  if (where) {
    results = results.filter(
      o =>
        o.location.toLowerCase().includes(where) ||
        o.city.toLowerCase().includes(where),
    )
  }
  if (category && category !== "all") {
    results = results.filter(o => o.category.toLowerCase().includes(category))
  }
  if (filters.includes("verified"))     results = results.filter(o => o.verified)
  if (filters.includes("urgent"))       results = results.filter(o => o.urgent)
  if (filters.includes("residential"))  results = results.filter(o => o.tags?.includes("residential"))
  if (filters.includes("commercial"))   results = results.filter(o => o.tags?.includes("commercial"))
  if (filters.includes("top-rated"))    results = results.filter(o => o.rating >= 4.8)
  if (filters.includes("emergency"))    results = results.filter(o => o.urgent)

  if (sort === "Price: Low to High") results = [...results].sort((a, b) => a.basePrice - b.basePrice)
  if (sort === "Price: High to Low") results = [...results].sort((a, b) => b.basePrice - a.basePrice)
  if (sort === "Rating")             results = [...results].sort((a, b) => b.rating - a.rating)
  if (sort === "Newest")             results = [...results].reverse()

  return results
}

/* ── Emergency filter + sort ─────────────────────────────────────────── */

function filterEmergencyServices(
  services: PublicEmergencyService[],
  params: SearchParamsMap,
): PublicEmergencyService[] {
  const q      = sp(params, "q").toLowerCase().trim()
  const where  = sp(params, "where").toLowerCase().trim()
  const filters = sp(params, "filters").split(",").filter(Boolean)
  const sort   = sp(params, "sort")

  let results = services

  if (q) {
    results = results.filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q),
    )
  }
  if (where) {
    results = results.filter(
      s =>
        s.location.toLowerCase().includes(where) ||
        s.coveragePostcodes.some(p => p.toLowerCase().startsWith(where)),
    )
  }
  if (filters.includes("police-vetted"))  results = results.filter(s => s.policeVetted)
  if (filters.includes("insured"))        results = results.filter(s => s.insured)
  if (filters.includes("no-callout-fee")) results = results.filter(s => s.noCalloutFee)
  if (filters.includes("24-7"))           results = results.filter(s => s.available24h)

  if (sort === "Price: Low to High")  results = [...results].sort((a, b) => a.baseCalloutPrice - b.baseCalloutPrice)
  if (sort === "Price: High to Low")  results = [...results].sort((a, b) => b.baseCalloutPrice - a.baseCalloutPrice)
  if (sort === "Rating")              results = [...results].sort((a, b) => b.rating - a.rating)
  if (sort === "Fastest Response")    results = [...results].sort((a, b) => a.responseTimeMin - b.responseTimeMin)

  return results
}

/* ── Location label ──────────────────────────────────────────────────── */

function locationLabel(params: SearchParamsMap, fallback: string): string {
  const where = sp(params, "where").trim()
  return where || fallback
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUPPLIERS SECTION
═══════════════════════════════════════════════════════════════════════════ */

const SUPPLIER_CHIPS = [
  { id: "vetted",        label: "Vetted ✓" },
  { id: "emergency",     label: "Emergency cover" },
  { id: "insurance",     label: "Fully insured" },
  { id: "commercial",    label: "Commercial" },
  { id: "residential",   label: "Residential" },
  { id: "gas-safe",      label: "Gas Safe" },
  { id: "niceic",        label: "NICEIC" },
  { id: "top-rated",     label: "Top rated" },
  { id: "fast-response", label: "Fast response" },
]

export async function SuppliersSection({
  searchParams = {},
}: {
  searchParams?: SearchParamsMap
}) {
  const [allProviders, allFeatured] = await Promise.all([
    getPublicProviders(),
    getFeaturedProviders(),
  ])

  const providers = filterProviders(allProviders, searchParams)
  const featured  = filterProviders(allFeatured, searchParams)
  const location  = locationLabel(searchParams, "Your area")

  return (
    <div>
      {/* Page header — H1 always above filters, never below */}
      <section className="bg-gradient-to-b from-violet-50 to-white pt-8 pb-6 px-4 rounded-2xl mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Find trusted suppliers</h1>
        <p className="text-base text-slate-500 mb-6">
          Search and compare verified businesses serving your area.
        </p>
        <Suspense>
          <PublicSearchBar variant="providers" />
        </Suspense>
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <Suspense>
          <PublicFilterChips chips={SUPPLIER_CHIPS} />
        </Suspense>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-4">
        <Suspense>
          <PublicResultsToolbar
            count={providers.length}
            location={location}
            mapHref={`${HUB}/map`}
            listHref={`${HUB}?tab=suppliers`}
            viewMode="grid"
            showSaveSearch
          />
        </Suspense>
      </div>

      {providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Star className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-semibold text-lg">No suppliers match your search</p>
          <p className="text-sm text-slate-400 mt-1">
            Try adjusting your filters or searching a different location.
          </p>
        </div>
      ) : (
        <>
          {/* Featured suppliers — same grid layout as regular cards, amber border differentiates */}
          {featured.length > 0 && (
            <section className="pb-6 px-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                <h2 className="text-base font-bold text-slate-900">Featured suppliers</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {featured.map((p) => (
                  <ProviderFeaturedCard key={p.id} provider={p} basePath={HUB} />
                ))}
              </div>
            </section>
          )}

          {/* Main supplier grid */}
          <section className="pb-10 px-4">
            {featured.length > 0 && (
              <h2 className="text-base font-bold text-slate-900 mb-4">All suppliers</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} basePath={HUB} />
              ))}
            </div>
          </section>
        </>
      )}

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SERVICES SECTION
═══════════════════════════════════════════════════════════════════════════ */

const SERVICE_CHIPS = [
  { id: "verified",     label: "Verified" },
  { id: "urgent",       label: "Urgent" },
  { id: "residential",  label: "Residential" },
  { id: "commercial",   label: "Commercial" },
  { id: "top-rated",    label: "Top rated" },
  { id: "emergency",    label: "Emergency", danger: true },
]

const SERVICE_CATEGORY_IDS = [
  { label: "All services",  id: "all" },
  { label: "Cleaning",      id: "cleaning" },
  { label: "Plumbing",      id: "plumbing" },
  { label: "Electrical",    id: "electrical" },
  { label: "Heating",       id: "heating" },
  { label: "Gardening",     id: "gardening" },
  { label: "Handyman",      id: "handyman" },
  { label: "Waste Removal", id: "waste" },
]

export async function ServicesSection({
  searchParams = {},
}: {
  searchParams?: SearchParamsMap
}) {
  const SERVICES_BASE = `${HUB}/services`
  const EMERGENCY_BASE = `${HUB}/emergency`

  // Emergency is folded into Services as a view, toggled by the "Emergency"
  // chip (?filters=emergency) or legacy ?tab=emergency links.
  const activeFilters = sp(searchParams, "filters").split(",").filter(Boolean)
  const emergencyMode = activeFilters.includes("emergency") || sp(searchParams, "tab") === "emergency"

  if (emergencyMode) {
    return <EmergencyView searchParams={searchParams} basePath={EMERGENCY_BASE} />
  }

  const [allOffers, allFeatured] = await Promise.all([
    getPublicServiceOffers(),
    getFeaturedServiceOffers(),
  ])

  const activeCategory = sp(searchParams, "category") || "all"
  const offers    = filterServiceOffers(allOffers,   { ...searchParams, category: activeCategory })
  const featured  = filterServiceOffers(allFeatured, { ...searchParams, category: activeCategory })
  const location  = locationLabel(searchParams, "Your area")

  // Live category counts — based on the full set so the chips show true totals
  const categoryCountMap = SERVICE_CATEGORY_IDS.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = cat.id === "all"
      ? allOffers.length
      : allOffers.filter(o => o.category.toLowerCase().includes(cat.id)).length
    return acc
  }, {})

  return (
    <div>
      {/* Page header */}
      <section className="bg-gradient-to-b from-emerald-50 to-white pt-8 pb-6 px-4 rounded-2xl mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
          Find trusted services for your properties
        </h1>
        <p className="text-base text-slate-500 mb-6">
          Vetted professionals. Transparent pricing. Quality work, every time.
        </p>
        <Suspense>
          <PublicSearchBar variant="services" />
        </Suspense>
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <Suspense>
          <PublicFilterChips chips={SERVICE_CHIPS} />
        </Suspense>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-4">
        <Suspense>
          <PublicResultsToolbar
            count={offers.length}
            location={location}
            mapHref={`${SERVICES_BASE}/map`}
            listHref={`${HUB}?tab=services`}
            viewMode="grid"
          />
        </Suspense>
      </div>

      {/* Category tabs — <a> links so they update ?category= in URL */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {SERVICE_CATEGORY_IDS.map((cat) => {
            const isActive = activeCategory === cat.id
            const count = categoryCountMap[cat.id] ?? 0
            return (
              <a
                key={cat.id}
                href={`${HUB}?tab=services&category=${cat.id}`}
                className={[
                  "shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                {cat.label}
                {count > 0 && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </a>
            )
          })}
        </div>
      </div>

      {/* Emergency promo — folds the old Emergency tab into a Services view */}
      <a
        href={`${HUB}?tab=services&filters=emergency`}
        className="mx-4 mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-white px-4 py-3 transition-colors hover:border-red-200"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <Siren className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-900">Need it urgently?</span>
            <span className="block text-xs text-slate-500">24/7 emergency call-outs — police-vetted, fast dispatch.</span>
          </span>
        </span>
        <span className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Emergency call-outs →</span>
      </a>

      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Shield className="h-12 w-12 text-slate-200 mb-3" />
          <p className="text-slate-500 font-semibold text-lg">No services match your search</p>
          <p className="text-sm text-slate-400 mt-1">
            Try adjusting your filters or selecting a different category.
          </p>
        </div>
      ) : (
        <>
          {/* Featured services — same grid as main, NOT a horizontal scroll lane */}
          {featured.length > 0 && (
            <section className="pb-6 px-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                <h2 className="text-base font-bold text-slate-900">Featured service offers</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {featured.map((offer) => (
                  <ServiceOfferCard
                    key={offer.id}
                    offer={offer}
                    featured
                    basePath={SERVICES_BASE}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Main services grid */}
          <section className="pb-10 px-4">
            {featured.length > 0 && (
              <h2 className="text-base font-bold text-slate-900 mb-4">All services</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {offers.map((offer) => (
                <ServiceOfferCard key={offer.id} offer={offer} basePath={SERVICES_BASE} />
              ))}
            </div>
          </section>
        </>
      )}

      <MarketplaceTrustStrip />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMERGENCY SECTION
═══════════════════════════════════════════════════════════════════════════ */

const EMERGENCY_TRUST = [
  { icon: Clock,         title: "30–90 min response",     desc: "Fast dispatch to your location" },
  { icon: Shield,        title: "Police vetted & insured", desc: "DBS checked, fully covered" },
  { icon: AlertTriangle, title: "24/7/365 availability",  desc: "Never closed, always ready" },
  { icon: Phone,         title: "Upfront pricing",        desc: "Quoted before work starts" },
]

const EMERGENCY_CHIPS = [
  { id: "police-vetted",  label: "Police vetted" },
  { id: "insured",        label: "Fully insured" },
  { id: "no-callout-fee", label: "No call-out fee" },
  { id: "24-7",           label: "24/7" },
]

const EMERGENCY_SORT_OPTIONS = [
  "Recommended",
  "Fastest Response",
  "Price: Low to High",
  "Price: High to Low",
  "Rating",
]

/**
 * EmergencyView — the emergency call-out discovery surface, rendered INSIDE the
 * Services tab when the "Emergency" filter is active (one discovery surface).
 */
async function EmergencyView({
  searchParams = {},
  basePath,
}: {
  searchParams?: SearchParamsMap
  basePath: string
}) {
  let allServices: PublicEmergencyService[] = []
  try {
    allServices = await getPublicEmergencyServices()
  } catch {
    // graceful empty state — never crash the page
  }

  const services = filterEmergencyServices(allServices, searchParams)
  const location  = locationLabel(searchParams, "Your area")

  return (
    <div>
      {/* Back to all services */}
      <a
        href={`${HUB}?tab=services`}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-[var(--brand)]"
      >
        ← Back to all services
      </a>

      {/* Hero — H1 above search, always */}
      <section className="bg-gradient-to-b from-red-50 to-white pt-8 pb-6 px-4 rounded-2xl mb-4 border border-red-100">
        <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          <Siren className="h-3.5 w-3.5" />
          EMERGENCY CALLOUT — We&apos;re on call and ready to go
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Emergency services</h1>
        <p className="text-base text-slate-500 mb-6">
          24/7 emergency response. Police vetted. Fully insured. Fast dispatch.
        </p>
        {/* Emergency gets its own dedicated search bar */}
        <Suspense>
          <PublicSearchBar variant="emergency" />
        </Suspense>
      </section>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <Suspense>
          <PublicFilterChips chips={EMERGENCY_CHIPS} />
        </Suspense>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-4">
        <Suspense>
          <PublicResultsToolbar
            count={services.length}
            location={location}
            sortOptions={EMERGENCY_SORT_OPTIONS}
            viewMode="grid"
          />
        </Suspense>
      </div>

      {/* Trust strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 px-4">
        {EMERGENCY_TRUST.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <AlertTriangle className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-semibold text-lg">No emergency services match your search</p>
          <p className="text-sm text-slate-400 mt-1">
            Try adjusting your filters or clearing the search.
          </p>
          <p className="text-sm text-red-600 font-semibold mt-4">
            For life-threatening emergencies, always call 999.
          </p>
        </div>
      ) : (
        <section className="pb-10 px-4">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Available emergency services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {services.map((service) => (
              <EmergencyServiceCard
                key={service.id}
                service={service}
                basePath={basePath}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
