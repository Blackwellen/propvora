import Link from "next/link"
import {
  Building2, Home, PoundSterling, Wrench, TrendingUp, ChevronRight, AlertTriangle, MapPin,
} from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getLandlordProperties } from "@/lib/portal/data"
import { formatMoney, propertyStatusMeta } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, PortalKpiStrip, StatusChip,
  PortalEmptyState, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function propLabel(p: { nickname: string | null; address_line1: string | null; city: string | null }) {
  return p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
}

export default async function LandlordPropertiesPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`
  const properties = await getLandlordProperties(session)

  const total = properties.length
  const occupied = properties.filter((p) => p.status === "active" || p.status === "occupied").length
  const voids = total - occupied
  const rents = properties.map((p) => p.target_rent_pcm ?? 0).filter((r) => r > 0)
  const rentRoll = rents.reduce((s, r) => s + r, 0)
  const avgRent = rents.length ? rentRoll / rents.length : 0
  const highest = rents.length ? Math.max(...rents) : 0

  const kpis: PortalKpi[] = [
    { label: "Total properties", value: String(total), icon: Building2, tone: "blue" },
    { label: "Occupied", value: String(occupied), icon: Home, tone: "emerald" },
    { label: "Voids", value: String(voids), icon: Home, tone: voids ? "amber" : "slate" },
    { label: "Avg rent pcm", value: formatMoney(avgRent), icon: PoundSterling, tone: "blue" },
    { label: "Total target rent", value: formatMoney(rentRoll), icon: TrendingUp, tone: "violet" },
    { label: "Under maintenance", value: "0", icon: Wrench, tone: "amber" },
  ]

  return (
    <div className="space-y-5">
      <PortalPageHeader title="Properties" subtitle={`${total} propert${total === 1 ? "y" : "ies"} shared with you.`} backHref={base} />
      <PortalKpiStrip kpis={kpis} cols={6} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="min-w-0">
          {properties.length === 0 ? (
            <PortalCard><PortalEmptyState icon={Building2} title="No properties shared yet" description="Properties your manager links to you appear here." /></PortalCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {properties.map((p) => {
                const meta = propertyStatusMeta(p.status)
                const tone: PortalTone = meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "slate"
                return (
                  <Link key={p.id} href={`${base}/properties/${p.id}`} className="block">
                    <PortalCard className="overflow-hidden hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)] hover:border-[#CFE0FB] transition-all h-full">
                      <div className="h-28 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center"><Home className="w-9 h-9 text-white/40" /></div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-[#071B4D] truncate">{propLabel(p)}</p><StatusChip tone={tone} dot>{meta.label}</StatusChip></div>
                        <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{[p.address_line1, p.city, p.postcode].filter(Boolean).join(", ")}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EEF3FB]">
                          <span className="text-sm"><span className="font-bold text-[#071B4D]">{p.target_rent_pcm != null ? formatMoney(p.target_rent_pcm) : "—"}</span> <span className="text-xs text-slate-400">pcm</span></span>
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#2563EB]">View details <ChevronRight className="w-3.5 h-3.5" /></span>
                        </div>
                      </div>
                    </PortalCard>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <PortalSectionCard title="Portfolio breakdown" icon={TrendingUp}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Occupancy rate</dt><dd className="font-semibold text-[#071B4D]">{total ? Math.round((occupied / total) * 100) : 0}%</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Highest rent</dt><dd className="font-semibold text-[#071B4D]">{formatMoney(highest)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Rent roll (pcm)</dt><dd className="font-semibold text-[#071B4D]">{formatMoney(rentRoll)}</dd></div>
            </dl>
          </PortalSectionCard>
          <PortalCard className="p-4"><div className="flex items-start gap-2.5"><span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Value overview</p><p className="text-xs text-slate-400 mt-0.5">Portfolio valuations are managed by {session.workspaceName}.</p></div></div></PortalCard>
        </div>
      </div>
    </div>
  )
}
