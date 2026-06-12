"use client"

import React, { useState, useEffect } from "react"
import { AlertTriangle, Loader2, LogOut, ArrowRightLeft, Archive, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  getDangerContext,
  leaveWorkspace,
  transferOwnership,
  archiveWorkspace,
  deleteWorkspace,
  type DangerContext,
} from "@/lib/actions/settings"

type RiskLevel = "medium" | "high" | "critical"

function DangerCard({
  icon,
  title,
  description,
  buttonLabel,
  onAction,
  risk,
  disabled,
  disabledReason,
}: {
  icon: React.ReactNode
  title: string
  description: string
  buttonLabel: string
  onAction: () => void
  risk: RiskLevel
  disabled?: boolean
  disabledReason?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-red-100 p-6 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wide">
                {risk}
              </span>
            </div>
            <p className="text-[12.5px] text-slate-500">{description}</p>
            {disabled && disabledReason && (
              <p className="text-[11.5px] text-amber-600 mt-1.5">{disabledReason}</p>
            )}
          </div>
        </div>
        <button
          onClick={onAction}
          disabled={disabled}
          className="px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-[12.5px] font-semibold hover:bg-red-50 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-[460px] mx-4 shadow-2xl border border-slate-200">
        {children}
      </div>
    </div>
  )
}

type ModalKind = "leave" | "transfer" | "archive" | "delete" | null

