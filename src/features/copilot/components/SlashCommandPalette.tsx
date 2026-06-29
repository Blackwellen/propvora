"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { CopilotPageContext } from "../context/useCopilotPageContext"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  COPILOT_COMMANDS,
  capabilitiesFor as fallbackCaps,
  commandsForCapabilities,
  commandsForPacks,
  packLabel,
  PACK_ORDER,
} from "@/lib/ai/commands-client"
import type { CommandPack } from "@/lib/ai/commands-client"

interface SlashCommand {
  slug: string
  label: string
  description: string
  shortcut: string
  category: string
  pack: string
}

// Default catalogue (operator type) derived from the SHARED registry so the
// palette can never drift from what actually has a handler.
function toUi(
  slug: string,
  label: string,
  description: string,
  category: string,
  pack: string,
  shortcut?: string | null,
): SlashCommand {
  return { slug, label, description, category, pack, shortcut: shortcut ?? "" }
}

const DEFAULT_COMMANDS: SlashCommand[] = commandsForCapabilities(fallbackCaps("operator")).map(
  (c) => toUi(c.slug, c.label, c.description, c.category, c.pack, c.shortcut),
)

interface SlashCommandPaletteProps {
  query: string
  context: CopilotPageContext
  onSelect: (cmd: string) => void
  onClose: () => void
}

