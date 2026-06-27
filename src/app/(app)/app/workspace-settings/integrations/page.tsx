"use client"

import React, { useEffect, useState } from "react"
import {
  BookOpen,
  Webhook,
  MapPin,
  Banknote,
  MessageSquare,
  FileSignature,
  CalendarDays,
  ShoppingBag,
  RefreshCw,
  Lock,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { normaliseTier } from "@/lib/billing/plans"

interface Integration {
  key: string
  name: string
  desc: string
  category: string
  badge?: string
  icon: React.ElementType
  colour: string
  /** Min plan tier required. null = available on all plans. */
  minTier?: "operator" | "scale" | "pro_agency" | "enterprise"
  /** Link to configuration page or external setup guide. */
  configHref?: string
  comingSoon?: boolean
}

const INTEGRATIONS: Integration[] = [
  // Accounting
  {
    key: "xero",
    name: "Xero",
    desc: "Two-way sync of income, expenses, invoices and reconciliation with Xero.",
    category: "Accounting",
    icon: BookOpen,
    colour: "#13B5EA",
    minTier: "scale",
    configHref: "/property-manager/workspace-settings/addons",
    badge: "Add-on",
  },
  {
    key: "quickbooks",
    name: "QuickBooks",
    desc: "Sync rent, bills and expenses with QuickBooks Online automatically.",
    category: "Accounting",
    icon: BookOpen,
    colour: "#2CA01C",
    minTier: "scale",
    configHref: "/property-manager/workspace-settings/addons",
    badge: "Add-on",
  },
  // Communication
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    desc: "Send tenancy updates, maintenance alerts and reminders via WhatsApp.",
    category: "Communication",
    icon: MessageSquare,
    colour: "#25D366",
    minTier: "operator",
    configHref: "/property-manager/workspace-settings/addons",
    badge: "Add-on",
  },
  // Calendar
  {
    key: "google-calendar",
    name: "Google Calendar",
    desc: "Sync property inspections, lease events and reminders to Google Calendar.",
    category: "Calendar",
    icon: CalendarDays,
    colour: "#4285F4",
    comingSoon: true,
  },
  {
    key: "outlook-calendar",
    name: "Microsoft Outlook",
    desc: "Sync compliance dates and appointments to Outlook / Microsoft 365.",
    category: "Calendar",
    icon: CalendarDays,
    colour: "#0078D4",
    comingSoon: true,
  },
  // E-signature
  {
    key: "esignature",
    name: "eSignature",
    desc: "Send ASTs, deeds of surrender and notices for legally-binding e-signature.",
    category: "Documents",
    icon: FileSignature,
    colour: "#FF4F00",
    minTier: "operator",
    configHref: "/property-manager/workspace-settings/addons",
    badge: "Add-on",
  },
  // Open Banking
  {
    key: "open-banking",
    name: "Open Banking",
    desc: "Connect bank feeds for automated rent reconciliation and cashflow reporting.",
    category: "Banking",
    icon: Banknote,
    colour: "#0EA5E9",
    minTier: "operator",
    configHref: "/property-manager/workspace-settings/addons",
    badge: "Add-on",
  },
  // Maps
  {
    key: "maps",
    name: "Maps & Geocoding",
    desc: "Property location maps, postcode lookup, and nearby amenities search.",
    category: "Mapping",
    icon: MapPin,
    colour: "#DC2626",
  },
  // Marketplace
  {
    key: "rightmove",
    name: "Rightmove",
    desc: "Export property listings directly to Rightmove for marketing.",
    category: "Portals",
    icon: ShoppingBag,
    colour: "#00DEB6",
    comingSoon: true,
  },
  {
    key: "zoopla",
    name: "Zoopla",
    desc: "Sync property listings with Zoopla for wider market exposure.",
    category: "Portals",
    icon: ShoppingBag,
    colour: "#8600EB",
    comingSoon: true,
  },
  // API / Webhooks
  {
    key: "webhooks",
    name: "Webhooks",
    desc: "Send real-time HTTP events to your own systems when workspace events occur.",
    category: "Developer",
    icon: Webhook,
    colour: "#D97706",
    configHref: "/property-manager/automations/webhooks",
  },
  // Zapier / n8n
  {
    key: "zapier",
    name: "Zapier",
    desc: "Connect Propvora to 6,000+ apps via Zapier automations.",
    category: "Automation",
    icon: RefreshCw,
    colour: "#FF4A00",
    comingSoon: true,
  },
]

