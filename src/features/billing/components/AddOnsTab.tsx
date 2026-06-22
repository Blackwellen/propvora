"use client"

import React, { useState } from "react"
import { Puzzle, ExternalLink } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useActiveAddons, useAddonFeatureFlags, useBillingRole, useSubscription } from "../data/hooks"
import { SEED_ADDON_CATALOG } from "../data/seed"
import { addonMonthlyPence } from "../data/calc"
import { addonAvailableForPlan, type SubscriptionAddon } from "../data/types"
import { openBillingPortal } from "../data/stripe-link"
import { BillingCard, BillingButton, Toggle, QtyStepper, StatusBadge, PermissionNotice } from "./ui"

const UNIT_SUFFIX: Record<string, string> = {
  per_property: "props",
  per_seat: "seats",
  per_gb: "× 100GB",
  flat: "",
  credit_pack: "",
}

// Plain-English pricing basis shown under the unit price for clarity.
const UNIT_BASIS: Record<string, string> = {
  per_property: "per extra property / unit, per month",
  per_seat: "per additional team seat, per month",
  per_gb: "per 100 GB of storage, per month",
  flat: "flat monthly fee",
  credit_pack: "one-off credit pack",
}

export function AddOnsTab() {
  const { data: active } = useActiveAddons()
  const { canManageBilling } = useBillingRole()
  const { data: subscription } = useSubscription()
  const addonFlags = useAddonFeatureFlags()

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
  const [pendingCode, setPendingCode] = useState<string | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)

  function setAddon(code: string, patch: Partial<SubscriptionAddon>) {
    setAddons((prev) => prev.map((a) => (a.code === code ? { ...a, ...patch } : a)))
  }

  // Add-on changes are applied as Stripe subscription-item changes. There is no
  // bespoke add-on mutation endpoint yet (see report), so the honest path is the
  // Stripe billing portal, which applies the change with real Stripe proration.
  async function confirmAddon(code: string) {
    setPortalError(null)
    setPendingCode(code)
    try {
      await openBillingPortal()
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Add-on changes need an active subscription. They open in the Stripe portal once billing is connected.")
    } finally {
      setPendingCode(null)
    }
  }

  const available = SEED_ADDON_CATALOG.filter((c) => addonAvailableForPlan(c, subscription.planCode, "V1.5", addonFlags))
  const gated = SEED_ADDON_CATALOG.filter((c) => !addonAvailableForPlan(c, subscription.planCode, "V1.5", addonFlags))

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
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[12px] text-slate-500">Unit price</span>
                    <p className="text-[11px] text-slate-400">{UNIT_BASIS[item.unit]}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">
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

                {a.enabled && (
                  <p className="text-[11px] text-slate-400">Changes are prorated by Stripe for the remainder of your billing period.</p>
                )}

                <div className="flex items-center justify-between">
                  {a.enabled ? <StatusBadge tone="emerald">Selected</StatusBadge> : <StatusBadge tone="slate">Off</StatusBadge>}
                  <BillingButton
                    variant="secondary"
                    icon={ExternalLink}
                    className="text-[12px] px-3 py-1.5"
                    disabled={!canManageBilling || pendingCode === item.code}
                    onClick={() => confirmAddon(item.code)}
                  >
                    {pendingCode === item.code ? "Opening Stripe…" : "Confirm change"}
                  </BillingButton>
                </div>
              </div>
            </BillingCard>
          )
        })}
      </div>

      {portalError && (
        <p className="text-[12px] text-amber-600">{portalError}</p>
      )}

      {gated.length > 0 && (
        <BillingCard title="Plan or release gated">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gated.map((c) => (
              <div key={c.code} className="rounded-xl border border-dashed border-slate-200 px-3.5 py-3 opacity-70">
                <p className="text-[13px] font-semibold text-slate-700">{c.name}</p>
                <p className="text-[11.5px] text-slate-400">Requires {c.minPlan} or above · {c.releaseStage} release.</p>
              </div>
            ))}
          </div>
        </BillingCard>
      )}
    </div>
  )
}
