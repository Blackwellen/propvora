"use client"

import { FileBadge, ShieldCheck, Award } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierStatusBadge,
  SupplierEmptyState, SupplierBanner,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence, expiryLabel, daysUntil } from "@/components/supplier-workspace/format"
import type {
  SupplierVerificationSummary, SupplierInsuranceRow, SupplierLicenceRow,
} from "@/components/supplier-workspace/types"

interface VerificationEnvelope {
  summary: SupplierVerificationSummary
  insurance: SupplierInsuranceRow[]
  licences: SupplierLicenceRow[]
}

function expiryTone(expired: boolean, validTo: string | null): "red" | "amber" | "emerald" {
  if (expired) return "red"
  const d = daysUntil(validTo)
  if (d != null && d <= 30) return "amber"
  return "emerald"
}

export default function SupplierInsurancePage() {
  const data = useSupplierApi<VerificationEnvelope>(useSupplierApiUrl("/api/supplier/verification"), {
    select: (j) => j as VerificationEnvelope,
  })
  const insurance = data.data?.insurance ?? []
  const licences = data.data?.licences ?? []
  const summary = data.data?.summary

  return (
    <div className="space-y-5">
      <MobileTopBar title="Insurance & licences" subtitle="Cover & credentials" />
      <SupplierPageHeader
        title="Insurance & licences"
        subtitle="Your insurance cover and trade licences on file. Keeping these current keeps you eligible for higher-risk jobs."
      />

      <SupplierBanner tone="blue">
        Evidence is reviewed by our team — these records reflect <strong>reviewed evidence</strong>, not a guarantee of cover. Document numbers are masked. To submit new evidence, contact support; admin review is required.
      </SupplierBanner>

      {data.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-2 gap-3">
              <SupplierCard className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Insurance</p>
                  <p className="text-xs text-slate-500">{summary.hasValidInsurance ? "Evidence reviewed" : "Not reviewed"}{summary.insuranceExpiringSoon ? " · expiring soon" : ""}</p>
                </div>
              </SupplierCard>
              <SupplierCard className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center"><Award className="w-5 h-5 text-sky-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Licences</p>
                  <p className="text-xs text-slate-500">{summary.hasValidLicence ? "Evidence reviewed" : "Not reviewed"}{summary.licenceExpiringSoon ? " · expiring soon" : ""}</p>
                </div>
              </SupplierCard>
            </div>
          )}

          <SupplierCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">Insurance policies</h2>
            </div>
            {insurance.length === 0 ? (
              <SupplierEmptyState icon={ShieldCheck} title="No insurance on file" description="When you submit insurance evidence and it's reviewed, your policies appear here with their cover level and expiry." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {insurance.map((p) => (
                  <li key={p.id} className="py-3.5 first:pt-0 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{p.insurance_type.replace(/_/g, " ")}</p>
                        <SupplierStatusBadge tone={p.status === "accepted" ? "emerald" : "slate"}>{p.status}</SupplierStatusBadge>
                        {p.minimum_cover_met && <SupplierStatusBadge tone="emerald">Min cover met</SupplierStatusBadge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.provider ?? "Provider"} · {p.policy_number_masked ?? "—"}
                        {p.coverage_amount_pence != null ? ` · ${moneyPence(p.coverage_amount_pence)} cover` : ""}
                      </p>
                    </div>
                    <SupplierStatusBadge tone={expiryTone(p.expired, p.valid_to)}>{expiryLabel(p.valid_to)}</SupplierStatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </SupplierCard>

          <SupplierCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileBadge className="w-4 h-4 text-sky-600" />
              <h2 className="text-base font-semibold text-slate-900">Trade licences</h2>
            </div>
            {licences.length === 0 ? (
              <SupplierEmptyState icon={FileBadge} title="No licences on file" description="Reviewed trade-licence evidence appears here with the issuing body, the categories it covers, and expiry." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {licences.map((l) => (
                  <li key={l.id} className="py-3.5 first:pt-0 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{l.licence_type.replace(/_/g, " ")}</p>
                        <SupplierStatusBadge tone={l.status === "accepted" ? "emerald" : "slate"}>{l.status}</SupplierStatusBadge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {l.issuing_body ?? "Issuer"} · {l.licence_number_masked ?? "—"}
                        {l.region ? ` · ${l.region}` : ""}{l.country ? `, ${l.country}` : ""}
                      </p>
                      {l.required_for_categories.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Covers: {l.required_for_categories.join(", ")}</p>
                      )}
                    </div>
                    <SupplierStatusBadge tone={expiryTone(l.expired, l.valid_to)}>{expiryLabel(l.valid_to)}</SupplierStatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </SupplierCard>
        </>
      )}
    </div>
  )
}
