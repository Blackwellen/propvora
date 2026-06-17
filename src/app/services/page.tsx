import type { Metadata } from "next"
import Link from "next/link"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import { Wrench, Zap, Droplets, Flame, Shield, Star, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Services | Propvora — Find verified property maintenance contractors",
  description:
    "Find and book verified property maintenance contractors across 60+ trade categories — plumbers, electricians, gas engineers, cleaners and more.",
  openGraph: {
    title: "Services | Propvora",
    description: "Find verified property maintenance contractors across 60+ trade categories.",
    type: "website",
  },
}

const TOP_CATEGORIES = [
  { icon: Droplets, label: "Plumbing", count: "Gas safe, certified" },
  { icon: Zap, label: "Electrical", count: "NICEIC / NAPIT registered" },
  { icon: Flame, label: "Gas & Heating", count: "Gas Safe engineers" },
  { icon: Wrench, label: "General Maintenance", count: "Handyman & repairs" },
  { icon: Shield, label: "Compliance Certs", count: "EPC, EICR, Gas Safety" },
  { icon: Star, label: "Cleaning", count: "End-of-tenancy, short-let" },
]

const ALL_CATEGORIES = [
  "Plumbing", "Electrical", "Gas & Heating", "Boiler Servicing", "HVAC / Air Con",
  "Roofing", "Drainage", "Locksmith", "Glazing", "Carpentry", "Joinery",
  "Painting & Decorating", "Plastering", "Flooring", "Tiling", "Brickwork",
  "General Handyman", "Appliance Repair", "Kitchen Fitting", "Bathroom Fitting",
  "Damp & Mould", "Pest Control", "Waste Removal", "Garden Maintenance",
  "Tree Surgery", "Fencing", "Driveways", "Scaffolding", "Cleaning",
  "End-of-Tenancy Cleaning", "Short-Let Cleaning", "Linen & Laundry",
  "Inventory Clerk", "EPC Assessor", "Gas Safety Engineer", "EICR Inspection",
  "Fire Safety Assessor", "Asbestos Surveyor", "Legionella Risk Assessment",
  "CCTV & Security", "Alarm Systems", "Smart Locks", "Access Control",
  "WiFi & Networking", "Solar & Renewables", "EV Charger Installation",
  "Removals", "Storage", "Property Photography", "Virtual Tour Provider",
  "Interior Staging", "Letting Compliance", "Property Solicitor",
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Property services,<br />by verified contractors
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
            Browse 60+ trade categories. Every contractor is ID-verified, insured, and reviewed by real property managers.
          </p>
          <Link
            href="/property-manager/marketplace/suppliers"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            Find a contractor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Top categories */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Most requested services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TOP_CATEGORIES.map(({ icon: Icon, label, count }) => (
              <Link
                key={label}
                href={`/property-manager/marketplace/suppliers?category=${encodeURIComponent(label)}`}
                className="flex items-center gap-4 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-700">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All categories A-Z */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6">All service categories</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/property-manager/marketplace/suppliers?category=${encodeURIComponent(cat)}`}
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Are you a contractor? */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Are you a contractor?</h2>
          <p className="text-slate-300 mb-8 max-w-md mx-auto">
            Join the Propvora supplier network. Get matched with property managers, quote on jobs, and grow your business.
          </p>
          <Link
            href="/suppliers"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Become a supplier
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
