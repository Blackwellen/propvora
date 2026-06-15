"use client"

import React, { useState } from "react"
import {
  CreditCard, AlertCircle, RefreshCw, FileText, Sparkles, Truck, Zap,
  CheckCircle, XCircle, ExternalLink, ChevronRight, Shield, Info,
  ToggleLeft, ToggleRight, AlertTriangle, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav } from "@/components/money/MoneyTabNav"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type EnvVar = {
  key: string
  configured: boolean
  description: string
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */
const ENV_VARS: EnvVar[] = [
  { key: "STRIPE_SECRET_KEY",                configured: false, description: "Server-side Stripe secret key" },
  { key: "STRIPE_PUBLISHABLE_KEY",           configured: false, description: "Public key for front-end" },
  { key: "STRIPE_WEBHOOK_SECRET",            configured: false, description: "Webhook endpoint signing secret" },
  { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", configured: false, description: "Public key exposed to browser" },
]

const FEATURES = [
  {
    icon: FileText,
    title: "Invoice Payment Links",
    description: "Send invoices with an embedded pay button so tenants and clients can pay instantly online.",
    colour: "#2563EB",
    bg: "bg-blue-50",
  },
  {
    icon: CreditCard,
    title: "Card Payments",
    description: "Accept credit and debit card payments from tenants, clients and suppliers.",
    colour: "#059669",
    bg: "bg-emerald-50",
  },
  {
    icon: Truck,
    title: "Supplier Payouts",
    description: "Pay approved supplier bills directly from Propvora via Stripe Connect payouts.",
    colour: "#7C3AED",
    bg: "bg-violet-50",
  },
  {
    icon: Zap,
    title: "Webhook Events",
    description: "Automatic payment status updates — invoices marked paid the moment Stripe confirms.",
    colour: "#D97706",
    bg: "bg-amber-50",
  },
]

const SETUP_STEPS = [
  { step: 1, label: "Create a Stripe account",          done: false, link: "https://stripe.com/register" },
  { step: 2, label: "Add environment variables",        done: false, link: null },
  { step: 3, label: "Connect your Stripe account",      done: false, link: null },
  { step: 4, label: "Test with a Stripe test card",     done: false, link: "https://stripe.com/docs/testing" },
  { step: 5, label: "Go live with real payments",       done: false, link: null },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function StripePage() {
  const [testMode, setTestMode] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const allEnvMissing = ENV_VARS.every(v => !v.configured)

  return (
    <DashboardContainer>
      <PageHeader
        title="Stripe & Payments"
        actions={
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Refresh Status
          </button>
        }
      />

      <MoneyTabNav />

      {/* Not connected banner */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Stripe is not connected.</span>{" "}
          Connect your Stripe account to enable invoice payment links, receive card payments, and pay suppliers via Stripe Connect.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ── MAIN COLUMN ── */}
        <div className="space-y-6">

          {/* Connection status card */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <div style={{ color: "#7C3AED" }}><CreditCard className="w-8 h-8" /></div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Stripe Account Not Connected</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Connect Stripe to start accepting card payments, sending invoice pay links and paying suppliers directly.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Not Connected
              </span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-lg shadow-blue-500/20"
                style={{ backgroundColor: "#2563EB" }}
              >
                <CreditCard className="w-4 h-4" />
                Connect Stripe Account
              </button>
              <a
                href="https://stripe.com/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                View Stripe Docs
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Test mode toggle */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="text-sm text-slate-500">Test Mode</span>
              <button
                onClick={() => setTestMode(v => !v)}
                className="flex items-center gap-1 focus:outline-none"
              >
                {testMode
                  ? <div style={{ color: "#2563EB" }}><ToggleRight className="w-8 h-8" /></div>
                  : <ToggleLeft className="w-8 h-8 text-slate-400" />}
              </button>
              <span className={cn("text-sm font-medium", testMode ? "text-blue-600" : "text-slate-400")}>
                {testMode ? "Enabled" : "Disabled"}
              </span>
            </div>
            {!testMode && (
              <div className="mt-2 flex items-center justify-center gap-2 text-amber-700 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                Live mode requires completed Stripe onboarding with verified identity and bank details.
              </div>
            )}
          </div>

          {/* What you get with Stripe */}
          <div>
            <h2 className="text-base font-semibold text-slate-800 mb-4">What you get with Stripe</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map(f => {
                const Icon = f.icon
                return (
                  <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 flex gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", f.bg)}>
                      <div style={{ color: f.colour }}><Icon className="w-5 h-5" /></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{f.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Environment variables status */}
          <div className={cn(
            "rounded-2xl border p-5",
            allEnvMissing ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
          )}>
            <div className="flex items-center gap-2 mb-4">
              {allEnvMissing
                ? <AlertCircle className="w-4 h-4 text-amber-600" />
                : <CheckCircle className="w-4 h-4 text-emerald-600" />}
              <h2 className="text-sm font-semibold text-slate-800">Environment Variables</h2>
              {allEnvMissing && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                  Not configured
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {ENV_VARS.map(v => (
                <div key={v.key} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  {v.configured
                    ? <div style={{ color: "#059669" }}><CheckCircle className="w-4 h-4" /></div>
                    : <XCircle className="w-4 h-4 text-red-400" />}
                  <code className="text-xs font-mono font-semibold text-slate-700 flex-1">{v.key}</code>
                  <span className="text-[11px] text-slate-500">{v.description}</span>
                  <span className={cn(
                    "text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
                    v.configured ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  )}>
                    {v.configured ? "Set" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Variable values are never displayed. Status only shows whether the key is present.
            </p>
          </div>

          {/* Compliance disclaimer */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex gap-3">
            <Shield className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Compliance disclaimer:</span>{" "}
              Payments are processed by Stripe or the configured third-party provider. Propvora tracks payment status and workflow records but does not hold client money unless a regulated payment setup is separately configured.
            </p>
          </div>

          {/* Recent payment events — empty state */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Recent Payment Events</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Event","Type","Amount","Contact","Status","Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <div style={{ color: "#7C3AED" }}><CreditCard className="w-6 h-6" /></div>
                        </div>
                        <p className="text-sm font-medium text-slate-600">No payment events yet</p>
                        <p className="text-xs text-slate-500 max-w-xs">Connect Stripe to start receiving payment data and automatic status updates.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Test / Live mode */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Test Mode vs Live Mode</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cn("rounded-xl p-4 border", testMode ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50")}>
                <p className="text-sm font-semibold text-slate-800 mb-1">Test Mode</p>
                <p className="text-xs text-slate-500">Use Stripe test cards. No real money moves. Safe for development and demos.</p>
                {testMode && <span className="inline-block mt-2 text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Active</span>}
              </div>
              <div className={cn("rounded-xl p-4 border", !testMode ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
                <p className="text-sm font-semibold text-slate-800 mb-1">Live Mode</p>
                <p className="text-xs text-slate-500">Real payments processed. Requires completed Stripe KYC and verified bank account.</p>
                {!testMode && <span className="inline-block mt-2 text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-semibold">Active</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT RAIL ── */}
        <div className="space-y-5">

          {/* Setup guide */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Setup Guide</h2>
            </div>
            <div className="p-4 space-y-3">
              {SETUP_STEPS.map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5",
                    s.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {s.done ? <CheckCircle className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-xs font-medium", s.done ? "text-slate-400 line-through" : "text-slate-700")}>{s.label}</p>
                    {s.link && !s.done && (
                      <a href={s.link} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                        View docs <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stripe pricing */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Stripe Pricing</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Standard card payments: <strong className="text-slate-700">1.5% + 20p</strong> per transaction (European cards). Payout fees vary by country.
            </p>
            <a
              href="https://stripe.com/gb/pricing"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              Full pricing details <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Support */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Need help?</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Our support team can help you connect Stripe and configure webhooks.
            </p>
            <button className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}
