import React from "react"
import Link from "next/link"
import { Globe2, ShieldAlert, CheckCircle2, Languages, ArrowRight, Lock } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { PackStatusBadge, OfferStatusBadge } from "@/components/intl"
import {
  listCountryProfiles,
  getReleaseSummaries,
  listSanctionsRules,
} from "@/lib/international/control-plane"

export const dynamic = "force-dynamic"

export const metadata = { title: "Global control plane — Propvora admin" }

export default async function AdminGlobalPage() {
  const [profiles, summaries, sanctions] = await Promise.all([
    listCountryProfiles(),
    getReleaseSummaries(),
    listSanctionsRules(),
  ])
  const summaryByCode = new Map(summaries.map((s) => [s.countryCode, s]))

  const enabled = summaries.filter((s) => s.state === "enabled").length
  const ready = summaries.filter((s) => s.releaseReady && s.state !== "enabled").length
  const sanctionedCount = sanctions.filter((s) => s.classification === "comprehensive_block").length

  const kpis = [
    { label: "Country packs", value: profiles.length, icon: Globe2, cls: "text-blue-600 bg-blue-50" },
    { label: "Enabled", value: enabled, icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50" },
    { label: "Release-ready", value: ready, icon: ArrowRight, cls: "text-amber-600 bg-amber-50" },
    { label: "Sanctioned", value: sanctionedCount, icon: ShieldAlert, cls: "text-red-600 bg-red-50" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Global control plane</h1>
          <p className="text-sm text-slate-500">
            Country packs, release gates, sanctions and localisation. GB is the protected reviewed
            baseline — every other country defaults to research-only and cannot be enabled until all
            reviews are approved.
          </p>
        </div>
        <Link
          href="/admin/global/translations"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
        >
          <Languages className="w-4 h-4" /> Translation manager
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${k.cls}`}>
              <k.icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[22px] font-bold text-slate-900 leading-none">{k.value}</p>
              <p className="text-[12px] text-slate-500 mt-1">{k.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {profiles.length === 0 ? (
        <Card className="p-8 text-center">
          <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-[14px] font-semibold text-slate-700">Country packs not provisioned</p>
          <p className="text-[12px] text-slate-500 mt-1">
            The internationalisation migration has not been applied to this environment.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[14px] font-bold text-slate-900">Country pack status</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Per-domain pack maturity + release gate. Open a country to record reviews and promote.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-2.5 font-medium">Country</th>
                  <th className="px-3 py-2.5 font-medium">Offer</th>
                  <th className="px-3 py-2.5 font-medium">Property</th>
                  <th className="px-3 py-2.5 font-medium">Legal</th>
                  <th className="px-3 py-2.5 font-medium">Tax</th>
                  <th className="px-3 py-2.5 font-medium">Privacy</th>
                  <th className="px-3 py-2.5 font-medium">Gate</th>
                  <th className="px-3 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const s = summaryByCode.get(p.country_code)
                  const gateBadge =
                    s?.state === "enabled" ? (
                      <Badge variant="success" size="sm" dot>Enabled</Badge>
                    ) : s?.state === "suspended" ? (
                      <Badge variant="danger" size="sm" dot>Suspended</Badge>
                    ) : s?.releaseReady ? (
                      <Badge variant="warning" size="sm" dot>Ready</Badge>
                    ) : (
                      <Badge variant="outline" size="sm">Locked</Badge>
                    )
                  return (
                    <tr key={p.country_code} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-5 py-2.5">
                        <div className="font-semibold text-slate-800">{p.display_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {p.country_code} · {p.default_currency} · {p.default_locale}
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><OfferStatusBadge status={p.offer_status} /></td>
                      <td className="px-3 py-2.5"><PackStatusBadge status={p.property_features_status} /></td>
                      <td className="px-3 py-2.5"><PackStatusBadge status={p.legal_status} /></td>
                      <td className="px-3 py-2.5"><PackStatusBadge status={p.tax_status} /></td>
                      <td className="px-3 py-2.5"><PackStatusBadge status={p.privacy_status} /></td>
                      <td className="px-3 py-2.5">{gateBadge}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          href={`/admin/global/${p.country_code}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Manage <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
