import type { Metadata } from "next"
import Link from "next/link"
import {
  FileText,
  Shield,
  Cookie,
  AlertTriangle,
  Database,
  Share2,
  Brain,
  ChevronRight,
  Store,
  Tag,
  ShoppingBag,
  Undo2,
  CalendarX,
  ShieldAlert,
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import { POLICY_LIST } from "@/lib/legal/policies"
import { GUEST_POLICY_LIST, HOST_POLICY_LIST } from "@/lib/legal/booking-policies"

export const metadata: Metadata = {
  title: "Legal | Propvora",
  description: "Propvora legal documents: Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use, Data Processing Agreement, Affiliate Terms, AI Disclaimer, and marketplace policies (Marketplace Terms, Seller Agreement, Buyer Terms, Refund and Cancellation policies).",
}

const documents = [
  {
    icon: FileText,
    title: "Terms of Service",
    description: "The agreement governing your use of the Propvora platform, including subscription terms, acceptable use, intellectual property, and limitations of liability.",
    href: "/legal/terms",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: Shield,
    title: "Privacy Policy",
    description: "How we collect, use, store, and protect your personal data. Includes your GDPR rights, our third-party processors, and how to contact us.",
    href: "/legal/privacy",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    icon: Cookie,
    title: "Cookie Policy",
    description: "What cookies and tracking technologies we use, why we use them, and how you can manage your preferences.",
    href: "/legal/cookies",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    icon: AlertTriangle,
    title: "Acceptable Use Policy",
    description: "Rules governing acceptable use of the platform, prohibited activities, data usage rules, and enforcement measures.",
    href: "/legal/acceptable-use",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    icon: Database,
    title: "Data Processing Agreement",
    description: "Our GDPR Data Processing Agreement for business customers, detailing controller/processor responsibilities, sub-processors, and data transfer mechanisms.",
    href: "/legal/data-processing",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  {
    icon: Share2,
    title: "Affiliate Terms",
    description: "Terms governing the Propvora Affiliate Programme, including commission rates, payment terms, tracking, and prohibited promotion methods.",
    href: "/legal/affiliate-terms",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
  {
    icon: Brain,
    title: "AI Disclaimer",
    description: "What Propvora's AI Copilot does and does not do. Covers the boundaries of AI assistance, accuracy limitations, and the human-approval requirement.",
    href: "/legal/ai-disclaimer",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
]

const marketplaceIcons: Record<string, typeof Store> = {
  "marketplace-terms": Store,
  "seller-agreement": Tag,
  "buyer-terms": ShoppingBag,
  "refund-policy": Undo2,
  "cancellation-policy": CalendarX,
  "acceptable-use": ShieldAlert,
}

const marketplaceDocuments = POLICY_LIST.map((p) => ({
  icon: marketplaceIcons[p.slug] ?? Store,
  title: p.title,
  description: p.summary,
  href: p.href,
  color: "text-indigo-600",
  bg: "bg-indigo-50",
  border: "border-indigo-200",
}))

const guestBookingDocuments = GUEST_POLICY_LIST.map((p) => ({
  title: p.title,
  description: p.summary,
  href: p.href,
}))

const hostBookingDocuments = HOST_POLICY_LIST.map((p) => ({
  title: p.title,
  description: p.summary,
  href: p.href,
}))

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Legal documents</h1>
          <p className="text-lg text-slate-600">
            All of our legal policies, agreements and disclaimers in one place. We believe in clear, plain-English terms that you can actually read.
          </p>
        </div>
      </section>

      {/* Documents */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {documents.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                className="group flex items-start gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${doc.bg} border ${doc.border} flex items-center justify-center flex-shrink-0`}>
                  <doc.icon className={`h-6 w-6 ${doc.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {doc.title}
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed">{doc.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>

          {/* Marketplace policies */}
          <div className="mt-14">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Marketplace policies</h2>
            <p className="text-slate-600 text-sm mb-5">
              Policies for the Propvora marketplace — booking stays and ordering supplier services.
              Propvora facilitates the marketplace; the contract for each stay or service is with the
              operator or supplier providing it.
            </p>
            <div className="space-y-4">
              {marketplaceDocuments.map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="group flex items-start gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${doc.bg} border ${doc.border} flex items-center justify-center flex-shrink-0`}>
                    <doc.icon className={`h-6 w-6 ${doc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{doc.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>

          {/* Booking & direct-booking — guest-facing */}
          <div className="mt-14">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Booking policies (guests)</h2>
            <p className="text-slate-600 text-sm mb-5">
              The terms and policies that apply when you book a stay through a host&rsquo;s
              Propvora booking page. For a direct booking, your contract for the stay is with the
              host; Propvora provides the booking software.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {guestBookingDocuments.map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <FileText className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed mt-0.5">{doc.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Host / property-manager-facing */}
          <div className="mt-14">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Host &amp; property-manager terms</h2>
            <p className="text-slate-600 text-sm mb-5">
              The terms, warranties and disclaimers that apply to hosts and property managers who
              take direct bookings through Propvora. Hosts are the contracting party for the stay;
              Propvora is a software facilitator and is not the host, insurer, or tax/legal adviser.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {hostBookingDocuments.map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed mt-0.5">{doc.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Questions about our legal documents?</h3>
            <p className="text-slate-600 text-sm mb-4">
              If you have any questions about our terms, privacy practices, or data handling, we&apos;re happy to help. Contact our team at{" "}
              <a href="mailto:legal@propvora.com" className="text-blue-600 hover:text-blue-700 font-medium">
                legal@propvora.com
              </a>
            </p>
            <p className="text-slate-500 text-xs">
              Propvora is a trading name of Blackwellen Ltd · Registered in England and Wales, Company No. 16482166 · Registered office: 61 Bridge Street, Kington, HR5 3DJ · ICO registration ZC160806
            </p>
          </div>
        </div>
      </section>
      </main>

      <PublicFooter />
    </div>
  )
}
