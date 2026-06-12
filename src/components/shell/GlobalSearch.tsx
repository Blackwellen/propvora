"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Command, Loader2, Building2, Users, ClipboardList, CornerDownLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface GlobalSearchProps {
  className?: string
}

type ResultKind = "property" | "contact" | "task"

interface SearchResult {
  id: string
  kind: ResultKind
  title: string
  subtitle: string
  href: string
}

const KIND_META: Record<ResultKind, { label: string; Icon: typeof Building2; colour: string }> = {
  property: { label: "Property", Icon: Building2,     colour: "#2563EB" },
  contact:  { label: "Contact",  Icon: Users,         colour: "#059669" },
  task:     { label: "Task",     Icon: ClipboardList, colour: "#D97706" },
}

export default function GlobalSearch({ className }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsIdRef = useRef<string | null>(null)

  // Resolve active workspace once
  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()
        wsIdRef.current = profile?.current_workspace_id ?? null
      } catch { /* noop */ }
    })()
  }, [])

  // Cmd/Ctrl+K to focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const runSearch = useCallback(async (term: string) => {
    const wsId = wsIdRef.current
    if (!term.trim() || !wsId) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const like = `%${term.trim()}%`
    const found: SearchResult[] = []

    // Properties — workspace-scoped (RLS enforces access)
    try {
      const { data } = await supabase
        .from("properties")
        .select("id, nickname, address_line1, city, postcode")
        .eq("workspace_id", wsId)
        .or(`nickname.ilike.${like},address_line1.ilike.${like},city.ilike.${like},postcode.ilike.${like}`)
        .limit(5)
      for (const p of (data ?? []) as Record<string, string>[]) {
        found.push({
          id: p.id,
          kind: "property",
          title: p.nickname || p.address_line1 || "Property",
          subtitle: [p.address_line1, p.city, p.postcode].filter(Boolean).join(", "),
          href: `/app/portfolio/properties/${p.id}`,
        })
      }
    } catch { /* 42P01-safe */ }

    // Contacts
    try {
      const { data } = await supabase
        .from("contacts")
        .select("id, display_name, email, type")
        .eq("workspace_id", wsId)
        .or(`display_name.ilike.${like},email.ilike.${like}`)
        .limit(5)
      for (const c of (data ?? []) as Record<string, string>[]) {
        found.push({
          id: c.id,
          kind: "contact",
          title: c.display_name || c.email || "Contact",
          subtitle: [c.type, c.email].filter(Boolean).join(" · "),
          href: `/app/contacts/${c.id}`,
        })
      }
    } catch { /* 42P01-safe */ }

    // Tasks
    try {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status")
        .eq("workspace_id", wsId)
        .ilike("title", like)
        .limit(5)
      for (const t of (data ?? []) as Record<string, string>[]) {
        found.push({
          id: t.id,
          kind: "task",
          title: t.title || "Task",
          subtitle: t.status ? `Task · ${t.status}` : "Task",
          href: `/app/work/tasks/${t.id}`,
        })
      }
    } catch { /* 42P01-safe */ }

    setResults(found)
    setActive(0)
    setLoading(false)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(focused)
      return
    }
    setOpen(true)
    const handle = setTimeout(() => runSearch(query), 250)
    return () => clearTimeout(handle)
  }, [query, focused, runSearch])

  function go(r: SearchResult) {
    setOpen(false)
    setQuery("")
    inputRef.current?.blur()
    router.push(r.href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) {
      if (e.key === "Escape") inputRef.current?.blur()
      return
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length) }
    else if (e.key === "Enter") { e.preventDefault(); if (results[active]) go(results[active]) }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur() }
  }

  return (
    <div ref={containerRef} className={cn("relative flex-1 max-w-[560px]", className)}>
      <div
        className={cn(
          "flex items-center gap-2 h-[44px] px-4 rounded-2xl border transition-all duration-200",
          focused
            ? "bg-white border-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
            : "bg-[#F8FBFF] border-[#DDE8F7] hover:border-[#B9D2F3]"
        )}
      >
        <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (query.trim()) setOpen(true) }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder="Search properties, contacts, tasks..."
          className="flex-1 bg-transparent text-[13.5px] text-[#071B4D] placeholder:text-[#94A3B8] outline-none"
          aria-label="Global search"
          aria-expanded={open}
          role="combobox"
          aria-controls="global-search-results"
        />
        <div className="flex items-center gap-1 shrink-0">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-[#94A3B8] animate-spin" />
          ) : (
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EBF2FF] text-[#64748B] text-[11px] font-medium">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {open && query.trim() && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute top-12 left-0 right-0 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[420px] overflow-y-auto"
        >
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-slate-400">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-300 mt-1">Searches properties, contacts and tasks in this workspace</p>
            </div>
          ) : (
            <div className="py-1.5">
              {results.map((r, i) => {
                const meta = KIND_META[r.kind]
                const Icon = meta.Icon
                return (
                  <button
                    key={`${r.kind}-${r.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
                      i === active ? "bg-slate-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.colour}14` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: meta.colour }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{r.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide shrink-0">
                      {meta.label}
                    </span>
                    {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
