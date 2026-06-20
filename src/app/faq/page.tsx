import type { Metadata } from "next"
import Link from "next/link"
import {
  HelpCircle,
  UserPlus,
  Brain,
  Building2,
  Wrench,
  Shield,
  Scale,
  Wallet,
  BookOpen,
  Users,
  Store,
  Settings,
  Plug,
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import FaqRegistrationSection from "@/components/marketing/faq/FaqRegistrationSection"
import FaqAiSection from "@/components/marketing/faq/FaqAiSection"
import FaqPortfoliosSection from "@/components/marketing/faq/FaqPortfoliosSection"
import FaqWorkSection from "@/components/marketing/faq/FaqWorkSection"
import FaqComplianceSection from "@/components/marketing/faq/FaqComplianceSection"
import FaqLegalSection from "@/components/marketing/faq/FaqLegalSection"
import FaqMoneySection from "@/components/marketing/faq/FaqMoneySection"
import FaqAccountingSection from "@/components/marketing/faq/FaqAccountingSection"
import FaqContactsSection from "@/components/marketing/faq/FaqContactsSection"
import FaqSupplierSection from "@/components/marketing/faq/FaqSupplierSection"
import FaqSettingsSection from "@/components/marketing/faq/FaqSettingsSection"
import FaqConnectorsSection from "@/components/marketing/faq/FaqConnectorsSection"

export const metadata: Metadata = {
  title: "FAQ | Propvora Help & Frequently Asked Questions",
  description:
    "Answers to common questions about Propvora — registration, billing, AI Copilot, compliance tracking, work management, and more.",
}

const navSections = [
  { id: "registration", label: "Sign Up", icon: UserPlus, colour: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
  { id: "ai", label: "AI Copilot", icon: Brain, colour: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
  { id: "portfolios", label: "Portfolios", icon: Building2, colour: "text-blue-500 bg-blue-50 hover:bg-blue-100" },
  { id: "work", label: "Work", icon: Wrench, colour: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" },
  { id: "compliance", label: "Compliance", icon: Shield, colour: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
  { id: "legal", label: "Legal", icon: Scale, colour: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" },
  { id: "money", label: "Money", icon: Wallet, colour: "text-sky-600 bg-sky-50 hover:bg-sky-100" },
  { id: "accounting", label: "Accounting", icon: BookOpen, colour: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
  { id: "contacts", label: "Contacts", icon: Users, colour: "text-orange-600 bg-orange-50 hover:bg-orange-100" },
  { id: "suppliers", label: "Suppliers", icon: Store, colour: "text-indigo-500 bg-indigo-50 hover:bg-indigo-100" },
  { id: "settings", label: "Settings", icon: Settings, colour: "text-slate-600 bg-slate-100 hover:bg-slate-200" },
  { id: "connectors", label: "Connectors", icon: Plug, colour: "text-teal-600 bg-teal-50 hover:bg-teal-100" },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
            Everything you need to know about Propvora. Can&apos;t find what you&apos;re looking for?{" "}
            <Link href="/contact" className="text-blue-600 hover:underline font-medium">
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Sticky quick-navigation */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-1.5 py-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {navSections.map(({ id, label, icon: Icon, colour }) => (
              <Link
                key={id}
                href={`#${id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${colour}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* All FAQ sections */}
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
        <FaqRegistrationSection />
        <FaqAiSection />
        <FaqPortfoliosSection />
        <FaqWorkSection />
        <FaqComplianceSection />
        <FaqLegalSection />
        <FaqMoneySection />
        <FaqAccountingSection />
        <FaqContactsSection />
        <FaqSupplierSection />
        <FaqSettingsSection />
        <FaqConnectorsSection />
      </div>

      {/* Bottom CTA */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Still have questions?</h2>
          <p className="text-slate-600 mb-8">
            Our team is happy to help. Reach out and we&apos;ll get back to you within one business day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
            >
              <HelpCircle className="w-4 h-4" />
              Contact Support
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
      </main>

      <PublicFooter />
    </div>
  )
}
