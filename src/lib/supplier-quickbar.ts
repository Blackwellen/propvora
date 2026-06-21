import {
  LayoutDashboard,
  Inbox,
  Wrench,
  CalendarDays,
  MessageSquare,
  Wallet,
  Calculator,
  ShieldCheck,
  UserCircle,
  Workflow,
  BarChart3,
  Building2,
  Star,
  Hammer,
  HandCoins,
  type LucideIcon,
} from "lucide-react"

export interface SupplierQuickWidget {
  key: string
  label: string
  href: string
  icon: LucideIcon
  colour: string
  bg: string
}

// ── Solo widgets — single-operator focused ─────────────────────────────────
export const SUPPLIER_SOLO_WIDGETS: SupplierQuickWidget[] = [
  { key: "s-overview",    label: "Overview",    href: "/supplier",              icon: LayoutDashboard, colour: "#2563EB", bg: "#EFF6FF" },
  { key: "s-requests",    label: "Requests",    href: "/supplier/requests",     icon: Inbox,           colour: "#7C3AED", bg: "#F5F3FF" },
  { key: "s-jobs",        label: "Jobs",        href: "/supplier/jobs",         icon: Wrench,          colour: "#D97706", bg: "#FFFBEB" },
  { key: "s-calendar",    label: "Calendar",    href: "/supplier/calendar",     icon: CalendarDays,    colour: "#0891B2", bg: "#ECFEFF" },
  { key: "s-services",    label: "Services",    href: "/supplier/services",     icon: Hammer,          colour: "#059669", bg: "#ECFDF5" },
  { key: "s-messages",    label: "Messages",    href: "/supplier/messages",     icon: MessageSquare,   colour: "#9333EA", bg: "#FAF5FF" },
  { key: "s-finance",     label: "Finance",     href: "/supplier/finance",      icon: Wallet,          colour: "#16A34A", bg: "#F0FDF4" },
  { key: "s-accounting",  label: "Accounting",  href: "/supplier/accounting",   icon: Calculator,      colour: "#0E7490", bg: "#ECFEFF" },
  { key: "s-compliance",  label: "Compliance",  href: "/supplier/compliance",   icon: ShieldCheck,     colour: "#DC2626", bg: "#FEF2F2" },
  { key: "s-profile",     label: "Profile",     href: "/supplier/profile",      icon: UserCircle,      colour: "#DB2777", bg: "#FDF2F8" },
  { key: "s-automations", label: "Automations", href: "/supplier/automations",  icon: Workflow,        colour: "#6366F1", bg: "#EEF2FF" },
  { key: "s-affiliate",   label: "Affiliate",   href: "/supplier/affiliate",    icon: HandCoins,       colour: "#F59E0B", bg: "#FFFBEB" },
]

// ── Team widgets — multi-member business focused ────────────────────────────
export const SUPPLIER_TEAM_WIDGETS: SupplierQuickWidget[] = [
  { key: "t-overview",    label: "Overview",    href: "/supplier",              icon: LayoutDashboard, colour: "#2563EB", bg: "#EFF6FF" },
  { key: "t-requests",    label: "Requests",    href: "/supplier/requests",     icon: Inbox,           colour: "#7C3AED", bg: "#F5F3FF" },
  { key: "t-jobs",        label: "Jobs",        href: "/supplier/jobs",         icon: Wrench,          colour: "#D97706", bg: "#FFFBEB" },
  { key: "t-calendar",    label: "Calendar",    href: "/supplier/calendar",     icon: CalendarDays,    colour: "#0891B2", bg: "#ECFEFF" },
  { key: "t-services",    label: "Services",    href: "/supplier/services",     icon: Hammer,          colour: "#059669", bg: "#ECFDF5" },
  { key: "t-messages",    label: "Messages",    href: "/supplier/messages",     icon: MessageSquare,   colour: "#9333EA", bg: "#FAF5FF" },
  { key: "t-finance",     label: "Finance",     href: "/supplier/finance",      icon: Wallet,          colour: "#16A34A", bg: "#F0FDF4" },
  { key: "t-accounting",  label: "Accounting",  href: "/supplier/accounting",   icon: Calculator,      colour: "#0E7490", bg: "#ECFEFF" },
  { key: "t-insights",    label: "Insights",    href: "/supplier/insights",     icon: BarChart3,       colour: "#6366F1", bg: "#EEF2FF" },
  { key: "t-compliance",  label: "Compliance",  href: "/supplier/compliance",   icon: ShieldCheck,     colour: "#DC2626", bg: "#FEF2F2" },
  { key: "t-reputation",  label: "Reputation",  href: "/supplier/reputation",   icon: Star,            colour: "#F59E0B", bg: "#FFFBEB" },
  { key: "t-automations", label: "Automations", href: "/supplier/automations",  icon: Workflow,        colour: "#8B5CF6", bg: "#F5F3FF" },
  { key: "t-account",     label: "Account",     href: "/supplier/account",      icon: Building2,       colour: "#2563EB", bg: "#EFF6FF" },
  { key: "t-affiliate",   label: "Affiliate",   href: "/supplier/affiliate",    icon: HandCoins,       colour: "#D97706", bg: "#FFFBEB" },
]
