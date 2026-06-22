"use client"

import { useEffect, useState } from "react"
import { Wallet, CheckCircle2, Loader2, ExternalLink, ShieldCheck, Landmark, AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"

interface ConnectStatus {
  enabled: boolean
  connected: boolean
  status: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  accountId: string | null
}

// ============================================================================
// Affiliate payout setup. Stripe Connect is the automated, internationally-
// aware rail — it onboards the affiliate in their own country, handles KYC/AML,
// and pays out in their local currency. Propvora never custodies these funds
// and never stores raw bank details. Manual bank transfer is offered as an
// at-payout fallback (details collected securely then, not stored here).
// ============================================================================
export default function AffiliatePayoutCard() {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<"stripe" | "manual">("stripe")

  useEffect(() => {
    let alive = true
    fetch("/api/connect/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: ConnectStatus) => { if (alive) setStatus(d) })
      .catch(() => { if (alive) setStatus(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  async function connect() {
    setBusy(true); setError(null)
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? "Couldn’t start payout setup. Please try again.")
        setBusy(false)
        return
      }
      window.location.assign(data.url)
    } catch {
      setError("Couldn’t start payout setup. Please try again.")
      setBusy(false)
    }
  }

  const connected = status?.connected && status?.payoutsEnabled
  const pending = status?.connected && !status?.payoutsEnabled

  return (
    <Card>
      <CardHeader><CardTitle>Payout method</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Checking your payout setup…</div>
        ) : status?.enabled === false ? (
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            Payouts open when the marketplace launches. Your earnings keep accruing in the meantime — you’ll be able to connect a payout account here.
          </div>
        ) : (
          <>
            {/* Method choice */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod("stripe")}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${method === "stripe" ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <Wallet className={`mt-0.5 h-5 w-5 shrink-0 ${method === "stripe" ? "text-[#2563EB]" : "text-slate-400"}`} />
                <div>
                  <p className="text-[13.5px] font-semibold text-slate-900">Stripe payouts <span className="ml-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">Recommended</span></p>
                  <p className="text-[12px] text-slate-500">Automated, paid in your local currency. Set up once.</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMethod("manual")}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${method === "manual" ? "border-[#2563EB] bg-blue-50/40" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <Landmark className={`mt-0.5 h-5 w-5 shrink-0 ${method === "manual" ? "text-[#2563EB]" : "text-slate-400"}`} />
                <div>
                  <p className="text-[13.5px] font-semibold text-slate-900">Manual bank transfer</p>
                  <p className="text-[12px] text-slate-500">We collect your bank details securely at payout time.</p>
                </div>
              </button>
            </div>

            {method === "stripe" ? (
              <div className="rounded-xl border border-slate-200 p-3.5">
                {connected ? (
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Stripe payouts active — you’re ready to be paid.
                  </div>
                ) : pending ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-700">
                      <AlertTriangle className="h-4 w-4" /> Stripe onboarding started but not finished.
                    </div>
                    <button onClick={connect} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 text-[13px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} Finish Stripe setup
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[12.5px] text-slate-600">Connect a Stripe account to receive automated payouts. Stripe verifies your identity and pays you in your local currency — Propvora never holds or sees your bank details.</p>
                    <button onClick={connect} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 text-[13px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />} Set up Stripe payouts
                    </button>
                  </div>
                )}
                {error && <p className="mt-2 text-[12px] text-rose-600">{error}</p>}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-3.5 text-[12.5px] text-slate-600 space-y-2">
                <p>Choose manual bank transfer and we’ll request your bank details over a secure form when your first payout is due — they’re never stored in the app before then.</p>
                <p className="flex items-center gap-1.5 text-[12px] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Same protections: encrypted in transit, AML checks, and a confirmation before any transfer.</p>
              </div>
            )}

            <p className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              Payouts are released only on cleared commission, after the referral’s chargeback window — so a refunded or charged-back referral can’t be paid out.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
