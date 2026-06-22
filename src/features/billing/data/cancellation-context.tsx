"use client"

// SINGLE SOURCE OF TRUTH for cancellation state across the Billing section.
//
// Previously the Cancellation panel held its own local `outcome` state while
// the right-rail Cancellation card read useCancellation() independently, so the
// two could DISAGREE (panel "Scheduled" vs rail "No cancellation scheduled").
// Both now consume this provider, mounted once in SubscriptionBillingPage, so
// they always render the same status.
//
// State is seeded from the live DB hook (useCancellation). Scheduling / keeping
// calls the REAL backend (/api/billing/cancel | /api/billing/resume) which sets
// cancel_at_period_end on Stripe and reconciles the DB. We keep an optimistic
// in-memory overlay so the whole section reacts immediately; a webhook then
// confirms the persisted state. If Stripe is not configured the route 503s and
// we surface the error honestly without faking a scheduled state.

import React, { createContext, useContext, useMemo, useState } from "react"
import { useCancellation, useSubscription } from "./hooks"
import { requestCancellation, requestResume } from "./stripe-link"
import type { CancellationRequest } from "./types"

export type CancellationView =
  | { scheduled: false }
  | {
      scheduled: true
      accessUntil: string | null
      effectiveAt: string | null
      dataRetentionDays: number
      retentionOfferClaimed: boolean
      /** True when this came from a live DB row rather than an in-session action. */
      persisted: boolean
    }

interface CancellationCtx {
  view: CancellationView
  /** Schedule cancel-at-period-end. Returns true on success. */
  schedule: (input: { reason?: string; detail?: string }) => Promise<boolean>
  /** Resume / keep the subscription. Returns true on success. */
  keep: () => Promise<boolean>
  /** Mark the retention offer as claimed (in-session). */
  claimRetention: () => void
  retentionClaimed: boolean
  busy: boolean
  error: string | null
}

const Ctx = createContext<CancellationCtx | null>(null)

export function CancellationProvider({ children }: { children: React.ReactNode }) {
  const { data: existing } = useCancellation()
  const { data: sub } = useSubscription()

  // overlay: null = follow DB; otherwise an in-session decision wins.
  const [overlay, setOverlay] = useState<CancellationRequest | null | "kept">(null)
  const [retentionClaimed, setRetentionClaimed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const view = useMemo<CancellationView>(() => {
    if (overlay === "kept") return { scheduled: false }
    const row = overlay ?? existing
    if (!row || row.status === "withdrawn") return { scheduled: false }
    return {
      scheduled: true,
      accessUntil: row.accessUntil ?? sub.currentPeriodEnd,
      effectiveAt: row.effectiveAt ?? sub.currentPeriodEnd,
      dataRetentionDays: row.dataRetentionDays ?? 90,
      retentionOfferClaimed: row.retentionOfferClaimed || retentionClaimed,
      persisted: overlay == null,
    }
  }, [overlay, existing, sub.currentPeriodEnd, retentionClaimed])

  const ctx = useMemo<CancellationCtx>(
    () => ({
      view,
      busy,
      error,
      retentionClaimed: retentionClaimed || !!existing?.retentionOfferClaimed,
      schedule: async ({ reason, detail }) => {
        setBusy(true)
        setError(null)
        try {
          const res = await requestCancellation({ reason, detail })
          setOverlay({
            id: "session",
            reason: reason ?? "",
            detail: detail ?? "",
            effectiveAt: res.accessUntil ?? sub.currentPeriodEnd,
            accessUntil: res.accessUntil ?? sub.currentPeriodEnd,
            dataRetentionDays: 90,
            retentionOfferClaimed: retentionClaimed,
            status: "scheduled",
          })
          return true
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not schedule cancellation")
          return false
        } finally {
          setBusy(false)
        }
      },
      keep: async () => {
        setBusy(true)
        setError(null)
        try {
          await requestResume()
          setOverlay("kept")
          return true
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not resume your subscription")
          return false
        } finally {
          setBusy(false)
        }
      },
      claimRetention: () => setRetentionClaimed(true),
    }),
    [view, busy, error, retentionClaimed, existing, sub.currentPeriodEnd],
  )

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function useCancellationState(): CancellationCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error("useCancellationState must be used within a CancellationProvider")
  }
  return ctx
}
