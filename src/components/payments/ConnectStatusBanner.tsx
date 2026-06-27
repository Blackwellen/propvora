"use client"

import { useState } from "react"
import { Landmark, ShieldCheck, AlertTriangle, ExternalLink, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ConnectBannerState {
  connected: boolean
  status: string // none | pending | active | restricted | disabled
  payoutsEnabled: boolean
}

/* Connect-account status banner. Links to (or starts) the existing Connect
   onboarding when payouts aren't yet set up. Honest about state — never claims
   payouts are live unless the account reports payouts_enabled. */
export default function ConnectStatusBanner({ state }: { state: ConnectBannerState }) {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = state.payoutsEnabled && state.status === "active"

  async function startOnboarding() {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        setError(
          (data?.error as string) ??
            "Connecting a payout account isn't available yet. Please try again later."
        )
        return
      }
      window.location.href = data.url as string
    } catch {
      setError("Couldn't start onboarding. Please try again.")
    } finally {
      setStarting(false)
    }
  }

  if (active) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
        <span className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-emerald-800">Payouts are active</p>
          <p className="text-[12px] text-emerald-700">
            Your connected Stripe account is set up to receive released escrow funds.
          </p>
        </div>
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 hidden sm:block" />
      </div>
    )
  }

  const restricted = state.status === "restricted" || state.status === "disabled"
  const pending = state.connected && state.status === "pending"

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border",
        restricted ? "bg-orange-50 border-orange-200" : "bg-[var(--brand-soft)] border-[var(--color-brand-100)]"
      )}
    >
      <span
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          restricted ? "bg-orange-100" : "bg-[var(--color-brand-100)]"
        )}
      >
        {restricted ? (
          <AlertTriangle className="w-4.5 h-4.5 text-orange-600" />
        ) : (
          <Landmark className="w-4.5 h-4.5 text-[var(--brand)]" />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-semibold", restricted ? "text-orange-800" : "text-[var(--brand-strong)]")}>
          {restricted
            ? "Action needed on your payout account"
            : pending
            ? "Finish setting up your payout account"
            : "Set up payouts to get paid"}
        </p>
        <p className={cn("text-[12px]", restricted ? "text-orange-700" : "text-[var(--brand-strong)]")}>
          {restricted
            ? "Stripe needs more details before payouts can be released to you."
            : pending
            ? "Your Stripe onboarding is in progress — complete it to start receiving payouts."
            : "Connect your own Stripe account so released escrow funds settle directly to you."}
        </p>
        {error && <p className="text-[12px] text-red-600 mt-1">{error}</p>}
      </div>
      <button
        type="button"
        onClick={startOnboarding}
        disabled={starting}
        className="shrink-0 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold bg-[var(--brand-strong)] text-white hover:bg-[#1A45BE] transition-colors disabled:opacity-60 min-h-[44px]"
      >
        {starting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {pending || restricted ? "Continue setup" : "Connect Stripe"}
            <ExternalLink className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  )
}
