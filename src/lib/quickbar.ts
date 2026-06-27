import {
  Home,
  Users,
  CheckSquare,
  Wrench,
  Truck,
  UserCircle,
  Receipt,
  FolderOpen,
  Building,
  FileText,
  TrendingUp,
  GitBranch,
  Handshake,
  ArrowRightLeft,
  Activity,
  BarChart2,
  CalendarDays,
  ShieldCheck,
  Layers,
  MessageCircle,
  Building2,
  Wallet,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react"

import type { V2FlagKey } from "@/lib/flags/registry"

export interface QuickBarWidget {
  key: string
  label: string
  href: string
  icon: LucideIcon
  colour: string
  bg: string
  group: string
  defaultVisible: boolean
  /** When set, the widget is only selectable/rendered if this feature flag is ON. */
  flag?: V2FlagKey
}

/** Distinct flags any quick widget depends on — resolved once by consumers. */
export const QUICKBAR_GATED_FLAGS: V2FlagKey[] = [
  "planningEnabled",
  "canvasLite",
  "legalSection",
  "marketplaceEnabled",
]

/** Filter widgets to those whose flag (if any) is enabled in the given map. */
export function gateWidgets(
  widgets: QuickBarWidget[],
  flags: Partial<Record<V2FlagKey, boolean>>,
): QuickBarWidget[] {
  return widgets.filter((w) => !w.flag || flags[w.flag] === true)
}

const MANAGER_BASE = "/property-manager"

export const ALL_QUICK_WIDGETS: QuickBarWidget[] = [
  // Portfolio
  { key: "properties",     label: "Properties",    href: `${MANAGER_BASE}/portfolio/properties`,      icon: Home,           colour: "#2563EB", bg: "#EFF6FF", group: "Portfolio",  defaultVisible: true  },
  { key: "tenancies",      label: "Tenancies",     href: `${MANAGER_BASE}/portfolio/tenancies`,       icon: Users,          colour: "#7C3AED", bg: "#F5F3FF", group: "Portfolio",  defaultVisible: true  },
  { key: "units",          label: "Units",         href: `${MANAGER_BASE}/portfolio/units`,           icon: Building,       colour: "#0891B2", bg: "#ECFEFF", group: "Portfolio",  defaultVisible: false },
  // Work
  { key: "tasks",          label: "Tasks",         href: `${MANAGER_BASE}/work/tasks`,                icon: CheckSquare,    colour: "#059669", bg: "#ECFDF5", group: "Work",       defaultVisible: true  },
  { key: "jobs",           label: "Jobs",          href: `${MANAGER_BASE}/work/jobs`,                 icon: Wrench,         colour: "#D97706", bg: "#FFFBEB", group: "Work",       defaultVisible: true  },
  { key: "work-board",     label: "Work Board",    href: `${MANAGER_BASE}/work/board`,                icon: LayoutDashboard,colour: "#6366F1", bg: "#EEF2FF", group: "Work",       defaultVisible: false },
  { key: "gantt",          label: "Gantt",         href: `${MANAGER_BASE}/work/gantt`,                icon: BarChart2,      colour: "#F59E0B", bg: "#FFFBEB", group: "Work",       defaultVisible: false },
  // Contacts
  { key: "suppliers",      label: "Suppliers",     href: `${MANAGER_BASE}/work/suppliers`,            icon: Truck,          colour: "#0E7490", bg: "#ECFEFF", group: "Contacts",   defaultVisible: true  },
  { key: "people",         label: "People",        href: `${MANAGER_BASE}/contacts/people`,           icon: UserCircle,     colour: "#DB2777", bg: "#FDF2F8", group: "Contacts",   defaultVisible: true  },
  { key: "organisations",  label: "Organisations", href: `${MANAGER_BASE}/contacts/organisations`,    icon: Building2,      colour: "#2563EB", bg: "#EFF6FF", group: "Contacts",   defaultVisible: false },
  { key: "messages",       label: "Messages",      href: `${MANAGER_BASE}/messages`,                  icon: MessageCircle,  colour: "#7C3AED", bg: "#F5F3FF", group: "Contacts",   defaultVisible: false },
  { key: "documents",      label: "Documents",     href: `${MANAGER_BASE}/contacts/documents`,        icon: FolderOpen,     colour: "#9333EA", bg: "#FAF5FF", group: "Contacts",   defaultVisible: true  },
  // Money
  { key: "invoices",       label: "Invoices",      href: `${MANAGER_BASE}/money/invoices`,            icon: Receipt,        colour: "#16A34A", bg: "#F0FDF4", group: "Money",      defaultVisible: true  },
  { key: "money",          label: "Finance",       href: `${MANAGER_BASE}/money`,                     icon: Wallet,         colour: "#059669", bg: "#ECFDF5", group: "Money",      defaultVisible: false },
  // Planning — gated behind the Planning feature flag (V1.5).
  { key: "planning-sets",  label: "Plans",         href: `${MANAGER_BASE}/planning/sets`,             icon: Layers,         colour: "#7C3AED", bg: "#F5F3FF", group: "Planning",   defaultVisible: false, flag: "planningEnabled" },
  { key: "offers",         label: "LL Offers",     href: `${MANAGER_BASE}/planning/landlord-offers`,  icon: Handshake,      colour: "#2563EB", bg: "#EFF6FF", group: "Planning",   defaultVisible: false, flag: "planningEnabled" },
  { key: "forecasts",      label: "Forecasts",     href: `${MANAGER_BASE}/planning/forecasts`,        icon: TrendingUp,     colour: "#10B981", bg: "#ECFDF5", group: "Planning",   defaultVisible: false, flag: "planningEnabled" },
  { key: "scenarios",      label: "Scenarios",     href: `${MANAGER_BASE}/planning/scenarios`,        icon: GitBranch,      colour: "#F59E0B", bg: "#FFFBEB", group: "Planning",   defaultVisible: false, flag: "planningEnabled" },
  { key: "conversions",    label: "Conversions",   href: `${MANAGER_BASE}/planning/conversions`,      icon: ArrowRightLeft, colour: "#EF4444", bg: "#FEF2F2", group: "Planning",   defaultVisible: false, flag: "planningEnabled" },
  { key: "plan-activity",  label: "Plan Activity", href: `${MANAGER_BASE}/planning/activity`,         icon: Activity,       colour: "#6366F1", bg: "#EEF2FF", group: "Planning",   defaultVisible: false, flag: "planningEnabled" },
  // Other
  { key: "calendar",       label: "Calendar",      href: `${MANAGER_BASE}/calendar`,                  icon: CalendarDays,   colour: "#0891B2", bg: "#ECFEFF", group: "Other",      defaultVisible: false },
  { key: "compliance",     label: "Compliance",    href: `${MANAGER_BASE}/compliance`,                icon: ShieldCheck,    colour: "#DC2626", bg: "#FEF2F2", group: "Other",      defaultVisible: false },
  { key: "automations",    label: "Automations",   href: `${MANAGER_BASE}/automations`,               icon: GitBranch,      colour: "#7C3AED", bg: "#F5F3FF", group: "Other",      defaultVisible: false, flag: "canvasLite" },
  { key: "legal",          label: "Legal",         href: `${MANAGER_BASE}/legal`,                     icon: FileText,       colour: "#0E7490", bg: "#ECFEFF", group: "Other",      defaultVisible: false, flag: "legalSection" },
  { key: "reports",        label: "Reports",       href: `${MANAGER_BASE}/money`,                     icon: FileText,       colour: "#64748B", bg: "#F8FAFC", group: "Other",      defaultVisible: false },
]

export const QUICKBAR_STORAGE_KEY = "propvora-quickbar-v1"

export interface QuickBarPrefs {
  visible: Record<string, boolean>
  order: string[]
}

export function loadQuickBarPrefs(): QuickBarPrefs {
  if (typeof window === "undefined") return getDefaultPrefs()
  try {
    const raw = localStorage.getItem(QUICKBAR_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as QuickBarPrefs
  } catch {
    // ignore
  }
  return getDefaultPrefs()
}

export function saveQuickBarPrefs(prefs: QuickBarPrefs): void {
  if (typeof window === "undefined") return
  localStorage.setItem(QUICKBAR_STORAGE_KEY, JSON.stringify(prefs))
}

export function getDefaultPrefs(): QuickBarPrefs {
  return {
    visible: Object.fromEntries(ALL_QUICK_WIDGETS.map(w => [w.key, w.defaultVisible])),
    order: ALL_QUICK_WIDGETS.map(w => w.key),
  }
}

function isValidPrefs(p: unknown): p is QuickBarPrefs {
  return !!p && typeof p === "object"
    && "visible" in p && typeof (p as QuickBarPrefs).visible === "object"
    && "order" in p && Array.isArray((p as QuickBarPrefs).order)
}

/**
 * Hydrate quick-bar prefs from the DB (cross-device). Returns the stored prefs
 * or null. Also mirrors them into localStorage for fast synchronous reads next
 * time. Best-effort — any failure resolves to null and the caller keeps the
 * localStorage/default prefs.
 */
export async function loadQuickBarPrefsFromDb(): Promise<QuickBarPrefs | null> {
  try {
    const { getUserPreferences } = await import("@/lib/actions/settings")
    const { prefs } = await getUserPreferences()
    const qb = prefs?.quickbar
    if (isValidPrefs(qb)) {
      saveQuickBarPrefs(qb)
      return qb
    }
  } catch {
    /* ignore — fall back to localStorage/defaults */
  }
  return null
}

/** Persist prefs to localStorage (instant) AND the DB (cross-device, best-effort). */
export async function saveQuickBarPrefsEverywhere(prefs: QuickBarPrefs): Promise<void> {
  saveQuickBarPrefs(prefs)
  try {
    const { saveUserPreferences } = await import("@/lib/actions/settings")
    await saveUserPreferences({ quickbar: prefs })
  } catch {
    /* localStorage already saved — DB sync is best-effort */
  }
}
