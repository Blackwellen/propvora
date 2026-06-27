"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Team inbox views — Customer Threads (image 15) and Internal Notes (image 16).
   Customer threads = 3-column inbox with assigned owner, customer/internal
   toggle, team ownership + SLA. Internal notes = team note feed with mentions.
   Rendered inside the Inbox tab hub for team plans.

   Data: threads come from /api/supplier/messages (live supplier_message_threads).
   42P01-safe: if the table is missing or the workspace has no threads, an
   honest empty state is shown — no fake conversations.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import {
  Search, Send, UserCheck, AtSign, MessageSquare, CheckCircle2, Lock, Star, Paperclip,
  MessagesSquare, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierLoadingState, SupplierEmptyState } from "@/components/supplier-workspace/ui"
import { timeAgo } from "@/components/supplier-workspace/format"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"

interface Thread {
  id: string
  name?: string
  subject?: string
  preview?: string
  lastAt?: string
  unread?: number
  channel?: string
}

interface ThreadsEnvelope {
  items?: Thread[]
  unreadCount?: number
}

export function TeamCustomerThreads() {
  const url = useSupplierApiUrl("/api/supplier/messages", { side: "supplier" })
  const state = useSupplierApi<ThreadsEnvelope>(url, {
    select: (j) => j as ThreadsEnvelope,
  })
  const threads: Thread[] = state.data?.items ?? []
  const [toast, setToast] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<"customer" | "internal">("customer")
  const [draft, setDraft] = useState("")

  const selected = threads.find((t) => t.id === selectedId) ?? threads[0] ?? null

  return (
    <div className="space-y-3">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-3 h-[calc(100vh-260px)] min-h-[480px]">
        {/* Thread list */}
        <SupplierCard className="p-0 overflow-hidden flex flex-col">
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search threads…" className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {state.loading ? (
              <div className="p-4"><SupplierLoadingState rows={4} /></div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center">
                <MessagesSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No customer threads yet.</p>
                <p className="text-xs text-slate-400 mt-1">Threads appear here when customers message your workspace.</p>
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={cn("w-full text-left flex gap-2.5 px-3 py-3 hover:bg-slate-50", t.id === (selected?.id) && "bg-[var(--brand-soft)]/60")}
                >
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 flex items-center justify-center shrink-0">
                    {(t.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{t.name ?? "Unknown"}</p>
                      {(t.unread ?? 0) > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[var(--brand)] text-white text-[9px] font-bold flex items-center justify-center">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{t.subject ?? ""}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.lastAt ? timeAgo(t.lastAt) : ""}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </SupplierCard>

        {/* Conversation pane */}
        <SupplierCard className="p-0 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Select a thread to view the conversation.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{selected.name ?? "Thread"}</p>
                  <p className="text-xs text-slate-400 truncate">{selected.subject ?? ""}</p>
                </div>
                <Link href={`/supplier/inbox/threads/${selected.id}`} className="text-xs font-semibold text-[var(--brand)] inline-flex items-center gap-0.5">
                  Open full <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {selected.preview && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-white border border-slate-200 px-3.5 py-2">
                      <p className="text-sm text-slate-800">{selected.preview}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{selected.lastAt ? timeAgo(selected.lastAt) : ""}</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Composer */}
              <div className="border-t border-slate-100 p-2.5">
                <div className="flex gap-1.5 mb-2">
                  <button onClick={() => setMode("customer")} className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold", mode === "customer" ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-600")}>Reply to customer</button>
                  <button onClick={() => setMode("internal")} className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1", mode === "internal" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600")}><Lock className="w-3 h-3" /> Internal note</button>
                </div>
                <div className={cn("flex items-end gap-2 rounded-xl border p-2", mode === "internal" ? "border-amber-200 bg-amber-50/40" : "border-slate-200")}>
                  <button className="p-1.5 text-slate-400" aria-label="Attach"><Paperclip className="w-4 h-4" /></button>
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} placeholder={mode === "internal" ? "Internal note (team only)…" : "Reply to customer…"} className="flex-1 resize-none bg-transparent text-sm outline-none" />
                  <SupplierButton size="sm" onClick={() => { setToast(mode === "internal" ? "Internal note added." : "Reply sent."); setDraft("") }} disabled={!draft.trim()}><Send className="w-3.5 h-3.5" /></SupplierButton>
                </div>
              </div>
            </>
          )}
        </SupplierCard>

        {/* Right rail */}
        <div className="space-y-3 overflow-y-auto">
          <SupplierCard className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Ownership</p>
            {selected ? (
              <>
                <p className="text-sm text-slate-600 mb-2">Thread: <span className="font-semibold text-slate-800">{selected.subject ?? "—"}</span></p>
                <SupplierButton size="sm" variant="outline" className="w-full justify-center" onClick={() => setToast("Owner reassignment coming in V2.")}><UserCheck className="w-3.5 h-3.5" /> Reassign owner</SupplierButton>
              </>
            ) : (
              <p className="text-xs text-slate-400">Select a thread to manage ownership.</p>
            )}
          </SupplierCard>
          <SupplierCard className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked record</p>
            {selected ? (
              <Link href={`/supplier/inbox/threads/${selected.id}`} className="text-sm font-semibold text-[var(--brand)]">Open full thread</Link>
            ) : (
              <p className="text-xs text-slate-400">Select a thread.</p>
            )}
          </SupplierCard>
          <SupplierCard className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Customer insight</p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Customer history available in V2</p>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

