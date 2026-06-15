"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  UserCircle,
  Building2,
  Tag,
  MapPin,
  Wrench,
  Clock,
  ShieldCheck,
  CreditCard,
  Store,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierLoadingState,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import type { SupplierProfile } from "@/components/supplier-workspace/types"

/* The onboarding steps mirror the supplier onboarding wizard (canvas §5). Each
   step's completion is inferred from the profile where possible; "Advance" calls
   the provisioning API (advanceOnboarding) which the sibling lib owns. */
interface Step {
  key: string
  label: string
  description: string
  icon: typeof UserCircle
  href: string
  done: (p: SupplierProfile | null) => boolean
}

const STEPS: Step[] = [
  { key: "account", label: "Account type", description: "Tell us whether you're a solo contractor, company or emergency supplier.", icon: UserCircle, href: "/supplier/profile", done: (p) => !!p?.supplier_type },
  { key: "business", label: "Business details", description: "Business name, trading name and experience.", icon: Building2, href: "/supplier/profile", done: (p) => !!p?.business_name },
  { key: "categories", label: "Service categories", description: "Pick the categories and emergency types you cover.", icon: Tag, href: "/supplier/profile", done: (p) => (p?.service_categories?.length ?? 0) > 0 },
  { key: "areas", label: "Service areas", description: "Define where you work and your travel radius.", icon: MapPin, href: "/supplier/profile", done: () => false },
  { key: "services", label: "Services & packages", description: "Create the offerings property managers can request.", icon: Wrench, href: "/supplier/profile", done: () => false },
  { key: "availability", label: "Availability", description: "Set working days, hours and emergency cover.", icon: Clock, href: "/supplier/profile", done: (p) => !!p?.availability_status },
  { key: "verification", label: "Verification", description: "Verify identity, insurance and licences.", icon: ShieldCheck, href: "/supplier/onboarding", done: (p) => /verified|approved/.test((p?.id_verification_status ?? "").toLowerCase()) },
  { key: "payments", label: "Payments", description: "Connect payouts so you can be paid for completed work.", icon: CreditCard, href: "/supplier/earnings", done: () => false },
  { key: "marketplace", label: "Marketplace profile", description: "Add your headline, gallery and publish your profile.", icon: Store, href: "/supplier/marketplace", done: (p) => !!p?.marketplace_enabled },
]

export default function SupplierOnboardingPage() {
  const profile = useSupplierApi<SupplierProfile>("/api/supplier/profile", {
    select: (j) => (j as { profile?: SupplierProfile }).profile ?? (j as SupplierProfile),
  })
  const [advancing, setAdvancing] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const p = profile.data
  const steps = useMemo(() => STEPS.map((s) => ({ ...s, complete: s.done(p) })), [p])
  const completed = steps.filter((s) => s.complete).length
  const pct = Math.round((completed / steps.length) * 100)
  const nextStep = steps.find((s) => !s.complete)

  async function advance(stepKey: string) {
    setAdvancing(true)
    setBanner(null)
    try {
      const res = await fetch("/api/supplier/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step: stepKey, action: "advance" }),
      })
      if (!res.ok) {
        setBanner(res.status === 503 || res.status === 404 ? "Onboarding service isn't available yet — complete this step from its page instead." : "Couldn't update onboarding.")
        return
      }
      profile.refresh()
    } catch {
      setBanner("Network error — please try again.")
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Onboarding" subtitle={`${pct}% complete`} />

      <SupplierPageHeader title="Get set up" subtitle="Complete these steps to publish your profile and start winning work" />

      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5">
          <p className="text-[13px] font-medium text-amber-800">{banner}</p>
          <button onClick={() => setBanner(null)} className="text-[12px] font-semibold text-amber-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Progress */}
      <SupplierCard className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-800">{completed} of {steps.length} steps complete</p>
          <span className="text-sm font-bold text-[#2563EB]">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {nextStep && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <p className="text-sm text-slate-500">
              Next: <span className="font-semibold text-slate-700">{nextStep.label}</span>
            </p>
            <Link
              href={nextStep.href}
              className="inline-flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </SupplierCard>

      {/* Steps */}
      {profile.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={6} /></SupplierCard>
      ) : (
        <SupplierCard className="divide-y divide-slate-100">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.key} className="flex items-center gap-3 p-4">
                <div className="shrink-0">
                  {s.complete ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.complete ? "bg-emerald-50" : "bg-slate-100")}>
                  <Icon className={cn("w-4 h-4", s.complete ? "text-emerald-600" : "text-slate-500")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    <span className="text-slate-400 mr-1.5">{i + 1}.</span>{s.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{s.description}</p>
                </div>
                {s.complete ? (
                  <span className="text-xs font-semibold text-emerald-600 shrink-0">Done</span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={s.href} className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">Open</Link>
                    <button
                      onClick={() => advance(s.key)}
                      disabled={advancing}
                      className="hidden sm:inline-flex text-xs font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                      Mark done
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </SupplierCard>
      )}
    </div>
  )
}
