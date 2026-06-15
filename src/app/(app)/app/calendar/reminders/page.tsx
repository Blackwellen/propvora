"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  Settings,
  AlarmClock,
  BellOff,
  Clock,
  X,
  CalendarDays,
  Eye,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { CalendarTabNav } from "@/components/calendar"
import { MobileTopBar } from "@/components/mobile"
import { Button } from "@/components/ui/Button"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  useCalendarReminders,
  useSnoozeReminder,
  useUpdateCalendarReminder,
  type CalendarReminder,
} from "@/hooks/useCalendarData"
import {
  useCalendarItems,
  bucketItems,
  type CalendarItem,
} from "../_lib/useCalendarItems"

type TabFilter = "All" | "Pending" | "Snoozed" | "Sent" | "Overdue"
const TABS: TabFilter[] = ["All", "Pending", "Snoozed", "Sent", "Overdue"]

const SNOOZE_OPTIONS: Array<{ label: string; ms: number }> = [
  { label: "1 hour", ms: 60 * 60_000 },
  { label: "4 hours", ms: 4 * 60 * 60_000 },
  { label: "1 day", ms: 24 * 60 * 60_000 },
  { label: "1 week", ms: 7 * 24 * 60 * 60_000 },
]

function statusStyle(status: string): { chip: string; dot: string; label: string } {
  switch (status) {
    case "pending": return { chip: "bg-blue-100 text-blue-700", dot: "bg-blue-500", label: "Pending" }
    case "snoozed": return { chip: "bg-slate-100 text-slate-500", dot: "bg-slate-300", label: "Snoozed" }
    case "sent": return { chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", label: "Sent" }
    case "failed": return { chip: "bg-red-100 text-red-700", dot: "bg-red-500", label: "Failed" }
    case "cancelled": return { chip: "bg-slate-100 text-slate-400", dot: "bg-slate-300", label: "Cancelled" }
    default: return { chip: "bg-slate-100 text-slate-600", dot: "bg-slate-400", label: status }
  }
}

export default function RemindersPage() {
  const { workspace } = useWorkspace()
  const wsId = workspace?.id ?? ""
  const remindersQuery = useCalendarReminders(wsId)
  const snooze = useSnoozeReminder(wsId)
  const updateReminder = useUpdateCalendarReminder(wsId)
  const { items } = useCalendarItems(workspace?.id)

  const [activeTab, setActiveTab] = useState<TabFilter>("All")
  const [snoozeTarget, setSnoozeTarget] = useState<CalendarReminder | null>(null)
  const [selectedSnooze, setSelectedSnooze] = useState<number | null>(null)

  // The reminders table may not exist (42P01) → query errors. Degrade gracefully.
  const tableMissing = remindersQuery.isError
  const reminders = remindersQuery.data ?? []

  const now = Date.now()
  const overdueCross = useMemo(() => bucketItems(items).overdue
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()), [items])

  const filtered = useMemo(() => reminders.filter((r) => {
    const isOverdue = r.status === "pending" && new Date(r.due_at).getTime() < now
    switch (activeTab) {
      case "All": return true
      case "Pending": return r.status === "pending"
      case "Snoozed": return r.status === "snoozed"
      case "Sent": return r.status === "sent"
      case "Overdue": return isOverdue
      default: return true
    }
  }), [reminders, activeTab, now])

  const stats = useMemo(() => ({
    total: reminders.length,
    dueToday: reminders.filter((r) => {
      const d = new Date(r.due_at); const t = new Date()
      return r.status === "pending" && d.toDateString() === t.toDateString()
    }).length,
    overdue: reminders.filter((r) => r.status === "pending" && new Date(r.due_at).getTime() < now).length,
    pending: reminders.filter((r) => r.status === "pending").length,
  }), [reminders, now])

  function openSnooze(r: CalendarReminder) { setSnoozeTarget(r); setSelectedSnooze(null) }
  function closeSnooze() { setSnoozeTarget(null); setSelectedSnooze(null) }
  async function confirmSnooze() {
    if (!snoozeTarget || selectedSnooze == null) return
    await snooze.mutateAsync({ id: snoozeTarget.id, snoozed_until: new Date(now + selectedSnooze).toISOString() })
    closeSnooze()
  }
  async function cancelReminder(r: CalendarReminder) {
    await updateReminder.mutateAsync({ id: r.id, updates: { status: "cancelled" } })
  }

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Reminders"
        subtitle="Scheduled alerts"
        primaryAction={{ label: "New reminder", icon: Plus, href: "/app/calendar/reminders/new" }}
        overflowActions={[
          { label: "Settings", icon: Settings, href: "/app/calendar/settings" },
        ]}
      />
      <div className="md:hidden -mx-4">
        <CalendarTabNav />
      </div>
      <div className="hidden md:block">
        <CalendarTabNav />
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div className="hidden md:flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reminders</h1>
            <p className="text-sm text-slate-500 mt-0.5">Scheduled alerts attached to your calendar events</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />} asChild>
              <Link href="/app/calendar/settings">Settings</Link>
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} asChild>
              <Link href="/app/calendar/reminders/new">New Reminder</Link>
            </Button>
          </div>
        </div>

        {tableMissing ? (
          /* Graceful degrade: reminders table not provisioned — show overdue attention from live cross-section. */
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <Bell className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Reminders not set up yet</p>
                <p className="text-xs text-amber-700 mt-0.5">The reminders table isn&apos;t provisioned in this workspace. Meanwhile, here are overdue items that need attention.</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-800">Overdue across your portfolio ({overdueCross.length})</p>
              </div>
              {overdueCross.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Nothing overdue</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {overdueCross.map((item: CalendarItem) => (
                    <Link key={item.key} href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-slate-800 truncate">{item.title}</span>
                      <span className="text-xs text-slate-400">{item.sourceLabel}</span>
                      <span className="text-xs font-medium text-red-600">{new Date(item.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* KPI strip */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-slate-900">{remindersQuery.isLoading ? "…" : stats.total}</p>
              </div>
              <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Due Today</p>
                <p className="text-2xl font-bold text-amber-600">{remindersQuery.isLoading ? "…" : stats.dueToday}</p>
              </div>
              <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{remindersQuery.isLoading ? "…" : stats.overdue}</p>
              </div>
              <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{remindersQuery.isLoading ? "…" : stats.pending}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200">
              {TABS.map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={cn("px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all", activeTab === tab ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700")}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {["Title", "Channel", "Due", "Status", "Actions"].map((col, i) => (
                        <th key={col} className={cn("px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap", i === 4 ? "text-right" : "text-left")}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {remindersQuery.isLoading && (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                        <div className="flex items-center justify-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />Loading reminders…</div>
                      </td></tr>
                    )}
                    {!remindersQuery.isLoading && filtered.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-16 text-center">
                        <BellOff className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-500">No reminders {activeTab !== "All" ? `(${activeTab.toLowerCase()})` : "yet"}</p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">Create a reminder to get alerted before key dates.</p>
                        <Link href="/app/calendar/reminders/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors">
                          <Plus className="w-4 h-4" />New Reminder
                        </Link>
                      </td></tr>
                    )}
                    {!remindersQuery.isLoading && filtered.map((r) => {
                      const isOverdue = r.status === "pending" && new Date(r.due_at).getTime() < now
                      const st = statusStyle(isOverdue ? "failed" : r.status)
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", st.dot)} />
                              <span className="font-medium text-slate-800 text-sm">{r.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs capitalize">{r.channel.replace("_", " ")}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                            {new Date(r.due_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", isOverdue ? "bg-red-100 text-red-700" : st.chip)}>
                              {isOverdue ? "Overdue" : st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ActionMenu
                              items={[
                                ...(r.event_id ? [{ label: "Open Event", icon: Eye, onClick: () => { window.location.href = `/app/calendar/events/${r.event_id}` } }] : []),
                                { label: "Snooze", icon: Clock, disabled: r.status !== "pending", onClick: () => openSnooze(r) },
                                { label: "Cancel", icon: X, variant: "danger" as const, disabled: r.status === "cancelled", onClick: () => { void cancelReminder(r) } },
                              ]}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Snooze drawer */}
      {snoozeTarget && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={closeSnooze} aria-hidden="true" />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlarmClock className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-semibold text-slate-900">Snooze Reminder</h2>
              </div>
              <button type="button" onClick={closeSnooze} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-xs text-slate-500 mb-0.5">Snoozing</p>
                <p className="text-sm font-medium text-slate-800">{snoozeTarget.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Snooze duration</p>
                <div className="space-y-2">
                  {SNOOZE_OPTIONS.map((opt) => (
                    <button key={opt.label} type="button" onClick={() => setSelectedSnooze(opt.ms)}
                      className={cn("w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-all", selectedSnooze === opt.ms ? "border-[#2563EB] bg-blue-50 text-[#2563EB]" : "border-slate-200 text-slate-700 hover:bg-slate-50")}>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex items-center gap-2">
              <Button variant="primary" size="sm" className="flex-1" disabled={selectedSnooze == null || snooze.isPending} onClick={confirmSnooze} leftIcon={<BellOff className="w-4 h-4" />}>
                {snooze.isPending ? "Snoozing…" : "Confirm Snooze"}
              </Button>
              <Button variant="outline" size="sm" onClick={closeSnooze}>Cancel</Button>
            </div>
          </div>
        </>
      )}
    </DashboardContainer>
  )
}
