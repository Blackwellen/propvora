import Link from "next/link"
import {
  CreditCard, Wrench, MessageSquare, FileText, ShieldCheck, ArrowRight, Phone, AlertTriangle,
} from "lucide-react"
import {
  PortalSectionCard, PortalKpiStrip, StatusChip, PortalAlertBanner,
  PortalEmptyState, PortalButtonLink, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"
import { formatMoney, formatDate } from "@/lib/portal/format"
import { ChevronRight, Bell } from "lucide-react"

interface MaintenanceRow {
  id: string
  title: string
  status: string
  created_at: string | null
}

interface TenantPortalOverviewTabProps {
  kpis: PortalKpi[]
  maintenance: MaintenanceRow[]
  openMaintenance: MaintenanceRow[]
  nextDue: string | null
  dueIn: number | null
  rentAmount: number | null
  workspaceName: string
  base: string
}

const MAINT_STATUS: Record<string, { label: string; tone: PortalTone }> = {
  new: { label: "Submitted", tone: "blue" },
  scoped: { label: "Reviewing", tone: "blue" },
  supplier_requested: { label: "Arranging", tone: "amber" },
  quote_received: { label: "Arranging", tone: "violet" },
  approved: { label: "Approved", tone: "blue" },
  scheduled: { label: "Scheduled", tone: "blue" },
  in_progress: { label: "In progress", tone: "blue" },
  complete: { label: "Resolved", tone: "emerald" },
  invoiced: { label: "Resolved", tone: "emerald" },
  closed: { label: "Closed", tone: "slate" },
  disputed: { label: "Disputed", tone: "red" },
}

function AttnRow({
  tone,
  icon: Icon,
  title,
  sub,
  href,
}: {
  tone: PortalTone
  icon: typeof Wrench
  title: string
  sub: string
  href: string
}) {
  const soft =
    tone === "blue"
      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
      : tone === "amber"
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-500"
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] px-3 py-2.5 transition-colors"
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${soft}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#071B4D] truncate">{title}</p>
        <p className="text-[11px] text-slate-400 truncate">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </Link>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string
  icon: typeof Wrench
  label: string
  tone: PortalTone
}) {
  const soft =
    tone === "blue"
      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-600"
        : tone === "amber"
          ? "bg-amber-50 text-amber-600"
          : "bg-violet-50 text-violet-600"
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] py-4 px-2 text-center transition-colors"
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${soft}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="text-[12px] font-semibold text-[#071B4D] leading-tight">{label}</span>
    </Link>
  )
}

export function TenantPortalOverviewTab({
  kpis,
  maintenance,
  openMaintenance,
  nextDue,
  dueIn,
  rentAmount,
  workspaceName,
  base,
}: TenantPortalOverviewTabProps) {
  return (
    <>
      <PortalKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="What needs attention" icon={Bell}>
            <div className="space-y-2">
              {nextDue && dueIn != null && dueIn <= 14 && (
                <AttnRow
                  tone="blue"
                  icon={CreditCard}
                  title={`Rent due in ${dueIn} day${dueIn === 1 ? "" : "s"}`}
                  sub={`${formatMoney(rentAmount)} · ${formatDate(nextDue)}`}
                  href={`${base}/payments`}
                />
              )}
              {openMaintenance.slice(0, 2).map((m) => (
                <AttnRow
                  key={m.id}
                  tone="amber"
                  icon={Wrench}
                  title={m.title}
                  sub={`Maintenance · ${(MAINT_STATUS[m.status] ?? { label: m.status }).label}`}
                  href={`${base}/maintenance/${m.id}`}
                />
              ))}
              {(!nextDue || dueIn == null || dueIn > 14) && openMaintenance.length === 0 && (
                <PortalEmptyState
                  icon={ShieldCheck}
                  title="You're all caught up"
                  description="No urgent actions right now."
                />
              )}
            </div>
          </PortalSectionCard>

          <PortalSectionCard title="Quick actions" icon={ArrowRight}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <QuickAction
                href={`${base}/maintenance/report`}
                icon={Wrench}
                label="Report a repair"
                tone="amber"
              />
              <QuickAction
                href={`${base}/payments`}
                icon={CreditCard}
                label="Make a payment"
                tone="emerald"
              />
              <QuickAction
                href={`${base}/messages`}
                icon={MessageSquare}
                label="Message manager"
                tone="blue"
              />
              <QuickAction
                href={`${base}/documents`}
                icon={FileText}
                label="View documents"
                tone="violet"
              />
            </div>
          </PortalSectionCard>

          <PortalSectionCard
            title="Maintenance overview"
            icon={Wrench}
            viewAllHref={`${base}/maintenance`}
          >
            {maintenance.length === 0 ? (
              <PortalEmptyState
                icon={Wrench}
                title="No maintenance requests"
                description="Report a repair and track it here."
                action={
                  <PortalButtonLink
                    href={`${base}/maintenance/report`}
                    variant="primary"
                    icon={Wrench}
                  >
                    Report a repair
                  </PortalButtonLink>
                }
              />
            ) : (
              <div className="divide-y divide-[#EEF3FB] -my-1.5">
                {maintenance.slice(0, 4).map((m) => {
                  const st = MAINT_STATUS[m.status] ?? {
                    label: m.status,
                    tone: "slate" as PortalTone,
                  }
                  return (
                    <Link
                      key={m.id}
                      href={`${base}/maintenance/${m.id}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
                    >
                      <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#071B4D] truncate">{m.title}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(m.created_at)}</p>
                      </div>
                      <StatusChip tone={st.tone}>{st.label}</StatusChip>
                    </Link>
                  )
                })}
              </div>
            )}
          </PortalSectionCard>
        </div>

        <div className="space-y-4">
          <PortalSectionCard
            title="Recent payments"
            icon={CreditCard}
            viewAllHref={`${base}/payments`}
          >
            <PortalEmptyState
              icon={CreditCard}
              title="Payment history"
              description="Your rent ledger appears here."
              action={
                <PortalButtonLink href={`${base}/payments`}>Open payments</PortalButtonLink>
              }
            />
          </PortalSectionCard>

          <PortalSectionCard
            title="Messages"
            icon={MessageSquare}
            viewAllHref={`${base}/messages`}
          >
            <PortalEmptyState
              icon={MessageSquare}
              title="No new messages"
              description="Chat securely with your manager."
            />
          </PortalSectionCard>

          <PortalSectionCard title="Your contacts" icon={Phone}>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">
                  {workspaceName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#071B4D] truncate">{workspaceName}</p>
                  <p className="text-[11px] text-slate-400">Property manager</p>
                </div>
              </div>
              <PortalAlertBanner tone="red" icon={AlertTriangle} title="Out-of-hours emergency">
                <span>
                  Gas, flood or fire — call <span className="font-semibold">0800 000 000</span>{" "}
                  immediately.
                </span>
              </PortalAlertBanner>
            </div>
          </PortalSectionCard>
        </div>
      </div>
    </>
  )
}
