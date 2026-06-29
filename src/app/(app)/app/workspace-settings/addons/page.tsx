"use client"

import React, { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Sparkles, Users, HardDrive, Globe, Key, BarChart3, Plug, Headphones,
  Check, Banknote, MessageSquare, FileSignature, BookOpen, FileText, Loader2, AlertCircle,
} from "lucide-react"

// Icon + colour per add-on key (display only; the catalogue itself is server-driven).
const META: Record<string, { icon: React.ElementType; colour: string }> = {
  extra_seat:          { icon: Users,        colour: "#2563EB" },
  extra_props_10:      { icon: HardDrive,    colour: "#059669" },
  white_label:         { icon: Globe,        colour: "#D97706" },
  ai_credits_1k:       { icon: Sparkles,     colour: "#7C3AED" },
  ai_pro:              { icon: Sparkles,     colour: "#7C3AED" },
  intelligence_pack_1k:{ icon: Sparkles,     colour: "#7C3AED" },
  action_pack_1k:      { icon: Sparkles,     colour: "#7C3AED" },
  onboarding:          { icon: Headphones,   colour: "#059669" },
  open_banking:        { icon: Banknote,     colour: "#0EA5E9" },
  whatsapp_business:   { icon: MessageSquare,colour: "#25D366" },
  esignature:          { icon: FileSignature,colour: "#FF4F00" },
  accounting_sync:     { icon: BookOpen,     colour: "#13B5EA" },
  mtd_itsa:            { icon: FileText,     colour: "#DC2626" },
  saml_sso:            { icon: Key,          colour: "#DC2626" },
  advanced_reporting:  { icon: BarChart3,    colour: "#2563EB" },
  api_access:          { icon: Plug,         colour: "#7C3AED" },
  priority_support:    { icon: Headphones,   colour: "#059669" },
}

interface CatalogueAddon {
  key: string
  name: string
  description: string
  amount: number
  interval: string | null
  eligibility: string | null
}

function priceLabel(amount: number, interval: string | null): string {
  const pounds = (amount / 100).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `£${pounds}${interval === "month" ? "/mo" : ""}`
}

export default function AddonsPage() {
  const [addons, setAddons] = useState<CatalogueAddon[] | null>(null)
  const [active, setActive] = useState<Set<string>>(new Set())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await fetch("/api/billing/addons")
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setLoadError(typeof j.error === "string" ? j.error : "Couldn't load add-ons.")
        return
      }
      const data = (await res.json()) as { addons: CatalogueAddon[]; active: string[] }
      setAddons(data.addons)
      setActive(new Set(data.active))
    } catch {
      setLoadError("Couldn't load add-ons.")
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function changeAddon(key: string, action: "add" | "remove") {
    setBusyKey(key)
    setActionError(null)
    try {
      const res = await fetch("/api/billing/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addonKey: key, action }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setActionError(typeof j.error === "string" ? j.error : "Couldn't update the add-on.")
        return
      }
      setActive((prev) => {
        const next = new Set(prev)
        if (j.enabled) next.add(key)
        else next.delete(key)
        return next
      })
    } catch {
      setActionError("Couldn't update the add-on — please try again.")
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Add-ons</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Extend your workspace — billed alongside your subscription.</p>
      </div>

      {actionError && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-red-700">{actionError}</p>
        </div>
      )}

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[13px] text-amber-700">{loadError}</div>
      ) : addons === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 h-[150px] animate-pulse" />
          ))}
        </div>
      ) : addons.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-[13px] text-slate-500">
          No add-ons available on your current plan.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => {
            const m = META[addon.key] ?? { icon: Plug, colour: "#64748b" }
            const Icon = m.icon
            const isActive = active.has(addon.key)
            const busy = busyKey === addon.key
            return (
              <div
                key={addon.key}
                className={cn(
                  "bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all",
                  isActive ? "border-[var(--brand)] shadow-[0_0_0_2px_#2563EB15]" : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.colour + "15" }}>
                    <div style={{ color: m.colour }}><Icon className="w-5 h-5" /></div>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">{addon.name}</h3>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">{addon.description}</p>
                  {addon.eligibility && (
                    <p className="text-[10px] text-slate-400 mt-1">{addon.eligibility}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-[14px] font-bold text-slate-900">{priceLabel(addon.amount, addon.interval)}</p>
                  <button
                    onClick={() => changeAddon(addon.key, isActive ? "remove" : "add")}
                    disabled={busy}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 disabled:opacity-60",
                      isActive ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
                    )}
                  >
                    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {busy ? "Saving…" : isActive ? "Remove" : "Add"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[11.5px] text-slate-400 text-center mt-6">
        Add-ons apply immediately and are pro-rated on your next invoice. Remove anytime.
      </p>
    </div>
  )
}
