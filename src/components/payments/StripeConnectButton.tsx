"use client"

import { useEffect, useState } from "react"
import { CreditCard, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/Button"

/**
 * Connect-status-aware "Pay via Stripe" button.
 *
 * Replaces hardcoded-disabled Stripe buttons. It reads the live workspace
 * Connect status from /api/connect/status and renders the honest state:
 *   - feature OFF (NEXT_PUBLIC_FF_STRIPE_CONNECT not set) → disabled with a
 *     truthful reason (V1 default — "stays correctly disabled until enabled").
 *   - feature ON, not connected / not finished → a real CTA that starts the
 *     Stripe Connect onboarding flow (POST /api/connect/onboard → redirect).
 *   - feature ON, connected + charges enabled → enabled button that calls
 *     `onReady` (e.g. open the Record Payment modal).
 *
 * No stubs: every reachable state performs a real action or is truthfully
 * disabled with a reason.
 */

interface ConnectStatusResponse {
  enabled?: boolean
  connected?: boolean
  status?: string
  chargesEnabled?: boolean
}

export function StripeConnectButton({
  onReady,
  label = "Pay via Stripe",
  size = "sm",
  fullWidth = false,
}: {
  onReady?: () => void
  label?: string
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}) {
  const [state, setState] = useState<ConnectStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let alive = true
    fetch("/api/connect/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setState(d) })
      .catch(() => { if (alive) setState(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const cls = fullWidth ? "w-full justify-start" : undefined
  const icon = <span style={{ color: "#7C3AED" }}><CreditCard className="w-4 h-4" /></span>

  if (loading) {
    return (
      <Button variant="outline" size={size} className={cls} disabled>
        <Loader2 className="w-4 h-4 animate-spin" /> {label}
      </Button>
    )
  }

  const enabled = !!state?.enabled
  const connected = !!state?.connected
  const chargesEnabled = !!state?.chargesEnabled

  // Feature off (V1 default) — truthfully disabled, no dead-end.
  if (!enabled) {
    return (
      <div title="Stripe payments aren't enabled for this workspace yet — enable Stripe Connect in Settings to collect card payments." className={fullWidth ? "w-full" : undefined}>
        <Button variant="outline" size={size} className={cls} disabled>
          {icon} {label}
        </Button>
      </div>
    )
  }

  // Feature on but not fully onboarded — real onboarding CTA.
  if (!connected || !chargesEnabled) {
    const onboard = async () => {
      setStarting(true)
      try {
        const res = await fetch("/api/connect/onboard", { method: "POST" })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.url) { window.location.href = data.url as string; return }
      } finally {
        setStarting(false)
      }
    }
    return (
      <Button variant="outline" size={size} className={cls} onClick={onboard} disabled={starting}>
        {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {connected ? "Finish Stripe setup" : "Set up Stripe"}
        <ExternalLink className="w-3.5 h-3.5" />
      </Button>
    )
  }

  // Connected + charges enabled — real action.
  return (
    <Button variant="outline" size={size} className={cls} onClick={onReady}>
      {icon} {label}
    </Button>
  )
}
