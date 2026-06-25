"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell, BellOff, CheckCheck, Loader2, AlertTriangle, RefreshCw, Settings,
  Inbox, ArrowUpRight, ChevronDown,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { MobileTopBar } from "@/components/mobile"
import { createClient } from "@/lib/supabase/client"
import { resolveEntityHref } from "@/lib/notifications/routes"
import { useWorkspace } from "@/providers/AuthProvider"
import { useSectionLink } from "@/components/sections/SectionBasePath"
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────────── */
interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  severity: string | null
  resource_type: string | null
  resource_id: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

const PAGE_SIZE = 30

/* ── Presentation helpers ───────────────────────────────────────────────── */
const SEVERITY_STYLE: Record<string, { bg: string; color: string; ring: string }> = {
  info:    { bg: "bg-blue-50",    color: "text-blue-600",    ring: "ring-blue-100" },
  success: { bg: "bg-emerald-50", color: "text-emerald-600", ring: "ring-emerald-100" },
  warning: { bg: "bg-amber-50",   color: "text-amber-600",   ring: "ring-amber-100" },
  danger:  { bg: "bg-red-50",     color: "text-red-600",     ring: "ring-red-100" },
  critical:{ bg: "bg-red-50",     color: "text-red-600",     ring: "ring-red-100" },
}

const TYPE_ICON: Record<string, string> = {
  message: "✉", task: "✓", compliance: "⚠", payment: "£", ai: "✦", info: "ℹ",
}
function iconForKind(kind: string): string {
  const prefix = (kind ?? "").split(".")[0]
  switch (prefix) {
    case "task":       return TYPE_ICON.task
    case "compliance": return TYPE_ICON.compliance
    case "message":    return TYPE_ICON.message
    case "invoice":
    case "bill":
    case "rent":       return TYPE_ICON.payment
    case "job":        return "🛠"
    case "tenancy":    return "🏠"
    case "ai":         return TYPE_ICON.ai
    default:           return TYPE_ICON[kind] ?? TYPE_ICON.info
  }
}

