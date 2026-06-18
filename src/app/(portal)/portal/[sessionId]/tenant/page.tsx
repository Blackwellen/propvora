import Link from "next/link"
import {
  Home, PoundSterling, CalendarClock, ClipboardList, FileText, CreditCard, MessageSquare,
  Download, ChevronRight, AlertTriangle, Wrench, Phone, ShieldCheck, Bell, ArrowRight,
} from "lucide-react"
import { requirePortalSession } from "../_guard"
import { getTenantTenancies, getTenantMaintenance, getTenantPayments } from "@/lib/portal/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatMoney, formatDate, tenancyStatusMeta } from "@/lib/portal/format"
import {
  PortalCard, PortalSectionCard, PortalKpiStrip, StatusChip, PortalAlertBanner,
  PortalEmptyState, PortalButtonLink, PortalFact, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function rentFreq(freq: string | null | undefined): string {
  return freq === "weekly" ? "per week" : freq === "quarterly" ? "per quarter" : freq === "annually" ? "per year" : "per month"
}
function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  return Number.isFinite(d) ? d : null
}
/** Next monthly rent date on the tenancy's payment day (derived from start_date). */
function computeNextDue(startDate: string | null | undefined): string | null {
  if (!startDate) return null
  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) return null
  const day = start.getDate()
  const now = new Date()
  let due = new Date(now.getFullYear(), now.getMonth(), day)
  if (due.getTime() < now.setHours(0, 0, 0, 0)) due = new Date(now.getFullYear(), now.getMonth() + 1, day)
  return due.toISOString()
}

const MAINT_STATUS: Record<string, { label: string; tone: PortalTone }> = {
  new: { label: "Submitted", tone: "blue" }, scoped: { label: "Reviewing", tone: "blue" },
  supplier_requested: { label: "Arranging", tone: "amber" }, quote_received: { label: "Arranging", tone: "violet" },
  approved: { label: "Approved", tone: "blue" }, scheduled: { label: "Scheduled", tone: "blue" },
  in_progress: { label: "In progress", tone: "blue" }, complete: { label: "Resolved", tone: "emerald" },
  invoiced: { label: "Resolved", tone: "emerald" }, closed: { label: "Closed", tone: "slate" }, disputed: { label: "Disputed", tone: "red" },
}

