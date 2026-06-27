"use client"

import React from "react"
import { Link as LinkIcon } from "lucide-react"

export interface Integration {
  id: string
  name: string
  description?: string
  logoUrl?: string
  isConfigured: boolean
  isConnected: boolean
  requiresEnv?: boolean
}

export interface IntegrationStatsStripProps {
  total: number
  configured: number
  notConfigured: number
}

export function IntegrationStatsStrip({ total, configured, notConfigured }: IntegrationStatsStripProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: "Total integrations", value: total, color: "text-slate-900" },
        { label: "Configured", value: configured, color: "text-emerald-600" },
        { label: "Not configured", value: notConfigured, color: "text-slate-400" },
      ].map((stat) => (
        <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className={`text-[22px] font-black tabular-nums ${stat.color}`}>{stat.value}</p>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

export interface IntegrationGridProps {
  integrations: Integration[]
  onConnect: (id: string) => void
  onManage: (id: string) => void
}

export function IntegrationGrid({ integrations, onConnect, onManage }: IntegrationGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {integrations.map((intg) => (
        <div key={intg.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              {intg.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={intg.logoUrl} alt={intg.name} className="w-6 h-6 object-contain" />
              ) : (
                <LinkIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
            {intg.isConnected ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Connected
              </span>
            ) : intg.requiresEnv ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Env needed
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                Not configured
              </span>
            )}
          </div>
          <p className="text-[13px] font-bold text-slate-900 mb-0.5">{intg.name}</p>
          {intg.description && (
            <p className="text-[11.5px] text-slate-400 mb-3">{intg.description}</p>
          )}
          <button
            type="button"
            onClick={() => intg.isConnected ? onManage(intg.id) : onConnect(intg.id)}
            className={`w-full py-2 rounded-xl text-[12.5px] font-semibold transition-colors ${
              intg.isConnected
                ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                : "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
            }`}
          >
            {intg.isConnected ? "Manage" : "Connect"}
          </button>
        </div>
      ))}
    </div>
  )
}
