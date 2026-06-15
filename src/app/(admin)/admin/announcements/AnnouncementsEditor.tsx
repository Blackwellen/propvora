"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Eye, EyeOff, X, AlertTriangle, Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  saveAnnouncement,
  setAnnouncementPublished,
  deleteAnnouncement,
} from "@/lib/comms/actions"
import { SEVERITIES, type Announcement, type AnnouncementSeverity } from "@/lib/comms/types"

interface Props {
  initialAnnouncements: Announcement[]
  workspaces: Array<{ id: string; name: string }>
}

const SEVERITY_STYLES: Record<AnnouncementSeverity, string> = {
  info: "bg-[#EFF6FF] text-[#2563EB]",
  success: "bg-[#ECFDF5] text-[#059669]",
  warning: "bg-[#FFFBEB] text-[#d97706]",
  critical: "bg-[#FEF2F2] text-[#dc2626]",
}

const EMPTY: Partial<Announcement> = {
  id: undefined,
  workspaceId: null,
  title: "",
  bodyHtml: "",
  severity: "info",
  audience: "all",
  startsAt: null,
  endsAt: null,
  dismissible: true,
  published: false,
}

function fmt(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** ISO -> value for <input type="datetime-local"> (local, no seconds). */
function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AnnouncementsEditor({ initialAnnouncements, workspaces }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const wsName = (id: string | null) =>
    id === null ? null : workspaces.find((w) => w.id === id)?.name ?? id.slice(0, 8)

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleSave(formData: FormData) {
    setBusy(true)
    setError(null)
    // Convert datetime-local back to ISO before sending.
    for (const key of ["starts_at", "ends_at"]) {
      const v = formData.get(key)
      if (typeof v === "string" && v) formData.set(key, new Date(v).toISOString())
    }
    const res = await saveAnnouncement(formData)
    setBusy(false)
    if (!res.ok) { setError(res.error ?? "Could not save."); return }
    setEditing(null)
    setNotice("Announcement saved.")
    refresh()
  }

  async function togglePublish(a: Announcement) {
    setError(null)
    const res = await setAnnouncementPublished(a.id, !a.published)
    if (!res.ok) { setError(res.error ?? "Could not update."); return }
    setNotice(a.published ? "Unpublished." : "Published.")
    refresh()
  }

  async function remove(a: Announcement) {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return
    setError(null)
    const res = await deleteAnnouncement(a.id)
    if (!res.ok) { setError(res.error ?? "Could not delete."); return }
    setNotice("Deleted.")
    refresh()
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">{notice}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => { setEditing({ ...EMPTY }); setNotice(null); setError(null) }}>
          <Plus className="w-4 h-4" /> New announcement
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {initialAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No announcements yet.</p>
          </div>
        ) : (
          <>
          {/* Mobile card list */}
          <ul className="lg:hidden divide-y divide-[#E2E8F0]" role="list">
            {initialAnnouncements.map((a) => (
              <li key={a.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                      {a.workspaceId === null ? (
                        <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium"><Globe className="w-3 h-3" /> Global</span>
                      ) : (
                        <span className="truncate">{wsName(a.workspaceId)}</span>
                      )}
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${SEVERITY_STYLES[a.severity]}`}>{a.severity}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">{fmt(a.startsAt)} – {fmt(a.endsAt)}</p>
                  </div>
                  {a.published ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] shrink-0">Published</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 shrink-0">Draft</span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                  <Button variant="outline" size="sm" onClick={() => togglePublish(a)} className="flex-1">
                    {a.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {a.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(a); setNotice(null); setError(null) }} className="flex-1">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(a)} aria-label="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <table className="hidden lg:table w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {["Title", "Scope", "Severity", "Window", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-400 px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {initialAnnouncements.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800 max-w-xs truncate">{a.title}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {a.workspaceId === null ? (
                      <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium"><Globe className="w-3 h-3" /> Global</span>
                    ) : (
                      <span className="truncate">{wsName(a.workspaceId)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SEVERITY_STYLES[a.severity]}`}>{a.severity}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{fmt(a.startsAt)} – {fmt(a.endsAt)}</td>
                  <td className="px-4 py-2.5">
                    {a.published ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#059669]">Published</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => togglePublish(a)} title={a.published ? "Unpublish" : "Publish"}>
                        {a.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => { setEditing(a); setNotice(null); setError(null) }} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => remove(a)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-slate-900">{editing.id ? "Edit announcement" : "New announcement"}</h2>
              <button onClick={() => setEditing(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={handleSave} className="p-5 space-y-4">
              {editing.id && <input type="hidden" name="id" value={editing.id} />}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  name="title" required defaultValue={editing.title ?? ""}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="e.g. Scheduled maintenance Sunday"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scope</label>
                  <select
                    name="workspace_id" defaultValue={editing.workspaceId ?? ""}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="">Global (all workspaces)</option>
                    {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    name="severity" defaultValue={editing.severity ?? "info"}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-white capitalize focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Audience</label>
                  <select
                    name="audience" defaultValue={editing.audience ?? "all"}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="all">All members</option>
                    <option value="admins">Workspace admins</option>
                    <option value="owners">Owners</option>
                  </select>
                </div>
                <div className="flex items-end gap-4 pb-1">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="dismissible" defaultChecked={editing.dismissible ?? true} className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]" />
                    <span className="text-sm text-slate-700">Dismissible</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="published" defaultChecked={editing.published ?? false} className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]" />
                    <span className="text-sm text-slate-700">Published</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Starts</label>
                  <input
                    type="datetime-local" name="starts_at" defaultValue={toLocalInput(editing.startsAt ?? null)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ends</label>
                  <input
                    type="datetime-local" name="ends_at" defaultValue={toLocalInput(editing.endsAt ?? null)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Body (HTML)</label>
                <textarea
                  name="body_html" rows={5} defaultValue={editing.bodyHtml ?? ""}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="<p>Details…</p>"
                />
                <p className="text-[11px] text-slate-400 mt-1">Basic HTML allowed. Unsafe markup is stripped automatically on save.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