export default async function TenantPortalHome({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`

  const tenancies = await getTenantTenancies(session)
  const current = tenancies.find((t) => t.status === "active") ?? tenancies[0] ?? null
  const [maintenance, payments] = await Promise.all([
    getTenantMaintenance(session).catch(() => []),
    getTenantPayments(session).catch(() => []),
  ])
  const openMaint = maintenance.filter((m) => !["complete", "invoiced", "closed"].includes(m.status))
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
  const paidThisYear = payments
    .filter((p) => p.direction === "in" && p.created_at >= yearStart)
    .reduce((s, p) => s + (p.amount ?? 0), 0)

  // Property details (scoped to workspace)
  let prop: { label: string; address: string; image: string | null } = { label: "Your home", address: "", image: null }
  if (current?.property_id) {
    try {
      const admin = createAdminClient()
      const { data } = await admin.from("properties")
        .select("nickname, address_line1, city, postcode, cover_image_url")
        .eq("id", current.property_id).eq("workspace_id", session.workspaceId).maybeSingle()
      if (data) {
        prop = {
          label: (data.nickname as string) || [data.address_line1, data.city].filter(Boolean).join(", ") || "Your home",
          address: [data.address_line1, data.city, data.postcode].filter(Boolean).join(", "),
          image: (data.cover_image_url as string) || null,
        }
      }
    } catch { /* tolerate */ }
  }

  if (!current) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-[#071B4D]">Welcome home</h1><p className="text-sm text-slate-500 mt-0.5">Manage your tenancy, rent, documents, maintenance and messages in one place.</p></div>
        <PortalCard><PortalEmptyState icon={Home} title="No active tenancy" description="When your tenancy is set up, your home details will appear here." /></PortalCard>
      </div>
    )
  }

  // Next rent due = the next monthly recurrence of the tenancy's payment day.
  const nextDue = computeNextDue(current.start_date)
  const dueIn = daysUntil(nextDue)
  const kpis: PortalKpi[] = [
    { label: "Next payment due", value: formatMoney(current.rent_amount), sub: nextDue ? formatDate(nextDue) : "—", icon: CreditCard, tone: "blue", href: `${base}/payments` },
    { label: "Total paid this year", value: formatMoney(paidThisYear || (current.rent_amount ?? 0)), sub: paidThisYear ? "Actual payments" : "Rent amount", icon: PoundSterling, tone: "emerald", href: `${base}/payments` },
    { label: "Open maintenance", value: String(openMaint.length), sub: openMaint.length ? "In progress" : "All clear", icon: Wrench, tone: openMaint.length ? "amber" : "emerald", href: `${base}/maintenance` },
    { label: "Unread messages", value: "0", sub: "From your manager", icon: MessageSquare, tone: "slate", href: `${base}/messages` },
    { label: "Documents available", value: "—", sub: "Agreement & certs", icon: FileText, tone: "violet", href: `${base}/documents` },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[#071B4D]">Welcome home</h1><p className="text-sm text-slate-500 mt-0.5">Manage your tenancy, rent, documents, maintenance and messages in one place.</p></div>

      {/* Property hero */}
      <PortalCard className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          <div className="relative h-44 lg:h-auto bg-gradient-to-br from-[#1E3A8A] to-[#2563EB]">
            {prop.image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={prop.image} alt={prop.label} className="absolute inset-0 w-full h-full object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center"><Home className="w-12 h-12 text-white/40" /></div>}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[#071B4D]">{prop.label}</h2>
                  <StatusChip tone={tenancyStatusMeta(current.status).variant === "success" ? "emerald" : "blue"} dot>{tenancyStatusMeta(current.status).label} tenancy</StatusChip>
                </div>
                {prop.address && <p className="text-xs text-slate-500 mt-0.5">{prop.address}</p>}
              </div>
              <div className="flex items-center gap-2">
                <PortalButtonLink href={`${base}/documents`} icon={Download}>Download agreement</PortalButtonLink>
                <PortalButtonLink href={`${base}/tenancy`} variant="primary">View tenancy</PortalButtonLink>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <PortalFact icon={PoundSterling} label="Rent" value={<>{formatMoney(current.rent_amount)} <span className="text-[11px] font-normal text-slate-400">{rentFreq(current.rent_frequency)}</span></>} />
              {current.deposit_amount != null && <PortalFact icon={ShieldCheck} label="Deposit" value={formatMoney(current.deposit_amount)} />}
              <PortalFact icon={CalendarClock} label="Start date" value={formatDate(current.start_date)} />
              {current.end_date && <PortalFact icon={CalendarClock} label="End date" value={formatDate(current.end_date)} />}
            </div>
            {nextDue && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#F4F8FF] border border-[#E1ECFF] px-4 py-2.5">
                <span className="text-sm text-slate-600">Next rent due <span className="font-semibold text-[#071B4D]">{formatDate(nextDue)}</span></span>
                {dueIn != null && <StatusChip tone={dueIn <= 7 ? "amber" : "blue"}>{dueIn} day{dueIn === 1 ? "" : "s"}</StatusChip>}
              </div>
            )}
          </div>
        </div>
      </PortalCard>

      {/* KPI strip */}
      <PortalKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left col (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* What needs attention */}
          <PortalSectionCard title="What needs attention" icon={Bell}>
            <div className="space-y-2">
              {nextDue && dueIn != null && dueIn <= 14 && (
                <AttnRow tone="blue" icon={CreditCard} title={`Rent due in ${dueIn} day${dueIn === 1 ? "" : "s"}`} sub={`${formatMoney(current.rent_amount)} · ${formatDate(nextDue)}`} href={`${base}/payments`} />
              )}
              {openMaint.slice(0, 2).map((m) => (
                <AttnRow key={m.id} tone="amber" icon={Wrench} title={m.title} sub={`Maintenance · ${(MAINT_STATUS[m.status] ?? { label: m.status }).label}`} href={`${base}/maintenance/${m.id}`} />
              ))}
              {(!nextDue || dueIn == null || dueIn > 14) && openMaint.length === 0 && (
                <PortalEmptyState icon={ShieldCheck} title="You're all caught up" description="No urgent actions right now." />
              )}
            </div>
          </PortalSectionCard>

          {/* Quick actions */}
          <PortalSectionCard title="Quick actions" icon={ArrowRight}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <QuickAction href={`${base}/maintenance/report`} icon={Wrench} label="Report a repair" tone="amber" />
              <QuickAction href={`${base}/payments`} icon={CreditCard} label="Make a payment" tone="emerald" />
              <QuickAction href={`${base}/messages`} icon={MessageSquare} label="Message manager" tone="blue" />
              <QuickAction href={`${base}/documents`} icon={FileText} label="View documents" tone="violet" />
            </div>
          </PortalSectionCard>

          {/* Maintenance overview */}
          <PortalSectionCard title="Maintenance overview" icon={ClipboardList} viewAllHref={`${base}/maintenance`}>
            {maintenance.length === 0 ? (
              <PortalEmptyState icon={Wrench} title="No maintenance requests" description="Report a repair and track it here." action={<PortalButtonLink href={`${base}/maintenance/report`} variant="primary" icon={Wrench}>Report a repair</PortalButtonLink>} />
            ) : (
              <div className="divide-y divide-[#EEF3FB] -my-1.5">
                {maintenance.slice(0, 4).map((m) => {
                  const st = MAINT_STATUS[m.status] ?? { label: m.status, tone: "slate" as PortalTone }
                  return (
                    <Link key={m.id} href={`${base}/maintenance/${m.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                      <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Wrench className="w-4 h-4" /></span>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#071B4D] truncate">{m.title}</p><p className="text-[11px] text-slate-400">{formatDate(m.created_at)}</p></div>
                      <StatusChip tone={st.tone}>{st.label}</StatusChip>
                    </Link>
                  )
                })}
              </div>
            )}
          </PortalSectionCard>
        </div>

        {/* Right col (1/3) */}
        <div className="space-y-4">
          {/* Recent payments */}
          <PortalSectionCard title="Recent payments" icon={CreditCard} viewAllHref={`${base}/payments`}>
            <PortalEmptyState icon={CreditCard} title="Payment history" description="Your rent ledger appears here." action={<PortalButtonLink href={`${base}/payments`}>Open payments</PortalButtonLink>} />
          </PortalSectionCard>

          {/* Messages */}
          <PortalSectionCard title="Messages" icon={MessageSquare} viewAllHref={`${base}/messages`}>
            <PortalEmptyState icon={MessageSquare} title="No new messages" description="Chat securely with your manager." />
          </PortalSectionCard>

          {/* Your contacts */}
          <PortalSectionCard title="Your contacts" icon={Phone}>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs font-bold">{session.workspaceName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                <div className="min-w-0"><p className="text-sm font-semibold text-[#071B4D] truncate">{session.workspaceName}</p><p className="text-[11px] text-slate-400">Property manager</p></div>
              </div>
              <PortalAlertBanner tone="red" icon={AlertTriangle} title="Out-of-hours emergency"><span>Gas, flood or fire — call <span className="font-semibold">0800 000 000</span> immediately.</span></PortalAlertBanner>
            </div>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}

function AttnRow({ tone, icon: Icon, title, sub, href }: { tone: PortalTone; icon: typeof Wrench; title: string; sub: string; href: string }) {
  const soft = tone === "blue" ? "bg-[#EFF6FF] text-[#2563EB]" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] px-3 py-2.5 transition-colors">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${soft}`}><Icon className="w-4 h-4" /></span>
      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#071B4D] truncate">{title}</p><p className="text-[11px] text-slate-400 truncate">{sub}</p></div>
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </Link>
  )
}
function QuickAction({ href, icon: Icon, label, tone }: { href: string; icon: typeof Wrench; label: string; tone: PortalTone }) {
  const soft = tone === "blue" ? "bg-[#EFF6FF] text-[#2563EB]" : tone === "emerald" ? "bg-emerald-50 text-emerald-600" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-violet-50 text-violet-600"
  return (
    <Link href={href} className="flex flex-col items-center gap-2 rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] py-4 px-2 text-center transition-colors">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${soft}`}><Icon className="w-5 h-5" /></span>
      <span className="text-[12px] font-semibold text-[#071B4D] leading-tight">{label}</span>
    </Link>
  )
}
