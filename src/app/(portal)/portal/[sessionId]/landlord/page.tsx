import Link from "next/link"
import {
  Building2, Home, PoundSterling, AlertTriangle, Wrench, MessageSquare, TrendingUp,
  CheckCircle2, Wallet, ArrowRight, FileText, ChevronRight,
} from "lucide-react"
import { requirePortalSession } from "../_guard"
import { getLandlordProperties, getLandlordOverdueAlerts, getLandlordTransactions } from "@/lib/portal/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatMoney, propertyStatusMeta } from "@/lib/portal/format"
import {
  PortalCard, PortalSectionCard, PortalKpiStrip, StatusChip, PortalAlertBanner,
  PortalEmptyState, PortalButtonLink, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function propLabel(p: { nickname: string | null; address_line1: string | null; city: string | null }) {
  return p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
}

export default async function LandlordPortalHome({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`
  const [properties, overdueAlerts, txns] = await Promise.all([
    getLandlordProperties(session), getLandlordOverdueAlerts(session), getLandlordTransactions(session).catch(() => []),
  ])

  const total = properties.length
  const occupied = properties.filter((p) => p.status === "active" || p.status === "occupied").length
  const voids = total - occupied
  const rentRoll = properties.reduce((s, p) => s + (p.target_rent_pcm ?? 0), 0)
  const collected = txns.filter((t) => t.direction === "in").reduce((s, t) => s + (t.amount ?? 0), 0)
  const arrears = overdueAlerts.length * (rentRoll / Math.max(total, 1))

  const propIds = properties.map((p) => p.id)
  let openMaintenanceCount = 0
  if (propIds.length) {
    try {
      const admin = createAdminClient()
      const { count } = await admin
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", session.workspaceId)
        .in("property_id", propIds)
        .not("status", "in", "(complete,invoiced,closed)")
      openMaintenanceCount = count ?? 0
    } catch { /* 42P01-safe — tolerate missing table */ }
  }

  const kpis: PortalKpi[] = [
    { label: "Total properties", value: String(total), icon: Building2, tone: "blue", href: `${base}/properties` },
    { label: "Occupied units", value: String(occupied), icon: Home, tone: "emerald", href: `${base}/properties` },
    { label: "Voids", value: String(voids), icon: Home, tone: voids ? "amber" : "slate", href: `${base}/properties` },
    { label: "Monthly target rent", value: formatMoney(rentRoll), icon: PoundSterling, tone: "blue", href: `${base}/financials` },
    { label: "Collected this month", value: formatMoney(collected), icon: CheckCircle2, tone: "emerald", href: `${base}/payments` },
    { label: "Arrears balance", value: formatMoney(arrears), icon: AlertTriangle, tone: arrears ? "red" : "emerald", href: `${base}/payments` },
    { label: "Open maintenance", value: String(openMaintenanceCount), icon: Wrench, tone: openMaintenanceCount ? "amber" : "emerald", href: `${base}/maintenance` },
    { label: "Unread messages", value: "0", icon: MessageSquare, tone: "slate", href: `${base}/messages` },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[#071B4D]">Your portfolio</h1><p className="text-sm text-slate-500 mt-0.5">A complete view of the properties shared with you by {session.workspaceName}.</p></div>

      {overdueAlerts.length > 0 && (
        <PortalAlertBanner tone="red" icon={AlertTriangle} title="Rent arrears require attention"
          action={<PortalButtonLink href={`${base}/payments`} variant="primary" className="bg-red-600 hover:bg-red-700 border-red-600">View arrears</PortalButtonLink>}>
          <span className="font-semibold">{formatMoney(arrears)} overdue</span> · {overdueAlerts.length} tenanc{overdueAlerts.length === 1 ? "y" : "ies"} overdue
        </PortalAlertBanner>
      )}

      <PortalKpiStrip kpis={kpis} cols={4} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Your properties" icon={Building2} viewAllHref={`${base}/properties`}>
            {properties.length === 0 ? (
              <PortalEmptyState icon={Building2} title="No properties shared yet" description="When your manager links a property to you, it appears here." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -m-1 p-1">
                {properties.slice(0, 6).map((p) => {
                  const meta = propertyStatusMeta(p.status)
                  const tone: PortalTone = meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "slate"
                  return (
                    <Link key={p.id} href={`${base}/properties/${p.id}`} className="block rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] p-3.5 transition-colors">
                      <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-[#071B4D] truncate">{propLabel(p)}</p><StatusChip tone={tone} dot>{meta.label}</StatusChip></div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{[p.address_line1, p.city, p.postcode].filter(Boolean).join(", ")}</p>
                      {p.target_rent_pcm != null && <p className="text-xs text-slate-500 mt-2">Rent <span className="font-semibold text-[#071B4D]">{formatMoney(p.target_rent_pcm)}</span> pcm</p>}
                    </Link>
                  )
                })}
              </div>
            )}
          </PortalSectionCard>
          <PortalSectionCard title="Recent rent activity" icon={Wallet} viewAllHref={`${base}/payments`}>
            {txns.length === 0 ? <PortalEmptyState icon={Wallet} title="No rent activity yet" /> : (
              <div className="divide-y divide-[#EEF3FB] -my-1.5">
                {txns.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5"><span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.direction === "in" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}><PoundSterling className="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#071B4D] truncate">{t.description ?? "Rent"}</p></div><span className={`text-sm font-bold ${t.direction === "in" ? "text-emerald-600" : "text-slate-900"}`}>{t.direction === "in" ? "+" : "−"}{formatMoney(t.amount, t.currency ?? "GBP")}</span></div>
                ))}
              </div>
            )}
          </PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Portfolio at a glance" icon={TrendingUp}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Occupancy</dt><dd className="font-semibold text-[#071B4D]">{total ? Math.round((occupied / total) * 100) : 0}%</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Rent roll (pcm)</dt><dd className="font-semibold text-[#071B4D]">{formatMoney(rentRoll)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Arrears</dt><dd className="font-semibold text-red-600">{formatMoney(arrears)}</dd></div>
            </dl>
          </PortalSectionCard>
          <PortalSectionCard title="Shared documents" icon={FileText} viewAllHref={`${base}/documents`}>
            <PortalButtonLink href={`${base}/documents`} variant="ghost" className="w-full justify-center">View documents</PortalButtonLink>
          </PortalSectionCard>
          <PortalSectionCard title="Quick actions" icon={ArrowRight}>
            <div className="grid grid-cols-2 gap-2">
              {[["Properties", `${base}/properties`, Building2], ["Financials", `${base}/financials`, Wallet], ["Maintenance", `${base}/maintenance`, Wrench], ["Messages", `${base}/messages`, MessageSquare]].map(([l, h, I]) => {
                const Icon = I as typeof Building2
                return <Link key={l as string} href={h as string} className="flex items-center gap-2 rounded-xl border border-[#EEF3FB] hover:bg-[#F8FBFF] px-3 py-2.5 text-sm font-semibold text-[#071B4D]"><Icon className="w-4 h-4 text-[var(--brand)]" />{l as string}<ChevronRight className="w-4 h-4 text-slate-300 ml-auto" /></Link>
              })}
            </div>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
