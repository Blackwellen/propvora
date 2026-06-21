import React from "react"
import Link from "next/link"
import { ShieldCheck, KeyRound, TrendingUp, ChevronRight } from "lucide-react"
import { AdminSectionCard } from "@/components/admin/ui"

type RoleMixEntry = { label: string; value: number }

interface KpiData {
  total: number | null
  mfaEnabled: number | null
  suspended: number | null
  unassigned: number | null
  activeLast30: number | null
  roleMix: RoleMixEntry[]
}

function fmt(n: number | null) { return n === null ? "—" : n.toLocaleString("en-GB") }

function roleLabel(role: string) {
  if (role === "platform_admin" || role === "admin") return "Platform admin"
  if (role === "support") return "Support"
  return "User"
}

interface Props {
  kpis: KpiData
}

export function UserRoleMixPanel({ kpis }: Props) {
  return (
    <div className="space-y-4">
      <AdminSectionCard title="Role mix" icon={ShieldCheck}>
        {kpis.roleMix.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-2">No users yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {kpis.roleMix.map((r) => {
              const pct = kpis.total ? Math.round((r.value / kpis.total) * 100) : 0
              return (
                <li key={r.label}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-slate-600">{roleLabel(r.label)}</span>
                    <span className="font-semibold text-[#0B1B3F]">
                      {r.value}{" "}
                      <span className="text-slate-400 font-normal">· {pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Security posture" icon={KeyRound}>
        <dl className="space-y-2.5 text-[13px]">
          {[
            { label: "MFA enabled", value: fmt(kpis.mfaEnabled) },
            { label: "Suspended", value: fmt(kpis.suspended) },
            { label: "Unassigned", value: fmt(kpis.unassigned) },
            { label: "Active in 30 days", value: fmt(kpis.activeLast30) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-semibold text-[#0B1B3F]">{row.value}</dd>
            </div>
          ))}
        </dl>
        <Link href="/admin/security" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
          Security centre <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </AdminSectionCard>

      <AdminSectionCard title="Footprint" icon={TrendingUp}>
        <p className="text-[26px] font-bold text-[#0B1B3F] leading-none">{fmt(kpis.total)}</p>
        <p className="mt-1.5 text-[12px] text-slate-500">total registered users across the platform.</p>
      </AdminSectionCard>
    </div>
  )
}
