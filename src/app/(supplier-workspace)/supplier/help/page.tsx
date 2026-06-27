"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, LifeBuoy, MessageSquare, AlertTriangle, ArrowRight } from "lucide-react"
import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import {
  SupplierCard,
  SupplierButton,
  SupplierField,
  SupplierBanner,
  supplierInputClass,
  supplierTextareaClass,
} from "@/components/supplier-workspace/ui"
import SupplierDisputesPage from "../disputes/page"

const GUIDES = [
  { title: "Getting started as a supplier", desc: "Set up your profile, services and coverage.", href: "/supplier/profile" },
  { title: "Winning more requests", desc: "How quoting and response time affect your win rate.", href: "/supplier/requests" },
  { title: "Managing jobs end-to-end", desc: "Schedule, evidence, sign-off and invoicing.", href: "/supplier/jobs" },
  { title: "Compliance & verification", desc: "Keep insurance and licences current.", href: "/supplier/compliance" },
]

function Guides() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {GUIDES.map((g) => (
        <Link
          key={g.title}
          href={g.href}
          className="block bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{g.title}</h3>
          <p className="text-xs text-slate-500 mt-1">{g.desc}</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] mt-3">
            Open guide <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      ))}
    </div>
  )
}

function ContactSupport() {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sent, setSent] = useState(false)

  return (
    <SupplierCard className="p-6 max-w-xl">
      {sent && <SupplierBanner tone="emerald" onDismiss={() => setSent(false)}>Your message has been sent to the platform team.</SupplierBanner>}
      <div className="space-y-4 mt-2">
        <SupplierField label="Subject" required>
          <input className={supplierInputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you need help with?" />
        </SupplierField>
        <SupplierField label="Message" required>
          <textarea className={supplierTextareaClass} rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        </SupplierField>
        <SupplierButton
          onClick={() => { if (subject.trim() && body.trim()) { setSent(true); setSubject(""); setBody("") } }}
          disabled={!subject.trim() || !body.trim()}
        >
          <MessageSquare className="w-4 h-4" /> Send to platform
        </SupplierButton>
      </div>
    </SupplierCard>
  )
}

export default function SupplierHelpHub() {
  const { isTeam } = useSupplierPlan()

  const tabs: SupplierHubTab[] = [
    { key: "guides", label: "Guides", icon: BookOpen, render: () => <Guides /> },
    { key: "support", label: "Support", icon: LifeBuoy, render: () => <ContactSupport /> },
    { key: "contact", label: "Contact Platform", icon: MessageSquare, render: () => <ContactSupport /> },
    { key: "disputes", label: "Disputes", icon: AlertTriangle, render: () => <SupplierDisputesPage /> },
  ]

  return (
    <SupplierTabHub
      title="Help"
      subtitle="Guides, support and contacting the platform"
      tabs={tabs}
      isTeam={isTeam}
    />
  )
}
