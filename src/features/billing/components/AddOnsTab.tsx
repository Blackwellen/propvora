"use client"

import React, { useState } from "react"
import { Puzzle, CheckCircle2 } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useActiveAddons, useAddonFeatureFlags, useBillingRole, useSubscription } from "../data/hooks"
import { SEED_ADDON_CATALOG } from "../data/seed"
import { addonMonthlyPence } from "../data/calc"
import { addonAvailableForPlan, type SubscriptionAddon } from "../data/types"
import { applyAddonChange, catalogKeyForAddon, oneOffCatalogKeyForAddon, startAddonOneOffCheckout } from "../data/stripe-link"
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
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null)
  const [pendingCode, setPendingCode] = useState<string | null>(null)
  const [errorByCode, setErrorByCode] = useState<Record<string, string>>({})

  function setAddon(code: string, patch: Partial<SubscriptionAddon>) {
    setAddons((prev) => prev.map((a) => (a.code === code ? { ...a, ...patch } : a)))
    setConfirmedCode(null)
  }

  // Apply the add-on change through the real /api/billing/addons endpoint.
  // The route validates the catalogue key, mutates the Stripe subscription item
  // (Stripe handles proration) and writes the DB + event rows. Add-ons without a
  // configured Stripe price surface an honest message rather than silently no-op.
  async function confirmAddon(code: string) {
    const a = addons.find((x) => x.code === code)
    if (!a) return
    setErrorByCode((prev) => ({ ...prev, [code]: "" }))
    setPendingCode(code)
    try {
      const action = !a.enabled ? "remove" : "set_quantity"
      await applyAddonChange({ code: a.code, action, quantity: a.quantity })
      setConfirmedCode(code)
    } catch (e) {
      setErrorByCode((prev) => ({
        ...prev,
        [code]: e instanceof Error ? e.message : "Could not apply the change.",
      }))
    } finally {
      setPendingCode(null)
    }
  }

  // One-time packs (e.g. AI credit pack) are bought via a payment-mode Stripe
  // Checkout. quantity is the number of 1,000-credit packs (5,000 = 5 packs).
  async function buyOneOff(item: (typeof SEED_ADDON_CATALOG)[number]) {
    const a = addons.find((x) => x.code === item.code)
    if (!a) return
    const pack = item.creditPacks?.[Math.min(Math.max(0, a.quantity), (item.creditPacks?.length ?? 1) - 1)]
    const packs = Math.max(1, Math.round((pack?.credits ?? 1000) / 1000))
    setErrorByCode((prev) => ({ ...prev, [item.code]: "" }))
    setPendingCode(item.code)
    try {
      await startAddonOneOffCheckout({ code: item.code, quantity: packs })
      // success → browser redirects to Stripe; line below is unreached.
    } catch (e) {
      setErrorByCode((prev) => ({
        ...prev,
        [item.code]: e instanceof Error ? e.message : "Could not start checkout.",
      }))
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
          // One-time packs (AI credit pack) buy via payment-mode checkout, not a
          // recurring on/off subscription item — so no enable toggle.
          const oneOff = item.unit === "credit_pack" && !!oneOffCatalogKeyForAddon(item.code)
          const selectedPack = oneOff ? item.creditPacks?.[Math.min(Math.max(0, a.quantity), (item.creditPacks?.length ?? 1) - 1)] : undefined
          return (
            <BillingCard key={item.code} icon={Puzzle} title={item.name} description={item.description}
              action={oneOff ? undefined : <Toggle label={`Toggle ${item.name}`} checked={a.enabled} disabled={!canManageBilling} onChange={(v) => setAddon(item.code, { enabled: v })} />}
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

                {(oneOff || a.enabled) && item.unit === "credit_pack" && item.creditPacks && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">Credit pack</span>
                    <select
                      value={a.quantity}
                      onChange={(e) => setAddon(item.code, { quantity: Number(e.target.value) })}
                      disabled={!canManageBilling}
                      className="rounded-xl border border-slate-200 text-[12px] px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                    >
                      {item.creditPacks.map((cp, i) => (
                        <option key={cp.label} value={i}>{cp.label} — {formatPence(cp.pricePence)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="rounded-xl bg-slate-50 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">{oneOff ? "One-time charge" : "Preview total"}</span>
                  <span className="text-[13px] font-bold text-slate-900">
                    {oneOff
                      ? `${formatPence(selectedPack?.pricePence ?? item.unitPricePence)} once`
                      : a.enabled ? `${formatPence(monthly)}/mo · ${formatPence(yearly)}/yr` : "Not added"}
                  </span>
                </div>

                {(() => {
                  const recurring = !!catalogKeyForAddon(item.code)
                  const unavailable = !oneOff && !recurring
                  return (
                    <>
                      {unavailable && (
                        <p className="text-[11px] text-amber-600">Not yet available for self-serve purchase — contact billing to enable.</p>
                      )}
                      {errorByCode[item.code] && (
                        <p className="text-[11px] text-red-600">{errorByCode[item.code]}</p>
                      )}

                      <div className="flex items-center justify-between">
                        {oneOff ? (
                          <StatusBadge tone="blue">One-time</StatusBadge>
                        ) : a.enabled ? (
                          <StatusBadge tone="emerald">Active</StatusBadge>
                        ) : (
                          <StatusBadge tone="slate">Off</StatusBadge>
                        )}
                        {oneOff ? (
                          <BillingButton
                            variant="primary"
                            className="text-[12px] px-3 py-1.5"
                            disabled={!canManageBilling || pendingCode === item.code}
                            onClick={() => void buyOneOff(item)}
                          >
                            {pendingCode === item.code ? "Redirecting…" : "Buy now"}
                          </BillingButton>
                        ) : (
                          <BillingButton
                            variant="secondary"
                            className="text-[12px] px-3 py-1.5"
                            disabled={!canManageBilling || pendingCode === item.code || !recurring}
                            onClick={() => void confirmAddon(item.code)}
                          >
                            {pendingCode === item.code
                              ? "Saving…"
                              : confirmedCode === item.code
                                ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>
                                : "Confirm change"}
                          </BillingButton>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            </BillingCard>
          )
        })}
      </div>

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
