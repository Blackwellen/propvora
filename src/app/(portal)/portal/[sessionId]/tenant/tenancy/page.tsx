import {
  Home, PoundSterling, CalendarClock, ShieldCheck, Users, Plug, Phone, KeyRound,
  ScrollText, Building2, History, Download, MessageSquare, FileText, MapPin, Bed, Bath,
} from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getTenantTenancies } from "@/lib/portal/data"
import { getPortalContactName } from "@/lib/portal/messaging-server"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatMoney, formatDate, tenancyStatusMeta } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function rentFreq(f: string | null | undefined) { return f === "weekly" ? "per week" : f === "quarterly" ? "per quarter" : f === "annually" ? "per year" : "per month" }

export default async function TenantTenancyPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`
  const tenancies = await getTenantTenancies(session)
  const current = tenancies.find((t) => t.status === "active") ?? tenancies[0] ?? null
  const tenantName = await getPortalContactName(session).catch(() => "You")
  const tenantInitials = tenantName.split(/\s+/).map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("") || "T"

  let prop: Record<string, unknown> | null = null
  if (current?.property_id) {
    try {
      const admin = createAdminClient()
      const { data } = await admin.from("properties")
        .select("nickname, address_line1, address_line2, city, postcode, bedrooms, bathrooms, category, tenure, cover_image_url, council_band")
        .eq("id", current.property_id).eq("workspace_id", session.workspaceId).maybeSingle()
      prop = data ?? null
    } catch { /* tolerate */ }
  }
  const label = (prop?.nickname as string) || [prop?.address_line1, prop?.city].filter(Boolean).join(", ") || "Your home"
  const address = [prop?.address_line1, prop?.address_line2, prop?.city, prop?.postcode].filter(Boolean).join(", ")
  const statusTone: PortalTone = tenancyStatusMeta(current?.status ?? "").variant === "success" ? "emerald" : "blue"

  if (!current) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="Tenancy details" backHref={base} />
        <PortalCard><PortalEmptyState icon={Home} title="No tenancy on record" description="Your tenancy details will appear here once set up." /></PortalCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Tenancy details" subtitle="View and manage all the details about your tenancy in one place." backHref={base}
        actions={<><PortalButtonLink href={`${base}/documents`} icon={Download}>Download agreement</PortalButtonLink><PortalButtonLink href={`${base}/messages`} variant="primary" icon={MessageSquare}>Contact manager</PortalButtonLink></>}
      />

      {/* Hero */}
      <PortalCard className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <div className="relative h-40 lg:h-auto bg-gradient-to-br from-[#1E3A8A] to-[#2563EB]">
            {prop?.cover_image_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={prop.cover_image_url as string} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center"><Home className="w-12 h-12 text-white/40" /></div>}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div><h2 className="text-lg font-bold text-[#071B4D]">{label}</h2>{address && <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{address}</p>}</div>
              <StatusChip tone={statusTone} dot>{tenancyStatusMeta(current.status).label}</StatusChip>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              <PortalFact icon={PoundSterling} label="Rent" value={<>{formatMoney(current.rent_amount)} <span className="text-[11px] font-normal text-slate-400">{rentFreq(current.rent_frequency)}</span></>} />
              {current.deposit_amount != null && <PortalFact icon={ShieldCheck} label="Deposit" value={formatMoney(current.deposit_amount)} />}
              <PortalFact icon={CalendarClock} label="Start" value={formatDate(current.start_date)} />
              {current.end_date && <PortalFact icon={CalendarClock} label="End" value={formatDate(current.end_date)} />}
              {current.reference && <PortalFact icon={FileText} label="Reference" value={current.reference} />}
            </div>
          </div>
        </div>
      </PortalCard>

      {/* Card grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <PortalSectionCard title="Tenancy summary" icon={ScrollText}>
          <dl className="space-y-2.5 text-sm">
            <Row k="Tenancy type" v="Assured shorthold (AST)" />
            <Row k="Rent" v={`${formatMoney(current.rent_amount)} ${rentFreq(current.rent_frequency)}`} />
            <Row k="Payment day" v={current.start_date ? `${new Date(current.start_date).getDate()}${ordinal(new Date(current.start_date).getDate())} of the month` : "—"} />
            <Row k="Term" v={`${formatDate(current.start_date)} → ${formatDate(current.end_date)}`} />
          </dl>
          <PortalButtonLink href={`${base}/payments`} className="mt-3" variant="ghost">View payment history</PortalButtonLink>
        </PortalSectionCard>

        <PortalSectionCard title="Deposit protection" icon={ShieldCheck}>
          {current.deposit_amount != null ? (
            <>
              <dl className="space-y-2.5 text-sm">
                <Row k="Amount" v={formatMoney(current.deposit_amount)} />
                <Row k="Status" v={<StatusChip tone="emerald">Protected</StatusChip>} />
              </dl>
              <p className="text-[11px] text-slate-400 mt-2">Your deposit is protected in a government-approved scheme. Contact your manager for scheme details and certificate.</p>
              <PortalButtonLink href={`${base}/documents`} className="mt-3" variant="ghost" icon={Download}>View deposit certificate</PortalButtonLink>
            </>
          ) : <PortalEmptyState icon={ShieldCheck} title="No deposit recorded" />}
        </PortalSectionCard>

        <PortalSectionCard title="Occupants / named tenants" icon={Users}>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs font-bold">{tenantInitials}</span>
            <div><p className="text-sm font-semibold text-[#071B4D]">{tenantName}</p><p className="text-[11px] text-slate-400">Lead tenant</p></div>
          </div>
          <PortalButtonLink href={`${base}/messages`} className="mt-3" variant="ghost" icon={Users}>Add additional occupant</PortalButtonLink>
        </PortalSectionCard>

        <PortalSectionCard title="Services & utilities" icon={Plug}>
          <p className="text-sm text-slate-500">Your tenancy agreement sets out which services are included. Please refer to your signed agreement or contact your manager for a full breakdown.</p>
          <PortalButtonLink href={`${base}/messages`} className="mt-3" variant="ghost" icon={MessageSquare}>Ask about included services</PortalButtonLink>
        </PortalSectionCard>

        <PortalSectionCard title="Key contacts" icon={Phone}>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs font-bold">{session.workspaceName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#071B4D] truncate">{session.workspaceName}</p><p className="text-[11px] text-slate-400">Property manager</p></div>
            <PortalButtonLink href={`${base}/messages`} variant="ghost" icon={MessageSquare}>Message</PortalButtonLink>
          </div>
        </PortalSectionCard>

        <PortalSectionCard title="Important dates & milestones" icon={CalendarClock}>
          <dl className="space-y-2.5 text-sm">
            <Row k="Tenancy start" v={formatDate(current.start_date)} />
            <Row k="Tenancy end / renewal" v={formatDate(current.end_date)} />
          </dl>
          <p className="text-[11px] text-slate-400 mt-2">Your manager will notify you ahead of safety checks, inspections and renewals.</p>
        </PortalSectionCard>

        <PortalSectionCard title="Access & keys" icon={KeyRound}>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-slate-400" />Contact your manager for key queries</li>
          </ul>
          <PortalButtonLink href={`${base}/messages`} className="mt-3" variant="ghost">Report lost key</PortalButtonLink>
        </PortalSectionCard>

        <PortalSectionCard title="House rules / building guidance" icon={ScrollText}>
          <p className="text-sm text-slate-500">Your tenancy agreement contains the full terms. Common obligations include notifying your manager of repairs promptly and not subletting without written consent.</p>
          <PortalButtonLink href={`${base}/documents`} className="mt-3" variant="ghost" icon={FileText}>View your agreement</PortalButtonLink>
        </PortalSectionCard>

        <PortalSectionCard title="Property details" icon={Building2}>
          <div className="grid grid-cols-2 gap-3">
            {prop?.bedrooms != null && <PortalFact icon={Bed} label="Bedrooms" value={String(prop.bedrooms)} />}
            {prop?.bathrooms != null && <PortalFact icon={Bath} label="Bathrooms" value={String(prop.bathrooms)} />}
            {prop?.category != null && <PortalFact icon={Home} label="Type" value={String(prop.category)} />}
            {prop?.council_band != null && <PortalFact icon={Building2} label="Council band" value={String(prop.council_band)} />}
          </div>
        </PortalSectionCard>

        <PortalSectionCard title="Recent tenancy events" icon={History}>
          <ol className="space-y-3">
            <Event label="Tenancy started" at={current.start_date} />
            <Event label="Deposit protected" at={current.start_date} />
          </ol>
        </PortalSectionCard>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-[#071B4D] text-right">{v}</dd></div>
}
function Event({ label, at }: { label: string; at: string | null | undefined }) {
  return <li className="flex gap-3"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" /><div><p className="text-sm text-slate-700">{label}</p><p className="text-[11px] text-slate-400">{formatDate(at)}</p></div></li>
}
function ordinal(n: number) { const s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0] }
