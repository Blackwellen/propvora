"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Wrench, Inbox, ReceiptText, Hammer, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSupplierApiUrl } from "./SupplierWorkspaceContext"

interface SearchResult {
  group: string
  id: string
  title: string
  subtitle: string | null
  href: string
}

const GROUP_ICON: Record<string, LucideIcon> = {
  Jobs: Wrench, Leads: Inbox, Invoices: ReceiptText, Services: Hammer,
}

/** Workspace-scoped global search (jobs/leads/invoices/services). Cmd/Ctrl+K opens. */
export default function SupplierGlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const baseUrl = useSupplierApiUrl("/api/supplier/search")

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
    else { setQ(""); setResults([]); setActive(0) }
  }, [open])

  useEffect(() => {
    if (!open || !baseUrl || q.trim().length < 2) { setResults([]); return }
    const ctrl = new AbortController()
    setLoading(true)
    const t = setTimeout(() => {
      fetch(`${baseUrl}&q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((j) => { setResults(j.results ?? []); setActive(0) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 200)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [q, open, baseUrl])

  function go(r: SearchResult) {
    setOpen(false)
    router.push(r.href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 pl-3 pr-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors w-full max-w-[280px]"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
        <span className="text-[13px] flex-1 text-left">Search workspace…</span>
        <kbd className="hidden md:inline text-[10px] font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
                  if (e.key === "Enter" && results[active]) go(results[active])
                }}
                placeholder="Search jobs, leads, invoices, services…"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {q.trim().length < 2 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">Type at least 2 characters to search.</p>
              ) : loading && results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No results for “{q}”.</p>
              ) : (
                <ul className="py-2">
                  {results.map((r, i) => {
                    const Icon = GROUP_ICON[r.group] ?? Search
                    return (
                      <li key={`${r.group}-${r.id}`}>
                        <button
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(r)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left",
                            i === active ? "bg-slate-50" : "hover:bg-slate-50"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">{r.title}</p>
                            {r.subtitle && <p className="text-xs text-slate-400 truncate capitalize">{r.subtitle}</p>}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{r.group}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
