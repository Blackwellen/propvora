"use client"

import React from "react"
import { AlertTriangle, Eye, Download, Trash2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

/**
 * Per-row GDPR action controls for the admin Data Requests page.
 *
 * • Preview          — always safe (dry run), shows what WOULD be erased.
 * • Generate export  — compiles + stores the subject's data bundle.
 * • Process deletion — opens a confirm dialog, then calls execute-deletion.
 *
 * The destructive path is DISABLED in the UI unless `erasureEnabled` is true
 * (mirrors the server env kill-switch). A banner makes the dry-run state plain.
 */

type Kind = "deletion" | "export"

interface Props {
  requestId: string
  kind: Kind
  erasureEnabled: boolean
}

// Minimal shape of the report we render (kept loose — server is source of truth).
interface ReportLike {
  executed?: boolean
  reason?: string
  status?: string
  downloadKey?: string
  expiresAt?: string
  enabledByEnv?: boolean
  toErase?: Array<{ table: string; count: number; action: string; note?: string }>
  retained?: Array<{ table: string; reason: string }>
  steps?: Array<{ table: string; action: string; ok: boolean; affected?: number; error?: string }>
  sections?: Record<string, number>
}

async function callWorker(action: string, requestId: string, confirm?: boolean) {
  const res = await fetch("/api/admin/account-process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, requestId, confirm }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`)
  return json.report as ReportLike
}

export function RequestActions({ requestId, kind, erasureEnabled }: Props) {
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [report, setReport] = React.useState<ReportLike | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  async function run(action: string, confirm?: boolean) {
    setBusy(action)
    setError(null)
    try {
      const r = await callWorker(action, requestId, confirm)
      setReport(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed")
    } finally {
      setBusy(null)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => run("preview-deletion")}
          disabled={busy !== null}
        >
          {busy === "preview-deletion" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
          Preview
        </Button>

        {kind === "export" && (
          <Button
            size="sm"
            variant="soft"
            onClick={() => run("generate-export")}
            disabled={busy !== null}
          >
            {busy === "generate-export" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Generate export
          </Button>
        )}

        {kind === "deletion" && (
          <Button
            size="sm"
            variant={erasureEnabled ? "destructive" : "outline"}
            onClick={() => setConfirmOpen(true)}
            disabled={busy !== null || !erasureEnabled}
            title={erasureEnabled ? "Permanently erase this user's data" : "Disabled — set ACCOUNT_ERASURE_ENABLED to execute"}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Process deletion
          </Button>
        )}
      </div>

      {kind === "deletion" && !erasureEnabled && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Dry-run only — set <code className="font-mono">ACCOUNT_ERASURE_ENABLED</code> to execute.
        </p>
      )}

      {error && (
        <p className="text-[11px] text-[#EF4444]">{error}</p>
      )}

      {report && <ReportPanel report={report} onClose={() => setReport(null)} />}

      {confirmOpen && (
        <ConfirmDialog
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => run("execute-deletion", true)}
          busy={busy === "execute-deletion"}
        />
      )}
    </div>
  )
}

// ── Report panel ─────────────────────────────────────────────────────────────

function ReportPanel({ report, onClose }: { report: ReportLike; onClose: () => void }) {
  const isExport = report.sections !== undefined
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-3 text-[11px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-700">
          {isExport ? "Export report" : report.executed ? "Erasure EXECUTED" : "Erasure dry-run"}
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close report">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {report.reason && <p className="text-slate-500 mb-2">{report.reason}</p>}

      {isExport ? (
        <ExportReportBody report={report} />
      ) : (
        <ErasureReportBody report={report} />
      )}
    </div>
  )
}

function ExportReportBody({ report }: { report: ReportLike }) {
  return (
    <div className="space-y-1.5">
      <p>
        Status:{" "}
        <span className={report.status === "ready" ? "text-emerald-600 font-medium" : "text-[#EF4444] font-medium"}>
          {report.status}
        </span>
      </p>
      {report.downloadKey && (
        <p className="font-mono break-all text-slate-500">key: {report.downloadKey}</p>
      )}
      {report.expiresAt && <p className="text-slate-500">expires: {new Date(report.expiresAt).toLocaleString("en-GB")}</p>}
      {report.sections && (
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
          {Object.entries(report.sections).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-500">{k}</span>
              <span className="font-mono text-slate-700">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ErasureReportBody({ report }: { report: ReportLike }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-slate-600 mb-1">Would erase / anonymise</p>
        <div className="space-y-0.5">
          {(report.toErase ?? []).map((i) => (
            <div key={i.table} className="flex justify-between">
              <span className="text-slate-500">
                {i.table} <span className="text-slate-400">({i.action})</span>
              </span>
              <span className="font-mono text-slate-700">{i.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-slate-600 mb-1">Retained (legal/financial)</p>
        <div className="space-y-0.5">
          {(report.retained ?? []).map((i) => (
            <div key={i.table}>
              <span className="text-slate-600">{i.table}</span>
              <span className="text-slate-400"> — {i.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {report.steps && report.steps.length > 0 && (
        <div>
          <p className="font-semibold text-slate-600 mb-1">Executed steps</p>
          <div className="space-y-0.5">
            {report.steps.map((s, idx) => (
              <div key={`${s.table}-${idx}`} className="flex justify-between">
                <span className="text-slate-500">
                  {s.table} <span className="text-slate-400">({s.action})</span>
                </span>
                <span className={s.ok ? "text-emerald-600 font-mono" : "text-[#EF4444] font-mono"}>
                  {s.ok ? `ok${s.affected != null ? ` · ${s.affected}` : ""}` : `fail: ${s.error ?? "?"}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  onCancel,
  onConfirm,
  busy,
}: {
  onCancel: () => void
  onConfirm: () => void
  busy: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-[#E2E8F0]">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[#FEF2F2] p-2">
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Process account erasure?</h3>
            <p className="mt-1 text-xs text-slate-500">
              This permanently deletes/anonymises the user&apos;s personal data and removes their
              login. Financial and audit records are retained per the retention schedule. This
              action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Confirm erasure
          </Button>
        </div>
      </div>
    </div>
  )
}
