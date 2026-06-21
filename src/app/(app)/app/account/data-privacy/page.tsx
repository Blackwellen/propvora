"use client"

import { useEffect, useState } from "react"
import { Download, AlertTriangle, Lock, FileText, X, Loader2, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AcceptanceStatusRow {
  documentType: string
  acceptedVersion: string | null
  acceptedAt: string | null
  currentVersion: string
  needsReacceptance: boolean
}

const DOC_LABELS: Record<string, string> = {
  terms_of_service: "Terms of Service",
  privacy_policy: "Privacy Policy",
}

export default function DataPrivacyPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [acceptances, setAcceptances] = useState<AcceptanceStatusRow[] | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteDone, setDeleteDone] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [exportOpen, setExportOpen] = useState(false)
  const [exportPassword, setExportPassword] = useState("")
  const [exportBusy, setExportBusy] = useState(false)
  const [exportRequested, setExportRequested] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    fetch("/api/legal/accept", { headers: { "Cache-Control": "no-store" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.status) setAcceptances(j.status as AcceptanceStatusRow[]) })
      .catch(() => {})
  }, [])

  async function reaccept() {
    try {
      const res = await fetch("/api/legal/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      if (res.ok) {
        const refreshed = await fetch("/api/legal/accept", { headers: { "Cache-Control": "no-store" } }).then((r) => r.json()).catch(() => null)
        if (refreshed?.status) setAcceptances(refreshed.status as AcceptanceStatusRow[])
      }
    } catch { /* surfaced via unchanged state */ }
  }

  const canDelete = deleteText === "DELETE" && deletePassword.length > 0 && !deleteBusy

  async function submitExport() {
    setExportBusy(true); setExportError(null)
    try {
      const res = await fetch("/api/account/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "export", password: exportPassword }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setExportError(j.error ?? "Could not request export."); return }
      setExportRequested(true); setExportOpen(false); setExportPassword("")
    } catch {
      setExportError("Network error. Please try again.")
    } finally {
      setExportBusy(false)
    }
  }

  async function submitDelete() {
    setDeleteBusy(true); setDeleteError(null)
    try {
      const res = await fetch("/api/account/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "deletion", password: deletePassword }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setDeleteError(j.error ?? "Could not request deletion."); return }
      setDeleteDone(true); setShowDeleteConfirm(false); setDeleteText(""); setDeletePassword("")
    } catch {
      setDeleteError("Network error. Please try again.")
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Data &amp; Privacy</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Control your data and account lifecycle</p>
      </div>

      {/* Data rights */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div style={{ color: "var(--brand)" }}><Lock className="w-4 h-4" /></div>
          <h3 className="text-[14px] font-bold text-slate-900">Your Data Rights</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { label: "Right to access", desc: "View all data we hold about you" },
            { label: "Right to portability", desc: "Export a copy of your data" },
            { label: "Right to erasure", desc: "Request permanent deletion" },
          ].map(right => (
            <div key={right.label} className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[12px] font-semibold text-blue-800">{right.label}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">{right.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legal acceptances */}
      {acceptances && acceptances.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div style={{ color: "var(--accent)" }}><ShieldCheck className="w-4 h-4" /></div>
            <h3 className="text-[14px] font-bold text-slate-900">Policy Acceptances</h3>
          </div>
          <div className="space-y-2.5">
            {acceptances.map((a) => (
              <div key={a.documentType} className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">{DOC_LABELS[a.documentType] ?? a.documentType}</p>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    {a.acceptedVersion
                      ? `Accepted version ${a.acceptedVersion}${a.acceptedAt ? ` on ${new Date(a.acceptedAt).toLocaleDateString("en-GB")}` : ""}`
                      : "Not yet recorded"}
                  </p>
                </div>
                {a.needsReacceptance ? (
                  <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Update available (v{a.currentVersion})
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
          {acceptances.some((a) => a.needsReacceptance) && (
            <button
              onClick={reaccept}
              className="mt-4 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors"
            >
              Accept latest policies
            </button>
          )}
        </div>
      )}

      {/* Export data */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <div style={{ color: "var(--color-success)" }}><FileText className="w-4 h-4" /></div>
          <h3 className="text-[14px] font-bold text-slate-900">Export My Data</h3>
        </div>
        <p className="text-[13px] text-slate-500 mb-4">
          Request a copy of the personal data Propvora holds about you. For your security
          you&apos;ll be asked to confirm your password. We&apos;ll email a secure download link to{" "}
          <span className="font-medium text-slate-700">{email ?? "your account email"}</span> once it&apos;s ready.
        </p>
        {exportRequested ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[13px] text-emerald-700 font-medium">
              Export requested. We&apos;ll email a secure download link to {email ?? "your account email"} once it&apos;s ready.
            </p>
          </div>
        ) : exportOpen ? (
          <div className="space-y-3 max-w-sm">
            <input
              type="password" autoComplete="current-password" placeholder="Confirm your password"
              value={exportPassword} onChange={e => setExportPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:border-emerald-400"
            />
            {exportError && <p className="text-[12px] text-red-600">{exportError}</p>}
            <div className="flex items-center gap-2">
              <button onClick={submitExport} disabled={exportBusy || !exportPassword}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                {exportBusy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm export
              </button>
              <button onClick={() => { setExportOpen(false); setExportPassword(""); setExportError(null) }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setExportOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Request data export
          </button>
        )}
      </div>

      {/* Delete account */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <div style={{ color: "var(--color-error)" }}><AlertTriangle className="w-4 h-4" /></div>
          <h3 className="text-[14px] font-bold text-red-900">Delete Account</h3>
        </div>
        {deleteDone ? (
          <p className="text-[13px] text-red-700">
            Your deletion request has been received. Your account is scheduled for erasure after a 30-day
            grace period; you can cancel during that window by contacting support@propvora.com.
          </p>
        ) : (
          <>
            <p className="text-[13px] text-red-700 mb-4">
              Permanently delete your account and associated personal data. Your request starts a 30-day
              grace period, after which data is erased or anonymised (some records are retained where the
              law requires). This cannot be undone.
            </p>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors">
              Request account deletion
            </button>
            <p className="text-[11px] text-red-400 mt-2">If you own workspaces, you must transfer or delete them first.</p>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div style={{ color: "var(--color-error)" }}><AlertTriangle className="w-5 h-5" /></div>
                <h3 className="text-[15px] font-bold text-slate-900">Confirm Account Deletion</h3>
              </div>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); setDeletePassword(""); setDeleteError(null) }}
                className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[13px] text-slate-600 mb-4">
              This starts a 30-day deletion of your account and personal data. For your security, confirm
              your password and type DELETE.
            </p>
            <input
              type="password" autoComplete="current-password" placeholder="Confirm your password"
              value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:border-red-400 mb-3"
            />
            <p className="text-[12.5px] font-semibold text-slate-700 mb-2">
              Type <span className="text-red-600">DELETE</span> to confirm
            </p>
            <input
              value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="Type DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-red-400 transition-all mb-3"
            />
            {deleteError && <p className="text-[12px] text-red-600 mb-3">{deleteError}</p>}
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); setDeletePassword(""); setDeleteError(null) }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={submitDelete} disabled={!canDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {deleteBusy && <Loader2 className="w-4 h-4 animate-spin" />} Delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
