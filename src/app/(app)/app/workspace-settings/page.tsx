"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { PLAN_DISPLAY, type PlanTier } from "@/lib/billing/plans"
import {
  Building2,
  Users,
  CreditCard,
  Sparkles,
  LayoutGrid,
  Lock,
  Database,
  ChevronRight,
} from "lucide-react"

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
      { label: "Workspace Profile",  href: "/property-manager/workspace-settings/profile" },
      { label: "Team",               href: "/property-manager/workspace-settings/team" },
      { label: "Roles & Permissions",href: "/property-manager/workspace-settings/roles" },
    ],
  },
  {
    label: "Billing",
    icon: CreditCard,
    colour: "#059669",
    bg: "#ECFDF5",
    items: [
      { label: "Subscription",      href: "/property-manager/workspace-settings/subscription" },
      { label: "Add-ons",           href: "/property-manager/workspace-settings/addons" },
      { label: "Billing & Payment", href: "/property-manager/workspace-settings/billing" },
      { label: "Invoices",          href: "/property-manager/workspace-settings/invoices" },
    ],
  },
  {
    label: "AI",
    icon: Sparkles,
    colour: "#7C3AED",
    bg: "#F5F3FF",
    items: [
      { label: "AI Credits",     href: "/property-manager/workspace-settings/ai" },
      { label: "Copilot & Inbox",href: "/property-manager/workspace-settings/copilot-inbox" },
    ],
  },
  {
    label: "Configuration",
    icon: LayoutGrid,
    colour: "#D97706",
    bg: "#FFFBEB",
    items: [
      { label: "Language & Preferences", href: "/property-manager/workspace-settings/preferences" },
      { label: "Notifications", href: "/property-manager/workspace-settings/notifications" },
      { label: "Branding",      href: "/property-manager/workspace-settings/branding" },
      { label: "White Label",   href: "/property-manager/workspace-settings/white-label" },
      { label: "Menu Builder",  href: "/property-manager/workspace-settings/navigation" },
      { label: "Integrations",  href: "/property-manager/workspace-settings/integrations" },
      { label: "Email & SMTP",  href: "/property-manager/workspace-settings/email" },
      { label: "Storage",       href: "/property-manager/workspace-settings/storage" },
    ],
  },
  {
    label: "Security",
    icon: Lock,
    colour: "#0F172A",
    bg: "#F1F5F9",
    items: [
      { label: "Security",    href: "/property-manager/workspace-settings/security" },
      { label: "SAML / SSO",  href: "/property-manager/workspace-settings/sso" },
      { label: "Audit Logs",  href: "/property-manager/workspace-settings/audit" },
    ],
  },
  {
    label: "Advanced",
    icon: Database,
    colour: "#DC2626",
    bg: "#FEF2F2",
    items: [
      { label: "Data & Exports", href: "/property-manager/workspace-settings/data" },
      { label: "Demo Data",      href: "/property-manager/workspace-settings/demo-data" },
      { label: "Danger Zone",    href: "/property-manager/workspace-settings/danger-zone" },
    ],
  },
]

function normaliseTier(plan: string | null | undefined): PlanTier {
  const p = (plan ?? "").toLowerCase()
  const valid: PlanTier[] = ["starter", "operator", "scale", "pro_agency", "enterprise"]
  if (valid.includes(p as PlanTier)) return p as PlanTier
  if (p === "trial" || p === "basic") return "starter"
  if (p === "growth") return "operator"
  if (p === "pro" || p === "business" || p === "agency") return "pro_agency"
  return "starter"
}

export default function WorkspaceSettingsPage() {
  const { workspace } = useWorkspace()
  const [teamCount, setTeamCount] = useState<number | null>(null)
  const [pendingInvites, setPendingInvites] = useState(0)

  useEffect(() => {
    const wid = workspace?.id
    if (!wid) return
    const supabase = createClient()
    ;(async () => {
      try {
        const { count } = await supabase
          .from("workspace_members").select("id", { head: true, count: "exact" }).eq("workspace_id", wid)
        setTeamCount(count ?? 0)
      } catch { /* ignore */ }
      try {
        const { count: inv } = await supabase
          .from("workspace_invitations").select("id", { head: true, count: "exact" })
          .eq("workspace_id", wid).eq("status", "pending")
        setPendingInvites(inv ?? 0)
      } catch { /* ignore */ }
    })()
  }, [workspace?.id])

  const tier = normaliseTier(workspace?.plan as string | undefined)
  const planDef = PLAN_DISPLAY[tier]
  const planStatus = (workspace as { plan_status?: string } | null)?.plan_status ?? "trialing"
  const statusLabel = { active: "Active", trialing: "Trial", past_due: "Past due", canceled: "Canceled", suspended: "Suspended" }[planStatus] ?? "Active"
  const seatLimit = planDef.features.teamSeats

  const STAT_CARDS = [
    { label: "Subscription", value: `${planDef.name} plan`, sub: statusLabel, colour: "#2563EB", icon: CreditCard, href: "/property-manager/workspace-settings/subscription" },
    { label: "Team Members", value: teamCount == null ? "—" : `${teamCount} active`, sub: pendingInvites > 0 ? `${pendingInvites} invite pending` : "No pending invites", colour: "#059669", icon: Users, href: "/property-manager/workspace-settings/team" },
    { label: "Seats", value: teamCount == null ? "—" : `${teamCount} / ${seatLimit}`, sub: typeof seatLimit === "number" && teamCount != null ? `${Math.max(0, seatLimit - teamCount)} available` : "Unlimited", colour: "#7C3AED", icon: Users, href: "/property-manager/workspace-settings/team" },
    { label: "AI Copilot", value: planDef.features.aiCopilot ? "Included" : "Not on plan", sub: planDef.features.aiCopilot ? "Available on this plan" : "Upgrade to enable", colour: "#D97706", icon: Sparkles, href: "/property-manager/workspace-settings/ai" },
  ] as const

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
                    className="flex items-center justify-between py-1.5 text-[12.5px] text-slate-600 hover:text-[var(--brand)] transition-colors group"
                  >
                    {item.label}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--brand)] transition-colors" />
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