export default function SlashCommandPalette({
  query,
  context,
  onSelect,
  onClose,
}: SlashCommandPaletteProps) {
  const { workspace } = useWorkspace()
  const [commands, setCommands] = useState<SlashCommand[]>(DEFAULT_COMMANDS)
  const [activeCategory, setActiveCategory] = useState("All actions")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Refine to the workspace-TYPE-filtered catalogue (operator/supplier/customer).
  useEffect(() => {
    if (!workspace?.id) return
    let cancelled = false
    fetch(`/api/ai/commands?workspaceId=${encodeURIComponent(workspace.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: {
          commands?: {
            slug: string
            label: string
            description: string
            category: string
            pack: string
            shortcut: string | null
          }[]
        } | null) => {
          if (cancelled || !data?.commands?.length) return
          setCommands(
            data.commands.map((c) => toUi(c.slug, c.label, c.description, c.category, c.pack, c.shortcut)),
          )
        },
      )
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [workspace?.id])

  // Categories + suggestions derived from the live command set.
  const CATEGORIES = useMemo(() => {
    const counts = commands.reduce<Record<string, number>>((acc, c) => {
      acc[c.category] = (acc[c.category] ?? 0) + 1
      return acc
    }, {})
    const order = Object.keys(counts)
    return [
      { label: "All actions", count: commands.length },
      ...order.map((l) => ({ label: l, count: counts[l] })),
    ]
  }, [commands])

  const SUGGESTED_COMMANDS = useMemo(() => commands.slice(0, 3).map((c) => c.slug), [commands])

  const filtered = commands.filter((c) => {
    const matchesCategory = activeCategory === "All actions" || c.category === activeCategory
    const q = query.replace(/^\//, "").toLowerCase()
    const matchesQuery = !q || c.slug.includes(q) || c.description.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

  // Group filtered commands by pack in canonical PACK_ORDER.
  const groupedByPack = useMemo(() => {
    const groups: { pack: CommandPack; label: string; cmds: SlashCommand[] }[] = []
    for (const pack of PACK_ORDER) {
      const cmds = filtered.filter((c) => c.pack === pack)
      if (cmds.length > 0) {
        groups.push({ pack, label: packLabel(pack), cmds })
      }
    }
    return groups
  }, [filtered])

  // Flat ordered list for keyboard navigation.
  const flatFiltered = useMemo(() => groupedByPack.flatMap((g) => g.cmds), [groupedByPack])

  useEffect(() => {
    setSelectedIndex(0)
  }, [activeCategory, query])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const cmd = flatFiltered[selectedIndex]
        if (cmd) onSelect(cmd.slug)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [flatFiltered, selectedIndex, onClose, onSelect])

  // Track cumulative index across groups for keyboard highlight.
  let cumulativeIndex = 0

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      style={{ maxHeight: 400 }}
    >
      <div className="flex h-full" style={{ minHeight: 320 }}>
        {/* Left: Categories — hidden on phones so the command list gets full width.
            The category list scrolls independently (it can exceed the panel
            height) while the Context card stays pinned at the bottom. */}
        <div className="hidden sm:flex w-[160px] shrink-0 border-r border-slate-100 bg-slate-50 flex-col overflow-hidden">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1 px-4">
            Categories
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto px-3 flex flex-col gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                  activeCategory === cat.label
                    ? "bg-[var(--brand)] text-white"
                    : "text-slate-600 hover:bg-white hover:shadow-sm"
                }`}
              >
                <span className="truncate">{cat.label}</span>
                <span
                  className={`text-[10px] ml-1 shrink-0 ${
                    activeCategory === cat.label ? "text-[var(--color-brand-100)]" : "text-slate-400"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
          {/* Context card — pinned below the scrollable category list */}
          <div className="shrink-0 px-3 pb-3 pt-2 mt-1 border-t border-slate-200">
            <div className="rounded-xl bg-[var(--brand-soft)] border border-[var(--color-brand-100)] p-2">
              <p className="text-[9px] font-bold text-[var(--brand)] uppercase tracking-wide">Context</p>
              <p className="text-[10px] text-[var(--brand-strong)] mt-0.5 leading-tight">{context.section}</p>
              {context.tab && (
                <p className="text-[10px] text-[var(--brand)] leading-tight">{context.tab}</p>
              )}
              {context.entity && (
                <p className="text-[10px] text-[var(--brand)] leading-tight truncate">{context.entity}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Commands grouped by pack */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-2">
            {activeCategory} ({flatFiltered.length})
          </p>

          {groupedByPack.length === 0 && (
            <p className="text-[11px] text-slate-400 px-3 py-4 text-center">
              No commands match your search.
            </p>
          )}

          {groupedByPack.map((group) => {
            const groupStartIndex = cumulativeIndex
            cumulativeIndex += group.cmds.length

            return (
              <div key={group.pack} className="mb-2">
                {/* Pack group header */}
                <div className="flex items-center gap-2 px-3 py-1 mb-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {group.cmds.map((cmd, i) => {
                  const globalIndex = groupStartIndex + i
                  return (
                    <button
                      key={cmd.slug}
                      onClick={() => onSelect(cmd.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                        globalIndex === selectedIndex
                          ? "bg-[var(--brand-soft)] border border-[var(--color-brand-100)]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <p className="text-[11.5px] font-semibold text-[var(--brand)]">{cmd.label}</p>
                        <p className="text-[10px] text-slate-500">{cmd.description}</p>
                      </div>
                      {cmd.shortcut ? (
                        <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono ml-2 shrink-0">
                          {cmd.shortcut}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Right: Suggested + Tip — hidden on phones. */}
        <div className="hidden sm:block w-[160px] shrink-0 border-l border-slate-100 bg-slate-50 p-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Suggested
          </p>
          {SUGGESTED_COMMANDS.map((slug) => {
            const cmd = commands.find((c) => c.slug === slug)
            return cmd ? (
              <button
                key={slug}
                onClick={() => onSelect(slug)}
                className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] text-slate-600 hover:bg-white hover:shadow-sm transition-all mb-0.5 truncate"
              >
                {cmd.label}
              </button>
            ) : null
          })}
          {/* Tip */}
          <div className="mt-3 rounded-xl bg-violet-50 border border-violet-100 p-2">
            <p className="text-[9px] font-bold text-violet-600 uppercase tracking-wide">Tip</p>
            <p className="text-[10px] text-violet-700 mt-0.5 leading-snug">
              Commands run in the context of the current page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
