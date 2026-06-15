import Link from "next/link"
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Wrench,
  type LucideIcon,
} from "lucide-react"

type MarketplaceKind = "home" | "stays" | "suppliers" | "emergency" | "services"

const NAV = [
  { label: "All", href: "/marketplace", kind: "home" },
  { label: "Stays", href: "/marketplace/stays", kind: "stays" },
  { label: "Suppliers", href: "/marketplace/suppliers", kind: "suppliers" },
  { label: "Emergency", href: "/marketplace/emergency", kind: "emergency" },
  { label: "Services", href: "/marketplace/services", kind: "services" },
] as const

const COPY: Record<MarketplaceKind, { title: string; intro: string; icon: LucideIcon }> = {
  home: {
    title: "Marketplace",
    intro: "Find stays, verified suppliers, emergency contractors and property services in one place.",
    icon: Search,
  },
  stays: {
    title: "Marketplace stays",
    intro: "Discover managed stays, serviced accommodation, mid-term lets and customer-ready booking pages.",
    icon: Building2,
  },
  suppliers: {
    title: "Supplier marketplace",
    intro: "Compare verified cleaners, maintenance teams, compliance providers and professional services.",
    icon: BriefcaseBusiness,
  },
  emergency: {
    title: "Emergency services",
    intro: "Find urgent locksmith, plumbing, electrical, boarding and safety support for live property issues.",
    icon: AlertTriangle,
  },
  services: {
    title: "Property services",
    intro: "Book packages for turnover cleaning, compliance work, utilities, setup and ongoing operations.",
    icon: Wrench,
  },
}

const RESULTS = [
  {
    title: "Managed city stay",
    type: "Stay",
    location: "Manchester",
    price: "From GBP 118/night",
    href: "/marketplace/stays/managed-city-stay",
    badge: "Direct booking",
    icon: Building2,
  },
  {
    title: "Short-let cleaning team",
    type: "Supplier",
    location: "Greater London",
    price: "From GBP 65/turnover",
    href: "/marketplace/suppliers/short-let-cleaning-team",
    badge: "Insurance checked",
    icon: ShieldCheck,
  },
  {
    title: "Emergency locksmith",
    type: "Emergency",
    location: "Within 10 miles",
    price: "Callout from GBP 95",
    href: "/marketplace/emergency/emergency-locksmith",
    badge: "Available now",
    icon: AlertTriangle,
  },
]

export default function PublicMarketplacePage({ kind }: { kind: MarketplaceKind }) {
  const page = COPY[kind]
  const Icon = page.icon

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Propvora
            </Link>
            <nav aria-label="Marketplace sections" className="flex flex-wrap gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    item.kind === kind
                      ? "bg-[#0F3B82] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#0F3B82]">
              <Icon className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{page.intro}</p>
          </div>

          <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-sm font-semibold text-slate-700" htmlFor="marketplace-search">
              Search marketplace
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="marketplace-search"
                name="q"
                placeholder="City, service, supplier or emergency"
                className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              />
              <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white">
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {RESULTS.map((result) => {
            const ResultIcon = result.icon
            return (
              <Link
                key={result.href}
                href={result.href}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF6FF] text-[#0F3B82]">
                    <ResultIcon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {result.badge}
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{result.type}</p>
                <h2 className="mt-1 text-lg font-bold">{result.title}</h2>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  {result.location}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{result.price}</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                    <Star className="h-4 w-4 fill-current" />
                    4.9
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
