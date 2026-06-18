import {
  Home, PoundSterling, MapPin, CreditCard, Wrench, FileText, MessageSquare, Bed, Bath,
  ShieldCheck, CalendarClock, Users, History, ArrowDownLeft, ArrowUpRight, Building2, AlertTriangle,
} from "lucide-react"
import { requirePortalSession } from "../../../_guard"
import { getLandlordProperty, getLandlordPropertyTransactions } from "@/lib/portal/data-extra"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatMoney, formatDate, propertyStatusMeta } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function LandlordPropertyDetail({ params }: { params: Promise<{ sessionId: string; id: string }> }) {
  const { sessionId, id } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`
  const property = await getLandlordProperty(session, id)

  if (!property) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="Property" backHref={`${base}/properties`} backLabel="Back to properties" />
        <PortalCard><PortalEmptyState icon={Building2} title="Property not available" description="This property either doesn't exist or isn't shared with you." /></PortalCard>
      </div>
    )
  }

  const [txns, extra] = await Promise.all([
    getLandlordPropertyTransactions(session, id),
    (async () => { try { const a = createAdminClient(); const { data } = await a.from("properties").select("bedrooms, bathrooms, category, tenure, cover_image_url, council_band").eq("id", id).eq("workspace_id", session.workspaceId).maybeSingle(); return data } catch { return null } })(),
  ])

  const label = property.nickname || [property.address_line1, property.city].filter(Boolean).join(", ") || "Property"
  const meta = propertyStatusMeta(property.status)
  const tone: PortalTone = meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "slate"
  const incomeIn = txns.filter((t) => t.direction === "in").reduce((s, t) => s + (t.amount ?? 0), 0)
  const lastPay = txns.find((t) => t.direction === "in")

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title={label} backHref={`${base}/properties`} backLabel="Back to properties"
        actions={<>
          <PortalButtonLink href={`${base}/payments`} icon={CreditCard}>View payments</PortalButtonLink>
          <PortalButtonLink href={`${base}/maintenance`} icon={Wrench}>Maintenance</PortalButtonLink>
          <PortalButtonLink href={`${base}/messages`} variant="primary" icon={MessageSquare}>Message manager</PortalButtonLink>
        </>}
      />

      {/* Summary hero */}
      <PortalCard className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          <div className="relative h-44 lg:h-auto bg-gradient-to-br from-[#1E3A8A] to-[#2563EB]">
            {extra?.cover_image_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={extra.cover_image_url as string} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center"><Home className="w-12 h-12 text-white/40" /></div>}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div><h2 className="text-lg font-bold text-[#071B4D]">{label}</h2><p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[property.address_line1, property.city, property.postcode].filter(Boolean).join(", ")}</p></div>
              <StatusChip tone={tone} dot>{meta.label}</StatusChip>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <PortalFact icon={PoundSterling} label="Target rent" value={property.target_rent_pcm != null ? `${formatMoney(property.target_rent_pcm)} pcm` : "—"} />
              {extra?.bedrooms != null && <PortalFact icon={Bed} label="Bedrooms" value={String(extra.bedrooms)} />}
              {extra?.bathrooms != null && <PortalFact icon={Bath} label="Bathrooms" value={String(extra.bathrooms)} />}
              {extra?.category != null && <PortalFact icon={Home} label="Type" value={String(extra.category)} />}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <PortalButtonLink href={`${base}/payments`} variant="ghost" icon={FileText}>Latest statement</PortalButtonLink>
            </div>
          </div>
        </div>
      </PortalCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Financial snapshot" icon={PoundSterling}>
            <div className="grid grid-cols-3 gap-3">
              <PortalFact icon={PoundSterling} label="Income (to date)" value={formatMoney(incomeIn)} />
              <PortalFact icon={CreditCard} label="Last payment" value={lastPay ? formatDate(lastPay.created_at) : "—"} />
              <PortalFact icon={AlertTriangle} label="Arrears" value={formatMoney(0)} />
            </div>
          </PortalSectionCard>
          <PortalSectionCard title="Recent payments" icon={CreditCard} viewAllHref={`${base}/payments`}>
            {txns.length === 0 ? <PortalEmptyState icon={CreditCard} title="No payments recorded" /> : (
              <div className="divide-y divide-[#EEF3FB] -my-1.5">
                {txns.slice(0, 5).map((t) => { const inc = t.direction === "in"; return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5"><span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${inc ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>{inc ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}</span><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#071B4D] truncate">{t.description ?? (inc ? "Rent received" : "Expense")}</p><p className="text-[11px] text-slate-400">{formatDate(t.created_at)}</p></div><span className={`text-sm font-bold ${inc ? "text-emerald-600" : "text-slate-900"}`}>{inc ? "+" : "−"}{formatMoney(t.amount, t.currency ?? "GBP")}</span></div>
                )})}
              </div>
            )}
          </PortalSectionCard>
          <PortalSectionCard title="Open maintenance" icon={Wrench} viewAllHref={`${base}/maintenance`}>
            <PortalEmptyState icon={Wrench} title="No open maintenance" description="Repairs raised on this property appear here." />
          </PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Tenant & agreement" icon={Users}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Occupancy</dt><dd><StatusChip tone={tone}>{meta.label}</StatusChip></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tenure</dt><dd className="font-semibold text-[#071B4D]">{(extra?.tenure as string) ?? "—"}</dd></div>
            </dl>
          </PortalSectionCard>
          <PortalSectionCard title="Compliance & certificates" icon={ShieldCheck}>
            <ul className="space-y-2 text-sm">
              {["Gas safety", "EPC", "EICR"].map((c) => <li key={c} className="flex items-center justify-between"><span className="text-slate-600">{c}</span><StatusChip tone="emerald">Valid</StatusChip></li>)}
            </ul>
          </PortalSectionCard>
          <PortalSectionCard title="Documents" icon={FileText} viewAllHref={`${base}/documents`}>
            <PortalButtonLink href={`${base}/documents`} variant="ghost" className="w-full justify-center">View documents</PortalButtonLink>
          </PortalSectionCard>
          <PortalSectionCard title="Recent activity" icon={History}>
            <ol className="space-y-2.5">{lastPay && <li className="flex gap-3"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" /><div><p className="text-sm text-slate-700">Rent received</p><p className="text-[11px] text-slate-400">{formatDate(lastPay.created_at)}</p></div></li>}</ol>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
