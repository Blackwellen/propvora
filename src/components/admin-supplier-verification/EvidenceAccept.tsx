"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"

type EvidenceTable =
  | "supplier_insurance_policies"
  | "supplier_licence_verifications"
  | "supplier_business_verifications"
  | "supplier_identity_documents"

/**
 * Inline accept / reject control for a single piece of evidence. Posts to the
 * guarded admin route (kind "evidence"), which records an event + audit entry.
 * Hidden once the evidence is in a terminal state.
 */
export default function EvidenceAccept({
  table,
  id,
  status,
}: {
  table: EvidenceTable
  id: string
  status: string
}) {
  const router = useRouter()
  const [busy, setBusy] = React.useState<"accept" | "reject" | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const terminal = status === "accepted" || status === "rejected"
  if (terminal) return null

  async function act(accept: boolean) {
    setBusy(accept ? "accept" : "reject")
    setError(null)
    try {
      const res = await fetch("/api/admin/supplier-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "evidence", table, id, accept }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? `Failed (${res.status})`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" onClick={() => act(true)} disabled={busy !== null}>
        {busy === "accept" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-[#059669]" />}
        Accept
      </Button>
      <Button variant="outline" size="sm" onClick={() => act(false)} disabled={busy !== null}>
        {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5 text-[#EF4444]" />}
        Reject
      </Button>
      {error && <span className="text-[11px] text-[#EF4444]">{error}</span>}
    </div>
  )
}
