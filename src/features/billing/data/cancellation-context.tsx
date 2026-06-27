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

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useCancellation, useSubscription } from "./hooks"
import { requestCancellation, requestResume, getRetentionEligibility, claimRetentionOffer } from "./stripe-link"
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
  /** Claim the retention offer via the real backend. Returns true on success. */
  claimRetention: () => Promise<boolean>
  retentionClaimed: boolean
  /** Server-authoritative: is the offer available (one-time · Starter · paid · 3mo)? */
  retentionEligible: boolean
  /** 2-month credit in pence, when eligible. */
  retentionCreditMinor: number | null
  retentionError: string | null
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
  const [retentionEligible, setRetentionEligible] = useState(false)
  const [retentionCreditMinor, setRetentionCreditMinor] = useState<number | null>(null)
  const [retentionError, setRetentionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Server-authoritative eligibility — the offer is hidden unless the backend
  // confirms one-time · Starter-only · paid+active · ≥3-months-subscribed.
  useEffect(() => {
    let active = true
    ;(async () => {
      const e = await getRetentionEligibility()
      if (!active) return
      setRetentionEligible(!!e.eligible)
      setRetentionCreditMinor(e.creditMinor ?? null)
    })()
    return () => { active = false }
  }, [])

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
      retentionEligible,
      retentionCreditMinor,
      retentionError,
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
      claimRetention: async () => {
        setBusy(true)
        setRetentionError(null)
        try {
          await claimRetentionOffer()
          setRetentionClaimed(true)
          setRetentionEligible(false)
          return true
        } catch (e) {
          setRetentionError(e instanceof Error ? e.message : "Could not claim the retention offer")
          return false
        } finally {
          setBusy(false)
        }
      },
    }),
    [view, busy, error, retentionClaimed, retentionEligible, retentionCreditMinor, retentionError, existing, sub.currentPeriodEnd],
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
