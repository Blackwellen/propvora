"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Ban, RotateCcw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { suspendUser, reactivateUser } from "../../actions"

interface Props {
  userId: string
  userName: string
}

export default function UserAdminActions({ userId, userName }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    return async () => {
      setError(null)
      setDone(null)
      const res = await fn()
      if (!res.ok) { setError(res.error ?? "Action failed"); return }
      setDone(successMsg)
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-700">{error}</p>
        </div>
      )}
      {done && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-[11px] text-emerald-700">{done}</p>
        </div>
      )}

      <ConfirmDialog
        title={`Suspend ${userName}?`}
        description="This blocks the user from signing in across all their workspaces. No data is deleted and it can be reversed."
        confirmLabel="Suspend account"
        confirmVariant="danger"
        onConfirm={run(() => suspendUser(userId), "User suspended.")}
      >
        {(open) => (
          <Button variant="warning" size="sm" className="w-full justify-start text-xs" onClick={open}>
            <Ban className="w-3.5 h-3.5" /> Suspend Account
          </Button>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        title={`Reactivate ${userName}?`}
        description="This lifts the suspension and restores sign-in access."
        confirmLabel="Reactivate account"
        confirmVariant="primary"
        onConfirm={run(() => reactivateUser(userId), "User reactivated.")}
      >
        {(open) => (
          <Button variant="success" size="sm" className="w-full justify-start text-xs" onClick={open}>
            <RotateCcw className="w-3.5 h-3.5" /> Reactivate Account
          </Button>
        )}
      </ConfirmDialog>
    </div>
  )
}