const TIER_ORDER = ["starter", "operator", "scale", "pro_agency", "enterprise"]

function tierRank(tier: string): number {
  return TIER_ORDER.indexOf(tier)
}

export default function IntegrationsPage() {
  const { workspace } = useWorkspace()
  const [serverStatus, setServerStatus] = useState<Record<string, boolean> | null>(null)

  const currentTier = normaliseTier(workspace?.plan as string | undefined)
  const currentRank = tierRank(currentTier)

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setServerStatus(d) })
      .catch(() => { /* fall back silently */ })
  }, [])

  function isConnected(key: string): boolean {
    return serverStatus ? !!serverStatus[key] : false
  }

  function isAccessible(int: Integration): boolean {
    if (!int.minTier) return true
    return currentRank >= tierRank(int.minTier)
  }

  const connectedCount = INTEGRATIONS.filter((i) => isConnected(i.key)).length
  const availableCount = INTEGRATIONS.filter((i) => isAccessible(i) && !i.comingSoon).length

  // Group integrations by category
  const groups = Array.from(new Set(INTEGRATIONS.map((i) => i.category)))

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Integrations</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">
          Connect your workspace to third-party services and external tools
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Available", value: availableCount.toString(), colour: "text-[var(--brand)]" },
          { label: "Connected", value: connectedCount.toString(), colour: "text-emerald-600" },
          { label: "Coming soon", value: INTEGRATIONS.filter((i) => i.comingSoon).length.toString(), colour: "text-slate-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
            <p className={cn("text-[22px] font-black mt-1", stat.colour)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Integration groups */}
      {groups.map((group) => {
        const items = INTEGRATIONS.filter((i) => i.category === group)
        return (
          <div key={group} className="mb-6">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">{group}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((int) => {
                const Icon = int.icon
                const connected = isConnected(int.key)
                const accessible = isAccessible(int)
                const locked = !accessible && !int.comingSoon

                return (
                  <div
                    key={int.key}
                    className={cn(
                      "bg-white rounded-2xl border p-5 flex flex-col",
                      locked ? "border-slate-100 opacity-70" : "border-slate-200"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: int.colour + "15" }}
                        >
                          <div style={{ color: int.colour }}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-bold text-slate-900">{int.name}</p>
                            {int.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide whitespace-nowrap">
                                {int.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                            {int.category}
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      {int.comingSoon ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 shrink-0 whitespace-nowrap">
                          Coming soon
                        </span>
                      ) : locked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                      ) : connected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-200 shrink-0" />
                      )}
                    </div>

                    <p className="text-[12px] text-slate-500 flex-1 mb-4">{int.desc}</p>

                    {/* CTA */}
                    {int.comingSoon ? (
                      <div className="w-full py-2 rounded-xl bg-slate-50 text-[12.5px] text-slate-400 font-semibold text-center">
                        Coming soon
                      </div>
                    ) : locked ? (
                      <a
                        href="/property-manager/workspace-settings/subscription"
                        className="w-full py-2 rounded-xl border border-violet-200 text-[#7C3AED] text-[12.5px] font-semibold hover:bg-violet-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Upgrade to unlock
                      </a>
                    ) : connected ? (
                      <a
                        href={int.configHref ?? "#"}
                        className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-[12.5px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Manage
                      </a>
                    ) : (
                      <a
                        href={int.configHref ?? "/property-manager/workspace-settings/addons"}
                        className="w-full py-2 rounded-xl border border-[var(--brand)] text-[var(--brand)] text-[12.5px] font-semibold hover:bg-[var(--brand-soft)] transition-colors flex items-center justify-center gap-1.5"
                      >
                        Set up
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Info banner */}
      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-slate-500">
          Integration credentials are stored encrypted and are never exposed after saving. Contact{" "}
          <a href="mailto:hello@propvora.com" className="text-[var(--brand)] hover:underline">hello@propvora.com</a>{" "}
          if you need help connecting a service not listed here.
        </p>
      </div>
    </div>
  )
}
