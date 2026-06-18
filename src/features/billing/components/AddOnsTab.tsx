"use client"

import React, { useState } from "react"
import { Puzzle, CheckCircle2 } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useActiveAddons, useBillingRole } from "../data/hooks"
import { SEED_ADDON_CATALOG } from "../data/seed"
import { addonMonthlyPence } from "../data/calc"
import type { SubscriptionAddon } from "../data/types"
import { BillingCard, BillingButton, Toggle, QtyStepper, StatusBadge, PermissionNotice } from "./ui"

const UNIT_SUFFIX: Record<string, string> = {
  per_property: "props",
  per_seat: "seats",
  per_gb: "× 100GB",
  flat: "",
  credit_pack: "",
}

export function AddOnsTab() {
  const { data: active } = useActiveAddons()
  const { canManageBilling } = useBillingRole()

  const [addons, setAddons] = useState<SubscriptionAddon[]>(
    SEED_ADDON_CATALOG.map((c) => {
      const existing = active.find((a) => a.code === c.code)
      return {
        code: c.code,
        enabled: existing?.enabled ?? false,
        quantity: existing?.quantity ?? (c.unit === "credit_pack" ? 0 : c.defaultQty),
      }
    }),
  )
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null)

  function setAddon(code: string, patch: Partial<SubscriptionAddon>) {
    setAddons((prev) => prev.map((a) => (a.code === code ? { ...a, ...patch } : a)))
    setConfirmedCode(null)
  }

  const available = SEED_ADDON_CATALOG.filter((c) => c.available)

  return (
    <div className="space-y-6">
      <PermissionNotice canManage={canManageBilling} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {available.map((item) => {
          const a = addons.find((x) => x.code === item.code)!
          const monthly = addonMonthlyPence(item, a)
          const yearly = monthly * 12
          return (
            <BillingCard key={item.code} icon={Puzzle} title={item.name} description={item.description}
              action={<Toggle label={`Toggle ${item.name}`} checked={a.enabled} disabled={!canManageBilling} onChange={(v) => setAddon(item.code, { enabled: v })} />}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">Unit price</span>
                  <span className="text-[13px] font-semibold text-slate-800">
                    {item.unit === "credit_pack" ? `from ${formatPence(item.unitPricePence)}` : `${formatPence(item.unitPricePence)}${item.unit === "flat" ? "/mo" : ""}`}
                  </span>
                </div>

                {a.enabled && item.hasQuantity && item.unit !== "credit_pack" && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">Quantity</span>
                    <QtyStepper value={a.quantity} onChange={(q) => setAddon(item.code, { quantity: q })} min={0} suffix={UNIT_SUFFIX[item.unit]} disabled={!canManageBilling} />
                  </div>
                )}

                {a.enabled && item.unit === "credit_pack" && item.creditPacks && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">Credit pack</span>
                    <select
                      value={a.quantity}
                      onChange={(e) => setAddon(item.code, { quantity: Number(e.target.value) })}
                      disabled={!canManageBilling}
                      className="rounded-xl border border-slate-200 text-[12px] px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    >
                      {item.creditPacks.map((cp, i) => (
                        <option key={cp.label} value={i}>{cp.label} — {formatPence(cp.pricePence)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="rounded-xl bg-slate-50 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">Preview total</span>
                  <span className="text-[13px] font-bold text-slate-900">
                    {a.enabled ? `${formatPence(monthly)}/mo · ${formatPence(yearly)}/yr` : "Not added"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {a.enabled ? <StatusBadge tone="emerald">Active</StatusBadge> : <StatusBadge tone="slate">Off</StatusBadge>}
                  <BillingButton
                    variant="secondary"
                    className="text-[12px] px-3 py-1.5"
                    disabled={!canManageBilling}
                    onClick={() => setConfirmedCode(item.code)}
                  >
                    {confirmedCode === item.code ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span> : "Confirm change"}
                  </BillingButton>
                </div>
              </div>
            </BillingCard>
          )
        })}
      </div>

      {SEED_ADDON_CATALOG.some((c) => !c.available) && (
        <BillingCard title="Coming soon">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SEED_ADDON_CATALOG.filter((c) => !c.available).map((c) => (
              <div key={c.code} className="rounded-xl border border-dashed border-slate-200 px-3.5 py-3 opacity-70">
                <p className="text-[13px] font-semibold text-slate-700">{c.name}</p>
                <p className="text-[11.5px] text-slate-400">Requires configuration — coming soon.</p>
              </div>
            ))}
          </div>
        </BillingCard>
      )}
    </div>
  )
}
