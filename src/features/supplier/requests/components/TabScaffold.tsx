"use client"

import React from "react"
import {
  SupplierCard,
  SupplierLoadingState,
  SupplierEmptyState,
  SupplierErrorState,
  SupplierPermissionDenied,
} from "@/components/supplier-workspace/ui"
import type { RequestsEnvelope } from "../data/types"

/* ──────────────────────────────────────────────────────────────────────────
   TabScaffold — wraps the standard loading / error / permission / empty
   branches every Requests tab needs, then renders `children` on success.
─────────────────────────────────────────────────────────────────────────── */

export function TabStateGate<T>({
  env,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}: {
  env: RequestsEnvelope<T>
  isEmpty: boolean
  emptyIcon?: React.ReactNode | React.ElementType
  emptyTitle: string
  emptyDescription?: string
  children: React.ReactNode
}) {
  if (env.loading) {
    return (
      <SupplierCard className="p-5">
        <SupplierLoadingState rows={6} />
      </SupplierCard>
    )
  }
  if (env.permissionDenied) {
    return (
      <SupplierPermissionDenied
        title="You don't have access to requests"
        description="Your role in this supplier workspace doesn't include the sales pipeline. Ask an owner to grant access."
      />
    )
  }
  if (env.error) {
    return (
      <SupplierErrorState
        title="Couldn't load requests"
        description={env.error}
        onRetry={env.reload}
      />
    )
  }
  if (isEmpty) {
    return (
      <SupplierCard className="p-5">
        <SupplierEmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      </SupplierCard>
    )
  }
  return <>{children}</>
}

/** Small "demo data" pill shown when a tab is rendering seed rather than live. */
export function SourceHint({ source }: { source: "live" | "seed" }) {
  if (source === "live") return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
      Demo data
    </span>
  )
}
