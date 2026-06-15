"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Eye, EyeOff, X, AlertTriangle, Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  saveChangelogEntry,
  setChangelogPublished,
  deleteChangelogEntry,
} from "@/lib/comms/actions"
import { CHANGELOG_CATEGORIES, type ChangelogEntry } from "@/lib/comms/types"

interface Props {
  initialEntries: ChangelogEntry[]
}

const EMPTY: Partial<ChangelogEntry> = {
  id: undefined,
  version: "",
  title: "",
  bodyHtml: "",
  category: "",
  tags: [],
  published: false,
}

function fmt(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function ChangelogEditor({ initialEntries }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState<Partial<ChangelogEntry> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleSave(formData: FormData) {
    setBusy(true)
    setError(null)
    const res = await saveChangelogEntry(formData)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? "Could not save.")
      return
    }
    setEditing(null)
    setNotice("Entry saved.")
    refresh()
  }

  async function togglePublish(entry: ChangelogEntry) {
    setError(null)
    const res = await setChangelogPublished(entry.id, !entry.published)
    if (!res.ok) { setError(res.error ?? "Could not update."); return }
    setNotice(entry.published ? "Entry unpublished." : "Entry published.")
    refresh()
  }

  async function remove(entry: ChangelogEntry) {
    if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return
    setError(null)
    const res = await deleteChangelogEntry(entry.id)
    if (!res.ok) { setError(res.error ?? "Could not delete."); return }
    setNotice("Entry deleted.")
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
          <Plus className="w-4 h-4" /> New entry
        </Button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {initialEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No changelog entries yet.</p>
          </div>
        ) : (
          <>
          {/* Mobile card list */}
          <ul className="lg:hidden divide-y divide-[#E2E8F0]" role="list">
            {initialEntries.map((e) => (
              <li key={e.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{e.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                      {e.version && <span className="font-mono">{e.version}</span>}
                      {e.category && <span>· {e.category}</span>}
                      <span>· {fmt(e.publishedAt)}</span>
                    </div>
                  </div>
                  {e.published ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] shrink-0">Published</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 shrink-0">Draft</span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                  <Button variant="outline" size="sm" onClick={() => togglePublish(e)} className="flex-1">
                    {e.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {e.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(e); setNotice(null); setError(null) }} className="flex-1">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(e)} aria-label="Delete">
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
                {["Title", "Version", "Category", "Status", "Published", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-400 px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {initialEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800 max-w-xs truncate">{e.title}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{e.version || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{e.category || "—"}</td>
                  <td className="px-4 py-2.5">
                    {e.published ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#059669]">Published</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{fmt(e.publishedAt)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => togglePublish(e)} title={e.published ? "Unpublish" : "Publish"}>
                        {e.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => { setEditing(e); setNotice(null); setError(null) }} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => remove(e)} title="Delete">
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

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-slate-900">{editing.id ? "Edit entry" : "New entry"}</h2>
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
                  placeholder="e.g. New compliance dashboard"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Version</label>
                  <input
                    name="version" defaultValue={editing.version ?? ""}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="v1.2.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    name="category" defaultValue={editing.category ?? ""}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="">None</option>
                    {CHANGELOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
                <input
                  name="tags" defaultValue={(editing.tags ?? []).join(", ")}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="portal, mobile"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Body (HTML)</label>
                <textarea
                  name="body_html" rows={8} defaultValue={editing.bodyHtml ?? ""}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="<p>What changed…</p>"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Basic HTML allowed (headings, lists, links, bold). Scripts and unsafe markup are stripped automatically on save.
                </p>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="published" defaultChecked={editing.published ?? false} className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]" />
                <span className="text-sm text-slate-700">Published (visible on the public changelog)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={busy}>{busy ? "Saving…" : "Save entry"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
