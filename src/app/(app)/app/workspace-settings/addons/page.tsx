"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, Users, HardDrive, Globe, Key, BarChart3, Truck, Plug, Headphones, Check } from "lucide-react"

type AddonStatus = "not_purchased" | "active"

interface Addon {
  key: string
  name: string
  desc: string
  price: string
  status: AddonStatus
  icon: React.ElementType
  colour: string
  planRequired?: string
}

const ADDONS: Addon[] = [
  { key: "ai-credits-pack",    name: "AI Credit Pack",         desc: "500 additional AI credits per month",             price: "£19/mo",  status: "not_purchased", icon: Sparkles,   colour: "#7C3AED" },
  { key: "extra-users",        name: "Extra Users (5 pack)",   desc: "Add 5 more team member seats",                    price: "£15/mo",  status: "not_purchased", icon: Users,      colour: "#2563EB" },
  { key: "extra-storage",      name: "Extra Storage (50GB)",   desc: "50GB additional document storage",                price: "£9/mo",   status: "not_purchased", icon: HardDrive,  colour: "#059669" },
  { key: "white-label",        name: "White Label",            desc: "Custom branding, hide Propvora logo",             price: "£39/mo",  status: "not_purchased", icon: Globe,      colour: "#D97706", planRequired: "Agency"     },
  { key: "saml-sso",           name: "SAML / SSO",             desc: "Enterprise single sign-on with SAML 2.0",         price: "£49/mo",  status: "not_purchased", icon: Key,        colour: "#DC2626", planRequired: "Enterprise" },
  { key: "advanced-reporting", name: "Advanced Reporting",     desc: "Custom reports, PDF exports, data visualisations",price: "£19/mo",  status: "not_purchased", icon: BarChart3,  colour: "#2563EB" },
  { key: "supplier-portal",    name: "Supplier Portal Pro",    desc: "Advanced supplier messaging and portal features", price: "£14/mo",  status: "not_purchased", icon: Truck,      colour: "#D97706" },
  { key: "api-webhooks",       name: "API & Webhooks",         desc: "REST API access and webhook integrations",        price: "£29/mo",  status: "not_purchased", icon: Plug,       colour: "#7C3AED" },
  { key: "priority-support",   name: "Priority Support",       desc: "Dedicated support with 4hr response SLA",         price: "£29/mo",  status: "not_purchased", icon: Headphones, colour: "#059669" },
]

export default function AddonsPage() {
  const [activeAddons, setActiveAddons] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setActiveAddons(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalMonthly = ADDONS.filter(a => activeAddons.has(a.key) && a.price !== "Custom")
    .reduce((sum, a) => sum + parseFloat(a.price.replace("£", "").replace("/mo", "")), 0)

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Add-ons</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Extend your workspace with premium features</p>
      </div>

      {/* Active addons summary */}
      {activeAddons.size > 0 && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1e3a8a]">{activeAddons.size} add-on{activeAddons.size > 1 ? "s" : ""} selected</p>
              <p className="text-[11.5px] text-[#3b82f6]">Total addition: £{totalMonthly.toFixed(0)}/mo</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[12.5px] font-semibold hover:bg-[#1d4ed8] transition-colors">
            Confirm & subscribe
          </button>
        </div>
      )}

      {/* Addon grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADDONS.map(addon => {
          const Icon = addon.icon
          const isActive = activeAddons.has(addon.key)
          return (
            <div
              key={addon.key}
              className={cn(
                "bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all",
                isActive ? "border-[#2563EB] shadow-[0_0_0_2px_#2563EB15]" : "border-slate-200"
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: addon.colour + "15" }}
                >
                  <div style={{ color: addon.colour }}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                {addon.planRequired && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    {addon.planRequired}+
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-slate-900">{addon.name}</h3>
                <p className="text-[11.5px] text-slate-500 mt-0.5">{addon.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-[14px] font-bold text-slate-900">{addon.price}</p>
                <button
                  onClick={() => toggle(addon.key)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-colors",
                    isActive
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                  )}
                >
                  {isActive ? "Remove" : "Add"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Note */}
      <p className="text-[11.5px] text-slate-400 text-center mt-6">
        Add-ons are billed monthly alongside your main subscription. Cancel anytime with no long-term commitment.
      </p>
    </div>
  )
}
