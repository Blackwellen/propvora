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
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"

export const metadata: Metadata = {
  title: "Legal | Propvora",
  description: "Propvora legal documents: Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use, Data Processing Agreement, Affiliate Terms and AI Disclaimer.",
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

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

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

          <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Questions about our legal documents?</h3>
            <p className="text-slate-600 text-sm mb-4">
              If you have any questions about our terms, privacy practices, or data handling, we&apos;re happy to help. Contact our team at{" "}
              <a href="mailto:legal@propvora.com" className="text-blue-600 hover:text-blue-700 font-medium">
                legal@propvora.com
              </a>
            </p>
            <p className="text-slate-500 text-xs">
              Propvora Ltd · Registered in England and Wales · ICO Registered
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
