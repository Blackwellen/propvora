"use client"

import Link from "next/link"
import {
  FileText, CalendarClock, ClipboardCheck, Wallet, Star, Navigation,
  PlusCircle, Upload, User, Calendar, Clock, AlertTriangle, MessageSquare,
  ArrowUpRight, MoreHorizontal, Inbox, ChevronRight, Map,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import {
  KpiRow, Panel, ScoreRing, CheckRow, Pill, OverviewLink, useToast,
  OverviewSkeleton, OverviewError, type OverviewKpi, type Accent,
} from "../ui/primitives"
import { clockTime, shortDate, timeAgo } from "../ui/util"
import { useTodayData } from "../data/hooks"

const QUICK_ICON: Record<string, React.ElementType> = {
  calendar: Calendar, inbox: Inbox, plus: PlusCircle, shield: Upload, user: User,
}

function trustAccent(pct: number): Accent {
  if (pct >= 85) return "emerald"
  if (pct >= 60) return "blue"
  if (pct >= 40) return "amber"
  return "slate"
}
function trustBand(pct: number): string {
  if (pct >= 85) return "Excellent"
  if (pct >= 60) return "Strong"
  if (pct >= 40) return "Building"
  return "Getting started"
}

const AGENDA_TONE: Record<string, { dot: string; pill: Accent; label: string }> = {
  done: { dot: "bg-emerald-500", pill: "emerald", label: "Done" },
  in_progress: { dot: "bg-blue-500", pill: "blue", label: "On site" },
  upcoming: { dot: "bg-slate-300", pill: "slate", label: "Scheduled" },
  overdue: { dot: "bg-red-500", pill: "red", label: "Overdue" },
}

export function TodayTab() {
  const { data, loading, error, reload } = useTodayData()
  const { toast } = useToast()

  if (loading) return <OverviewSkeleton />
  if (error && !data) return <OverviewError onRetry={reload} />
  if (!data) return null

  const k = data.kpis
  const cur = data.earnings.currency

  const kpis: OverviewKpi[] = [
    { id: "new", label: "New requests", value: k.newRequests, icon: FileText, accent: "blue", href: "/supplier?tab=requests" },
    { id: "jobs", label: "Jobs today", value: k.jobsToday, icon: CalendarClock, accent: "sky", href: "/supplier?tab=jobs" },
    { id: "ev", label: "Awaiting evidence", value: k.awaitingEvidence, icon: ClipboardCheck, accent: "amber", href: "/supplier?tab=jobs" },
    { id: "pay", label: "Awaiting payout", value: formatPence(k.awaitingPayoutPence, cur), icon: Wallet, accent: "emerald", href: "/supplier?tab=earnings" },
    { id: "score", label: "Response score", value: k.responseScorePct > 0 ? `${k.responseScorePct}%` : "—", icon: Star, accent: "violet", href: "/supplier?tab=compliance" },
  ]

  const next = data.nextAppointment
  const [addrLine1, ...addrRest] = (next?.address ?? "").split(",")
  const addrLine2 = addrRest.join(",").trim()
  const quick = data.quickActions

  return (
    <div className="space-y-5">
      <KpiRow kpis={kpis} />

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-5">
        {/* ── Left column: agenda + earnings ──────────────────────────────── */}
        <div className="space-y-5 order-2 xl:order-1">
          <Panel title="Today's agenda" icon={CalendarClock} action={<span className="text-[12px] font-medium text-slate-400">Today</span>}>
            {data.agenda.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-2">No appointments scheduled for today.</p>
            ) : (
            <ol className="relative pl-5">
              <span className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-100" aria-hidden />
              {data.agenda.map((a) => {
                const tone = AGENDA_TONE[a.status] ?? AGENDA_TONE.upcoming
                const label = a.kind === "off" ? "Travel" : tone.label
                const pill = a.kind === "off" ? "slate" : tone.pill
                return (
                  <li key={a.id} className="relative pb-4 last:pb-0">
                    <span className={`absolute -left-5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${tone.dot}`} />
                    <Link href={a.href} className="group flex items-start gap-2.5 rounded-xl -mx-2 px-2 py-1 hover:bg-slate-50">
                      <span className="text-[12px] font-bold text-slate-500 w-10 shrink-0 pt-0.5">{a.time}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-slate-800 truncate group-hover:text-blue-600">{a.title}</span>
                        <span className="block text-[11px] text-slate-400 truncate">{a.subtitle}</span>
                      </span>
                      <Pill accent={pill as Accent}>{label}</Pill>
                    </Link>
                  </li>
                )
              })}
            </ol>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
              <OverviewLink href="/supplier/schedule" label="View full schedule" />
              <Link href="/supplier/schedule" className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-slate-700">
                <Map className="w-3.5 h-3.5" /> Route map
              </Link>
            </div>
          </Panel>

          <Panel title="Earnings snapshot" icon={Wallet} action={<OverviewLink href="/supplier?tab=earnings" label="View" />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Today</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 leading-none">{formatPence(data.earnings.todayPence, cur)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">This week</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 leading-none">{formatPence(data.earnings.weekPence, cur)}</p>
              </div>
            </div>
            <Link href="/supplier?tab=earnings" className="mt-3 inline-block text-[12px] font-semibold text-blue-600 hover:text-blue-700">View full earnings →</Link>
          </Panel>
        </div>

        {/* ── Center column: next appointment + alerts/quick + messages ─────── */}
        <div className="space-y-5 order-1 xl:order-2">
          {next && (
            <section className="bg-white border border-slate-200 rounded-[20px] shadow-sm p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Next appointment</h2>
                <Pill accent="blue">Upcoming</Pill>
              </div>

              {next.photo && (
                <div className="mt-4 h-44 rounded-2xl overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={next.photo} alt={next.address} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="mt-4">
                <Pill accent="blue">{next.service}</Pill>
                <h3 className="mt-2.5 text-xl font-bold text-slate-900 leading-tight">{addrLine1}</h3>
                {addrLine2 && <p className="text-[13px] text-slate-500">{addrLine2}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> Today, {clockTime(next.startsAt)}</span>
                  {next.durationMinutes && <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {next.durationMinutes} min</span>}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[13px] text-slate-600">
                  <span className="text-slate-400">Job ID:</span>
                  <span className="font-semibold text-slate-700">{next.jobRef}</span>
                  {next.stateLabel && <Pill accent="emerald">{next.stateLabel}</Pill>}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => toast("Route handoff coming soon", "info")} className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#1d4ed8] transition-colors">
                    <Navigation className="w-4 h-4" /> Start route
                  </button>
                  <Link href={next.jobHref} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors">
                    Open job <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <button onClick={() => toast("More actions coming soon", "info")} className="w-[42px] h-[42px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Priority alerts + Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Panel title="Priority alerts" icon={AlertTriangle}>
              {data.priorityAlerts.length === 0 && (
                <p className="text-[12px] text-slate-400">No priority alerts right now.</p>
              )}
              <ul className="space-y-2.5">
                {data.priorityAlerts.map((al) => (
                  <li key={al.id} className="flex items-start gap-2.5">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${al.tone === "red" ? "bg-red-50 text-red-500" : al.tone === "amber" ? "bg-amber-50 text-amber-500" : al.tone === "violet" ? "bg-violet-50 text-violet-500" : "bg-blue-50 text-blue-500"}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 leading-snug">{al.title}</p>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{al.body}</p>
                    </div>
                    <Link href={al.href} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 shrink-0 self-center whitespace-nowrap">{al.ctaLabel}</Link>
                  </li>
                ))}
              </ul>
              <Link href="/supplier?tab=compliance" className="mt-3 inline-block text-[12px] font-semibold text-blue-600 hover:text-blue-700">View all alerts →</Link>
            </Panel>

            <Panel title="Quick actions">
              <div className="grid grid-cols-3 gap-2.5">
                {quick.slice(0, 3).map((q) => {
                  const Icon = QUICK_ICON[q.icon] ?? PlusCircle
                  const badge = q.icon === "inbox" ? k.newRequests : undefined
                  return (
                    <Link key={q.id} href={q.href} className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-center">
                      {badge ? (
                        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">{badge}</span>
                      ) : null}
                      <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Icon className="w-4 h-4 text-blue-600" /></span>
                      <span className="text-[11px] font-medium text-slate-700 leading-tight">{q.label}</span>
                    </Link>
                  )
                })}
              </div>
              {quick[3] && (
                <Link href={quick[3].href} className="mt-2.5 flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Upload className="w-4 h-4 text-blue-600" /></span>
                  <span className="text-[12.5px] font-medium text-slate-700">{quick[3].label}</span>
                </Link>
              )}
              {quick[4] && (
                <Link href={quick[4].href} className="mt-2.5 flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-blue-600" /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] font-medium text-slate-700">{quick[4].label}</span>
                    <span className="block text-[11px] text-slate-400">See how property managers see you</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              )}
            </Panel>
          </div>

          {/* Unread messages */}
          <Panel title="Unread messages" icon={MessageSquare} action={<OverviewLink href="/supplier/messages" label="View all messages" />}>
            {data.unread.length === 0 && (
              <p className="text-[12px] text-slate-400 py-1">No unread messages.</p>
            )}
            <ul className="divide-y divide-slate-100">
              {data.unread.map((m) => (
                <li key={m.id}>
                  <Link href={m.href} className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-slate-50">
                    <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0">
                      {m.from.split(/[\s–-]+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold text-slate-800 truncate">{m.from}</span>
                      <span className="block text-[12px] text-slate-500 truncate">{m.preview}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(m.receivedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* ── Right rail ────────────────────────────────────────────────────── */}
        <aside className="space-y-5 order-3">
          {/* Availability */}
          <Panel>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-900">Availability</h2>
              <button
                onClick={() => toast(data.availability.available ? "Marked unavailable (demo)" : "Marked available (demo)", "info")}
                role="switch"
                aria-checked={data.availability.available}
                aria-label="Toggle availability"
                className={`relative w-11 h-6 rounded-full transition-colors ${data.availability.available ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${data.availability.available ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            <p className={`text-[13px] font-semibold ${data.availability.available ? "text-emerald-600" : "text-slate-500"}`}>{data.availability.available ? "Online and available" : "Unavailable"}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{data.availability.available ? "You're visible to property managers and receiving requests." : "You're hidden from new requests while unavailable."}</p>
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Today&apos;s hours</span>
                <Link href="/supplier/availability" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">Edit</Link>
              </div>
              <p className="text-[13px] font-semibold text-slate-800 -mt-1">{data.availability.hours}</p>
            </div>
          </Panel>

          {/* Payout snapshot */}
          <Panel>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Payout snapshot</h2>
            <p className="text-[12px] text-slate-500">This week</p>
            <p className="text-2xl font-bold text-emerald-600 leading-none mt-0.5">{formatPence(data.payout.thisWeekPence, data.payout.currency)}</p>
            <div className="mt-3 border-t border-slate-100 pt-3 flex items-end justify-between">
              <div>
                <p className="text-[12px] text-slate-500">Next payout</p>
                <p className="text-[13px] font-semibold text-slate-800 mt-0.5">{shortDate(data.payout.nextPayoutDate)}</p>
              </div>
              <p className="text-[15px] font-bold text-slate-900">{formatPence(data.payout.nextPayoutPence, data.payout.currency)}</p>
            </div>
            <OverviewLink href="/supplier?tab=earnings" label="View finance" />
          </Panel>

          {/* Compliance alerts */}
          <Panel title="Compliance alerts" action={<span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold inline-flex items-center justify-center">{data.complianceAlerts.length}</span>}>
            {data.complianceAlerts.length === 0 && (
              <p className="text-[12px] text-slate-400">No compliance alerts.</p>
            )}
            <ul className="space-y-3">
              {data.complianceAlerts.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${c.status === "missing" || c.status === "expired" ? "bg-red-500" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800">{c.document} {c.document === "Gas Safe" ? "certificate" : "document"}</p>
                    <p className="text-[11px] text-slate-500">{c.expiresAt ? `Expires in ${Math.max(0, Math.round((new Date(c.expiresAt).getTime() - Date.now()) / 86_400_000))} days` : c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <OverviewLink href="/supplier?tab=compliance" label="View all alerts" />
          </Panel>

          {/* Profile & trust ring */}
          <Panel title="Profile & trust score" action={<Link href="/supplier/profile" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">View public profile</Link>}>
            {data.trust.scorePct > 0 ? (
              <>
                <div className="flex items-center gap-4">
                  <ScoreRing pct={data.trust.scorePct} size={86} stroke={9} accent={trustAccent(data.trust.scorePct)} sub={undefined} />
                  <div className="min-w-0">
                    <Pill accent={trustAccent(data.trust.scorePct)}>{trustBand(data.trust.scorePct)}</Pill>
                    <p className="text-[12px] text-slate-500 mt-1.5">Based on your on-time, response, quality and communication scores.</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  <CheckRow label="On-time completion" done={data.trust.breakdown.onTimePct >= 80} value={`${data.trust.breakdown.onTimePct}%`} />
                  <CheckRow label="Response time" done={data.trust.breakdown.responsePct >= 80} value={`${data.trust.breakdown.responsePct}%`} />
                  <CheckRow label="Quality of work" done={data.trust.breakdown.qualityPct >= 80} value={`${data.trust.breakdown.qualityPct}%`} />
                  <CheckRow label="Communication" done={data.trust.breakdown.communicationPct >= 80} value={`${data.trust.breakdown.communicationPct}%`} />
                </div>
              </>
            ) : (
              <p className="text-[12px] text-slate-400 py-2">Your trust score builds as you complete jobs and earn verified reviews.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}