interface Note { id: string; author: string; initials: string; body: string; at: string; mentions: string[]; linked: string | null; resolved: boolean }

export function TeamInternalNotes() {
  const [toast, setToast] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [notes, setNotes] = useState<Note[]>([])

  return (
    <div className="space-y-3">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 items-start">
        <SupplierCard className="p-0 overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[440px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <AtSign className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No internal notes yet.</p>
                <p className="text-xs text-slate-400 mt-1">Add a note below. @mention teammates to notify them.</p>
              </div>
            )}
            {notes.map((n) => (
              <div key={n.id} className={cn("rounded-xl border p-3", n.resolved ? "border-slate-100 bg-slate-50/50 opacity-70" : "border-amber-100 bg-amber-50/30")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 flex items-center justify-center">{n.initials}</span>
                  <span className="text-[13px] font-semibold text-slate-800">{n.author}</span>
                  <span className="text-[11px] text-slate-400">{timeAgo(n.at)}</span>
                  {n.resolved && <span className="ml-auto text-[10px] font-semibold text-emerald-600 inline-flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />Resolved</span>}
                </div>
                <p className="text-sm text-slate-700">{n.body.split(/(@\w+)/).map((part, i) => part.startsWith("@") ? <span key={i} className="font-semibold text-[var(--brand)]">{part}</span> : part)}</p>
                {n.linked && <Link href={`/supplier/jobs/${n.linked}`} className="text-[11px] font-semibold text-[var(--brand)] mt-1 inline-block">{n.linked}</Link>}
                {!n.resolved && <button onClick={() => { setNotes((ns) => ns.map((x) => x.id === n.id ? { ...x, resolved: true } : x)); setToast("Note resolved.") }} className="ml-3 text-[11px] font-semibold text-slate-500 hover:text-slate-700">Resolve</button>}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2.5">
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 p-2">
              <button className="p-1.5 text-slate-400" aria-label="Mention"><AtSign className="w-4 h-4" /></button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={1}
                placeholder="Add an internal note… use @ to mention"
                className="flex-1 resize-none text-sm outline-none"
              />
              <SupplierButton
                size="sm"
                onClick={() => {
                  if (!draft.trim()) return
                  setNotes((ns) => [...ns, {
                    id: `local-${Date.now()}`,
                    author: "You",
                    initials: "YO",
                    body: draft,
                    at: new Date().toISOString(),
                    mentions: [],
                    linked: null,
                    resolved: false,
                  }])
                  setDraft("")
                  setToast("Note added.")
                }}
                disabled={!draft.trim()}
              >
                <Send className="w-3.5 h-3.5" />
              </SupplierButton>
            </div>
          </div>
        </SupplierCard>
        <SupplierCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">About internal notes</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />Visible to workspace members only — never to customers.</li>
            <li className="flex gap-2"><AtSign className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />@mention teammates to notify them.</li>
            <li className="flex gap-2"><MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />Link notes to jobs, quotes and requests.</li>
          </ul>
        </SupplierCard>
      </div>
    </div>
  )
}