/** Human label for a kind prefix — used in the category filter. */
function kindLabel(prefix: string): string {
  const map: Record<string, string> = {
    task: "Tasks", compliance: "Compliance", message: "Messages",
    invoice: "Payments", bill: "Payments", rent: "Payments",
    job: "Jobs", tenancy: "Tenancies", ai: "AI", info: "General",
  }
  return map[prefix] ?? (prefix.charAt(0).toUpperCase() + prefix.slice(1))
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

/** Bucket a notification into a date group header. */
function dateGroup(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return "Earlier this week"
  if (days < 30) return "This month"
  return "Older"
}

function rowHref(n: NotificationRow): string | null {
  return n.href ?? resolveEntityHref(n.resource_type, n.resource_id)
}

type Tab = "all" | "unread"

/* ── KPI card (matches Messages benchmark) ──────────────────────────────── */
function KpiCard({ label, value, icon, bg, alert }: {
  label: string; value: number; icon: React.ReactNode; bg: string; alert?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      {alert && <p className="text-[10px] font-medium text-amber-600 mt-0.5">{alert}</p>}
    </div>
  )
}

/* ── Notification row ───────────────────────────────────────────────────── */
function NotifRow({ n, onActivate }: { n: NotificationRow; onActivate: (n: NotificationRow) => void }) {
  const style = SEVERITY_STYLE[n.severity ?? "info"] ?? SEVERITY_STYLE.info
  const href = rowHref(n)
  const unread = !n.read_at
  const body = (
    <div
      className={cn(
        "flex items-start gap-3.5 px-4 py-3.5 transition-colors border-b border-slate-100 last:border-0 group",
        unread ? "bg-[#F5F9FF]" : "hover:bg-slate-50",
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ring-1", style.bg, style.ring)}>
        <span className={style.color}>{iconForKind(n.type)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-[13.5px] leading-snug truncate", unread ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>
            {n.title}
          </p>
          {unread && <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />}
          <span className="text-[11px] text-slate-400 shrink-0 ml-auto">{relativeTime(n.created_at)}</span>
        </div>
        {n.body && <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{n.body}</p>}
      </div>
      {href && (
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#2563EB] shrink-0 self-center transition-colors" />
      )}
    </div>
  )
  return href ? (
    <Link href={href} onClick={() => onActivate(n)} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 rounded-xl">
      {body}
    </Link>
  ) : (
    <button type="button" onClick={() => onActivate(n)} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 rounded-xl">
      {body}
    </button>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function NotificationsFeedPage() {
  const router = useRouter()
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()

  const [rows, setRows] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [marking, setMarking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [tab, setTab] = useState<Tab>("all")
  const [kind, setKind] = useState<string>("all")
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  const SELECT = "id, type:kind, title, body, severity, resource_type:entity_type, resource_id:entity_id, href, read_at, created_at"

  /* ── Initial load + realtime subscription ────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError("You must be signed in to view notifications."); setRows([]); return }

      const { data, error: qErr } = await supabase
        .from("notifications")
        .select(SELECT)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1)

      if (qErr) { setError(qErr.message); setRows([]); return }
      const list = (data as NotificationRow[]) ?? []
      setRows(list)
      setHasMore(list.length === PAGE_SIZE)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, workspace?.id])

  // Realtime: prepend new inserts for this user. Cleaned up on unmount / ws switch.
  useEffect(() => {
    let active = true
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const channel = supabase
        .channel(`notifications-feed:user:${user.id}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const raw = payload.new as Record<string, unknown>
            const newRow: NotificationRow = {
              id: String(raw.id),
              type: String(raw.kind ?? "info"),
              title: String(raw.title ?? ""),
              body: (raw.body as string | null) ?? null,
              severity: (raw.severity as string | null) ?? "info",
              resource_type: (raw.entity_type as string | null) ?? null,
              resource_id: (raw.entity_id as string | null) ?? null,
              href: (raw.href as string | null) ?? null,
              read_at: (raw.read_at as string | null) ?? null,
              created_at: String(raw.created_at ?? new Date().toISOString()),
            }
            setRows((prev) => (prev.some((r) => r.id === newRow.id) ? prev : [newRow, ...prev]))
          })
        .subscribe()
      channelRef.current = channel
    })()
    return () => {
      active = false
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [workspace?.id])

  /* ── Load more (pagination) ──────────────────────────────────────────── */
  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const from = rows.length
      const { data, error: qErr } = await supabase
        .from("notifications")
        .select(SELECT)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1)
      if (qErr) return
      const list = (data as NotificationRow[]) ?? []
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id))
        return [...prev, ...list.filter((r) => !seen.has(r.id))]
      })
      setHasMore(list.length === PAGE_SIZE)
    } finally {
      setLoadingMore(false)
    }
  }

  /* ── Mutations ───────────────────────────────────────────────────────── */
  async function markAllRead() {
    const now = new Date().toISOString()
    const prev = rows
    setMarking(true)
    setRows((r) => r.map((n) => (n.read_at ? n : { ...n, read_at: now }))) // optimistic
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("not signed in")
      const { error: uErr } = await supabase
        .from("notifications")
        .update({ read_at: now, read: true })
        .eq("user_id", user.id)
        .is("read_at", null)
      if (uErr) throw uErr
    } catch {
      setRows(prev) // rollback
    } finally {
      setMarking(false)
    }
  }

  async function activate(n: NotificationRow) {
    if (!n.read_at) {
      const now = new Date().toISOString()
      setRows((r) => r.map((x) => (x.id === n.id ? { ...x, read_at: now } : x))) // optimistic
      try {
        const supabase = createClient()
        await supabase.from("notifications").update({ read_at: now, read: true }).eq("id", n.id)
      } catch { /* non-fatal — UI already updated */ }
    }
    const href = rowHref(n)
    if (href) router.push(href)
  }

  /* ── Derived data ────────────────────────────────────────────────────── */
  const unreadCount = useMemo(() => rows.filter((n) => !n.read_at).length, [rows])

  const kindOptions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((n) => set.add((n.type ?? "info").split(".")[0]))
    return Array.from(set).sort()
  }, [rows])

  const filtered = useMemo(() => {
    let data = rows
    if (tab === "unread") data = data.filter((n) => !n.read_at)
    if (kind !== "all") data = data.filter((n) => (n.type ?? "info").split(".")[0] === kind)
    return data
  }, [rows, tab, kind])

  // Group filtered rows into ordered date buckets.
  const grouped = useMemo(() => {
    const order = ["Today", "Yesterday", "Earlier this week", "This month", "Older"]
    const map = new Map<string, NotificationRow[]>()
    filtered.forEach((n) => {
      const g = dateGroup(n.created_at)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(n)
    })
    return order.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }))
  }, [filtered])

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        primaryAction={{ label: "Refresh", icon: RefreshCw, onClick: () => void load() }}
        overflowActions={[
          { label: "Notification settings", icon: Settings, href: "/property-manager/account/notifications" },
          ...(unreadCount > 0 ? [{ label: "Mark all read", icon: CheckCheck, onClick: () => void markAllRead() }] : []),
        ]}
      />

      <div className="space-y-0">
        {/* Desktop header — hidden below lg; MobileTopBar (lg:hidden) owns 768–1023 + phones */}
        <div className="hidden lg:flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500">
              Every alert from across your workspace — tasks, compliance, payments, messages and AI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0 || marking}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Mark all read
            </button>
            <Link
              href="/property-manager/account/notifications"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <ActionMenu
              items={[
                { label: "Refresh", icon: RefreshCw, onClick: () => void load() },
                { label: "Notification settings", icon: Settings, onClick: () => router.push("/property-manager/account/notifications") },
              ]}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">Couldn&apos;t load notifications</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
              <button onClick={() => void load()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:underline">
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </button>
            </div>
          )}

          {/* KPIs */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 h-24 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <KpiCard label="Total notifications" value={rows.length} icon={<Bell className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
              <KpiCard label="Unread" value={unreadCount} alert={unreadCount > 0 ? "Needs attention" : undefined} icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
              <KpiCard label="Categories" value={kindOptions.length} icon={<Inbox className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" />
            </div>
          )}

          {/* Controls */}
          {!error && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
                {([["all", "All"], ["unread", "Unread"]] as [Tab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      tab === key ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {label}{key === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
                  </button>
                ))}
              </div>

              {kindOptions.length > 1 && (
                <div className="relative">
                  <select
                    aria-label="Filter by category"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    className="appearance-none h-9 pl-3 pr-8 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all cursor-pointer"
                  >
                    <option value="all">All categories</option>
                    {kindOptions.map((k) => (
                      <option key={k} value={k}>{kindLabel(k)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {/* List */}
          {!error && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {loading ? (
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3.5 px-4 py-3.5 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-base font-semibold text-slate-500">You&apos;re all caught up</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Alerts about tasks, compliance, payments and messages will appear here.
                  </p>
                  <Link href={sectionLink("/property-manager/messages")} className="mt-3 inline-flex text-sm text-[#2563EB] hover:underline">
                    Go to Messages →
                  </Link>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <BellOff className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No notifications match your filters</p>
                  <button onClick={() => { setTab("all"); setKind("all") }} className="mt-2 text-xs text-[#2563EB] hover:underline">Clear filters</button>
                </div>
              ) : (
                <div>
                  {grouped.map(({ group, items }) => (
                    <div key={group}>
                      <div className="sticky top-0 z-10 px-4 py-1.5 bg-slate-50/90 backdrop-blur-sm border-b border-slate-100">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{group}</p>
                      </div>
                      {items.map((n) => <NotifRow key={n.id} n={n} onActivate={activate} />)}
                    </div>
                  ))}

                  {hasMore && tab === "all" && kind === "all" && (
                    <div className="p-3 border-t border-slate-100 text-center">
                      <button
                        onClick={() => void loadMore()}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardContainer>
  )
}
