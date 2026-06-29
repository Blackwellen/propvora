import type { Metadata } from "next"
import Link from "next/link"
import {
  FileText, Shield, Cookie, AlertTriangle, Database, Brain,
  CalendarCheck, Home, Store, Share2, ChevronRight, Scale,
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import { isFeatureEnabled } from "@/lib/flags"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Policies & Legal | Propvora",
  description:
    "Every Propvora policy, agreement and disclaimer in one place — platform terms, privacy, bookings, hosting, marketplace and affiliate.",
}

// `flag` gates a doc/group to a V2 surface — hidden at V1 until the flag is on.
type V2Flag = "marketplaceEnabled" | "bookingManagement"
type Doc = { title: string; href: string; desc?: string; flag?: V2Flag }
type Group = { key: string; title: string; icon: typeof FileText; color: string; bg: string; docs: Doc[]; flag?: V2Flag }

const GROUPS: Group[] = [
  {
    key: "platform",
    title: "Platform & account",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    docs: [
      { title: "Terms of Service", href: "/legal/terms", desc: "The agreement governing your use of Propvora." },
      { title: "Privacy Policy", href: "/legal/privacy", desc: "How we collect, use and protect your data (GDPR)." },
      { title: "Acceptable Use Policy", href: "/legal/acceptable-use", desc: "Rules and prohibited activities on the platform." },
      { title: "Cookie Policy", href: "/legal/cookies", desc: "Cookies and tracking we use, and how to manage them." },
      { title: "Data Processing Agreement", href: "/legal/data-processing", desc: "GDPR DPA for business customers." },
    ],
  },
  {
    key: "trust",
    title: "Trust, security & compliance",
    icon: Shield,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    docs: [
      { title: "Security & Trust", href: "/legal/security", desc: "How we protect your data — encryption, isolation, monitoring." },
      { title: "Sub-processors", href: "/legal/subprocessors", desc: "The third parties that help us deliver the Service, and where they process data." },
      { title: "Data Retention & Deletion", href: "/legal/data-retention", desc: "How long we keep data, and how it is deleted." },
      { title: "Service Level Agreement", href: "/legal/sla", desc: "Availability commitment, service credits and support targets." },
      { title: "Accessibility Statement", href: "/legal/accessibility", desc: "Our WCAG 2.2 AA commitment and how to report barriers." },
      { title: "Complaints Procedure", href: "/legal/complaints", desc: "How to raise a complaint and how we handle it." },
      { title: "Modern Slavery Statement", href: "/legal/modern-slavery", desc: "Our voluntary statement on slavery and human trafficking." },
    ],
  },
  {
    key: "data-ai",
    title: "Data & AI",
    icon: Brain,
    color: "text-sky-600",
    bg: "bg-sky-50",
    docs: [
      { title: "AI Disclaimer", href: "/legal/ai-disclaimer", desc: "What our AI Copilot does and doesn't do." },
      { title: "Booking AI Disclaimer", href: "/legal/booking-ai-disclaimer", desc: "AI assistance limits in booking flows.", flag: "bookingManagement" },
      { title: "Guest Data Notice", href: "/legal/guest-data-notice", desc: "How guest data is handled for bookings.", flag: "bookingManagement" },
    ],
  },
  {
    key: "bookings",
    title: "Bookings & stays (guests)",
    flag: "bookingManagement",
    icon: CalendarCheck,
    color: "text-rose-600",
    bg: "bg-rose-50",
    docs: [
      { title: "Booking Terms", href: "/legal/booking-terms", desc: "Guest-facing terms for stays booked via Propvora." },
      { title: "Guest Terms", href: "/legal/guest-terms" },
      { title: "Buyer Terms", href: "/legal/buyer-terms" },
      { title: "Booking Payment Terms", href: "/legal/booking-payment-terms" },
      { title: "Cancellation Policy", href: "/legal/booking-cancellation-policy" },
      { title: "Refund Policy", href: "/legal/booking-refund-policy" },
      { title: "Review Policy", href: "/legal/booking-review-policy" },
      { title: "Damage Deposit Policy", href: "/legal/damage-deposit-policy" },
      { title: "House Rules Policy", href: "/legal/house-rules-policy" },
      { title: "Safety & Emergency Disclaimer", href: "/legal/safety-emergency-disclaimer" },
      { title: "General Cancellation Policy", href: "/legal/cancellation-policy" },
      { title: "General Refund Policy", href: "/legal/refund-policy" },
    ],
  },
  {
    key: "hosts",
    title: "Hosts & landlords",
    flag: "bookingManagement",
    icon: Home,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    docs: [
      { title: "Host Terms", href: "/legal/host-terms", desc: "The agreement for hosts and landlords." },
      { title: "Host Payout Terms", href: "/legal/host-payout-terms" },
      { title: "Host Insurance Disclaimer", href: "/legal/host-insurance-disclaimer" },
      { title: "Host Tax Disclaimer", href: "/legal/host-tax-disclaimer" },
      { title: "Host Compliance Disclaimer", href: "/legal/host-compliance-disclaimer" },
      { title: "Listing Accuracy Warranty", href: "/legal/listing-accuracy-warranty" },
      { title: "Direct Booking Terms", href: "/legal/direct-booking-terms" },
      { title: "Channel Sync Disclaimer", href: "/legal/channel-sync-disclaimer" },
    ],
  },
  {
    key: "marketplace",
    title: "Marketplace & suppliers",
    flag: "marketplaceEnabled",
    icon: Store,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    docs: [
      { title: "Marketplace Terms", href: "/legal/marketplace-terms", desc: "Terms for the Propvora services marketplace." },
      { title: "Supplier Agreement", href: "/legal/seller-agreement", desc: "For suppliers & tradespeople — verification, fees, payments, disputes." },
      { title: "Marketplace Acceptable Use", href: "/legal/acceptable-use-marketplace" },
    ],
  },
  {
    key: "affiliate",
    title: "Affiliate programme",
    icon: Share2,
    color: "text-pink-600",
    bg: "bg-pink-50",
    docs: [
      { title: "Affiliate Terms", href: "/legal/affiliate-terms", desc: "Commission, payment terms, tracking and prohibited methods." },
    ],
  },
]

