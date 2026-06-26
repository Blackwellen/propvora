import {
  Wrench, MessageSquare, MapPin, CalendarClock, User, CheckCircle2, Circle,
  ClipboardList, Images, PoundSterling, Phone, Building2, Home, FileText, Wallet,
} from "lucide-react"
import { requirePortalSession } from "../../../_guard"
import { getLandlordPropertyIds } from "@/lib/portal/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const STEPS = ["Reported", "Triaged", "Quote requested", "Visit scheduled", "Resolved"] as const
function stepIdx(status: string): number {
  if (["complete", "invoiced", "closed"].includes(status)) return 4
  if (["scheduled", "in_progress"].includes(status)) return 3
  if (["supplier_requested", "quote_received", "approved"].includes(status)) return 2
  if (["scoped"].includes(status)) return 1
  return 0
}

export default async function LandlordMaintenanceDetail({ params }: { params: Promise<{ sessionId: string; requestId: string }> }) {
  const { sessionId, requestId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`

  let job: { id: string; title: string | null; status: string | null; created_at: string | null; priority: string | null; description?: string | null } | null = null
  try {
    const ids = await getLandlordPropertyIds(session)
    if (ids.length) {
      const admin = createAdminClient()
      const { data } = await admin.from("jobs").select("id, title, status, created_at, priority, description").eq("id", requestId).eq("workspace_id", session.workspaceId).in("property_id", ids).maybeSingle()
      job = data ?? null
    }
  } catch { /* tolerate */ }

  if (!job) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="Maintenance request" backHref={`${base}/maintenance`} backLabel="Back to maintenance" />
        <PortalCard><PortalEmptyState icon={Wrench} title="Request not available" description="This request isn't on one of your properties." /></PortalCard>
      </div>
    )
  }
  const idx = stepIdx(job.status ?? "")
  const awaitingApproval = (job.status ?? "") === "quote_received"
  const tone: PortalTone = idx >= 4 ? "emerald" : awaitingApproval ? "violet" : "blue"

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title={job.title ?? "Maintenance request"} subtitle={`Request #${job.id.slice(0, 8).toUpperCase()}`} backHref={`${base}/maintenance`} backLabel="Back to maintenance"
        actions={<>
          {awaitingApproval && <PortalButtonLink href={`${base}/messages`} variant="primary" icon={CheckCircle2}>Approve quote</PortalButtonLink>}
          <PortalButtonLink href={`${base}/messages`} icon={MessageSquare}>Message manager</PortalButtonLink>
        </>}
      />

      <PortalCard className="p-5">
        <div className="flex items-center gap-2 flex-wrap mb-4"><StatusChip tone={tone} dot>{awaitingApproval ? "Awaiting your approval" : idx >= 4 ? "Resolved" : "In progress"}</StatusChip><StatusChip tone={(job.priority ?? "").toLowerCase() === "urgent" ? "red" : "blue"}>{(job.priority ?? "Normal")} priority</StatusChip></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <PortalFact icon={MapPin} label="Property" value="Your property" />
          <PortalFact icon={CalendarClock} label="Reported" value={formatDate(job.created_at)} />
          <PortalFact icon={User} label="Manager" value={session.workspaceName} />
          <PortalFact icon={PoundSterling} label="Current estimate" value="N/A" />
        </div>
      </PortalCard>

      <PortalCard className="p-5">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => { const reached = idx >= i; return (
            <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1 shrink-0"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${reached ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400"}`}>{reached ? <CheckCircle2 className="w-4 h-4" /> : i + 1}</span><span className={`text-[10px] font-semibold text-center ${reached ? "text-[#071B4D]" : "text-slate-400"}`}>{s}</span></div>
              {i < STEPS.length - 1 && <span className={`flex-1 h-0.5 ${idx > i ? "bg-[#2563EB]" : "bg-slate-200"}`} />}
            </div>
          )})}
        </div>
      </PortalCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Issue summary" icon={ClipboardList}><p className="text-sm text-slate-600">{job.description || "Details of the reported issue appear here."}</p></PortalSectionCard>
          {awaitingApproval && (
            <PortalSectionCard title="Quote approval" icon={Wallet}>
              <p className="text-sm text-slate-600 mb-3">A contractor quote is awaiting your approval before work proceeds.</p>
              <div className="flex gap-2"><PortalButtonLink href={`${base}/messages`} variant="primary" icon={CheckCircle2}>Approve quote</PortalButtonLink><PortalButtonLink href={`${base}/messages`}>Request changes</PortalButtonLink></div>
            </PortalSectionCard>
          )}
          <PortalSectionCard title="Activity & updates" icon={ClipboardList}>
            <ol className="space-y-3"><li className="flex gap-3"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" /><div><p className="text-sm text-slate-700">Request raised</p><p className="text-[11px] text-slate-400">{formatDate(job.created_at)}</p></div></li></ol>
          </PortalSectionCard>
          <PortalSectionCard title="Attachments & photos" icon={Images}><PortalEmptyState icon={Images} title="No photos yet" /></PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Contractor details" icon={Building2}><p className="text-sm text-slate-600">Assigned by {session.workspaceName} once approved.</p></PortalSectionCard>
          <PortalSectionCard title="Cost / quote summary" icon={PoundSterling}><p className="text-sm text-slate-600">Quote details will appear here.</p></PortalSectionCard>
          <PortalSectionCard title="Resolution & next steps" icon={CheckCircle2}>{idx >= 4 ? <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Resolved</p> : <p className="text-sm text-slate-600 flex items-center gap-1.5"><Circle className="w-4 h-4 text-slate-300" /> In progress</p>}</PortalSectionCard>
          <PortalCard className="p-4"><div className="flex items-start gap-2.5"><span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Phone className="w-4 h-4" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Urgent contact</p><p className="text-xs text-slate-400 mt-0.5">Call <a href="tel:0800000000" className="font-semibold text-red-600">0800 000 000</a> for emergencies.</p></div></div></PortalCard>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <PortalButtonLink href={`${base}/messages`} icon={MessageSquare} className="justify-center">Message manager</PortalButtonLink>
        <PortalButtonLink href={`${base}/properties`} icon={Home} className="justify-center">View property</PortalButtonLink>
        <PortalButtonLink href={`${base}/financials`} icon={Wallet} className="justify-center">View finances</PortalButtonLink>
        <PortalButtonLink href={`${base}/documents`} icon={FileText} className="justify-center">View documents</PortalButtonLink>
      </div>
    </div>
  )
}
