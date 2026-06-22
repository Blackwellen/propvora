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
// updates an in-memory overlay so the whole section reacts immediately. There
// is no server cancel-at-period-end endpoint yet (see report) — when a real
// Stripe subscription exists the action routes through the billing portal; the
// overlay reflects the user's intent consistently until a webhook syncs the DB.

import React, { createContext, useContext, useMemo, useState } from "react"
import { useCancellation, useSubscription } from "./hooks"
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
  /** Schedule cancel-at-period-end (in-session intent until webhook syncs). */
  schedule: (input: { reason?: string; detail?: string }) => void
  /** Resume / keep the subscription. */
  keep: () => void
  /** Mark the retention offer as claimed (in-session). */
  claimRetention: () => void
  retentionClaimed: boolean
}

const Ctx = createContext<CancellationCtx | null>(null)

export function CancellationProvider({ children }: { children: React.ReactNode }) {
  const { data: existing } = useCancellation()
  const { data: sub } = useSubscription()

  // overlay: null = follow DB; otherwise an in-session decision wins.
  const [overlay, setOverlay] = useState<CancellationRequest | null | "kept">(null)
  const [retentionClaimed, setRetentionClaimed] = useState(false)

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
      retentionClaimed: retentionClaimed || !!existing?.retentionOfferClaimed,
      schedule: ({ reason, detail }) =>
        setOverlay({
          id: "session",
          reason: reason ?? "",
          detail: detail ?? "",
          effectiveAt: sub.currentPeriodEnd,
          accessUntil: sub.currentPeriodEnd,
          dataRetentionDays: 90,
          retentionOfferClaimed: retentionClaimed,
          status: "scheduled",
        }),
      keep: () => setOverlay("kept"),
      claimRetention: () => setRetentionClaimed(true),
    }),
    [view, retentionClaimed, existing, sub.currentPeriodEnd],
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
