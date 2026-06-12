"use client"

import React from "react"
import Link from "next/link"
import {
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
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Health stat cards                                                    */
/* ------------------------------------------------------------------ */
const STAT_CARDS = [
  {
    label: "Subscription",
    value: "Pro Plan",
    sub: "Renews 1 Jan 2027",
    colour: "#2563EB",
    icon: CreditCard,
    href: "/app/workspace-settings/subscription",
  },
  {
    label: "Team Members",
    value: "3 active",
    sub: "1 invite pending",
    colour: "#059669",
    icon: Users,
    href: "/app/workspace-settings/team",
  },
  {
    label: "AI Credits",
    value: "247 / 500",
    sub: "253 remaining this month",
    colour: "#7C3AED",
    icon: Sparkles,
    href: "/app/workspace-settings/ai",
  },
  {
    label: "Integrations",
    value: "2 active",
    sub: "3 not configured",
    colour: "#D97706",
    icon: Plug,
    href: "/app/workspace-settings/integrations",
  },
] as const

/* ------------------------------------------------------------------ */
/* Category cards                                                       */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  {
    label: "General",
    icon: Building2,
    colour: "#2563EB",
    bg: "#EFF6FF",
    items: [
      { label: "Workspace Profile",  href: "/app/workspace-settings/profile" },
      { label: "Team",               href: "/app/workspace-settings/team" },
      { label: "Roles & Permissions",href: "/app/workspace-settings/roles" },
    ],
  },
  {
    label: "Billing",
    icon: CreditCard,
    colour: "#059669",
    bg: "#ECFDF5",
    items: [
      { label: "Subscription",      href: "/app/workspace-settings/subscription" },
      { label: "Add-ons",           href: "/app/workspace-settings/addons" },
      { label: "Billing & Payment", href: "/app/workspace-settings/billing" },
      { label: "Invoices",          href: "/app/workspace-settings/invoices" },
    ],
  },
  {
    label: "AI",
    icon: Sparkles,
    colour: "#7C3AED",
    bg: "#F5F3FF",
    items: [
      { label: "AI Credits",     href: "/app/workspace-settings/ai" },
      { label: "Copilot & Inbox",href: "/app/workspace-settings/copilot-inbox" },
    ],
  },
  {
    label: "Configuration",
    icon: LayoutGrid,
    colour: "#D97706",
    bg: "#FFFBEB",
    items: [
      { label: "Notifications", href: "/app/workspace-settings/notifications" },
      { label: "Branding",      href: "/app/workspace-settings/branding" },
      { label: "White Label",   href: "/app/workspace-settings/white-label" },
      { label: "Menu Builder",  href: "/app/workspace-settings/navigation" },
      { label: "Integrations",  href: "/app/workspace-settings/integrations" },
      { label: "Email & SMTP",  href: "/app/workspace-settings/email" },
      { label: "Storage",       href: "/app/workspace-settings/storage" },
    ],
  },
  {
    label: "Security",
    icon: Lock,
    colour: "#0F172A",
    bg: "#F1F5F9",
    items: [
      { label: "Security",    href: "/app/workspace-settings/security" },
      { label: "SAML / SSO",  href: "/app/workspace-settings/sso" },
      { label: "Audit Logs",  href: "/app/workspace-settings/audit" },
    ],
  },
  {
    label: "Advanced",
    icon: Database,
    colour: "#DC2626",
    bg: "#FEF2F2",
    items: [
      { label: "Data & Exports", href: "/app/workspace-settings/data" },
      { label: "Demo Data",      href: "/app/workspace-settings/demo-data" },
      { label: "Danger Zone",    href: "/app/workspace-settings/danger-zone" },
    ],
  },
]

export default function WorkspaceSettingsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-slate-900">Workspace Settings</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">
          Configure your workspace, team, billing, AI and integrations
        </p>
      </div>

      {/* Health stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${card.colour}18` }}
                >
                  <div style={{ color: card.colour }}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  {card.label}
                </p>
              </div>
              <p className="text-[15px] font-bold text-slate-900">{card.value}</p>
              <p className="text-[11.5px] text-slate-400 mt-0.5">{card.sub}</p>
            </Link>
          )
        })}
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <div
              key={cat.label}
              className="bg-white rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: cat.bg }}
                >
                  <div style={{ color: cat.colour }}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-[13px] font-bold text-slate-900">{cat.label}</h3>
              </div>
              <div className="space-y-0.5">
                {cat.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between py-1.5 text-[12.5px] text-slate-600 hover:text-[#2563EB] transition-colors group"
                  >
                    {item.label}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#2563EB] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
