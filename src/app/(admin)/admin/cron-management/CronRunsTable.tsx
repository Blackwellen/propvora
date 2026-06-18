"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminTable, AdminStatusChip, AdminActionMenu, AdminConfirmDialog, type AdminTone } from "@/components/admin/ui"
import { recordCronAction } from "./actions"
import type { CronRunRow } from "@/lib/admin/pages/batch3"

function shortId(id: string | null) {
  return id ? id.slice(0, 8) : "—"
}

function fmtWhen(iso: string | null): string {
  if (!iso) return "—"
  try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) }
  catch { return "—" }
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function statusTone(status: string): AdminTone {
  const s = status.toLowerCase()
  if (["success", "ok", "completed"].includes(s)) return "emerald"
  if (["error", "failed", "errored"].includes(s)) return "red"
  if (["running", "in_progress", "queued"].includes(s)) return "amber"
  return "slate"
}

interface PendingAction {
  action: "run" | "pause" | "resume"
  jobKey: string
  label: string
}

export default function CronRunsTable({ rows }: { rows: CronRunRow[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    if (!pending) return
    setBusy(true)
    setError(null)
    const res = await recordCronAction({ action: pending.action, jobKey: pending.jobKey })
    setBusy(false)
    if (res.ok) {
      setPending(null)
      router.refresh()
    } else {
      setError(res.error ?? "Action failed")
    }
  }

  const verb = pending?.action === "run" ? "Trigger a manual run of" : pending?.action === "pause" ? "Pause" : "Resume"

  return (
    <>
      <AdminTable
        minWidth={820}
        head={[
          { label: "Run" }, { label: "Automation" }, { label: "Workspace" },
          { label: "Status" }, { label: "Started" }, { label: "Duration", align: "right" },
          { label: "", align: "right" },
        ]}
      >
        {rows.map((r) => {
          const jobKey = r.automation || r.ref || r.id
          return (
            <tr key={r.id} className="hover:bg-[#FAFCFF]">
              <td className="px-4 py-3">
                <p className="font-semibold text-[#0B1B3F]">{r.ref ?? shortId(r.id)}</p>
                <p className="text-[11px] text-slate-400 font-mono">{shortId(r.id)}</p>
              </td>
              <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">{r.automation ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">{r.workspaceName ?? <span className="font-mono text-slate-400">{shortId(r.workspaceId)}</span>}</td>
              <td className="px-4 py-3"><AdminStatusChip tone={statusTone(r.status)} dot>{r.status.replace(/_/g, " ")}</AdminStatusChip></td>
              <td className="px-4 py-3 text-slate-500">{fmtWhen(r.startedAt)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtDuration(r.durationMs)}</td>
              <td className="px-4 py-3 text-right">
                <AdminActionMenu
                  actions={[
                    { label: "Trigger manual run", onSelect: () => setPending({ action: "run", jobKey, label: jobKey }) },
                    { label: "Pause schedule", onSelect: () => setPending({ action: "pause", jobKey, label: jobKey }) },
                    { label: "Resume schedule", onSelect: () => setPending({ action: "resume", jobKey, label: jobKey }) },
                  ]}
                />
              </td>
            </tr>
          )
        })}
      </AdminTable>

      <AdminConfirmDialog
        open={!!pending}
        title={`${verb} this job?`}
        description={
          (pending ? `${verb} “${pending.label}”. ` : "") +
          "This is an explicit, recorded admin action — it will be written to the audit log." +
          (error ? `\n\n${error}` : "")
        }
        confirmLabel={pending?.action === "run" ? "Trigger run" : pending?.action === "pause" ? "Pause" : "Resume"}
        danger={pending?.action !== "resume"}
        busy={busy}
        onConfirm={confirm}
        onCancel={() => { if (!busy) { setPending(null); setError(null) } }}
      />
    </>
  )
}