export default async function LegalPage() {
  // Hide V2 policy groups/docs (bookings, hosts, marketplace) until their flag
  // is on. At V1 only the live policies (platform, AI, affiliate) are listed.
  const supabase = await createClient()
  const [marketplaceOn, bookingsOn] = await Promise.all([
    isFeatureEnabled("marketplaceEnabled", { supabase }),
    isFeatureEnabled("bookingManagement", { supabase }),
  ])
  const flagOn = (f?: V2Flag) =>
    !f || (f === "marketplaceEnabled" ? marketplaceOn : bookingsOn)
  const groups = GROUPS
    .filter((g) => flagOn(g.flag))
    .map((g) => ({ ...g, docs: g.docs.filter((d) => flagOn(d.flag)) }))
    .filter((g) => g.docs.length > 0)

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white pt-32 pb-14">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-600 shadow-sm">
              <Scale className="h-3.5 w-3.5 text-blue-600" /> Policies & legal
            </div>
            <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Every policy, in one place
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-500">
              All of our agreements, policies and disclaimers — written in plain English. Grouped so you can find exactly what applies to you.
            </p>
          </div>
        </section>

        {/* Grouped documents */}
        <section className="py-14">
          <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6 lg:px-8">
            {groups.map((g) => {
              const Icon = g.icon
              return (
                <div key={g.key}>
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${g.bg}`}>
                      <Icon className={`h-[18px] w-[18px] ${g.color}`} />
                    </div>
                    <h2 className="text-[18px] font-bold text-slate-900">{g.title}</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {g.docs.map((d) => (
                      <Link
                        key={d.href}
                        href={d.href}
                        className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#CFE0F7] hover:shadow-[0_10px_28px_-14px_rgba(37,99,235,0.3)]"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[14.5px] font-semibold text-slate-900 group-hover:text-blue-600">{d.title}</h3>
                          {d.desc && <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{d.desc}</p>}
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-600" />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Contact */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                <Shield className="h-4 w-4 text-blue-600" /> Questions about our policies?
              </h3>
              <p className="mb-3 text-sm text-slate-600">
                Email{" "}
                <a href="mailto:legal@propvora.com" className="font-medium text-blue-600 hover:text-blue-700">legal@propvora.com</a>{" "}
                and our team will help. For general support, contact{" "}
                <a href="mailto:support@propvora.com" className="font-medium text-blue-600 hover:text-blue-700">support@propvora.com</a>.
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                <Cookie className="h-3 w-3" />
                <span>Propvora is a trading name of Blackwellen Ltd · Registered in England &amp; Wales No. 16482166 · ICO ZC160806</span>
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
