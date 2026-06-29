"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Building2,
  Plus,
  ChevronDown,
  ClipboardList,
  UserPlus,
  FileUp,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
} from "lucide-react"
import { openCopilot } from "@/lib/copilot/open"
import { HomeKpiRow } from "../components/HomeKpiRow"
import { HomePortfolioSnapshotCard } from "../components/HomePortfolioSnapshotCard"
import { HomeTenancySpotlightCard } from "../components/HomeTenancySpotlightCard"
import { HomeWorkQueueCard } from "../components/HomeWorkQueueCard"
import { HomeMoneySnapshotCard } from "../components/HomeMoneySnapshotCard"
import { HomeUpcomingCard } from "../components/HomeUpcomingCard"
import { HomeActionItemsCard } from "../components/HomeActionItemsCard"
import { HomeRecentActivityCard } from "../components/HomeRecentActivityCard"
import { HomeComplianceLegalCard } from "../components/HomeComplianceLegalCard"
import { HomePriorityPanel } from "../components/HomePriorityPanel"
import { createClient } from "@/lib/supabase/client"
import { isFeatureEnabled } from "@/lib/flags"
import { resolveCoverUrls } from "@/lib/files/coverUrl"
import { formatCurrency } from "@/lib/utils"
import { normalisePropertyType, normaliseOperationProfile, normalisePropertyStatus } from "@/lib/portfolio/helpers"
import { useWorkspace } from "@/providers/AuthProvider"
import type {
  HomeKpi,
  HomeProperty,
  HomeTenant,
  HomeWorkItem,
  HomeMoneyData,
  HomeEvent,
  HomeAiPriority,
  HomeActivity,
  HomeComplianceItem,
  HomePriorityItem,
} from "../types"

/* ------------------------------------------------------------------ */
/* Empty / zero fallbacks (brand-new workspace ONLY — never fabricated) */
/* ------------------------------------------------------------------ */

const EMPTY_KPI: HomeKpi = {
  properties: 0,
  propertiesTrend: 0,
  units: 0,
  unitsTrend: 0,
  activeTenancies: 0,
  tenanciesTrend: 0,
  occupancyPct: 0,
  occupancyTrend: 0,
  rentCollected: 0,
  rentTrend: 0,
  openWork: 0,
  complianceDue: 0,
  arrears: 0,
  workTrend: 0,
}

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

function isMissingTable(err: { code?: string } | null): boolean {
  return err?.code === "42P01"
}

function relativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  } catch {
    return dateStr
  }
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                      */
/* ------------------------------------------------------------------ */
function DashboardSkeleton() {
  return (
    <div className="py-4 flex flex-col gap-5">
      <div className="h-20 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-8 h-64 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
        <div className="col-span-12 md:col-span-4 h-64 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-span-12 md:col-span-3 h-52 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6 h-52 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
        <div className="col-span-12 md:col-span-6 h-52 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Quick actions dropdown                                                */
/* ------------------------------------------------------------------ */
function QuickActionsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const actions = [
    { label: "Add Property", icon: Building2, href: "/property-manager/portfolio/properties/new" },
    { label: "Create Task", icon: ClipboardList, href: "/property-manager/work/tasks/new" },
    { label: "Log Job", icon: Wrench, href: "/property-manager/work/jobs/new" },
    { label: "Add Contact", icon: UserPlus, href: "/property-manager/contacts/new" },
    { label: "Upload Document", icon: FileUp, href: "/property-manager/compliance/documents/new" },
    { label: "Create Invoice", icon: Receipt, href: "/property-manager/money/invoices/new" },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#16304f] text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
      >
        <Plus style={{ width: 15, height: 15 }} />
        Quick action
        <ChevronDown style={{ width: 13, height: 13 }} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1.5 min-w-[200px] z-50">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <Icon className="text-slate-500" style={{ width: 15, height: 15 }} />
                <span className="text-[13px] text-slate-700">{action.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Command Header                                                         */
/* ------------------------------------------------------------------ */
function CommandHeader({
  workspaceName,
  onAskAI,
  logoUrl,
  brandColor,
}: {
  workspaceName: string
  onAskAI?: () => void
  logoUrl?: string | null
  brandColor?: string | null
}) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const initials = workspaceName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "WS"

  const bgColor = brandColor ?? "#1E3A5F"

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: bgColor }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={`${workspaceName} logo`} className="w-full h-full object-contain" />
          ) : (
            <span className="text-white text-[13px] font-bold leading-none">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-bold text-slate-900 truncate">{workspaceName || "Your Workspace"}</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 flex-shrink-0">
              <CheckCircle2 style={{ width: 9, height: 9 }} />
              Operating
            </span>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {greeting} — {dateStr}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        {onAskAI && (
          <button
            onClick={onAskAI}
            className="hidden sm:flex items-center gap-1.5 border border-violet-200 bg-violet-50 text-violet-700 text-[12.5px] font-semibold px-3 py-2 rounded-xl hover:bg-violet-100 transition-colors"
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            Ask AI
          </button>
        )}
        <QuickActionsMenu />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                   */
/* ------------------------------------------------------------------ */
export function HomeDashboardPage() {
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(true)

  const [kpi, setKpi] = useState<HomeKpi>(EMPTY_KPI)
  const [properties, setProperties] = useState<HomeProperty[]>([])
  const [tenants, setTenants] = useState<HomeTenant[]>([])
  const [workItems, setWorkItems] = useState<HomeWorkItem[]>([])
  const [money, setMoney] = useState<HomeMoneyData>({ income: 0, expenses: 0, netCashflow: 0 })
  const [events, setEvents] = useState<HomeEvent[]>([])
  const [activities, setActivities] = useState<HomeActivity[]>([])
  const [complianceItems, setComplianceItems] = useState<HomeComplianceItem[]>([])
  const [priorityItems, setPriorityItems] = useState<HomePriorityItem[]>([])
  const [smartPriorities, setSmartPriorities] = useState<HomeAiPriority[]>([])
  const [legalEnabled, setLegalEnabled] = useState(true)
  const [stripeConnected, setStripeConnected] = useState(false)
  const [errored, setErrored] = useState(false)
  const [showAiPreflight, setShowAiPreflight] = useState(false)
  const [workspaceBranding, setWorkspaceBranding] = useState<{ logoUrl: string | null; brandColor: string | null }>({ logoUrl: null, brandColor: null })

  useEffect(() => {
    if (!workspace?.id) {
      setLoading(false)
      return
    }

    async function loadDashboard() {
      const supabase = createClient()
      const wid = workspace!.id
      const today = new Date().toISOString()
      const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

      // Resolve feature flag + branding in parallel
      const [legalFlagResult, brandingRow] = await Promise.all([
        isFeatureEnabled("legalSection", { supabase, workspaceId: wid }),
        supabase.from("workspaces").select("logo_url, brand_color").eq("id", wid).maybeSingle().then(r => r.data),
      ])
      setLegalEnabled(legalFlagResult)
      if (brandingRow) {
        const rawKey = (brandingRow as { logo_url?: string | null }).logo_url ?? null
        const logoUrl = rawKey
          ? (rawKey.startsWith("http") || rawKey.startsWith("/api/") ? rawKey : `/api/files/${rawKey}`)
          : null
        setWorkspaceBranding({
          logoUrl,
          brandColor: (brandingRow as { brand_color?: string | null }).brand_color ?? null,
        })
      }

      const results = await Promise.allSettled([
        // 0: properties  (alias live cols → app names the UI expects)
        supabase
          .from("properties")
          .select("id, name:nickname, address_line1, city, postcode, status, template, category, target_rent:target_rent_pcm, bedrooms, cover_file_id, cover_image_url, updated_at")
          .eq("workspace_id", wid),

        // 1: units  (canonical units table — the one tenancies/bills/bookings FK to)
        supabase
          .from("units")
          .select("id, status, property_id, rent_amount")
          .eq("workspace_id", wid),

        // 2: tenancies  (primary_contact_id → contact_id)
        supabase
          .from("tenancies")
          .select("id, status, rent_amount, end_date, contact_id:primary_contact_id, property_id, updated_at")
          .eq("workspace_id", wid),

        // 3: tasks (open)  (due_at → due_date)
        supabase
          .from("tasks")
          .select("id, title, status, priority, due_date:due_at, property_id, updated_at")
          .eq("workspace_id", wid)
          .not("status", "in", "(done,cancelled)")
          .order("due_at", { ascending: true })
          .limit(8),

        // 4: jobs (open) — count via exact + rows for activity/preview
        supabase
          .from("jobs")
          .select("id, title, status, updated_at", { count: "exact" })
          .eq("workspace_id", wid)
          .not("status", "in", "(complete,cancelled)")
          .order("updated_at", { ascending: false })
          .limit(8),

        // 5: contacts (for tenant names)  (display_name → full_name)
        supabase
          .from("contacts")
          .select("id, full_name:display_name")
          .eq("workspace_id", wid),

        // 6: calendar events
        supabase
          .from("calendar_events")
          .select("id, title, start_at, event_type")
          .eq("workspace_id", wid)
          .gte("start_at", today)
          .order("start_at", { ascending: true })
          .limit(5),

        // 7: activity log  (live table is activity_logs)
        supabase
          .from("activity_logs")
          .select("id, action, entity_type:resource_type, entity_id:resource_id, description, created_at")
          .eq("workspace_id", wid)
          .order("created_at", { ascending: false })
          .limit(8),

        // 8: compliance items
        supabase
          .from("compliance_items")
          .select("id, title, type:kind, due_date, status")
          .eq("workspace_id", wid)
          .lte("due_date", in60days)
          .order("due_date", { ascending: true })
          .limit(4),

        // 9: invoices (outstanding)
        supabase
          .from("invoices")
          .select("id, total_amount:total, status, due_date")
          .eq("workspace_id", wid)
          .eq("status", "unpaid"),

        // 10: stripe_accounts (connected payment collection)
        supabase
          .from("stripe_accounts")
          .select("id, charges_enabled")
          .eq("workspace_id", wid)
          .limit(1),
      ])

      // ---- Properties ----
      const propsResult = results[0]
      const props =
        propsResult.status === "fulfilled" && !isMissingTable(propsResult.value.error)
          ? (propsResult.value.data ?? [])
          : []

      // ---- Units ----
      const unitsResult = results[1]
      const units =
        unitsResult.status === "fulfilled" && !isMissingTable(unitsResult.value.error)
          ? (unitsResult.value.data ?? [])
          : []

      // ---- Tenancies ----
      const tenanciesResult = results[2]
      const tenancies =
        tenanciesResult.status === "fulfilled" && !isMissingTable(tenanciesResult.value.error)
          ? (tenanciesResult.value.data ?? [])
          : null

      // ---- Tasks ----
      const tasksResult = results[3]
      const tasks =
        tasksResult.status === "fulfilled" && !isMissingTable(tasksResult.value.error)
          ? (tasksResult.value.data ?? [])
          : null

      // ---- Jobs (open) ----
      const jobsResult = results[4]
      const jobsOk = jobsResult.status === "fulfilled" && !isMissingTable(jobsResult.value.error)
      const openJobsCount = jobsOk ? (jobsResult.value.count ?? jobsResult.value.data?.length ?? 0) : 0
      const jobsRows = (jobsOk ? (jobsResult.value.data ?? []) : []) as {
        id: string
        title?: string | null
        updated_at?: string | null
      }[]

      // ---- Contacts ----
      const contactsResult = results[5]
      const contacts =
        contactsResult.status === "fulfilled" && !isMissingTable(contactsResult.value.error)
          ? (contactsResult.value.data ?? [])
          : []

      // ---- Calendar events ----
      const eventsResult = results[6]
      const calEvents =
        eventsResult.status === "fulfilled" && !isMissingTable(eventsResult.value.error)
          ? (eventsResult.value.data ?? [])
          : null

      // ---- Activity log ----
      const activityResult = results[7]
      const activityLog =
        activityResult.status === "fulfilled" && !isMissingTable(activityResult.value.error)
          ? (activityResult.value.data ?? [])
          : null

      // ---- Compliance items ----
      const complianceResult = results[8]
      const complianceData =
        complianceResult.status === "fulfilled" && !isMissingTable(complianceResult.value.error)
          ? (complianceResult.value.data ?? [])
          : null

      // ---- Invoices ----
      const invoicesResult = results[9]
      const invoices =
        invoicesResult.status === "fulfilled" && !isMissingTable(invoicesResult.value.error)
          ? (invoicesResult.value.data ?? [])
          : []

      const stripeResult = results[10]
      const stripeRows =
        stripeResult?.status === "fulfilled" && !isMissingTable((stripeResult.value as { error: { code?: string } | null }).error)
          ? ((stripeResult.value as { data: { charges_enabled?: boolean }[] | null }).data ?? [])
          : []
      setStripeConnected(stripeRows.length > 0 && Boolean(stripeRows[0].charges_enabled))

      /* --- Compute KPIs --- */
      const activeProps = props.filter((p) => p.status !== "archived")
      const occupiedUnits = units.filter((u: { status: string }) => u.status === "occupied").length
      const totalUnits = units.length
      const activeTenanciesList = tenancies ? tenancies.filter((t: { status: string }) => t.status === "active") : []
      const occupancyPct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
      const rentRoll = activeTenanciesList.reduce((s: number, t: { rent_amount?: number }) => s + (t.rent_amount ?? 0), 0)
      const openTaskCount = tasks ? tasks.length : 0
      const complianceDueCount =
        complianceData !== null
          ? complianceData.filter((c: { status?: string }) => c.status === "overdue" || c.status === "due-soon").length
          : 0

      // KPIs are always live (zeros for a brand-new workspace).
      setKpi({
        properties: activeProps.length,
        propertiesTrend: 0,
        units: totalUnits,
        unitsTrend: 0,
        activeTenancies: activeTenanciesList.length,
        tenanciesTrend: 0,
        occupancyPct,
        occupancyTrend: 0,
        rentCollected: rentRoll,
        rentTrend: 0,
        openWork: openTaskCount + openJobsCount,
        complianceDue: complianceDueCount,
        arrears: 0,
        workTrend: 0,
      })

      // Capture today's snapshot for future trend calculation (idempotent upsert).
      const todayStr = new Date().toISOString().split("T")[0]
      void supabase.from("kpi_snapshots").upsert([
        { workspace_id: wid, snapshot_date: todayStr, metric_name: "properties_count",  value: activeProps.length },
        { workspace_id: wid, snapshot_date: todayStr, metric_name: "units_count",        value: totalUnits },
        { workspace_id: wid, snapshot_date: todayStr, metric_name: "tenancies_count",    value: activeTenanciesList.length },
        { workspace_id: wid, snapshot_date: todayStr, metric_name: "occupancy_pct",      value: occupancyPct },
        { workspace_id: wid, snapshot_date: todayStr, metric_name: "rent_pcm_total",     value: rentRoll },
        { workspace_id: wid, snapshot_date: todayStr, metric_name: "open_tasks_count",   value: openTaskCount + openJobsCount },
      ], { onConflict: "workspace_id,snapshot_date,metric_name" })

      // Query historical snapshot ~30 days ago for trend deltas.
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      void supabase
        .from("kpi_snapshots")
        .select("metric_name, value, snapshot_date")
        .eq("workspace_id", wid)
        .gte("snapshot_date", thirtyDaysAgo)
        .lt("snapshot_date", todayStr)
        .order("snapshot_date", { ascending: false })
        .then(({ data: snaps }) => {
          if (!snaps?.length) return
          const byMetric: Record<string, number> = {}
          for (const s of snaps) {
            if (!(s.metric_name in byMetric)) byMetric[s.metric_name] = Number(s.value)
          }
          setKpi((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              propertiesTrend: byMetric.properties_count !== undefined ? activeProps.length - byMetric.properties_count : 0,
              unitsTrend: byMetric.units_count !== undefined ? totalUnits - byMetric.units_count : 0,
              tenanciesTrend: byMetric.tenancies_count !== undefined ? activeTenanciesList.length - byMetric.tenancies_count : 0,
              occupancyTrend: byMetric.occupancy_pct !== undefined ? occupancyPct - byMetric.occupancy_pct : 0,
              rentTrend: byMetric.rent_pcm_total !== undefined && byMetric.rent_pcm_total > 0
                ? Math.round(((rentRoll - byMetric.rent_pcm_total) / byMetric.rent_pcm_total) * 100)
                : 0,
              workTrend: byMetric.open_tasks_count !== undefined ? openTaskCount + openJobsCount - byMetric.open_tasks_count : 0,
            }
          })
        }, () => {})

      /* --- Portfolio snapshot ---
         Map live rows onto the canonical PropertyCard shape so the home cards
         match the Portfolio › Properties page exactly. */
      if (activeProps.length > 0) {
        const gradients = [
          "from-[var(--color-brand-100)] to-[var(--color-brand-400)]",
          "from-indigo-200 to-indigo-400",
          "from-slate-300 to-slate-500",
          "from-emerald-200 to-emerald-400",
          "from-violet-200 to-violet-400",
        ]
        // Live `properties.status` enum is active|void|off_market|archived;
        // normalisePropertyStatus expects active|vacant|under_works|archived.
        const STATUS_FROM_DB: Record<string, string> = {
          active: "active", void: "vacant", off_market: "under_works", archived: "archived",
        }
        const snapSource = activeProps.slice(0, 4) as Array<{
          id: string; name: string; address_line1?: string | null; city?: string | null; postcode?: string | null
          status?: string | null; template?: string | null; category?: string | null
          target_rent?: number | null; bedrooms?: number | null
          cover_file_id?: string | null; cover_image_url?: string | null
        }>
        // Resolve real uploaded covers (cover_file_id → /api/files URL).
        // Fails soft to an empty Map → gradient fallback in the card.
        const coverMap = await resolveCoverUrls(supabase, snapSource.map((p) => p.cover_file_id))
        const snapProperties: HomeProperty[] = snapSource.map((p, i) => {
          const propUnits = units.filter((u: { property_id: string }) => u.property_id === p.id)
          const propOccupied = propUnits.filter((u: { status: string }) => u.status === "occupied").length
          const propTenants = (tenancies ?? []).filter(
            (t: { property_id?: string; status?: string }) => t.property_id === p.id && t.status === "active"
          ).length
          const unitRent = propUnits.reduce((s: number, u: { rent_amount?: number | null }) => s + (u.rent_amount ?? 0), 0)
          return {
            id: p.id,
            name: p.name,
            city: p.city ?? "",
            address: [p.address_line1, p.city].filter(Boolean).join(", "),
            postcode: p.postcode ?? "",
            type: normalisePropertyType(p.template) as HomeProperty["type"],
            status: normalisePropertyStatus(STATUS_FROM_DB[String(p.status ?? "active")] ?? "active") as HomeProperty["status"],
            operationProfile: normaliseOperationProfile(p.template),
            category: p.category ?? null,
            bedrooms: p.bedrooms ?? undefined,
            monthlyRent: unitRent > 0 ? unitRent : (p.target_rent ?? 0),
            units: propUnits.length,
            occupied: propOccupied,
            tenants: propTenants,
            risk: "Med" as const,
            occupancyPct: propUnits.length > 0 ? Math.round((propOccupied / propUnits.length) * 100) : 0,
            gradient: gradients[i % gradients.length],
            coverImageUrl: (p.cover_file_id ? coverMap.get(p.cover_file_id) : undefined) ?? p.cover_image_url ?? undefined,
            href: `/property-manager/portfolio/properties/${p.id}`,
          }
        })
        setProperties(snapProperties)
      } else {
        setProperties([])
      }

      const propNameMap: Record<string, string> = {}
      props.forEach((p: { id: string; name: string }) => {
        propNameMap[p.id] = p.name
      })

      /* --- Tenants --- */
      if (tenancies !== null && activeTenanciesList.length > 0) {
        const contactMap: Record<string, string> = {}
        contacts.forEach((c: { id: string; full_name: string }) => {
          contactMap[c.id] = c.full_name
        })
        const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"]
        const tenantList: HomeTenant[] = activeTenanciesList.slice(0, 3).map(
          (t: { id: string; contact_id?: string; rent_amount?: number; end_date?: string; property_id?: string }, idx: number) => {
            const name = t.contact_id ? (contactMap[t.contact_id] ?? "Tenant") : "Tenant"
            const initials = name
              .split(" ")
              .slice(0, 2)
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
            return {
              id: t.id,
              name,
              initials,
              avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
              property: t.property_id ? (propNameMap[t.property_id] ?? "") : "",
              unit: "",
              rent: t.rent_amount ?? 0,
              endDate: t.end_date ?? "",
              depositStatus: "Protected" as const,
              actionText: "Active",
              href: `/property-manager/portfolio/tenancies/${t.id}`,
            }
          }
        )
        setTenants(tenantList)
      } else {
        setTenants([])
      }

      /* --- Work items --- */
      if (tasks !== null && tasks.length > 0) {
        const priorityMap: Record<string, HomeWorkItem["dueVariant"]> = {
          critical: "red",
          high: "red",
          medium: "amber",
          low: "slate",
          normal: "blue",
        }
        const workList: HomeWorkItem[] = tasks.slice(0, 5).map((j: { id: string; title?: string; priority?: string; property_id?: string; due_date?: string }) => {
          const isOverdue = j.due_date ? new Date(j.due_date).getTime() < Date.now() : false
          const isUrgent = j.priority === "critical" || j.priority === "high"
          const dueLabel = isOverdue ? "Overdue" : isUrgent ? "Urgent" : j.priority === "medium" ? "Medium" : "Open"
          const dueVariant: HomeWorkItem["dueVariant"] = isOverdue || isUrgent ? "red" : j.priority === "medium" ? "amber" : priorityMap[j.priority ?? "normal"] ?? "slate"
          return {
            id: j.id,
            title: j.title ?? "Work order",
            property: j.property_id ? (propNameMap[j.property_id] ?? "") : "",
            unit: "",
            dueLabel,
            dueVariant,
            iconColor: dueVariant,
            href: `/property-manager/work/tasks/${j.id}`,
          }
        })
        setWorkItems(workList)
      } else {
        setWorkItems([])
      }

      /* --- Money --- */
      const outstandingInvoicesTotal = invoices.reduce(
        (s: number, inv: { total_amount?: number }) => s + (inv.total_amount ?? 0),
        0
      )
      setMoney({
        income: rentRoll,
        expenses: outstandingInvoicesTotal,
        netCashflow: rentRoll - outstandingInvoicesTotal,
      })

      /* --- Calendar events --- */
      if (calEvents !== null) {
        if (calEvents.length > 0) {
          const mapped: HomeEvent[] = calEvents.map((ev: { id: string; title: string; start_at: string; event_type?: string }) => {
            const d = new Date(ev.start_at)
            return {
              id: ev.id,
              day: d.getDate(),
              month: d.toLocaleDateString("en-GB", { month: "short" }),
              title: ev.title,
              subtitle: ev.event_type ?? "",
              timeOrAmount: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              eventType: ev.event_type,
              href: `/property-manager/calendar/events/${ev.id}`,
            }
          })
          setEvents(mapped)
        } else {
          setEvents([])
        }
      }

      /* --- Activity feed ---
         Prefer a real audit table; if it is missing (42P01) or empty, derive a
         feed from the most-recently-updated rows across live entities. */
      const ENTITY_HREF: Partial<Record<string, (id: string) => string>> = {
        task: (id) => `/property-manager/work/tasks/${id}`,
        job: (id) => `/property-manager/work/jobs/${id}`,
        property: (id) => `/property-manager/portfolio/properties/${id}`,
        tenancy: (id) => `/property-manager/portfolio/tenancies/${id}`,
      }

      if (activityLog !== null && activityLog.length > 0) {
        const mapped: HomeActivity[] = activityLog.map(
          (a: { id: string; action?: string; entity_type?: string; entity_id?: string; description?: string; created_at: string }) => {
            const type = a.entity_type ?? "default"
            const hrefFn = ENTITY_HREF[type]
            return {
              id: a.id,
              iconType: type,
              actionText: a.description ?? a.action ?? "Activity",
              entityName: type === "default" ? "" : type,
              timeAgo: relativeTime(a.created_at),
              href: hrefFn && a.entity_id ? hrefFn(a.entity_id) : undefined,
            }
          }
        )
        setActivities(mapped)
      } else {
        // Derive from recently-updated live rows.
        type Derived = { id: string; type: string; label: string; ts: string; href?: string }
        const derived: Derived[] = []
        ;(tasks ?? []).forEach((t: { id: string; title?: string; updated_at?: string }) => {
          if (t.updated_at) derived.push({ id: `task-${t.id}`, type: "task", label: `Task updated — ${t.title ?? "Untitled"}`, ts: t.updated_at, href: `/property-manager/work/tasks/${t.id}` })
        })
        jobsRows.forEach((j) => {
          if (j.updated_at) derived.push({ id: `job-${j.id}`, type: "job", label: `Job updated — ${j.title ?? "Untitled"}`, ts: j.updated_at, href: `/property-manager/work/jobs/${j.id}` })
        })
        ;(tenancies ?? []).forEach((t: { id: string; updated_at?: string; property_id?: string }) => {
          if (t.updated_at) derived.push({ id: `ten-${t.id}`, type: "tenancy", label: `Tenancy updated${t.property_id && propNameMap[t.property_id] ? ` — ${propNameMap[t.property_id]}` : ""}`, ts: t.updated_at, href: `/property-manager/portfolio/tenancies/${t.id}` })
        })
        props.forEach((p: { id: string; name: string; updated_at?: string }) => {
          if (p.updated_at) derived.push({ id: `prop-${p.id}`, type: "property", label: `Property updated — ${p.name}`, ts: p.updated_at, href: `/property-manager/portfolio/properties/${p.id}` })
        })
        derived.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        const mapped: HomeActivity[] = derived.slice(0, 6).map((d) => ({
          id: d.id,
          iconType: d.type,
          actionText: d.label,
          entityName: d.type,
          timeAgo: relativeTime(d.ts),
          href: d.href,
        }))
        setActivities(mapped)
      }

      /* --- Compliance items --- */
      if (complianceData !== null) {
        if (complianceData.length > 0) {
          const mapped: HomeComplianceItem[] = complianceData.map(
            (c: { id: string; title?: string; type?: string; due_date?: string; status?: string }) => {
              let status: HomeComplianceItem["status"] = "ok"
              const dueDate = c.due_date ? new Date(c.due_date) : null
              if (dueDate) {
                const diff = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                if (diff < 0) status = "overdue"
                else if (diff <= 30) status = "due-soon"
                else status = "ok"
              }
              const typeStr = c.type ?? "compliance"
              return {
                id: c.id,
                title: c.title ?? "Compliance item",
                type: (typeStr === "legal" ? "legal" : "compliance") as HomeComplianceItem["type"],
                dueDate: c.due_date ?? "",
                status,
                section: (typeStr === "legal" ? "legal" : "compliance") as HomeComplianceItem["section"],
              }
            }
          )
          setComplianceItems(mapped)
        } else {
          setComplianceItems([])
        }
      } else {
        setComplianceItems([])
      }

      /* --- Priority items: tasks (due/overdue) + compliance deadlines --- */
      const urgentItems: HomePriorityItem[] = []
      if (tasks !== null) {
        for (const t of tasks) {
          const dueDate = t.due_date ? new Date(t.due_date) : null
          const daysUntilDue = dueDate
            ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null
          let urgency: HomePriorityItem["urgency"] = "blue"
          let dueLabel = "Open"
          if (t.priority === "critical" || t.priority === "high" || (daysUntilDue !== null && daysUntilDue < 0)) {
            urgency = "red"
            dueLabel = daysUntilDue !== null && daysUntilDue < 0 ? "Overdue" : "Urgent"
          } else if (t.priority === "medium" || (daysUntilDue !== null && daysUntilDue <= 7)) {
            urgency = "amber"
            dueLabel = daysUntilDue !== null && daysUntilDue <= 7 ? `Due in ${daysUntilDue}d` : "Due soon"
          }
          urgentItems.push({
            id: `task-${t.id}`,
            title: t.title ?? "Task",
            subtitle: dueDate ? `Due ${dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "Open task",
            dueLabel,
            urgency,
            href: `/property-manager/work/tasks/${t.id}`,
          })
        }
      }
      // Add compliance deadlines (overdue / due-soon) as priority items.
      if (complianceData !== null) {
        for (const c of complianceData as { id: string; title?: string; due_date?: string }[]) {
          const dd = c.due_date ? new Date(c.due_date) : null
          const days = dd ? Math.ceil((dd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
          if (days === null || days > 30) continue
          urgentItems.push({
            id: `comp-${c.id}`,
            title: c.title ?? "Compliance item",
            subtitle: days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `Due in ${days}d`,
            dueLabel: days < 0 ? "Overdue" : "Due soon",
            urgency: days < 0 ? "red" : "amber",
            href: "/property-manager/compliance",
          })
        }
      }
      // Sort red first, then amber, then blue; cap at 8.
      const rank = { red: 0, amber: 1, blue: 2 } as const
      urgentItems.sort((a, b) => rank[a.urgency] - rank[b.urgency])
      setPriorityItems(urgentItems.slice(0, 8))

      /* --- Smart priorities (live-derived summary insights) --- */
      const sp: HomeAiPriority[] = []
      let n = 1
      const overdueTasks = (tasks ?? []).filter((t: { due_date?: string }) => {
        if (!t.due_date) return false
        return new Date(t.due_date).getTime() < Date.now()
      }).length
      if (outstandingInvoicesTotal > 0) {
        sp.push({
          id: "sp-invoices",
          num: n++,
          title: `${invoices.length} outstanding invoice${invoices.length !== 1 ? "s" : ""}`,
          subtitle: `${formatCurrency(outstandingInvoicesTotal)} to collect`,
          action: "Chase",
          href: "/property-manager/money/invoices",
        })
      }
      if (complianceDueCount > 0) {
        sp.push({
          id: "sp-compliance",
          num: n++,
          title: `${complianceDueCount} compliance deadline${complianceDueCount !== 1 ? "s" : ""}`,
          subtitle: "Due soon or overdue",
          action: "Review",
          href: "/property-manager/compliance",
        })
      }
      if (overdueTasks > 0) {
        sp.push({
          id: "sp-tasks",
          num: n++,
          title: `${overdueTasks} overdue task${overdueTasks !== 1 ? "s" : ""}`,
          subtitle: "Past their due date",
          action: "Resolve",
          href: "/property-manager/work/tasks",
        })
      }
      if (openJobsCount > 0) {
        sp.push({
          id: "sp-jobs",
          num: n++,
          title: `${openJobsCount} open job${openJobsCount !== 1 ? "s" : ""}`,
          subtitle: "Awaiting completion",
          action: "Open",
          href: "/property-manager/work/jobs",
        })
      }
      setSmartPriorities(sp.slice(0, 4))
    }

    loadDashboard()
      .catch(() => setErrored(true))
      .finally(() => setLoading(false))
  }, [workspace?.id])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="py-4 flex flex-col gap-5 min-h-0">
      {/* 1. Command Header */}
      <CommandHeader
        workspaceName={workspace?.name ?? "Your Workspace"}
        onAskAI={() => setShowAiPreflight(true)}
        logoUrl={workspaceBranding.logoUrl}
        brandColor={workspaceBranding.brandColor}
      />

      {/* Ask AI pre-flight modal */}
      {showAiPreflight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowAiPreflight(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-violet-600" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Ask Propvora AI</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Dashboard AI assistant</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-[13px] font-medium text-slate-700">What the AI will do</p>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Open a chat session with context about your current portfolio — {kpi.properties} {kpi.properties === 1 ? "property" : "properties"}, {kpi.activeTenancies} active {kpi.activeTenancies === 1 ? "tenancy" : "tenancies"}, {kpi.openWork} open work items and {kpi.complianceDue} compliance items.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" style={{ width: 14, height: 14 }} />
              <p className="text-[12px] text-amber-800 leading-relaxed">
                AI chat uses credits from your monthly allowance. Each message costs approximately 1–3 AI credits depending on length.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowAiPreflight(false)}
                className="flex-1 py-2.5 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAiPreflight(false)
                  openCopilot({
                    prompt: "Summarise my property management dashboard for today — portfolio, rent, open work and compliance.",
                    summaryData: {
                      section: "dashboard",
                      pageTitle: "Home Dashboard",
                      summaryData: {
                        propertyCount: kpi.properties,
                        unitCount: kpi.units,
                        activeTenancies: kpi.activeTenancies,
                        occupancyPct: kpi.occupancyPct,
                        rentCollectedThisMonth: kpi.rentCollected,
                        openWorkItems: kpi.openWork,
                        complianceDue: kpi.complianceDue,
                        rentArrears: kpi.arrears,
                      },
                    },
                  })
                }}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles style={{ width: 13, height: 13 }} />
                Start AI chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft error banner — page still renders with whatever loaded */}
      {errored && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <AlertTriangle className="text-amber-500 flex-shrink-0" style={{ width: 16, height: 16 }} />
          <p className="text-[12px] text-amber-800">
            Some dashboard data could not be loaded. Showing everything that is available.
          </p>
        </div>
      )}

      {/* 2. KPI Row — 7 cards */}
      <HomeKpiRow data={kpi} />

      {/* 3. Priority Panel */}
      <HomePriorityPanel items={priorityItems} />

      {/* 3b. Portfolio Snapshot — canonical property cards, full width */}
      <HomePortfolioSnapshotCard properties={properties} />

      {/* 4. Work Queue + Money + Upcoming + Compliance/Legal */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-3">
          <HomeWorkQueueCard items={workItems} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <HomeMoneySnapshotCard data={money} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <HomeUpcomingCard events={events} />
        </div>
        <div className="col-span-12 md:col-span-3">
          <HomeComplianceLegalCard items={complianceItems} legalEnabled={legalEnabled} />
        </div>
      </div>

      {/* 5. Tenant Spotlight + Recent Activity */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <HomeTenancySpotlightCard tenants={tenants} />
        </div>
        <div className="col-span-12 md:col-span-6">
          <HomeRecentActivityCard activities={activities} />
        </div>
      </div>

      {/* 6. Action Items + Getting Started */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <HomeActionItemsCard priorities={smartPriorities} />
        </div>
        <div className="col-span-12 md:col-span-6 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900">Getting started</h3>
            <p className="text-[12px] text-slate-500 mt-1">Complete these steps to get the most out of Propvora.</p>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            {[
              { label: "Add your first property", href: "/property-manager/portfolio/properties/new", done: kpi.properties > 0 },
              { label: "Add a tenant or tenancy", href: "/property-manager/portfolio/tenancies/new", done: kpi.activeTenancies > 0 },
              { label: "Configure compliance items", href: "/property-manager/compliance/certificates/new", done: kpi.complianceDue > 0 },
              { label: "Connect payment collection", href: "/property-manager/settings/payments-stripe", done: stripeConnected },
            ].map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors ${
                  step.done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-[var(--color-brand-100)] hover:bg-[var(--brand-soft)]"
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                  {step.done && (
                    <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={`text-[12px] font-medium ${step.done ? "line-through text-emerald-600" : "text-slate-700"}`}>
                  {step.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
