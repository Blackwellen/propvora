import {
  Wrench, MessageSquare, MapPin, CalendarClock, User, CheckCircle2, Circle,
  Images, ClipboardList, AlertTriangle, Phone, PoundSterling, ShieldCheck,
} from "lucide-react"
import { requirePortalSession } from "../../../_guard"
import { getTenantMaintenance } from "@/lib/portal/data"
import { formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const STEPS = ["Reported", "Triaged", "Assigned", "Visit scheduled", "Resolved"] as const
function stepIndex(status: string): number {
  if (["complete", "invoiced", "closed"].includes(status)) return 4
  if (["scheduled", "in_progress"].includes(status)) return 3
  if (["approved", "supplier_requested", "quote_received"].includes(status)) return 2
  if (["scoped"].includes(status)) return 1
  return 0
}
const STATUS: Record<string, { label: string; tone: PortalTone }> = {
  new: { label: "Submitted", tone: "blue" }, scoped: { label: "Reviewing", tone: "blue" },
  scheduled: { label: "Scheduled", tone: "blue" }, in_progress: { label: "In progress", tone: "blue" },
  complete: { label: "Resolved", tone: "emerald" }, closed: { label: "Closed", tone: "slate" },
}

export default async function TenantMaintenanceDetail({ params }: { params: Promise<{ sessionId: string; requestId: string }> }) {
  const { sessionId, requestId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`
  const jobs = await getTenantMaintenance(session)
  const req = jobs.find((j) => j.id === requestId) ?? null

  if (!req) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="Maintenance request" backHref={`${base}/maintenance`} backLabel="Back to maintenance" />
        <PortalCard><PortalEmptyState icon={Wrench} title="Request not found" description="This request may have been closed or isn't on your tenancy." /></PortalCard>
      </div>
    )
  }
  const idx = stepIndex(req.status)
  const st = STATUS[req.status] ?? { label: req.status, tone: "slate" as PortalTone }
  type MaybeDesc = { description?: string | null; scheduled_date?: string | null; priority?: string | null }
  const extra = req as unknown as MaybeDesc

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title={req.title} subtitle={`Request #${req.id.slice(0, 8).toUpperCase()}`} backHref={`${base}/maintenance`} backLabel="Back to maintenance"
        actions={<PortalButtonLink href={`${base}/messages`} variant="primary" icon={MessageSquare}>Message about this request</PortalButtonLink>}
      />

      {/* Meta strip */}
      <PortalCard className="p-5">
        <div className="flex items-center gap-2 flex-wrap mb-4"><StatusChip tone={st.tone} dot>{st.label}</StatusChip><StatusChip tone="amber">{(extra.priority ?? "Medium")} priority</StatusChip></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <PortalFact icon={MapPin} label="Property" value="Your home" />
          <PortalFact icon={CalendarClock} label="Reported" value={formatDate(req.created_at)} />
          <PortalFact icon={User} label="Manager" value={session.workspaceName} />
          <PortalFact icon={CalendarClock} label="Scheduled" value={extra.scheduled_date ? formatDate(extra.scheduled_date) : "TBC"} />
        </div>
      </PortalCard>

      {/* Progress tracker */}
      <PortalCard className="p-5">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const reached = idx >= i
            return (
              <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${reached ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400"}`}>{reached ? <CheckCircle2 className="w-4 h-4" /> : i + 1}</span>
                  <span className={`text-[10px] font-semibold text-center ${reached ? "text-[#071B4D]" : "text-slate-400"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <span className={`flex-1 h-0.5 ${idx > i ? "bg-[#2563EB]" : "bg-slate-200"}`} />}
              </div>
            )
          })}
        </div>
      </PortalCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Issue summary" icon={ClipboardList}>
            <p className="text-sm text-slate-600">{extra.description || "Details of the reported issue appear here."}</p>
          </PortalSectionCard>
          <PortalSectionCard title="Contractor appointment" icon={CalendarClock}>
            {extra.scheduled_date ? <PortalFact icon={CalendarClock} label="Visit" value={formatDate(extra.scheduled_date)} /> : <PortalEmptyState icon={CalendarClock} title="No visit scheduled yet" description="You'll be notified when an appointment is booked." />}
          </PortalSectionCard>
          <PortalSectionCard title="Activity & updates" icon={ClipboardList}>
            <ol className="space-y-3">
              <li className="flex gap-3"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" /><div><p className="text-sm text-slate-700">Request submitted</p><p className="text-[11px] text-slate-400">{formatDate(req.created_at)}</p></div></li>
              {idx >= 1 && <li className="flex gap-3"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" /><div><p className="text-sm text-slate-700">Reviewed by your manager</p></div></li>}
            </ol>
          </PortalSectionCard>
          <PortalSectionCard title="Attachments & photos" icon={Images}>
            <PortalEmptyState icon={Images} title="No photos yet" description="Photos you add when reporting appear here." action={<PortalButtonLink href={`${base}/messages`}>Add photos via message</PortalButtonLink>} />
          </PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Resolution & next steps" icon={CheckCircle2}>
            {idx >= 4 ? <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Resolved</p> : <p className="text-sm text-slate-600 flex items-center gap-1.5"><Circle className="w-4 h-4 text-slate-300" /> In progress — we&apos;ll keep you updated.</p>}
          </PortalSectionCard>
          <PortalSectionCard title="Charges (if applicable)" icon={PoundSterling}>
            <p className="text-sm text-slate-600">No charges apply to this request.</p>
          </PortalSectionCard>
          <PortalCard className="p-4"><div className="flex items-start gap-2.5"><span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Phone className="w-4 h-4" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Need urgent help?</p><p className="text-xs text-slate-400 mt-0.5">Call <a href="tel:0800000000" className="font-semibold text-red-600">0800 000 000</a> for emergencies.</p></div></div></PortalCard>
        </div>
      </div>

      <PortalCard className="p-4 bg-[#F4F8FF] border-[#E1ECFF]"><div className="flex items-center gap-2.5"><ShieldCheck className="w-5 h-5 text-[#2563EB]" /><p className="text-sm text-slate-600">Your request is logged and tracked. <span className="font-semibold text-[#071B4D]">{session.workspaceName}</span> will keep you updated here and via Messages.</p></div></PortalCard>
    </div>
  )
}
