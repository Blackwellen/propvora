"use client"

import { useState } from "react"
import {
  ChevronRight,
  HelpCircle,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Webhook,
  LifeBuoy,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookEvent {
  name: string
}

// ─── Static data ──────────────────────────────────────────────────────────────

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { name: "payment_intent.succeeded" },
  { name: "invoice.paid" },
  { name: "invoice.payment_failed" },
  { name: "customer.subscription.updated" },
]

const ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PK",
]

const SETUP_STEPS = [
  "Create a Stripe account at stripe.com",
  "Get your API keys from Dashboard > Developers",
  "Add keys to your .env.local file",
  "Click Connect Stripe Account above",
  "Test with a test payment",
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({
  enabled,
  disabled,
  onChange,
}: {
  enabled: boolean
  disabled?: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors focus:outline-none shrink-0",
        enabled && !disabled
          ? "bg-blue-600"
          : disabled
          ? "bg-slate-200 cursor-not-allowed opacity-60"
          : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
          enabled ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  )
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-100 shadow-sm p-6",
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsStripePage() {
  const [stripeConnected, setStripeConnected] = useState(false)
  const [testMode, setTestMode] = useState(true)
  const [paymentLinksEnabled, setPaymentLinksEnabled] = useState(false)
  const [cardPaymentsEnabled, setCardPaymentsEnabled] = useState(false)
  const [supplierPayoutsEnabled, setSupplierPayoutsEnabled] = useState(false)
  const [autoReconcileEnabled, setAutoReconcileEnabled] = useState(false)
  const [showConnectFlow, setShowConnectFlow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  function handleConnect() {
    setShowConnectFlow(true)
    setTimeout(() => {
      setShowConnectFlow(false)
      showToast("Redirecting to Stripe Connect...")
    }, 1500)
  }

  function handleCopyGuide() {
    void navigator.clipboard
      .writeText(ENV_VARS.join("\n"))
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        showToast("Copy failed — please copy manually")
      })
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Page top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
          <span>Settings</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-slate-700 font-medium">Payments & Stripe</span>
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Payments & Stripe
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage your payment processing, Stripe account and supplier
              payouts.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => showToast("Opening help centre...")}
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => showToast("Exporting config...")}
            >
              <Download className="w-4 h-4" />
              Export Config
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-6 p-6 max-w-[1400px] mx-auto w-full items-start">
        {/* LEFT 60% */}
        <div className="flex flex-col gap-5 flex-[3] min-w-0">
          {/* A. Stripe Account Connection */}
          <SectionCard>
            {/* Stripe logo placeholder */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-black tracking-tighter text-violet-600">
                STRIPE
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Connect your Stripe account to enable payment links, online card
              payments and supplier payouts.
            </p>

            {!stripeConnected ? (
              <>
                {/* Status badge */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                    <XCircle className="w-3.5 h-3.5" />
                    Not Connected
                  </span>
                </div>

                {/* Features checklist */}
                <ul className="flex flex-col gap-2 mb-6">
                  {[
                    "Invoice payment links",
                    "Card payments for tenants",
                    "Supplier payouts via Stripe Connect",
                    "Automatic reconciliation",
                  ].map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* Connect button */}
                <button
                  onClick={handleConnect}
                  disabled={showConnectFlow}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors",
                    showConnectFlow && "opacity-70 cursor-wait"
                  )}
                >
                  {showConnectFlow ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Stripe Account"
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 mt-3">
                  Already have an account?{" "}
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => showToast("Redirecting to Stripe sign in...")}
                  >
                    Sign in to Stripe →
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Connected
                  </span>
                </div>
                <button
                  onClick={() => setStripeConnected(false)}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Disconnect Stripe
                </button>
              </>
            )}
          </SectionCard>

          {/* B. Payment Features */}
          <SectionCard>
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Payment Features
            </h2>
            {!stripeConnected && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                Connect your Stripe account to enable these features.
              </p>
            )}
            <div className="flex flex-col divide-y divide-slate-50">
              {[
                {
                  label: "Payment Links",
                  desc: "Enable direct payment links on invoices",
                  value: paymentLinksEnabled,
                  onChange: setPaymentLinksEnabled,
                },
                {
                  label: "Card Payments",
                  desc: "Accept card payments from tenants",
                  value: cardPaymentsEnabled,
                  onChange: setCardPaymentsEnabled,
                },
                {
                  label: "Supplier Payouts",
                  desc: "Pay suppliers via Stripe Connect",
                  value: supplierPayoutsEnabled,
                  onChange: setSupplierPayoutsEnabled,
                },
                {
                  label: "Auto-reconciliation",
                  desc: "Match Stripe transactions automatically",
                  value: autoReconcileEnabled,
                  onChange: setAutoReconcileEnabled,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {row.label}
                    </p>
                    <p className="text-xs text-slate-400">{row.desc}</p>
                  </div>
                  <Toggle
                    enabled={row.value}
                    disabled={!stripeConnected}
                    onChange={row.onChange}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* C. Test Mode */}
          <SectionCard>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Test Mode
                </h2>
                <p className="text-xs text-slate-400">
                  Development Environment
                </p>
              </div>
              <Toggle
                enabled={testMode}
                onChange={(val) => {
                  setTestMode(val)
                  if (!val) showToast("Switching to live mode...")
                }}
              />
            </div>

            {testMode && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Test mode is currently active. Payments will not be processed.
                  Switch to live mode when ready to accept real payments.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setTestMode(false)
                showToast("Switching to live mode...")
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Switch to Live Mode
            </button>
          </SectionCard>

          {/* D. Environment Variables */}
          <SectionCard>
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Environment Variables
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Required keys for Stripe integration
            </p>
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs mb-4">
              {ENV_VARS.map((v) => (
                <div key={v} className="flex items-center justify-between py-1">
                  <span className="text-slate-300">{v}</span>
                  <span className="flex items-center gap-1.5 text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    Not configured
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleCopyGuide}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Setup Guide
                </>
              )}
            </button>
          </SectionCard>

          {/* E. Setup Guide */}
          <SectionCard>
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Setup Guide
            </h2>
            <ol className="flex flex-col gap-3">
              {SETUP_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-snug">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>

        {/* RIGHT 40% */}
        <div className="flex flex-col gap-5 flex-[2] min-w-0">
          {/* A. Stripe Connection Status */}
          <SectionCard>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Stripe Connection Status
            </h3>

            {/* Big status indicator */}
            <div className="flex flex-col items-center py-5 mb-4">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-3",
                  stripeConnected ? "bg-emerald-100" : "bg-red-100"
                )}
              >
                {stripeConnected ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
              </div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  stripeConnected ? "text-emerald-700" : "text-red-600"
                )}
              >
                {stripeConnected ? "Connected" : "Not Connected"}
              </p>
            </div>

            {/* Details table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              {[
                { label: "Account ID", value: "—" },
                { label: "Business Name", value: "—" },
                { label: "Environment", value: testMode ? "Test" : "Live" },
                { label: "Webhook", value: "Not configured" },
                { label: "Card Payments", value: "—" },
                { label: "Payouts", value: "—" },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm",
                    i % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                  )}
                >
                  <span className="text-slate-500">{row.label}</span>
                  <span className="text-slate-400 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* B. Webhook Events */}
          <SectionCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Webhook Events
              </h3>
              <button className="text-xs text-blue-600 hover:underline">
                View webhook log →
              </button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              <Webhook className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Webhook Status:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                Not configured
              </span>
            </div>

            {/* Events table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-3">
              <div className="grid grid-cols-3 px-4 py-2 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Event Type</span>
                <span>Status</span>
                <span>Last Received</span>
              </div>
              {WEBHOOK_EVENTS.map((event) => (
                <div
                  key={event.name}
                  className="grid grid-cols-3 px-4 py-2.5 text-xs border-t border-slate-50 opacity-50"
                >
                  <span className="text-slate-600 font-mono truncate">
                    {event.name}
                  </span>
                  <span className="text-slate-400">Inactive</span>
                  <span className="text-slate-400">Never</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => showToast("Opening webhook configuration...")}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Configure webhook →
            </button>
          </SectionCard>

          {/* C. Pricing Info */}
          <SectionCard>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Stripe Pricing Overview
            </h3>
            <ul className="flex flex-col gap-2 mb-4">
              {[
                { region: "UK", detail: "1.5% + 20p per successful card charge" },
                { region: "EU", detail: "1.5% + 20p for European cards" },
                { region: "International", detail: "2.9% + 30p" },
                { region: "Payouts", detail: "£0.25 per payout" },
              ].map((row) => (
                <li key={row.region} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>
                    <span className="font-medium text-slate-800">
                      {row.region}:
                    </span>{" "}
                    <span className="text-slate-500">{row.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="https://stripe.com/gb/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View full pricing at stripe.com
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </SectionCard>

          {/* D. Support */}
          <SectionCard>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <LifeBuoy className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Need help setting up Stripe?
                </h3>
                <div className="flex flex-col gap-2 mt-3">
                  <button
                    onClick={() => showToast("Opening documentation...")}
                    className="text-sm text-blue-600 hover:underline text-left flex items-center gap-1"
                  >
                    View setup documentation →
                  </button>
                  <button
                    onClick={() => showToast("Opening support chat...")}
                    className="text-sm text-blue-600 hover:underline text-left flex items-center gap-1"
                  >
                    Contact Propvora support →
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}
    </div>
  )
}