export default function DangerZonePage() {
  const router = useRouter()
  const [ctx, setCtx] = useState<DangerContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalKind>(null)
  const [confirmText, setConfirmText] = useState("")
  const [transferTarget, setTransferTarget] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDangerContext()
      .then(setCtx)
      .finally(() => setLoading(false))
  }, [])

  function close() {
    setModal(null)
    setConfirmText("")
    setTransferTarget("")
    setError(null)
    setBusy(false)
  }

  async function finish(result: { ok: boolean; error?: string; redirect?: string }) {
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.")
      setBusy(false)
      return
    }
    // Clear local Supabase session if the user is leaving access entirely
    if (result.redirect === "/login") {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.push(result.redirect ?? "/app")
    router.refresh()
  }

  const soleOwner = !!ctx?.isOwner && ctx.ownerCount <= 1

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ color: "#DC2626" }}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="text-[20px] font-bold text-red-900">Danger Zone</h1>
        </div>
        <p className="text-[13px] text-red-600">
          These actions are sensitive and audit logged. Proceed with caution.
        </p>
      </div>

      {/* Context banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
        <p className="text-[13px] text-red-700">
          {ctx
            ? `You are ${ctx.role ?? "a member"} of ${ctx.workspaceName} (${ctx.memberCount} member${ctx.memberCount === 1 ? "" : "s"}, ${ctx.ownerCount} owner${ctx.ownerCount === 1 ? "" : "s"}).`
            : "Could not determine your workspace context."}
        </p>
      </div>

      {/* 1. Leave workspace */}
      <DangerCard
        icon={<LogOut className="w-4 h-4" />}
        title="Leave Workspace"
        description="Remove yourself from this workspace. You will lose access until re-invited."
        buttonLabel="Leave workspace"
        onAction={() => setModal("leave")}
        risk="medium"
        disabled={soleOwner}
        disabledReason={soleOwner ? "You are the sole owner — transfer ownership or delete instead." : undefined}
      />

      {/* 2. Transfer ownership (owner-only) */}
      <DangerCard
        icon={<ArrowRightLeft className="w-4 h-4" />}
        title="Transfer Ownership"
        description="Hand ownership of this workspace to another member. You will be demoted to admin."
        buttonLabel="Transfer ownership"
        onAction={() => setModal("transfer")}
        risk="high"
        disabled={!ctx?.isOwner || (ctx?.otherMembers.length ?? 0) === 0}
        disabledReason={
          !ctx?.isOwner
            ? "Only owners can transfer ownership."
            : (ctx?.otherMembers.length ?? 0) === 0
              ? "No other members to transfer to. Invite someone first."
              : undefined
        }
      />

      {/* 3. Archive workspace (owner-only) */}
      <DangerCard
        icon={<Archive className="w-4 h-4" />}
        title="Archive Workspace"
        description="Soft-archive this workspace. Data is preserved but the workspace becomes inaccessible."
        buttonLabel="Archive workspace"
        onAction={() => setModal("archive")}
        risk="high"
        disabled={!ctx?.isOwner}
        disabledReason={!ctx?.isOwner ? "Only owners can archive the workspace." : undefined}
      />

      {/* 4. Delete workspace (owner-only) */}
      <DangerCard
        icon={<Trash2 className="w-4 h-4" />}
        title="Delete Workspace"
        description="Soft-delete this workspace and schedule its data for removal. This cannot be undone from the app."
        buttonLabel="Delete workspace"
        onAction={() => setModal("delete")}
        risk="critical"
        disabled={!ctx?.isOwner}
        disabledReason={!ctx?.isOwner ? "Only owners can delete the workspace." : undefined}
      />

      {/* ── Leave modal ── */}
      {modal === "leave" && (
        <Modal onClose={close}>
          <div className="flex items-center gap-3 mb-3">
            <LogOut className="w-5 h-5 text-red-600" />
            <h3 className="text-[15px] font-bold text-slate-900">Leave {ctx?.workspaceName}?</h3>
          </div>
          <p className="text-[13px] text-slate-500 mb-4">
            You will be removed from this workspace and lose access to all of its data. You can be
            re-invited later.
          </p>
          <p className="text-[12px] text-slate-700 font-semibold mb-2">
            Type <strong>LEAVE</strong> to confirm:
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="LEAVE"
            className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 text-[13px] mb-4 focus:outline-none focus:border-red-400 transition-all"
          />
          {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              disabled={confirmText !== "LEAVE" || busy}
              onClick={async () => { setBusy(true); setError(null); finish(await leaveWorkspace()) }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Leave workspace
            </button>
          </div>
        </Modal>
      )}

      {/* ── Transfer modal ── */}
      {modal === "transfer" && (
        <Modal onClose={close}>
          <div className="flex items-center gap-3 mb-3">
            <ArrowRightLeft className="w-5 h-5 text-red-600" />
            <h3 className="text-[15px] font-bold text-slate-900">Transfer ownership</h3>
          </div>
          <p className="text-[13px] text-slate-500 mb-4">
            Select the member who should become the new owner. You will be downgraded to admin.
          </p>
          <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">New owner</label>
          <select
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] mb-4 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
          >
            <option value="">Select a member…</option>
            {ctx?.otherMembers.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
          {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              disabled={!transferTarget || busy}
              onClick={async () => {
                setBusy(true); setError(null)
                const r = await transferOwnership(transferTarget)
                if (r.ok) { close(); router.refresh() } else { setError(r.error ?? "Failed."); setBusy(false) }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Transfer ownership
            </button>
          </div>
        </Modal>
      )}

      {/* ── Archive modal ── */}
      {modal === "archive" && (
        <Modal onClose={close}>
          <div className="flex items-center gap-3 mb-3">
            <Archive className="w-5 h-5 text-red-600" />
            <h3 className="text-[15px] font-bold text-slate-900">Archive workspace?</h3>
          </div>
          <p className="text-[13px] text-slate-500 mb-4">
            {ctx?.workspaceName} will be archived and made inaccessible to all members. Data is
            preserved and can be restored by contacting support.
          </p>
          <p className="text-[12px] text-slate-700 font-semibold mb-2">
            Type <strong>ARCHIVE</strong> to confirm:
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ARCHIVE"
            className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 text-[13px] mb-4 focus:outline-none focus:border-red-400 transition-all"
          />
          {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              disabled={confirmText !== "ARCHIVE" || busy}
              onClick={async () => { setBusy(true); setError(null); finish(await archiveWorkspace()) }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Archive workspace
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete modal ── */}
      {modal === "delete" && (
        <Modal onClose={close}>
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="text-[15px] font-bold text-red-900">Delete workspace?</h3>
          </div>
          <p className="text-[13px] text-slate-600 mb-1">
            This will permanently delete <strong>{ctx?.workspaceName}</strong> and all associated
            data.
          </p>
          <p className="text-[13px] text-slate-600 mb-3">
            Type the workspace name <strong>{ctx?.workspaceName}</strong> to confirm:
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={ctx?.workspaceName}
            className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 text-[13px] mb-4 focus:outline-none focus:border-red-400 transition-all"
          />
          {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              disabled={confirmText !== ctx?.workspaceName || busy}
              onClick={async () => { setBusy(true); setError(null); finish(await deleteWorkspace(confirmText)) }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-red-700 transition-colors"
              )}
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {busy ? "Deleting…" : "Delete workspace"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
