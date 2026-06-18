"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Team inbox views — Customer Threads (image 15) and Internal Notes (image 16).
   Customer threads = 3-column inbox with assigned owner, customer/internal
   toggle, team ownership + SLA. Internal notes = team note feed with mentions.
   Rendered inside the Inbox tab hub for team plans. Actions are typed stubs.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import {
  Search, Send, UserCheck, AtSign, MessageSquare, CheckCircle2, Lock, Clock, Star, Paperclip,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { timeAgo } from "@/components/supplier-workspace/format"
import { SEED_THREADS } from "@/features/supplier/inbox/data/threads"

const OWNERS = ["Alex Morgan", "Mike Thompson", "Emma Collins"]

export function TeamCustomerThreads() {
  const [toast, setToast] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState(SEED_THREADS[0].id)
  const [mode, setMode] = useState<"customer" | "internal">("customer")
  const [draft, setDraft] = useState("")
  const selected = SEED_THREADS.find((t) => t.id === selectedId) ?? SEED_THREADS[0]
  const owner = OWNERS[SEED_THREADS.findIndex((t) => t.id === selectedId) % OWNERS.length]

  return (
    <div className="space-y-3">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-3 h-[calc(100vh-260px)] min-h-[480px]">
        {/* Thread list */}
        <SupplierCard className="p-0 overflow-hidden flex flex-col">
          <div className="p-2.5 border-b border-slate-100"><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input placeholder="Search threads…" className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none" /></div></div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {SEED_THREADS.map((t, i) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)} className={cn("w-full text-left flex gap-2.5 px-3 py-3 hover:bg-slate-50", t.id === selectedId && "bg-blue-50/60")}>
                <span className="w-8 h-8 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 flex items-center justify-center shrink-0">{t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-semibold text-slate-800 truncate">{t.name}</p>{t.unread > 0 && <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">{t.unread}</span>}</div>
                  <p className="text-[11px] text-slate-400 truncate">{t.subject}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Owner: {OWNERS[i % OWNERS.length].split(" ")[0]}</p>
                </div>
              </button>
            ))}
          </div>
        </SupplierCard>

        {/* Conversation */}
        <SupplierCard className="p-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
            <div className="min-w-0"><p className="text-sm font-semibold text-slate-900 truncate">{selected.name}</p><p className="text-xs text-slate-400 truncate">{selected.subject}</p></div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600"><Clock className="w-3.5 h-3.5" /> SLA 2h</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            <div className="flex justify-start"><div className="max-w-[75%] rounded-2xl rounded-bl-md bg-white border border-slate-200 px-3.5 py-2"><p className="text-sm text-slate-800">{selected.preview}</p><p className="text-[10px] text-slate-400 mt-1">{timeAgo(selected.lastAt)}</p></div></div>
          </div>
          {/* Composer with customer/internal toggle */}
          <div className="border-t border-slate-100 p-2.5">
            <div className="flex gap-1.5 mb-2">
              <button onClick={() => setMode("customer")} className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold", mode === "customer" ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-600")}>Reply to customer</button>
              <button onClick={() => setMode("internal")} className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1", mode === "internal" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600")}><Lock className="w-3 h-3" /> Internal note</button>
            </div>
            <div className={cn("flex items-end gap-2 rounded-xl border p-2", mode === "internal" ? "border-amber-200 bg-amber-50/40" : "border-slate-200")}>
              <button className="p-1.5 text-slate-400" aria-label="Attach"><Paperclip className="w-4 h-4" /></button>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} placeholder={mode === "internal" ? "Internal note (team only)…" : "Reply to customer…"} className="flex-1 resize-none bg-transparent text-sm outline-none" />
              <SupplierButton size="sm" onClick={() => { setToast(mode === "internal" ? "Internal note added." : "Reply sent."); setDraft("") }} disabled={!draft.trim()}><Send className="w-3.5 h-3.5" /></SupplierButton>
            </div>
          </div>
        </SupplierCard>

        {/* Ownership + linked + insights */}
        <div className="space-y-3 overflow-y-auto">
          <SupplierCard className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Ownership</p>
            <div className="flex items-center gap-2 mb-2"><span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">{owner.split(" ").map((w) => w[0]).join("")}</span><div><p className="text-sm font-semibold text-slate-800">{owner}</p><p className="text-[11px] text-slate-400">Thread owner</p></div></div>
            <SupplierButton size="sm" variant="outline" className="w-full justify-center" onClick={() => setToast("Owner reassigned.")}><UserCheck className="w-3.5 h-3.5" /> Reassign owner</SupplierButton>
          </SupplierCard>
          <SupplierCard className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked record</p>
            <Link href={`/supplier/inbox/threads/${selected.id}`} className="text-sm font-semibold text-blue-600">Open full thread</Link>
          </SupplierCard>
          <SupplierCard className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Customer insight</p>
            <p className="text-sm text-slate-600 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Returning · 4 jobs · positive sentiment</p>
            <SupplierButton size="sm" variant="ghost" className="w-full justify-center mt-2" onClick={() => setToast("Marked resolved.")}><CheckCircle2 className="w-3.5 h-3.5" /> Mark resolved</SupplierButton>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

