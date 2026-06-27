import {
  ClipboardCheck, Home, PoundSterling, CalendarClock, CheckCircle2, User, Phone, Mail,
} from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getApplicantProspects } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState, PortalFact,
} from "@/components/portals/portal-ui"
import { APPLICATION_STATUS_META } from "../_status"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// The application journey, in order. We mark each stage reached based on the
// current prospect status so the applicant can see exactly where they are.
const JOURNEY: { key: string; label: string }[] = [
  { key: "new", label: "Application received" },
  { key: "contacted", label: "In contact" },
  { key: "viewing_scheduled", label: "Viewing arranged" },
  { key: "referencing", label: "Referencing" },
  { key: "offered", label: "Offer" },
  { key: "accepted", label: "Accepted" },
]
const STAGE_ORDER: Record<string, number> = {
  new: 0, contacted: 1, viewing_scheduled: 2, viewing_done: 2,
  referencing: 3, offered: 4, accepted: 5, rejected: 99, withdrawn: 99,
}

export default async function ApplicantApplicationPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "applicant")
  const base = `/portal/${session.id}/applicant`
  const prospects = await getApplicantProspects(session)
  const p = prospects[0] ?? null

  if (!p) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="My application" subtitle="Your application details and progress." backHref={base} />
        <PortalCard className="p-0"><PortalEmptyState icon={ClipboardCheck} title="No application on file" description="Once your enquiry is registered you'll see your full application here." /></PortalCard>
      </div>
    )
  }

  const meta = APPLICATION_STATUS_META[p.status] ?? APPLICATION_STATUS_META.new
  const currentStage = STAGE_ORDER[p.status] ?? 0
  const applicantName = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Applicant"

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="My application"
        subtitle="Your application details and progress."
        backHref={base}
        actions={<StatusChip tone={meta.tone} dot>{meta.label}</StatusChip>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Property" icon={Home}>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#071B4D]">{p.vacancyTitle ?? p.propertyLabel ?? "Your application"}</p>
              {p.propertyLabel && <p className="text-xs text-slate-400">{p.propertyLabel}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {p.vacancyRent != null && <PortalFact label="Asking rent" value={`${formatMoney(p.vacancyRent)} pcm`} icon={PoundSterling} />}
                {p.move_in_date && <PortalFact label="Preferred move-in" value={formatDate(p.move_in_date)} icon={CalendarClock} />}
                {(p.budget_max ?? p.budget_min) != null && <PortalFact label="Your budget" value={formatMoney(p.budget_max ?? p.budget_min)} icon={PoundSterling} />}
              </div>
            </div>
          </PortalSectionCard>

          <PortalSectionCard title="Progress" icon={CheckCircle2}>
            {p.status === "rejected" || p.status === "withdrawn" ? (
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">This application is no longer progressing. Please contact {session.workspaceName} if you have any questions.</div>
            ) : (
              <ol className="space-y-3">
                {JOURNEY.map((stage, i) => {
                  const done = i < currentStage
                  const active = i === currentStage
                  return (
                    <li key={stage.key} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${done ? "bg-emerald-500 text-white" : active ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-400"}`}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </span>
                      <span className={`text-sm ${active ? "font-semibold text-[#071B4D]" : done ? "text-slate-600" : "text-slate-400"}`}>{stage.label}</span>
                      {active && <StatusChip tone="blue" className="ml-auto">Current</StatusChip>}
                    </li>
                  )
                })}
              </ol>
            )}
          </PortalSectionCard>
        </div>

        <div className="space-y-4">
          <PortalSectionCard title="Your details" icon={User}>
            <div className="space-y-3">
              <PortalFact label="Name" value={applicantName} icon={User} />
              {p.email && <PortalFact label="Email" value={p.email} icon={Mail} />}
              {p.phone && <PortalFact label="Phone" value={p.phone} icon={Phone} />}
              <PortalFact label="Applied" value={formatDate(p.created_at)} icon={CalendarClock} />
            </div>
          </PortalSectionCard>
          <PortalSectionCard title="Referencing" icon={CheckCircle2}>
            <StatusChip tone={p.referencing_status ? "violet" : "slate"}>{p.referencing_status ?? "Not started"}</StatusChip>
            <p className="text-xs text-slate-400 mt-2">Referencing is arranged by {session.workspaceName} once your application progresses.</p>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
