"use client"

import Link from "next/link"
import { Users } from "lucide-react"
import type { HomeTenant } from "../types"

interface HomeTenancySpotlightCardProps {
  tenants: HomeTenant[]
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"]

function formatEndDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return "Expired"
    if (diff <= 30) return `Ends in ${diff}d`
    return `Ends ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
  } catch {
    return dateStr
  }
}

function EndDateBadge({ endDate }: { endDate: string }) {
  try {
    const date = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isUrgent = diff <= 30
    const cls = isUrgent
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-slate-50 text-slate-500 border border-slate-200"
    return (
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
        {formatEndDate(endDate)}
      </span>
    )
  } catch {
    return null
  }
}

export function HomeTenancySpotlightCard({ tenants }: HomeTenancySpotlightCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-900">Tenancy spotlight</h3>
        <Link href="/app/portfolio/tenancies" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
          View all →
        </Link>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-6">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
              <Users className="text-slate-300" style={{ width: 20, height: 20 }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-slate-600">No active tenancies</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Tenancies will appear here once created</p>
            </div>
            <Link href="/app/portfolio/tenancies/new" className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Create tenancy →
            </Link>
          </div>
        ) : (
          tenants.map((tenant, idx) => (
            <Link
              key={tenant.id}
              href={tenant.href ?? `/app/portfolio/tenancies/${tenant.id}`}
              className="flex items-center gap-3 group hover:bg-slate-50 rounded-lg p-1.5 -mx-1.5 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
              >
                {getInitials(tenant.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-900 truncate">{tenant.name}</p>
                <p className="text-[12px] text-slate-500 truncate">{tenant.property || tenant.unit}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[13px] font-semibold text-slate-900">
                  £{tenant.rent.toLocaleString("en-GB")}/mo
                </span>
                {tenant.endDate && <EndDateBadge endDate={tenant.endDate} />}
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <Link href="/app/portfolio/tenancies" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
          View all tenancies →
        </Link>
      </div>
    </div>
  )
}
