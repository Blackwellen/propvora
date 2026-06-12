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

export interface QuickBarWidget {
  key: string
  label: string
  href: string
  icon: LucideIcon
  colour: string
  bg: string
  group: string
  defaultVisible: boolean
}

export const ALL_QUICK_WIDGETS: QuickBarWidget[] = [
  // Portfolio
  { key: "properties",     label: "Properties",    href: "/app/portfolio/properties",      icon: Home,           colour: "#2563EB", bg: "#EFF6FF", group: "Portfolio",  defaultVisible: true  },
  { key: "tenancies",      label: "Tenancies",     href: "/app/portfolio/tenancies",       icon: Users,          colour: "#7C3AED", bg: "#F5F3FF", group: "Portfolio",  defaultVisible: true  },
  { key: "units",          label: "Units",         href: "/app/portfolio/units",           icon: Building,       colour: "#0891B2", bg: "#ECFEFF", group: "Portfolio",  defaultVisible: false },
  // Work
  { key: "tasks",          label: "Tasks",         href: "/app/work/tasks",                icon: CheckSquare,    colour: "#059669", bg: "#ECFDF5", group: "Work",       defaultVisible: true  },
  { key: "jobs",           label: "Jobs",          href: "/app/work/jobs",                 icon: Wrench,         colour: "#D97706", bg: "#FFFBEB", group: "Work",       defaultVisible: true  },
  { key: "work-board",     label: "Work Board",    href: "/app/work/board",                icon: LayoutDashboard,colour: "#6366F1", bg: "#EEF2FF", group: "Work",       defaultVisible: false },
  { key: "gantt",          label: "Gantt",         href: "/app/work/gantt",                icon: BarChart2,      colour: "#F59E0B", bg: "#FFFBEB", group: "Work",       defaultVisible: false },
  // Contacts
  { key: "suppliers",      label: "Suppliers",     href: "/app/work/suppliers",            icon: Truck,          colour: "#0E7490", bg: "#ECFEFF", group: "Contacts",   defaultVisible: true  },
  { key: "people",         label: "People",        href: "/app/contacts/people",           icon: UserCircle,     colour: "#DB2777", bg: "#FDF2F8", group: "Contacts",   defaultVisible: true  },
  { key: "organisations",  label: "Organisations", href: "/app/contacts/organisations",    icon: Building2,      colour: "#2563EB", bg: "#EFF6FF", group: "Contacts",   defaultVisible: false },
  { key: "messages",       label: "Messages",      href: "/app/contacts/messages",         icon: MessageCircle,  colour: "#7C3AED", bg: "#F5F3FF", group: "Contacts",   defaultVisible: false },
  { key: "documents",      label: "Documents",     href: "/app/contacts/documents",        icon: FolderOpen,     colour: "#9333EA", bg: "#FAF5FF", group: "Contacts",   defaultVisible: true  },
  // Money
  { key: "invoices",       label: "Invoices",      href: "/app/money/invoices",            icon: Receipt,        colour: "#16A34A", bg: "#F0FDF4", group: "Money",      defaultVisible: true  },
  { key: "money",          label: "Finance",       href: "/app/money",                     icon: Wallet,         colour: "#059669", bg: "#ECFDF5", group: "Money",      defaultVisible: false },
  // Planning
  { key: "planning-sets",  label: "Plans",         href: "/app/planning/sets",             icon: Layers,         colour: "#7C3AED", bg: "#F5F3FF", group: "Planning",   defaultVisible: false },
  { key: "offers",         label: "LL Offers",     href: "/app/planning/landlord-offers",  icon: Handshake,      colour: "#2563EB", bg: "#EFF6FF", group: "Planning",   defaultVisible: false },
  { key: "forecasts",      label: "Forecasts",     href: "/app/planning/forecasts",        icon: TrendingUp,     colour: "#10B981", bg: "#ECFDF5", group: "Planning",   defaultVisible: false },
  { key: "scenarios",      label: "Scenarios",     href: "/app/planning/scenarios",        icon: GitBranch,      colour: "#F59E0B", bg: "#FFFBEB", group: "Planning",   defaultVisible: false },
  { key: "conversions",    label: "Conversions",   href: "/app/planning/conversions",      icon: ArrowRightLeft, colour: "#EF4444", bg: "#FEF2F2", group: "Planning",   defaultVisible: false },
  { key: "plan-activity",  label: "Plan Activity", href: "/app/planning/activity",         icon: Activity,       colour: "#6366F1", bg: "#EEF2FF", group: "Planning",   defaultVisible: false },
  // Other
  { key: "calendar",       label: "Calendar",      href: "/app/calendar",                  icon: CalendarDays,   colour: "#0891B2", bg: "#ECFEFF", group: "Other",      defaultVisible: false },
  { key: "compliance",     label: "Compliance",    href: "/app/compliance",                icon: ShieldCheck,    colour: "#DC2626", bg: "#FEF2F2", group: "Other",      defaultVisible: false },
  { key: "reports",        label: "Reports",       href: "/app/money",                     icon: FileText,       colour: "#64748B", bg: "#F8FAFC", group: "Other",      defaultVisible: false },
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
