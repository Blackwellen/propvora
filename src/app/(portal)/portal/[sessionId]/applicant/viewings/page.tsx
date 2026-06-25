import { CalendarClock, Clock } from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getApplicantViewings } from "@/lib/portal/data"
import { formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
} from "@/components/portals/portal-ui"
import { VIEWING_STATUS_META } from "../_status"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ApplicantViewingsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "applicant")
  const base = `/portal/${session.id}/applicant`
  const viewings = await getApplicantViewings(session)

  const now = Date.now()
  const upcoming = viewings.filter((v) => v.status === "scheduled" && new Date(v.scheduled_at).getTime() >= now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const past = viewings.filter((v) => !(v.status === "scheduled" && new Date(v.scheduled_at).getTime() >= now))
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))

  function row(v: typeof viewings[number]) {
    const meta = VIEWING_STATUS_META[v.status] ?? VIEWING_STATUS_META.scheduled
    return (
      <div key={v.id} className="flex items-center gap-3 rounded-xl border border-[#EEF3FB] px-4 py-3">
        <span className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0"><CalendarClock className="w-4 h-4" /></span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#071B4D]">{formatDate(v.scheduled_at, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">{v.vacancyTitle ?? "Viewing"}{v.duration_minutes ? <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{v.duration_minutes} min</span> : null}</p>
        </div>
        <StatusChip tone={meta.tone} dot>{meta.label}</StatusChip>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PortalPageHeader title="Viewings" subtitle="Your scheduled and past property viewings." backHref={base} />

      {viewings.length === 0 ? (
        <PortalCard className="p-0"><PortalEmptyState icon={CalendarClock} title="No viewings yet" description="When a viewing is arranged for you, it will appear here." /></PortalCard>
      ) : (
        <>
          <PortalSectionCard title={`Upcoming (${upcoming.length})`} icon={CalendarClock}>
            {upcoming.length === 0 ? <PortalEmptyState icon={CalendarClock} title="No upcoming viewings" /> : <div className="space-y-2">{upcoming.map(row)}</div>}
          </PortalSectionCard>
          {past.length > 0 && (
            <PortalSectionCard title={`Past (${past.length})`} icon={Clock}>
              <div className="space-y-2">{past.map(row)}</div>
            </PortalSectionCard>
          )}
        </>
      )}
    </div>
  )
}
