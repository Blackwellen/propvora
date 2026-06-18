"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Ban, RotateCcw, AlertTriangle, Check } from "lucide-react"
import { AdminConfirmDialog } from "@/components/admin/ui"
import { suspendUser, reactivateUser } from "@/app/(admin)/admin/actions"

/**
 * Customer-account admin actions (suspend / reactivate the owner). Wraps the
 * existing audited user server actions with a confirm dialog. No data is
 * deleted; suspension is enforced at the auth layer.
 */
export default function CustomerActions({ ownerId, name, suspended }: { ownerId: string; name: string; suspended: boolean }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dialog, setDialog] = useState<null | "suspend" | "reactivate">(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setBusy(true); setMsg(null)
    const res = await fn()
    setBusy(false); setDialog(null)
    if (!res.ok) { setMsg({ ok: false, text: res.error ?? "Action failed" }); return }
    setMsg({ ok: true, text: okText })
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-2">
      {msg && (
        <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
          {msg.ok ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}{msg.text}
        </span>
      )}
      {suspended ? (
        <button
          onClick={() => setDialog("reactivate")}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          <RotateCcw className="w-4 h-4" /> Reactivate
        </button>
      ) : (
        <button
          onClick={() => setDialog("suspend")}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-amber-200 bg-amber-50 text-[13px] font-semibold text-amber-700 hover:bg-amber-100"
        >
          <Ban className="w-4 h-4" /> Suspend
        </button>
      )}

      <AdminConfirmDialog
        open={dialog === "suspend"}
        title={`Suspend ${name}?`}
        description="Blocks the owner from signing in across all their workspaces. No data is deleted and this is reversible. The action is written to the audit log."
        confirmLabel="Suspend account"
        danger
        busy={busy}
        onConfirm={() => run(() => suspendUser(ownerId), "Customer suspended.")}
        onCancel={() => setDialog(null)}
      />
      <AdminConfirmDialog
        open={dialog === "reactivate"}
        title={`Reactivate ${name}?`}
        description="Lifts the suspension and restores sign-in access. Written to the audit log."
        confirmLabel="Reactivate"
        danger={false}
        busy={busy}
        onConfirm={() => run(() => reactivateUser(ownerId), "Customer reactivated.")}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}
