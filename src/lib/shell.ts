// Shell style types, defaults, token maps, and localStorage cache key.
// No React imports — pure data so server components can safely import if needed.

export type ShellStyle = "soft-card"
export type ShellLayout = "side-and-top" | "top-only"

export interface ShellPrefs {
  shell_style: ShellStyle
  shell_layout: ShellLayout
  side_nav_collapsed: boolean
  top_nav_compact: boolean
}

export const DEFAULT_SHELL_PREFS: ShellPrefs = {
  shell_style: "soft-card",
  shell_layout: "side-and-top",
  side_nav_collapsed: false,
  top_nav_compact: false,
}

export const SHELL_PREFS_CACHE_KEY = "propvora_shell_prefs"

export const SHELL_STYLE_META: Record<ShellStyle, {
  label: string
  number: number
  desc: string
  isDefault?: boolean
}> = {
  "soft-card": {
    number: 1,
    label: "Elegant Soft-Card",
    desc: "Warm white card-based shell with soft blue active states, rounded surfaces, subtle shadows, friendly enterprise polish.",
    isDefault: true,
  },
}

export interface ShellTokens {
  // Layout backgrounds
  shellBg: string
  // Sidebar surface + structure
  sideNavStyle: string
  logoAreaBorder: string
  logoAreaTint: string
  logoFilter: string           // CSS filter value (empty string = none)
  // Nav group label
  groupLabelStyle: string
  // Nav leaf items (no children)
  navItemDefault: string
  navItemActive: string
  // Nav expandable items (with children)
  navItemActiveExpanded: string
  // Nav item icon containers
  navItemIconDefault: string
  navItemIconActive: string
  navItemIconActiveExpanded: string
  // Nested child links
  navChildActive: string
  navChildDefault: string
  navTreeBorder: string
  // Chevron icons
  chevronDefault: string
  chevronActive: string
  // Bottom account card
  accountCardStyle: string
  accountNameStyle: string
  accountSubStyle: string
  accountDivider: string
  accountLinkStyle: string
  // Collapse toggle button
  collapseButtonStyle: string
  // TopBar chrome
  topBarStyle: string
  searchStyle: string
  kbdStyle: string
  iconStyle: string
  dividerStyle: string
  profileHoverStyle: string
  topNavTextPrimary: string
  topNavTextSecondary: string
  // Profile dropdown
  profileDropdownBg: string
  profileDropdownHeader: string
  profileDropdownItemHover: string
  profileDropdownDivider: string
  profileDropdownText: string
  profileDropdownDestructive: string
  // Top-only mode nav links
  topNavLinkDefault: string
  topNavLinkActive: string
  // Top-only compact widgets
  widgetButtonStyle: string
  widgetDropdownStyle: string
  widgetLabelStyle: string
  widgetHeadingStyle: string
  widgetItemStyle: string
  widgetItemHover: string
  widgetLinkStyle: string
  widgetDivider: string
  // Flag for dark variant
  isDark: boolean
}

export const SHELL_TOKENS: Record<ShellStyle, ShellTokens> = {
  /* ═══════════════════════════════════════════════════════
     1. ELEGANT SOFT-CARD
     ═══════════════════════════════════════════════════════ */
  "soft-card": {
    shellBg: "bg-[#F8FAFC]",
    sideNavStyle: "bg-white border-r border-slate-200 shadow-[2px_0_12px_rgba(0,0,0,0.04)]",
    logoAreaBorder: "",
    logoAreaTint: "bg-gradient-to-b from-blue-50/40 to-transparent",
    logoFilter: "",
    groupLabelStyle: "text-slate-400",
    navItemDefault: "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
    navItemActive: "bg-[#2563EB] text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)]",
    navItemActiveExpanded: "bg-[#EFF6FF] text-[#1d4ed8]",
    navItemIconDefault: "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700",
    navItemIconActive: "bg-white/20 text-white",
    navItemIconActiveExpanded: "bg-[#DBEAFE] text-[#2563EB]",
    navChildActive: "text-[#2563EB] font-semibold bg-[#EFF6FF]",
    navChildDefault: "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
    navTreeBorder: "border-slate-100",
    chevronDefault: "text-slate-300",
    chevronActive: "text-[#93C5FD]",
    accountCardStyle: "bg-slate-50 border border-slate-100",
    accountNameStyle: "text-slate-900",
    accountSubStyle: "text-slate-500",
    accountDivider: "border-slate-200",
    accountLinkStyle: "text-[#2563EB] hover:text-[#1d4ed8]",
    collapseButtonStyle: "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 shadow-sm",
    topBarStyle: "bg-white/97 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.03)]",
    searchStyle: "bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/40 focus:bg-white",
    kbdStyle: "bg-slate-100 text-slate-400 border border-slate-200",
    iconStyle: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    dividerStyle: "bg-slate-200",
    profileHoverStyle: "hover:bg-slate-100",
    topNavTextPrimary: "text-slate-800",
    topNavTextSecondary: "text-slate-500",
    profileDropdownBg: "bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)]",
    profileDropdownHeader: "bg-gradient-to-br from-slate-50 to-white border-b border-slate-100",
    profileDropdownItemHover: "hover:bg-slate-50",
    profileDropdownDivider: "border-slate-100",
    profileDropdownText: "text-slate-700",
    profileDropdownDestructive: "text-red-600 hover:bg-red-50",
    topNavLinkDefault: "text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg",
    topNavLinkActive: "text-[#2563EB] bg-[#EFF6FF] rounded-lg",
    widgetButtonStyle: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    widgetDropdownStyle: "bg-white border border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.10)]",
    widgetLabelStyle: "text-slate-600",
    widgetHeadingStyle: "text-slate-900 font-semibold",
    widgetItemStyle: "text-slate-700",
    widgetItemHover: "hover:bg-slate-50",
    widgetLinkStyle: "text-[#2563EB] hover:text-[#1d4ed8]",
    widgetDivider: "border-slate-100",
    isDark: false,
  },
}
