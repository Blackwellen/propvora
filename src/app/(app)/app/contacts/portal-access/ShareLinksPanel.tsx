"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Link2, Plus, X, Copy, CheckCircle2, XCircle, ShieldCheck,
  FileText, Receipt, Wrench, Loader2, Clock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { issueShareLink, revokeShareLink } from "@/lib/portal/share-issue"

// ── Resource types offered in the mint dialog ────────────────────────────────
const RESOURCE_OPTIONS = [
  { key: "documents", label: "Documents (collection)", icon: FileText, collection: true },
  { key: "document", label: "A specific document", icon: FileText, collection: false },
  { key: "invoice", label: "An invoice", icon: Receipt, collection: false },
  { key: "job", label: "A job", icon: Wrench, collection: false },
] as const

const CAPABILITY_OPTIONS = [
  { key: "download", label: "Download files" },
  { key: "upload", label: "Upload files back" },
  { key: "sign", label: "Acknowledge / sign" },
] as const

const EXPIRY_OPTIONS = [
  { v: 7, label: "7 days" },
  { v: 14, label: "14 days" },
  { v: 30, label: "30 days" },
  { v: 90, label: "90 days" },
]

interface ShareRow {
  id: string
  resource_type: string
  capabilities: string[] | null
  title: string | null
  recipient_label: string | null
  expires_at: string
  revoked_at: string | null
  view_count: number | null
  upload_count: number | null
  created_at: string
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function statusOf(r: ShareRow): { label: string; cls: string } {
  if (r.revoked_at) return { label: "Revoked", cls: "bg-red-100 text-red-700" }
  if (new Date(r.expires_at).getTime() <= Date.now()) return { label: "Expired", cls: "bg-slate-100 text-slate-500" }
  return { label: "Active", cls: "bg-emerald-100 text-emerald-700" }
}

export default function ShareLinksPanel({ workspaceId }: { workspaceId: string | undefined }) {
  const [rows, setRows] = useState<ShareRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [minted, setMinted] = useState<{ url: string; expiresAt: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("portal_share_links")
        .select("id, resource_type, capabilities, title, recipient_label, expires_at, revoked_at, view_count, upload_count, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
      setRows((data as ShareRow[]) ?? [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { void load() }, [load])

  async function handleRevoke(id: string) {
    if (confirmId !== id) {
      setConfirmId(id)
      setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 3000)
      return
    }
    setConfirmId(null)
    if (!workspaceId) return
    const res = await revokeShareLink({ workspaceId, id })
    if (res.ok) void load()
  }

  function copy(url: string) {
    if (navigator?.clipboard) navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recipient share links</h3>
            <p className="text-xs text-slate-500">Resource-scoped /p/ links with granular capabilities and expiry.</p>
          </div>
        </div>
        <button
          onClick={() => { setMinted(null); setShowModal(true) }}
          disabled={!workspaceId}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          New share link
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading share links…</div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center">
          <ShieldCheck className="w-9 h-9 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">No share links yet</p>
          <p className="text-xs text-slate-400 mt-1">Mint a scoped /p/ link to share a document, invoice or job.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">Shared item</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Capabilities</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r) => {
                const st = statusOf(r)
                const caps = (r.capabilities ?? []).filter((c) => c !== "view")
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{r.title || r.resource_type.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-slate-400 capitalize">{r.resource_type.replace(/_/g, " ")}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.recipient_label || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {caps.length === 0 ? (
                          <span className="text-[11px] text-slate-400">View only</span>
                        ) : caps.map((c) => (
                          <span key={c} className="inline-flex rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-semibold capitalize">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(r.expires_at)}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {r.view_count ?? 0} views · {r.upload_count ?? 0} uploads
                    </td>
                    <td className="px-4 py-3">
                      {!r.revoked_at && (
                        <button
                          onClick={() => handleRevoke(r.id)}
                          title={confirmId === r.id ? "Confirm revoke" : "Revoke"}
                          className={`p-1.5 rounded-md transition-colors ${confirmId === r.id ? "text-red-600 bg-red-50" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <MintModal
          workspaceId={workspaceId}
          minted={minted}
          copied={copied}
          onCopy={copy}
          onMinted={(m) => { setMinted(m); void load() }}
          onClose={() => { setShowModal(false); setMinted(null) }}
        />
      )}
    </div>
  )
}

// ── Mint dialog ──────────────────────────────────────────────────────────────
function MintModal({
  workspaceId, minted, copied, onCopy, onMinted, onClose,
}: {
  workspaceId: string | undefined
  minted: { url: string; expiresAt: string } | null
  copied: boolean
  onCopy: (url: string) => void
  onMinted: (m: { url: string; expiresAt: string }) => void
  onClose: () => void
}) {
  const [resourceType, setResourceType] = useState<string>("documents")
  const [resourceIds, setResourceIds] = useState("")
  const [caps, setCaps] = useState<string[]>([])
  const [expiry, setExpiry] = useState(14)
  const [title, setTitle] = useState("")
  const [recipient, setRecipient] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCollection = RESOURCE_OPTIONS.find((o) => o.key === resourceType)?.collection ?? false

  function toggleCap(c: string) {
    setCaps((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function submit() {
    if (!workspaceId) { setError("Workspace not loaded."); return }
    setSaving(true)
    setError(null)
    const ids = resourceIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
    const res = await issueShareLink({
      workspaceId,
      resourceType,
      resourceIds: isCollection ? [] : ids,
      capabilities: ["view", ...caps],
      expiryDays: expiry,
      title: title || undefined,
      recipientLabel: recipient || undefined,
    })
    setSaving(false)
    if (!res.ok || !res.url) { setError(res.error || "Could not create the link."); return }
    onMinted({ url: res.url, expiresAt: res.expiresAt! })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">{minted ? "Share link ready" : "New recipient share link"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        {minted ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-800">Copy this link now — for security it is shown only once and cannot be recovered.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <input readOnly value={minted.url} className="flex-1 bg-transparent text-xs text-slate-700 outline-none truncate" />
              <button onClick={() => onCopy(minted.url)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 text-white text-xs font-medium px-2.5 py-1.5 hover:bg-blue-700">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Clock className="w-3 h-3" /> Expires {fmtDate(minted.expiresAt)}</p>
            <button onClick={onClose} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">What are you sharing?</label>
              <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                {RESOURCE_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>

            {!isCollection && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Resource ID(s)</label>
                <input value={resourceIds} onChange={(e) => setResourceIds(e.target.value)} placeholder="Paste the document / invoice / job ID" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                <p className="text-[11px] text-slate-400 mt-1">The link only exposes the IDs you list, verified against your workspace.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Capabilities</label>
              <div className="space-y-1.5">
                {CAPABILITY_OPTIONS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={caps.includes(c.key)} onChange={() => toggleCap(c.key)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    {c.label}
                  </label>
                ))}
                <p className="text-[11px] text-slate-400">View access is always included.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expiry</label>
                <select value={expiry} onChange={(e) => setExpiry(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                  {EXPIRY_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Recipient label</label>
                <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. ACME Ltd" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title (optional)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What the recipient sees at the top" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={submit} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Creating…" : "Create link"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
