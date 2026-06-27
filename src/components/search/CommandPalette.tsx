"use client"

// ────────────────────────────────────────────────────────────────────────────
// Global command palette (⌘K / Ctrl+K)
//
// Workspace-scoped search across 10 entity types + quick-action commands.
// • Opens on ⌘/Ctrl-K anywhere, or via the OPEN_COMMAND_PALETTE event.
// • role=dialog + listbox, aria-activedescendant selection (single tab stop on
//   the input), full arrow-key navigation, Enter to go, Esc to close.
// • Debounced, 42P01-safe queries, capped result counts, height-capped scroll.
// • Reduced-motion safe (motion gated on motion-reduce). No `dark:` classes.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import {
  Search, Loader2, CornerDownLeft, Building2, DoorOpen, FileText,
  Users, ClipboardList, Wrench, Receipt, ShieldCheck, LineChart,
  CalendarDays, Plus, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { runEntitySearch, type SearchHit, type ResultGroup } from "./search-queries"
import { filterCommands, type QuickCommand } from "./commands"

export const OPEN_COMMAND_PALETTE = "propvora:open-command-palette"

/** Imperatively open the palette from anywhere (e.g. the topbar trigger). */
export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE))
  }
}

const GROUP_META: Record<ResultGroup, { Icon: typeof Building2; colour: string }> = {
  Properties:  { Icon: Building2,     colour: "#2563EB" },
  Units:       { Icon: DoorOpen,      colour: "#0EA5E9" },
  Tenancies:   { Icon: FileText,      colour: "#7C3AED" },
  Contacts:    { Icon: Users,         colour: "#059669" },
  Tasks:       { Icon: ClipboardList, colour: "#D97706" },
  Jobs:        { Icon: Wrench,        colour: "#EA580C" },
  Invoices:    { Icon: Receipt,       colour: "#0D9488" },
  Compliance:  { Icon: ShieldCheck,   colour: "#DC2626" },
  Planning:    { Icon: LineChart,     colour: "#4F46E5" },
  Calendar:    { Icon: CalendarDays,  colour: "#9333EA" },
}

const GROUP_ORDER: ResultGroup[] = [
  "Properties", "Units", "Tenancies", "Contacts", "Tasks",
  "Jobs", "Invoices", "Compliance", "Planning", "Calendar",
]

// A flat navigable item is either a quick command or an entity hit.
type FlatItem =
  | { kind: "command"; cmd: QuickCommand }
  | { kind: "hit"; hit: SearchHit }

