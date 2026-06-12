"use client"

import React, { useState } from "react"
import { Ban, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { setAffiliateSuspended } from "@/lib/admin/affiliate-actions"

export default function AffiliateActions({ workspaceId, approved }: { workspaceId: string; approved: boolean }) {
  const [busy, setBusy] = useState(false)
  const [isApproved, setIsApproved] = useState(approved)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      const res = await setAffiliateSuspended(workspaceId, isApproved) // if approved → suspend
      if (res.ok) setIsApproved((v) => !v)
      else setError(res.error ?? "Action failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-rose-600">{error}</span>}
      <Button variant={isApproved ? "outline" : "primary"} size="sm" onClick={toggle} disabled={busy}>
        {isApproved ? <><Ban className="w-3.5 h-3.5" /> Suspend</> : <><RotateCcw className="w-3.5 h-3.5" /> Reactivate</>}
      </Button>
    </div>
  )
}
