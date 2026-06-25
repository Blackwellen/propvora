"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { FolderPlus, Pin, PinOff, Archive, MessageSquareText, Loader2, ChevronLeft, Check, X } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"

// ============================================================================
// Chat history + folders — premium, enterprise-grade organisation for saved
// Copilot chats (spec §20). Folder filter chips, pinned section, clean cards
// with relative time + entity badge, and quiet hover actions. RLS-scoped via
// the threads/folders APIs.
// ============================================================================

interface Folder { id: string; name: string; color: string | null }
interface Thread {
  id: string
  title: string | null
  folder_id: string | null
  pinned: boolean | null
  pinned_entity_type: string | null
  updated_at: string
}

const DOT = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#db2777", "#0891b2"]

function relTime(iso: string): string {
  const d = new Date(iso).getTime()
  const mins = Math.round((Date.now() - d) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export default function CopilotHistoryScreen({ onOpen, onBack }: { onOpen: (threadId: string) => void; onBack: () => void }) {
  const { workspace } = useWorkspace()
  const wid = workspace?.id
  const [folders, setFolders] = useState<Folder[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState<string | null>(null) // null = All
  const [adding, setAdding] = useState(false)
  const [newFolder, setNewFolder] = useState("")
  const [creating, setCreating] = useState(false)
  const [moveFor, setMoveFor] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!wid) return
    setLoading(true)
    const [f, t] = await Promise.all([
      fetch(`/api/ai/folders?workspaceId=${wid}`).then((r) => (r.ok ? r.json() : { folders: [] })).catch(() => ({ folders: [] })),
      fetch(`/api/ai/threads?workspaceId=${wid}`).then((r) => (r.ok ? r.json() : { threads: [] })).catch(() => ({ threads: [] })),
    ])
    setFolders(f.folders ?? [])
    setThreads(t.threads ?? [])
    setLoading(false)
  }, [wid])
  useEffect(() => { load() }, [load])

  const folderColor = useMemo(() => {
    const m: Record<string, string> = {}
    folders.forEach((f, i) => { m[f.id] = f.color || DOT[i % DOT.length] })
    return m
  }, [folders])

  async function createFolder() {
    if (!wid || !newFolder.trim()) return
    setCreating(true)
    try {
      await fetch("/api/ai/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: wid, name: newFolder.trim(), color: DOT[folders.length % DOT.length] }) })
      setNewFolder(""); setAdding(false); await load()
    } finally { setCreating(false) }
  }
  async function patchThread(id: string, body: Record<string, unknown>) {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, ...(body.pinned !== undefined ? { pinned: body.pinned as boolean } : {}), ...(body.folderId !== undefined ? { folder_id: body.folderId as string | null } : {}) } : t)))
    await fetch(`/api/ai/threads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if ((body as { archived?: boolean }).archived) load()
  }

  const visible = useMemo(() => threads.filter((t) => activeFolder === null || t.folder_id === activeFolder), [threads, activeFolder])
  const pinned = visible.filter((t) => t.pinned)
  const rest = visible.filter((t) => !t.pinned)

  const Row = (t: Thread) => (
    <div key={t.id} className="group relative rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 transition-all hover:border-violet-300 hover:shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10">
          <MessageSquareText className="h-3.5 w-3.5 text-violet-500" />
        </div>
        <button onClick={() => onOpen(t.id)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            {t.pinned && <Pin className="h-3 w-3 shrink-0 fill-violet-500 text-violet-500" />}
            <span className="truncate text-[12.5px] font-[600] text-slate-800">{t.title || "Untitled chat"}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-400">
            <span>{relTime(t.updated_at)}</span>
            {t.folder_id && folderColor[t.folder_id] && (
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: folderColor[t.folder_id] }} />{folders.find((f) => f.id === t.folder_id)?.name}</span>
            )}
            {t.pinned_entity_type && <span className="rounded bg-slate-100 px-1.5 py-px text-[9px] font-[700] uppercase tracking-wide text-slate-500">{t.pinned_entity_type}</span>}
          </div>
        </button>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {folders.length > 0 && (
            <button onClick={() => setMoveFor(moveFor === t.id ? null : t.id)} title="Move to folder" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => patchThread(t.id, { pinned: !t.pinned })} title={t.pinned ? "Unpin" : "Pin"} className="rounded-md p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600">
            {t.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => patchThread(t.id, { archived: true })} title="Archive" className="rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600">
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {moveFor === t.id && folders.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
          <button onClick={() => { patchThread(t.id, { folderId: null }); setMoveFor(null) }} className="rounded-full border border-slate-200 px-2 py-0.5 text-[10.5px] font-[600] text-slate-500 hover:bg-slate-50">None</button>
          {folders.map((f) => (
            <button key={f.id} onClick={() => { patchThread(t.id, { folderId: f.id }); setMoveFor(null) }} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[10.5px] font-[600] text-slate-600 hover:bg-slate-50">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: folderColor[f.id] }} />{f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-slate-100">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-[12px] font-[600] text-slate-500 transition-colors hover:text-violet-700">
          <ChevronLeft className="h-4 w-4" /> Back to chat
        </button>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-[700] text-slate-500">{visible.length} chats</span>
      </div>

      {/* Folder filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 shrink-0">
        <button onClick={() => setActiveFolder(null)} className={`rounded-full px-2.5 py-1 text-[11px] font-[600] transition-colors ${activeFolder === null ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>All</button>
        {folders.map((f) => (
          <button key={f.id} onClick={() => setActiveFolder(f.id)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-[600] transition-colors ${activeFolder === f.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: folderColor[f.id] }} />{f.name}
          </button>
        ))}
        {adding ? (
          <span className="inline-flex items-center gap-1">
            <input autoFocus value={newFolder} onChange={(e) => setNewFolder(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") { setAdding(false); setNewFolder("") } }} placeholder="Folder name" className="w-28 rounded-full border border-violet-200 px-2.5 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-violet-200" />
            <button onClick={createFolder} disabled={creating || !newFolder.trim()} className="rounded-full bg-violet-600 p-1 text-white disabled:opacity-50">{creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}</button>
            <button onClick={() => { setAdding(false); setNewFolder("") }} className="rounded-full bg-slate-100 p-1 text-slate-500"><X className="h-3 w-3" /></button>
          </span>
        ) : (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-[600] text-slate-400 hover:border-violet-300 hover:text-violet-600">
            <FolderPlus className="h-3 w-3" /> Folder
          </button>
        )}
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquareText className="h-8 w-8 text-slate-200" />
            <p className="mt-2 text-[12px] text-slate-400">No saved chats here yet.</p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="space-y-1.5">
                <p className="px-1 text-[10px] font-[700] uppercase tracking-wide text-slate-400">Pinned</p>
                {pinned.map(Row)}
              </div>
            )}
            <div className="space-y-1.5">
              {pinned.length > 0 && rest.length > 0 && <p className="px-1 text-[10px] font-[700] uppercase tracking-wide text-slate-400">All chats</p>}
              {rest.map(Row)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