interface Note { id: string; author: string; initials: string; body: string; at: string; mentions: string[]; linked: string | null; resolved: boolean }
const NOTES: Note[] = [
  { id: "n1", author: "Mike Thompson", initials: "MT", body: "@Emma can you confirm the gas certificate requirement for JOB-0421 before we quote?", at: new Date(Date.now() - 3 * 3600000).toISOString(), mentions: ["Emma Collins"], linked: "JOB-2025-0421", resolved: false },
  { id: "n2", author: "Emma Collins", initials: "EC", body: "Confirmed — CP12 needed. I've flagged it on the job.", at: new Date(Date.now() - 2.5 * 3600000).toISOString(), mentions: [], linked: "JOB-2025-0421", resolved: false },
  { id: "n3", author: "Alex Morgan", initials: "AM", body: "Customer prefers morning slots. Handover note for whoever picks this up.", at: new Date(Date.now() - 26 * 3600000).toISOString(), mentions: [], linked: "QUO-2025-0451", resolved: true },
]

export function TeamInternalNotes() {
  const [toast, setToast] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [notes, setNotes] = useState(NOTES)
  return (
    <div className="space-y-3">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 items-start">
        <SupplierCard className="p-0 overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[440px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notes.map((n) => (
              <div key={n.id} className={cn("rounded-xl border p-3", n.resolved ? "border-slate-100 bg-slate-50/50 opacity-70" : "border-amber-100 bg-amber-50/30")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 flex items-center justify-center">{n.initials}</span>
                  <span className="text-[13px] font-semibold text-slate-800">{n.author}</span>
                  <span className="text-[11px] text-slate-400">{timeAgo(n.at)}</span>
                  {n.resolved && <span className="ml-auto text-[10px] font-semibold text-emerald-600 inline-flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />Resolved</span>}
                </div>
                <p className="text-sm text-slate-700">{n.body.split(/(@\w+)/).map((part, i) => part.startsWith("@") ? <span key={i} className="font-semibold text-blue-600">{part}</span> : part)}</p>
                {n.linked && <Link href={`/supplier/jobs/${n.linked}`} className="text-[11px] font-semibold text-blue-600 mt-1 inline-block">{n.linked}</Link>}
                {!n.resolved && <button onClick={() => { setNotes((ns) => ns.map((x) => x.id === n.id ? { ...x, resolved: true } : x)); setToast("Note resolved.") }} className="ml-3 text-[11px] font-semibold text-slate-500 hover:text-slate-700">Resolve</button>}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2.5">
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 p-2">
              <button className="p-1.5 text-slate-400" aria-label="Mention"><AtSign className="w-4 h-4" /></button>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} placeholder="Add an internal note… use @ to mention" className="flex-1 resize-none text-sm outline-none" />
              <SupplierButton size="sm" onClick={() => { if (!draft.trim()) return; setNotes((ns) => [...ns, { id: `local-${Date.now()}`, author: "You", initials: "YO", body: draft, at: new Date().toISOString(), mentions: [], linked: null, resolved: false }]); setDraft(""); setToast("Note added.") }} disabled={!draft.trim()}><Send className="w-3.5 h-3.5" /></SupplierButton>
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
