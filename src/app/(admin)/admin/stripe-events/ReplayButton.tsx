"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { AdminConfirmDialog } from "@/components/admin/ui"
import { replayStripeEvent } from "./actions"

export default function ReplayButton({ eventId, type }: { eventId: string; type: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function confirm() {
    setError(null)
    startTransition(async () => {
      const res = await replayStripeEvent(eventId)
      if (!res.ok) { setError(res.error ?? "Replay failed."); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[#E2EAF6] text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Replay
      </button>
      <AdminConfirmDialog
        open={open}
        danger={false}
        title="Replay this webhook event?"
        description={`This requeues "${type}" for re-processing. The stored event is re-applied; no new charge is created.${error ? `\n\n${error}` : ""}`}
        confirmLabel="Replay event"
        busy={pending}
        onCancel={() => setOpen(false)}
        onConfirm={confirm}
      />
    </>
  )
}