export default function CommandPalette() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const wsIdRef = useRef<string | null>(workspace?.id ?? null)
  const seqRef = useRef(0)

  useEffect(() => {
    if (workspace?.id) { wsIdRef.current = workspace.id; return }
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
        wsIdRef.current = (data as { current_workspace_id?: string } | null)?.current_workspace_id ?? null
      } catch { /* noop */ }
    })()
  }, [workspace?.id])

  // ── Open/close wiring ──────────────────────────────────────────
  const doOpen = useCallback(() => {
    setOpen(true)
    setActive(0)
  }, [])
  const doClose = useCallback(() => {
    setOpen(false)
    setQuery("")
    setHits([])
    setActive(0)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    function onOpenEvent() { doOpen() }
    document.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpenEvent)
    return () => {
      document.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpenEvent)
    }
  }, [doOpen])

  // Focus input + lock scroll when open
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 10)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { clearTimeout(t); document.body.style.overflow = prev }
  }, [open])

  // ── Debounced entity search ────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const term = query.trim()
    if (!term) { setHits([]); setLoading(false); return }
    const wsId = wsIdRef.current
    if (!wsId) { setHits([]); setLoading(false); return }
    setLoading(true)
    const seq = ++seqRef.current
    const handle = setTimeout(async () => {
      const found = await runEntitySearch(wsId, term)
      if (seq !== seqRef.current) return // a newer query superseded this one
      setHits(found)
      setActive(0)
      setLoading(false)
    }, 220)
    return () => clearTimeout(handle)
  }, [query, open])

  // ── Build grouped + flat item lists ────────────────────────────
  const commands = useMemo(() => filterCommands(query), [query])

  const groupedHits = useMemo(() => {
    const map = new Map<ResultGroup, SearchHit[]>()
    for (const g of GROUP_ORDER) {
      const items = hits.filter((h) => h.group === g)
      if (items.length) map.set(g, items)
    }
    return map
  }, [hits])

  const flat = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = commands.map((cmd) => ({ kind: "command", cmd }))
    for (const g of GROUP_ORDER) {
      for (const h of groupedHits.get(g) ?? []) items.push({ kind: "hit", hit: h })
    }
    return items
  }, [commands, groupedHits])

  // Clamp active index when the list changes
  useEffect(() => {
    setActive((a) => (flat.length === 0 ? 0 : Math.min(a, flat.length - 1)))
  }, [flat.length])

  const itemId = (i: number) => `cmdk-item-${i}`

  const go = useCallback((item: FlatItem) => {
    const href = item.kind === "command" ? item.cmd.href : item.hit.href
    doClose()
    if (href) router.push(href)
  }, [doClose, router])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { e.preventDefault(); doClose(); return }
    if (flat.length === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % flat.length) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + flat.length) % flat.length) }
    else if (e.key === "Home") { e.preventDefault(); setActive(0) }
    else if (e.key === "End") { e.preventDefault(); setActive(flat.length - 1) }
    else if (e.key === "Enter") { e.preventDefault(); if (flat[active]) go(flat[active]) }
  }

  // Keep the active row scrolled into view
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(itemId(active))}`)
    el?.scrollIntoView({ block: "nearest" })
  }, [active, open])

  if (!open || typeof window === "undefined") return null

  // Running index for aria-activedescendant alignment
  let runningIndex = commands.length

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center px-3 pt-[6vh] sm:px-4 sm:pt-[12vh]"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) doClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] motion-safe:animate-[fadeIn_0.12s_ease-out]" />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-[640px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden motion-safe:animate-[scaleIn_0.14s_ease-out]"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 h-[56px] border-b border-slate-100">
          <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search properties, contacts, tasks, invoices… or run a command"
            className="flex-1 bg-transparent text-[14.5px] text-[#071B4D] placeholder:text-slate-400 outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-listbox"
            aria-activedescendant={flat.length ? itemId(active) : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          {loading
            ? <Loader2 className="w-4 h-4 text-slate-300 animate-spin shrink-0" aria-hidden />
            : <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-medium shrink-0">Esc</kbd>}
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="cmdk-listbox"
          role="listbox"
          aria-label="Search results"
          className="max-h-[min(70vh,460px)] sm:max-h-[min(60vh,460px)] overflow-y-auto overscroll-contain py-2"
        >
          {flat.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" aria-hidden />
              <p className="text-[13px] font-medium text-slate-400">
                {query.trim() ? `No results for “${query.trim()}”` : "Type to search"}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                Searches this workspace across portfolio, work, money, compliance and more
              </p>
            </div>
          ) : (
            <>
              {/* Quick actions */}
              {commands.length > 0 && (
                <Section label={query.trim() ? "Commands" : "Quick actions"}>
                  {commands.map((cmd, i) => (
                    <Row
                      key={cmd.id}
                      id={itemId(i)}
                      selected={active === i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go({ kind: "command", cmd })}
                      icon={<span className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center"><Plus className="w-4 h-4 text-[var(--brand)]" /></span>}
                      title={cmd.label}
                      subtitle={cmd.hint}
                      trailing={<ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
                      isActive={active === i}
                    />
                  ))}
                </Section>
              )}

              {/* Entity groups */}
              {GROUP_ORDER.map((g) => {
                const items = groupedHits.get(g)
                if (!items?.length) return null
                const meta = GROUP_META[g]
                const Icon = meta.Icon
                const start = runningIndex
                runningIndex += items.length
                return (
                  <Section key={g} label={g}>
                    {items.map((h, j) => {
                      const idx = start + j
                      return (
                        <Row
                          key={`${g}-${h.id}`}
                          id={itemId(idx)}
                          selected={active === idx}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => go({ kind: "hit", hit: h })}
                          icon={
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${meta.colour}14` }}
                            >
                              <Icon className="w-4 h-4" style={{ color: meta.colour }} />
                            </span>
                          }
                          title={h.title}
                          subtitle={h.subtitle}
                          trailing={active === idx ? <CornerDownLeft className="w-3.5 h-3.5 text-slate-300" /> : null}
                          isActive={active === idx}
                        />
                      )
                    })}
                  </Section>
                )
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 h-[40px] border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-400">
          <Hint k="↑↓" label="Navigate" />
          <Hint k="↵" label="Open" />
          <Hint k="Esc" label="Close" />
          <span className="ml-auto hidden sm:inline">Workspace-scoped</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1" role="group" aria-label={label}>
      <p className="px-2 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {children}
    </div>
  )
}

function Row({
  id, selected, onMouseEnter, onClick, icon, title, subtitle, trailing, isActive,
}: {
  id: string
  selected: boolean
  onMouseEnter: () => void
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  isActive: boolean
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      onMouseEnter={onMouseEnter}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-colors",
        isActive ? "bg-slate-100" : "hover:bg-slate-50",
      )}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate">{title}</p>
        {subtitle ? <p className="text-[11px] text-slate-400 truncate">{subtitle}</p> : null}
      </div>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </div>
  )
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 text-[10px] font-medium">{k}</kbd>
      {label}
    </span>
  )
}
