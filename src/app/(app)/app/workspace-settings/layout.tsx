"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Building2,
  Users,
  ShieldCheck,
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
} from "lucide-react"

const WORKSPACE_NAV = [
  { key: "overview",      label: "Overview",           href: "/app/workspace-settings",                  icon: Building2 },
  { key: "profile",       label: "Workspace Profile",  href: "/app/workspace-settings/profile",          icon: Building2,     group: "General" },
  { key: "team",          label: "Team",               href: "/app/workspace-settings/team",             icon: Users,         group: "General" },
  { key: "roles",         label: "Roles & Permissions",href: "/app/workspace-settings/roles",            icon: ShieldCheck,   group: "General" },
  { key: "subscription",  label: "Subscription",       href: "/app/workspace-settings/subscription",     icon: CreditCard,    group: "Billing" },
  { key: "addons",        label: "Add-ons",            href: "/app/workspace-settings/addons",           icon: Package,       group: "Billing" },
  { key: "billing",       label: "Billing & Payment",  href: "/app/workspace-settings/billing",          icon: Receipt,       group: "Billing" },
  { key: "invoices",      label: "Invoices",           href: "/app/workspace-settings/invoices",         icon: FileText,      group: "Billing" },
  { key: "ai",            label: "AI Credits",         href: "/app/workspace-settings/ai",               icon: Sparkles,      group: "AI" },
  { key: "copilot-inbox", label: "Copilot & Inbox",    href: "/app/workspace-settings/copilot-inbox",    icon: MessageCircle, group: "AI" },
  { key: "notifications", label: "Notifications",      href: "/app/workspace-settings/notifications",    icon: Bell,          group: "Configuration" },
  { key: "branding",      label: "Branding",           href: "/app/workspace-settings/branding",         icon: Palette,       group: "Configuration" },
  { key: "white-label",   label: "White Label",        href: "/app/workspace-settings/white-label",      icon: Globe,         group: "Configuration" },
  { key: "navigation",    label: "Menu Builder",       href: "/app/workspace-settings/navigation",       icon: LayoutGrid,    group: "Configuration" },
  { key: "integrations",  label: "Integrations",       href: "/app/workspace-settings/integrations",     icon: Plug,          group: "Configuration" },
  { key: "email",         label: "Email & SMTP",       href: "/app/workspace-settings/email",            icon: Mail,          group: "Configuration" },
  { key: "storage",       label: "Storage",            href: "/app/workspace-settings/storage",          icon: HardDrive,     group: "Configuration" },
  { key: "security",      label: "Security",           href: "/app/workspace-settings/security",         icon: Lock,          group: "Security" },
  { key: "sso",           label: "SAML / SSO",         href: "/app/workspace-settings/sso",              icon: Key,           group: "Security" },
  { key: "audit",         label: "Audit Logs",         href: "/app/workspace-settings/audit",            icon: ClipboardList, group: "Security" },
  { key: "data",          label: "Data & Exports",     href: "/app/workspace-settings/data",             icon: Database,      group: "Advanced" },
  { key: "demo-data",     label: "Demo Data",          href: "/app/workspace-settings/demo-data",        icon: FlaskConical,  group: "Advanced" },
  { key: "danger-zone",   label: "Danger Zone",        href: "/app/workspace-settings/danger-zone",      icon: AlertTriangle, group: "Advanced" },
  { key: "compliance",    label: "Compliance",         href: "/app/settings/compliance",                 icon: ShieldCheck,   group: "Configuration" },
]

const GROUPS = ["General", "Billing", "AI", "Configuration", "Security", "Advanced"] as const

function NavItem({
  item,
  pathname,
}: {
  item: (typeof WORKSPACE_NAV)[number]
  pathname: string
}) {
  const Icon = item.icon
  const active =
    item.href === "/app/workspace-settings"
      ? pathname === "/app/workspace-settings"
      : pathname.startsWith(item.href) && item.href !== "/app/workspace-settings"

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5",
        active
          ? "bg-[#EFF6FF] text-[#2563EB]"
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
            href="/app/portfolio"
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

      {/* Main content + inline mobile tab bar */}
      <main className="flex-1 min-w-0">
        {/* Mobile horizontal scrollable tab bar — inline (no overlapping fixed bar). */}
        <div className="lg:hidden -mt-1 mb-4 rounded-2xl border border-slate-200 bg-white px-2 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1">
            {WORKSPACE_NAV.map((item) => {
              const Icon = item.icon
              const active =
                item.href === "/app/workspace-settings"
                  ? pathname === "/app/workspace-settings"
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors",
                    active ? "bg-[#EFF6FF] text-[#2563EB]" : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="max-w-[1000px]">
          {children}
        </div>
      </main>
    </div>
  )
}
