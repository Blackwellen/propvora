"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import MobileSheet from "@/components/mobile/MobileSheet"
import { useIsBelowDesktop } from "@/components/mobile/useBreakpoint"

/** Admin decision verbs (mirror lib/supplier-verification/review.ts). */
type Decision = "approve" | "reject" | "more_info" | "suspicious" | "blocked"

interface Props {
  verificationId: string
  status: string
}

const ACTION_META: Record<
  Decision,
  { label: string; verb: string; icon: typeof CheckCircle2; tone: "approve" | "reject" | "info"; noteRequired: boolean; help: string }
> = {
  approve: {
    label: "Approve",
    verb: "Approve — ID evidence reviewed",
    icon: CheckCircle2,
    tone: "approve",
    noteRequired: false,
    help: "Records that ID evidence (documents + selfie) has been reviewed and passed. This is an evidence-reviewed decision, not a guarantee. Audited.",
  },
  reject: {
    label: "Reject",
    verb: "Reject verification",
    icon: XCircle,
    tone: "reject",
    noteRequired: true,
    help: "Records a rejected status. Provide a reason for the audit trail.",
  },
  more_info: {
    label: "Request more info",
    verb: "Request more information",
    icon: MessageSquareWarning,
    tone: "info",
    noteRequired: true,
    help: "Returns the verification to the supplier for more information. Describe what is needed.",
  },
  suspicious: {
    label: "Flag suspicious",
    verb: "Flag as suspicious",
    icon: ShieldAlert,
    tone: "reject",
    noteRequired: true,
    help: "Raises a risk flag and holds the verification in review. Does not approve anything.",
  },
  blocked: {
    label: "Block supplier",
    verb: "Block — suspend verification",
    icon: Ban,
    tone: "reject",
    noteRequired: true,
    help: "Suspends the supplier's verification. They cannot accept gated jobs until reinstated.",
  },
}

const TERMINAL = new Set(["verified", "rejected", "suspended"])

/**
 * Platform-admin decision panel. Every decision posts to
 * /api/admin/supplier-verification (which re-checks admin identity server-side
 * and writes an event + audit entry). NOTHING auto-decides.
 */
export default function ReviewActions({ verificationId, status }: Props) {
  const router = useRouter()
  const isMobile = useIsBelowDesktop()
  const [pending, setPending] = React.useState<Decision | null>(null)
  const [note, setNote] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<{ status: string } | null>(null)

  const meta = pending ? ACTION_META[pending] : null
  const locked = TERMINAL.has(status)

  function open(d: Decision) {
    setPending(d)
    setNote("")
    setError(null)
  }
  function close() {
    if (busy) return
    setPending(null)
  }

  async function submit() {
    if (!pending) return
    const m = ACTION_META[pending]
    if (m.noteRequired && note.trim().length === 0) {
      setError("A note is required for this action.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        kind: "decision",
        verificationId,
        decision: pending,
        note: note.trim() || undefined,
      }
      if (pending === "suspicious" || pending === "blocked") {
        body.riskFlag = {
          flagType: pending === "blocked" ? "blocked" : "suspicious",
          severity: "high",
          detail: { note: note.trim() || undefined },
        }
      }
      const res = await fetch("/api/admin/supplier-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`)
      setResult({ status: json.newStatus as string })
      setPending(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(false)
    }
  }

  if (locked) {
    return (
      <p className="text-[12px] text-slate-500">
        This verification is in a final state ({status.replace(/_/g, " ")}). No further action.
      </p>
    )
  }

  const Form = meta ? (
    <div className="space-y-3">
      <p className="text-[12.5px] text-slate-600">{meta.help}</p>
      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">
          Reviewer note{" "}
          {meta.noteRequired ? (
            <span className="text-[#EF4444]">*</span>
          ) : (
            <span className="text-slate-400">(optional)</span>
          )}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Recorded in the audit trail…"
          className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-[12px] text-[#EF4444]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  ) : null

  const ConfirmButton = meta ? (
    <Button
      variant={meta.tone === "reject" ? "destructive" : meta.tone === "approve" ? "primary" : "secondary"}
      onClick={submit}
      disabled={busy}
      className="w-full sm:w-auto"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <meta.icon className="w-4 h-4" />}
      {meta.verb}
    </Button>
  ) : null

  return (
    <div className="space-y-3">
      {result && (
        <div className="flex items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <p className="text-[12px] text-[#047857]">
            Decision recorded · new status:{" "}
            <span className="font-semibold capitalize">{result.status.replace(/_/g, " ")}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button variant="primary" onClick={() => open("approve")} className="w-full sm:w-auto">
          <CheckCircle2 className="w-4 h-4" /> Approve
        </Button>
        <Button variant="destructive" onClick={() => open("reject")} className="w-full sm:w-auto">
          <XCircle className="w-4 h-4" /> Reject
        </Button>
        <Button variant="outline" onClick={() => open("more_info")} className="w-full sm:w-auto">
          <MessageSquareWarning className="w-4 h-4" /> Request info
        </Button>
        <Button variant="outline" onClick={() => open("suspicious")} className="w-full sm:w-auto">
          <ShieldAlert className="w-4 h-4" /> Flag
        </Button>
        <Button variant="outline" onClick={() => open("blocked")} className="w-full sm:w-auto">
          <Ban className="w-4 h-4" /> Block
        </Button>
      </div>

      {meta && !isMobile && (
        <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <meta.icon
              className={
                meta.tone === "reject"
                  ? "w-4 h-4 text-[#EF4444]"
                  : meta.tone === "approve"
                    ? "w-4 h-4 text-[#059669]"
                    : "w-4 h-4 text-[#2563EB]"
              }
            />
            <h3 className="text-sm font-semibold text-slate-800">{meta.verb}</h3>
          </div>
          {Form}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={busy}>
              Cancel
            </Button>
            {ConfirmButton}
          </div>
        </div>
      )}

      {isMobile && (
        <MobileSheet
          open={meta !== null}
          onClose={close}
          title={meta?.verb}
          description="An explicit, recorded admin decision."
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={close} disabled={busy} className="flex-1">
                Cancel
              </Button>
              {ConfirmButton}
            </div>
          }
        >
          <div className="px-2 pb-2">{Form}</div>
        </MobileSheet>
      )}
    </div>
  )
}
