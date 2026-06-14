"use client"

import React, { useEffect, useState } from "react"
import {
  CreditCard,
  Sparkles,
  Mail,
  Database,
  HardDrive,
  Globe,
  Zap,
  MapPin,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Status based on public env vars that are safe to expose on the client
// Note: secret keys should NOT be checked client-side; we check public indicators only
// For a real check, move to a server component or API route
interface Integration {
  key: string
  name: string
  desc: string
  category: string
  // We'll derive status from public env vars available at build time
  envCheck: boolean
  icon: React.ElementType
  colour: string
}

// These public env vars are safe to expose; they're already in the browser bundle
const INTEGRATIONS: Integration[] = [
  {
    key: "stripe",
    name: "Stripe",
    desc: "Payment processing, subscriptions, billing",
    category: "Payments",
    envCheck: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    icon: CreditCard,
    colour: "#635BFF",
  },
  {
    key: "openai",
    name: "Propvora AI",
    desc: "AI Copilot, drafts, credit management",
    category: "AI",
    envCheck: !!process.env.NEXT_PUBLIC_AI_ENABLED,
    icon: Sparkles,
    colour: "#7C3AED",
  },
  {
    key: "resend",
    name: "Resend",
    desc: "Transactional email delivery",
    category: "Email",
    envCheck: !!process.env.NEXT_PUBLIC_RESEND_CONFIGURED,
    icon: Mail,
    colour: "#000000",
  },
  {
    key: "supabase",
    name: "Supabase",
    desc: "Database, auth, storage, real-time",
    category: "Infrastructure",
    envCheck: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    icon: Database,
    colour: "#3ECF8E",
  },
  {
    key: "r2",
    name: "Cloudflare R2",
    desc: "Object storage for documents and media",
    category: "Storage",
    envCheck: !!process.env.NEXT_PUBLIC_R2_CONFIGURED,
    icon: HardDrive,
    colour: "#F38020",
  },
  {
    key: "google-auth",
    name: "Google Auth",
    desc: "Google OAuth login for users",
    category: "Auth",
    envCheck: !!process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED,
    icon: Globe,
    colour: "#4285F4",
  },
  {
    key: "webhooks",
    name: "Webhooks",
    desc: "HTTP callbacks for workspace events",
    category: "API",
    envCheck: false,
    icon: Zap,
    colour: "#D97706",
  },
  {
    key: "maps",
    name: "Maps Provider",
    desc: "Property location maps and postcodes",
    category: "Mapping",
    envCheck: !!process.env.NEXT_PUBLIC_MAPS_API_KEY,
    icon: MapPin,
    colour: "#DC2626",
  },
]

export default function IntegrationsPage() {
  // Real configured state comes from the server (env-based, no secrets exposed).
  const [serverStatus, setServerStatus] = useState<Record<string, boolean> | null>(null)
  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setServerStatus(d) })
      .catch(() => { /* fall back to env check */ })
  }, [])

  const isConfigured = (int: Integration): boolean =>
    serverStatus ? !!serverStatus[int.key] : int.envCheck

  const configuredCount = INTEGRATIONS.filter(isConfigured).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Integrations</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Manage all connected services and third-party integrations
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total integrations", value: INTEGRATIONS.length.toString() },
          { label: "Configured", value: configuredCount.toString(), ok: true },
          { label: "Not configured", value: (INTEGRATIONS.length - configuredCount).toString(), warn: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
            <p
              className={cn(
                "text-[22px] font-black mt-1",
                stat.ok ? "text-emerald-600" : stat.warn ? "text-amber-600" : "text-slate-900"
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <div style={{ color: "#2563EB" }}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
        </div>
        <p className="text-[12.5px] text-blue-700">
          Status is determined by the presence of required environment variables. Contact your administrator or check the setup guide to configure integrations.
        </p>
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map((int) => {
          const Icon = int.icon
          const configured = isConfigured(int)
          return (
            <div key={int.key} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: int.colour + "15" }}
                  >
                    <div style={{ color: int.colour }}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{int.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                      {int.category}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0",
                    configured
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {configured ? "Connected" : "Not configured"}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mb-4">{int.desc}</p>
              <button
                className={cn(
                  "w-full py-2 rounded-xl text-[12.5px] font-semibold transition-colors border",
                  configured
                    ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "border-[#2563EB] text-[#2563EB] hover:bg-blue-50"
                )}
                onClick={() => {
                  if (!configured) {
                    alert(`To configure ${int.name}, set the required environment variables and redeploy.`)
                  }
                }}
              >
                {configured ? "Manage" : "Configure"}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
