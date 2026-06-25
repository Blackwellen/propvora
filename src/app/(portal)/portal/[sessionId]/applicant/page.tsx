import Link from "next/link"
import {
  ClipboardCheck, CalendarClock, FileText, MessageSquare, Home, ChevronRight,
  ArrowRight, CheckCircle2, PoundSterling,
} from "lucide-react"
import { requirePortalSession } from "../_guard"
import { getApplicantProspects, getApplicantViewings } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalSectionCard, PortalKpiStrip, StatusChip, PortalEmptyState, PortalFact,
  type PortalKpi,
} from "@/components/portals/portal-ui"
import { APPLICATION_STATUS_META } from "./_status"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ApplicantPortalHome({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "applicant")
  const base = `/portal/${session.id}/applicant`
  const prospects = await getApplicantProspects(session)
  const viewings = await getApplicantViewings(session, prospects)

  const primary = prospects[0] ?? null
  const meta = APPLICATION_STATUS_META[primary?.status ?? "new"] ?? APPLICATION_STATUS_META.new
  const upcoming = viewings
    .filter((v) => v.status === "scheduled" && new Date(v.scheduled_at).getTime() >= Date.now())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const nextViewing = upcoming[0] ?? null

  const kpis: PortalKpi[] = [
    { label: "Application status", value: meta.label, icon: ClipboardCheck, tone: meta.tone, href: `${base}/application` },
    { label: "Upcoming viewings", value: String(upcoming.length), icon: CalendarClock, tone: upcoming.length ? "blue" : "slate", href: `${base}/viewings` },
    { label: "Referencing", value: primary?.referencing_status ? primary.referencing_status : "Not started", icon: CheckCircle2, tone: primary?.referencing_status ? "violet" : "slate", href: `${base}/application` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#071B4D]">Your application</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track your application progress with {session.workspaceName}.</p>
      </div>

      {prospects.length === 0 ? (
        <PortalSectionCard title="Application" icon={ClipboardCheck}>
          <PortalEmptyState icon={ClipboardCheck} title="No application on file yet" description="Once your enquiry is registered, your application details and viewing schedule will appear here." />
        </PortalSectionCard>
      ) : (
        <>
          <PortalKpiStrip kpis={kpis} cols={4} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 space-y-4">
              <PortalSectionCard title="Property you applied for" icon={Home} viewAllHref={`${base}/application`} viewAllLabel="Full details">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#071B4D] truncate">{primary?.vacancyTitle ?? primary?.propertyLabel ?? "Your application"}</p>
                      {primary?.propertyLabel && <p className="text-xs text-slate-400 truncate mt-0.5">{primary.propertyLabel}</p>}
                    </div>
                    <StatusChip tone={meta.tone} dot>{meta.label}</StatusChip>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {primary?.vacancyRent != null && <PortalFact label="Asking rent" value={`${formatMoney(primary.vacancyRent)} pcm`} icon={PoundSterling} />}
                    {primary?.move_in_date && <PortalFact label="Move-in" value={formatDate(primary.move_in_date)} icon={CalendarClock} />}
                    {(primary?.budget_max ?? primary?.budget_min) != null && <PortalFact label="Your budget" value={formatMoney(primary?.budget_max ?? primary?.budget_min)} icon={PoundSterling} />}
                  </div>
                </div>
              </PortalSectionCard>

              <PortalSectionCard title="Next viewing" icon={CalendarClock} viewAllHref={`${base}/viewings`}>
                {!nextViewing ? (
                  <PortalEmptyState icon={CalendarClock} title="No viewings scheduled" description="When a viewing is booked, it will show here." />
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF3FB] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#071B4D]">{formatDate(nextViewing.scheduled_at, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="text-xs text-slate-400 truncate">{nextViewing.vacancyTitle ?? "Viewing"}</p>
                    </div>
                    <StatusChip tone="blue" dot>Scheduled</StatusChip>
                  </div>
                )}
              </PortalSectionCard>
            </div>

            <div className="space-y-4">
              <PortalSectionCard title="Documents" icon={FileText} viewAllHref={`${base}/documents`}>
                <p className="text-sm text-slate-500">Listing brochures, draft tenancy agreements and other documents shared for your application.</p>
              </PortalSectionCard>
              <PortalSectionCard title="Quick actions" icon={ArrowRight}>
                <div className="grid grid-cols-1 gap-2">
                  {[["My application", `${base}/application`, ClipboardCheck], ["Viewings", `${base}/viewings`, CalendarClock], ["Documents", `${base}/documents`, FileText], ["Messages", `${base}/messages`, MessageSquare]].map(([l, h, I]) => {
                    const Icon = I as typeof ClipboardCheck
                    return <Link key={l as string} href={h as string} className="flex items-center gap-2 rounded-xl border border-[#EEF3FB] hover:bg-[#F8FBFF] px-3 py-2.5 text-sm font-semibold text-[#071B4D]"><Icon className="w-4 h-4 text-[#2563EB]" />{l as string}<ChevronRight className="w-4 h-4 text-slate-300 ml-auto" /></Link>
                  })}
                </div>
              </PortalSectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
