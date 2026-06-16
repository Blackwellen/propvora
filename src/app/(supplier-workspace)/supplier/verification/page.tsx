"use client"

import Link from "next/link"
import { ShieldCheck, CheckCircle2, Circle, FileBadge, ArrowUpRight } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierStatusBadge,
  SupplierBanner,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate } from "@/components/supplier-workspace/format"
import type {
  SupplierVerificationSummary, SupplierInsuranceRow, SupplierLicenceRow,
} from "@/components/supplier-workspace/types"

interface VerificationEnvelope {
  summary: SupplierVerificationSummary
  insurance: SupplierInsuranceRow[]
  licences: SupplierLicenceRow[]
}

const LEVELS = [
  { level: 1, label: "Email confirmed" },
  { level: 2, label: "Phone confirmed" },
  { level: 3, label: "Payout verified" },
  { level: 4, label: "ID evidence reviewed" },
  { level: 5, label: "Insurance & licence evidence reviewed" },
]

export default function SupplierVerificationPage() {
  const data = useSupplierApi<VerificationEnvelope>(useSupplierApiUrl("/api/supplier/verification"), {
    select: (j) => j as VerificationEnvelope,
  })
  const s = data.data?.summary
  const level = s?.level ?? 0

  return (
    <div className="space-y-5">
      <MobileTopBar title="Verification" subtitle="Trust & badges" />
      <SupplierPageHeader
        title="Verification"
        subtitle="Your verification level and badges. Higher levels unlock higher-risk jobs and payouts."
        actions={
          <Link href="/supplier/insurance" className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
            <FileBadge className="w-4 h-4" /> Insurance & licences
          </Link>
        }
      />

      <SupplierBanner tone="blue">
        Badges reflect <strong>evidence reviewed</strong> by our team — never a guarantee, background check or &quot;government verified&quot; status.
      </SupplierBanner>

      {data.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <SupplierCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-semibold text-slate-900">Verification level</h2>
              </div>
              <SupplierStatusBadge tone={level >= 3 ? "emerald" : "slate"}>L{level} · {s?.levelLabel ?? "Unverified"}</SupplierStatusBadge>
            </div>
            <ol className="space-y-1">
              {LEVELS.map((l) => {
                const reached = level >= l.level
                return (
                  <li key={l.level} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${reached ? "bg-emerald-50/60" : ""}`}>
                    {reached ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${reached ? "text-slate-900" : "text-slate-500"}`}>Level {l.level}</p>
                      <p className="text-xs text-slate-500">{l.label}</p>
                    </div>
                    {reached && <SupplierStatusBadge tone="emerald">Achieved</SupplierStatusBadge>}
                  </li>
                )
              })}
            </ol>
          </SupplierCard>

          <div className="space-y-4">
            <SupplierCard className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Badges</h2>
              <div className="flex flex-wrap gap-2">
                {(s?.badges ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">No badges yet.</p>
                ) : (
                  (s?.badges ?? []).map((b) => (
                    <SupplierStatusBadge key={b.key} tone={b.active ? "emerald" : "slate"}>
                      {b.active ? "✓ " : ""}{b.label}
                    </SupplierStatusBadge>
                  ))
                )}
              </div>
            </SupplierCard>

            <SupplierCard className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Checks</h2>
              <dl className="space-y-2.5">
                <CheckRow label="Identity documents" value={s?.documentCheckStatus} />
                <CheckRow label="Selfie / liveness" value={s?.selfieCheckStatus} />
                <CheckRow label="Manual review" value={s?.manualReviewStatus} />
                <CheckRow label="Insurance on file" value={s?.hasValidInsurance ? "reviewed" : "not reviewed"} />
                <CheckRow label="Licence on file" value={s?.hasValidLicence ? "reviewed" : "not reviewed"} />
              </dl>
              {s?.expiresAt && <p className="mt-3 text-[11px] text-slate-400">Verification valid until {shortDate(s.expiresAt)}.</p>}
              <Link href="/supplier/insurance" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
                Manage insurance & licences <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </SupplierCard>
          </div>
        </div>
      )}
    </div>
  )
}

function CheckRow({ label, value }: { label: string; value?: string }) {
  const v = (value ?? "not_started").toLowerCase()
  const good = /passed|approved|reviewed|complete/.test(v)
  const warn = /pending|in_progress|review/.test(v)
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd>
        <SupplierStatusBadge tone={good ? "emerald" : warn ? "amber" : "slate"}>
          {(value ?? "not started").replace(/_/g, " ")}
        </SupplierStatusBadge>
      </dd>
    </div>
  )
}
