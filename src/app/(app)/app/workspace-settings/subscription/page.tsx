"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { CreditCard, AlertTriangle, ExternalLink, Check, X } from "lucide-react"

const PLANS = [
  { name: "Basic",      price: "£29/mo",  users: "3",         credits: "100",       storage: "5GB",       properties: "10",        colour: "#64748B", current: false },
  { name: "Pro",        price: "£79/mo",  users: "10",        credits: "500",       storage: "10GB",      properties: "50",        colour: "#2563EB", current: true  },
  { name: "Agency",     price: "£149/mo", users: "25",        credits: "2000",      storage: "50GB",      properties: "200",       colour: "#7C3AED", current: false },
  { name: "Enterprise", price: "Custom",  users: "Unlimited", credits: "Unlimited", storage: "Unlimited", properties: "Unlimited", colour: "#D97706", current: false },
]

export default function SubscriptionPage() {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Subscription</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Manage your plan, billing cycle and usage limits</p>
      </div>

      {/* Current plan card */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] rounded-2xl p-6 text-white mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-wide">Current Plan</p>
            <h2 className="text-[22px] font-black mt-1">Pro Plan</h2>
            <p className="text-[12px] text-blue-200 mt-0.5">Renews 1 January 2027 · Monthly billing</p>
          </div>
          <span className="bg-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl">Active</span>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/20">
          {[
            { label: "Users",      value: "3 / 10"        },
            { label: "AI Credits", value: "247 / 500"     },
            { label: "Storage",    value: "2.1GB / 10GB"  },
            { label: "Properties", value: "8 / 50"        },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] text-blue-200 uppercase tracking-wide">{item.label}</p>
              <p className="text-[14px] font-bold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Billing cycle toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Billing Cycle</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {billing === "annual" ? "Annual billing — you save 20%" : "Switch to annual billing and save 20%"}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(["monthly", "annual"] as const).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-all",
                  billing === cycle
                    ? "bg-white text-[#2563EB] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {cycle === "monthly" ? "Monthly" : "Annual · Save 20%"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={cn(
              "bg-white rounded-2xl border p-5 flex flex-col relative",
              plan.current ? "border-[#2563EB] shadow-[0_0_0_2px_#2563EB20]" : "border-slate-200"
            )}
          >
            {plan.current && (
              <span
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full text-white"
                style={{ backgroundColor: plan.colour }}
              >
                Current
              </span>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: plan.colour + "18" }}>
                <div style={{ color: plan.colour }}><CreditCard className="w-4 h-4" /></div>
              </div>
              <h3 className="text-[14px] font-bold text-slate-900">{plan.name}</h3>
            </div>
            <p className="text-[22px] font-black mb-4" style={{ color: plan.colour }}>{plan.price}</p>
            <div className="space-y-2 flex-1 mb-5">
              {[
                { label: "Users",      val: plan.users      },
                { label: "AI Credits", val: plan.credits    },
                { label: "Storage",    val: plan.storage    },
                { label: "Properties", val: plan.properties },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[11.5px] text-slate-500">{row.label}</span>
                  <span className="text-[11.5px] font-semibold text-slate-800">{row.val}</span>
                </div>
              ))}
            </div>
            {plan.current ? (
              <button
                className="w-full py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-500 cursor-default"
                disabled
              >
                Current Plan
              </button>
            ) : (
              <button
                className="w-full py-2.5 rounded-xl text-[12.5px] font-semibold text-white transition-colors"
                style={{ backgroundColor: plan.colour }}
              >
                {plan.name === "Basic" ? "Downgrade" : plan.name === "Enterprise" ? "Contact Sales" : "Upgrade"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Billing Actions</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/billing/portal", { method: "POST" })
                if (!res.ok) throw new Error("not_configured")
                const { url } = await res.json()
                if (url) window.open(url, "_blank")
              } catch {
                alert("Stripe billing portal is not configured. Set STRIPE_SECRET_KEY and STRIPE_PORTAL_RETURN_URL to enable it.")
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2563EB] text-[#2563EB] text-[13px] font-semibold hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Stripe billing portal
          </button>
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Cancel subscription
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Stripe portal not yet configured — billing portal will open once Stripe keys are set.
        </p>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-[420px] w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Cancel Subscription</h3>
                <p className="text-[12.5px] text-slate-500 mt-1">
                  Your workspace will remain active until the end of the current billing period (1 January 2027). After that, your account will be downgraded to a free plan.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-[12px] font-semibold text-amber-800">What you will lose:</p>
              <ul className="mt-2 space-y-1">
                {["AI Credits & Copilot access", "Additional team members", "Advanced features & integrations", "Priority support"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[12px] text-amber-700">
                    <X className="w-3 h-3 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Keep plan
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors">
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
