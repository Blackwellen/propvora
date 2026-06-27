"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MobileSectionNav, type MobileSectionNavItem } from "@/components/mobile"
import {
  ArrowLeft,
  Building2,
  Users,
  ShieldCheck,
  Scale,
  CreditCard,
  Package,
  Receipt,
  FileText,
  Sparkles,
  MessageCircle,
  Bell,
  Palette,
  Globe,
  LayoutGrid,
  Plug,
  Mail,
  HardDrive,
  Lock,
  Key,
  ClipboardList,
  Database,
  FlaskConical,
  AlertTriangle,
  Settings2,
  Workflow,
} from "lucide-react"

const WORKSPACE_NAV = [
  { key: "overview",      label: "Overview",           href: "/property-manager/workspace-settings",                  icon: Building2 },
  { key: "profile",       label: "Workspace Profile",  href: "/property-manager/workspace-settings/profile",          icon: Building2,     group: "General" },
  { key: "team",          label: "Team",               href: "/property-manager/workspace-settings/team",             icon: Users,         group: "General" },
  { key: "roles",         label: "Roles & Permissions",href: "/property-manager/workspace-settings/roles",            icon: ShieldCheck,   group: "General" },
  { key: "subscription",  label: "Subscription",       href: "/property-manager/workspace-settings/subscription",     icon: CreditCard,    group: "Billing" },
  { key: "addons",        label: "Add-ons",            href: "/property-manager/workspace-settings/addons",           icon: Package,       group: "Billing" },
  { key: "billing",       label: "Billing & Payment",  href: "/property-manager/workspace-settings/billing",          icon: Receipt,       group: "Billing" },
  { key: "invoices",      label: "Invoices",           href: "/property-manager/workspace-settings/invoices",         icon: FileText,      group: "Billing" },
  { key: "ai",            label: "AI Credits",         href: "/property-manager/workspace-settings/ai",               icon: Sparkles,      group: "AI" },
  { key: "copilot-inbox", label: "Copilot & Inbox",    href: "/property-manager/workspace-settings/copilot-inbox",    icon: MessageCircle, group: "AI" },
  { key: "notifications", label: "Notifications",      href: "/property-manager/workspace-settings/notifications",    icon: Bell,          group: "Configuration" },
  { key: "branding",      label: "Branding",           href: "/property-manager/workspace-settings/branding",         icon: Palette,       group: "Configuration" },
  { key: "white-label",   label: "White Label",        href: "/property-manager/workspace-settings/white-label",      icon: Globe,         group: "Configuration" },
  { key: "preferences",  label: "Preferences",        href: "/property-manager/workspace-settings/preferences",      icon: Settings2,     group: "Configuration" },
  { key: "jurisdiction",  label: "Jurisdiction",       href: "/property-manager/workspace-settings/jurisdiction",     icon: Scale,         group: "Configuration" },
  { key: "navigation",    label: "Menu Builder",       href: "/property-manager/workspace-settings/navigation",       icon: LayoutGrid,    group: "Configuration" },
  { key: "integrations",  label: "Integrations",       href: "/property-manager/workspace-settings/integrations",     icon: Plug,          group: "Configuration" },
  { key: "automations",   label: "Automation Governance", href: "/property-manager/workspace-settings/automations",   icon: Workflow,      group: "Configuration" },
  { key: "email",         label: "Email & SMTP",       href: "/property-manager/workspace-settings/email",            icon: Mail,          group: "Configuration" },
  { key: "storage",       label: "Storage",            href: "/property-manager/workspace-settings/storage",          icon: HardDrive,     group: "Configuration" },
  { key: "security",      label: "Security",           href: "/property-manager/workspace-settings/security",         icon: Lock,          group: "Security" },
  { key: "sso",           label: "SAML / SSO",         href: "/property-manager/workspace-settings/sso",              icon: Key,           group: "Security" },
  { key: "audit",         label: "Audit Logs",         href: "/property-manager/workspace-settings/audit",            icon: ClipboardList, group: "Security" },
  { key: "data",          label: "Data & Exports",     href: "/property-manager/workspace-settings/data",             icon: Database,      group: "Advanced" },
  { key: "demo-data",     label: "Demo Data",          href: "/property-manager/workspace-settings/demo-data",        icon: FlaskConical,  group: "Advanced" },
  { key: "danger-zone",   label: "Danger Zone",        href: "/property-manager/workspace-settings/danger-zone",      icon: AlertTriangle, group: "Advanced" },
  { key: "compliance",    label: "Compliance",         href: "/property-manager/settings/compliance",                 icon: ShieldCheck,   group: "Configuration" },
  { key: "legal",         label: "Legal",              href: "/property-manager/settings/legal",                      icon: Scale,         group: "Configuration" },
]

const GROUPS = ["General", "Billing", "AI", "Configuration", "Security", "Advanced"] as const

const MOBILE_NAV: MobileSectionNavItem[] = WORKSPACE_NAV.map(({ key, label, href, icon }) => ({
  key,
  label,
  href,
  icon,
}))

function NavItem({
  item,
  pathname,
}: {
  item: (typeof WORKSPACE_NAV)[number]
  pathname: string
}) {
  const Icon = item.icon
  const active =
    item.href === "/property-manager/workspace-settings"
      ? pathname === "/property-manager/workspace-settings"
      : pathname.startsWith(item.href) && item.href !== "/property-manager/workspace-settings"

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1",
        active
          ? "bg-[var(--brand-soft)] text-[var(--brand)]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  )
}

export default function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex gap-5 items-start">
      {/* Desktop settings nav — a clean rounded panel that sticks while content scrolls. */}
      <aside className="hidden lg:flex flex-col w-[236px] shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden self-start sticky top-0 max-h-[calc(100dvh-128px)] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link
            href="/property-manager/portfolio"
            className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to app
          </Link>
          <h1 className="text-[15px] font-bold text-slate-900">Workspace Settings</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Your workspace settings</p>
        </div>
        <nav className="flex-1 py-3 px-3">
          {/* Overview — ungrouped */}
          <NavItem item={WORKSPACE_NAV[0]} pathname={pathname} />
          {/* Grouped items */}
          {GROUPS.map((group) => {
            const items = WORKSPACE_NAV.filter((n) => n.group === group)
            if (!items.length) return null
            return (
              <div key={group} className="mt-4">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">
                  {group}
                </p>
                {items.map((item) => (
                  <NavItem key={item.key} item={item} pathname={pathname} />
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main content + mobile section nav */}
      <main className="flex-1 min-w-0">
        {/* Mobile section nav — pill strip in place of the desktop side rail. */}
        <div className="lg:hidden -mt-1 mb-4">
          <MobileSectionNav
            items={MOBILE_NAV}
            rootHref="/property-manager/workspace-settings"
            aria-label="Workspace settings sections"
          />
        </div>

        {/* Bottom clearance below lg so the lifted sticky save bar (which sits
            above the fixed mobile bottom nav) never covers the last form rows. */}
        <div className="max-w-[1000px] pb-[120px] lg:pb-0">
          {children}
        </div>
      </main>
    </div>
  )
}
