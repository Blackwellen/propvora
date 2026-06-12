"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Ban, RotateCcw, Archive, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { suspendWorkspace, restoreWorkspace, archiveWorkspace } from "../../actions"

interface Props {
  workspaceId: string
  workspaceName: string
  planStatus: string
}

export default function WorkspaceAdminActions({ workspaceId, workspaceName, planStatus }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isSuspended = planStatus === "suspended"
  const isArchived = planStatus === "canceled"

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    return async () => {
      setError(null)
      const res = await fn()
      if (!res.ok) {
        setError(res.error ?? "Action failed")
        return
      }
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

      {isSuspended ? (
        <ConfirmDialog
          title="Restore this workspace?"
          description={`Members of "${workspaceName}" will regain access immediately.`}
          confirmLabel="Restore workspace"
          confirmVariant="primary"
          onConfirm={run(() => restoreWorkspace(workspaceId))}
        >
          {(open) => (
            <Button variant="success" size="sm" className="w-full justify-start text-xs" onClick={open}>
              <RotateCcw className="w-3.5 h-3.5" /> Restore Workspace
            </Button>
          )}
        </ConfirmDialog>
      ) : (
        <ConfirmDialog
          title="Suspend this workspace?"
          description={`All members of "${workspaceName}" will lose access until it is restored. No data is deleted.`}
          confirmLabel="Suspend workspace"
          confirmVariant="danger"
          onConfirm={run(() => suspendWorkspace(workspaceId))}
        >
          {(open) => (
            <Button variant="warning" size="sm" className="w-full justify-start text-xs" onClick={open}>
              <Ban className="w-3.5 h-3.5" /> Suspend Workspace
            </Button>
          )}
        </ConfirmDialog>
      )}

      {isArchived ? (
        <ConfirmDialog
          title="Restore archived workspace?"
          description={`"${workspaceName}" will be reactivated.`}
          confirmLabel="Restore workspace"
          confirmVariant="primary"
          onConfirm={run(() => restoreWorkspace(workspaceId))}
        >
          {(open) => (
            <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={open}>
              <RotateCcw className="w-3.5 h-3.5" /> Restore from Archive
            </Button>
          )}
        </ConfirmDialog>
      ) : (
        <ConfirmDialog
          title="Archive this workspace?"
          description={`"${workspaceName}" will be marked cancelled and hidden from active use. This is reversible — no customer data is deleted.`}
          confirmLabel="Archive workspace"
          confirmVariant="danger"
          onConfirm={run(() => archiveWorkspace(workspaceId))}
        >
          {(open) => (
            <Button variant="destructive-soft" size="sm" className="w-full justify-start text-xs" onClick={open}>
              <Archive className="w-3.5 h-3.5" /> Archive Workspace
            </Button>
          )}
        </ConfirmDialog>
      )}
    </div>
  )
}
