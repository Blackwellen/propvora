"use client"

import { useEffect, useRef, useState } from "react"
import type { CopilotPageContext } from "../context/useCopilotPageContext"

interface SlashCommand {
  slug: string
  label: string
  description: string
  shortcut: string
  category: string
}

const COMMANDS: SlashCommand[] = [
  { slug: "/summarise", label: "/summarise", description: "Summarise the current page", shortcut: "⌘1", category: "Compliance" },
  { slug: "/review-compliance", label: "/review-compliance", description: "Review all compliance items", shortcut: "⌘2", category: "Compliance" },
  { slug: "/find-missing-docs", label: "/find-missing-docs", description: "Find missing documents", shortcut: "⌘3", category: "Compliance" },
  { slug: "/create-task", label: "/create-task", description: "Create a new task", shortcut: "⌘4", category: "Tasks & Work" },
  { slug: "/create-work-order", label: "/create-work-order", description: "Create a work order", shortcut: "⌘5", category: "Tasks & Work" },
  { slug: "/draft-supplier-message", label: "/draft-supplier-message", description: "Draft a message to a supplier", shortcut: "⌘6", category: "Communication" },
  { slug: "/send-reminder", label: "/send-reminder", description: "Send a reminder to a contact", shortcut: "⌘7", category: "Communication" },
  { slug: "/log-note", label: "/log-note", description: "Log a note against a record", shortcut: "⌘8", category: "Notes" },
  { slug: "/generate-report", label: "/generate-report", description: "Generate a report", shortcut: "⌘9", category: "Documents" },
  { slug: "/chase-arrears", label: "/chase-arrears", description: "Chase outstanding arrears", shortcut: "⌘A", category: "Communication" },
  { slug: "/book-inspection", label: "/book-inspection", description: "Book a property inspection", shortcut: "⌘B", category: "Tasks & Work" },
  { slug: "/check-tenancy", label: "/check-tenancy", description: "Check tenancy status and details", shortcut: "⌘C", category: "Compliance" },
]

// Category counts derived from COMMANDS so they can never drift out of sync.
const CATEGORIES = (() => {
  const order = ["Compliance", "Tasks & Work", "Communication", "Documents", "Notes"]
  const counts = COMMANDS.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1
    return acc
  }, {})
  return [
    { label: "All actions", count: COMMANDS.length },
    ...order.filter((l) => counts[l]).map((l) => ({ label: l, count: counts[l] })),
  ]
})()

// Starter suggestions (not per-user history — labelled "Suggested" honestly).
const SUGGESTED_COMMANDS = ["/review-compliance", "/chase-arrears", "/create-task"]

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
  const [activeCategory, setActiveCategory] = useState("All actions")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = COMMANDS.filter((c) => {
    const matchesCategory =
      activeCategory === "All actions" || c.category === activeCategory
    const q = query.replace(/^\//, "").toLowerCase()
    const matchesQuery = !q || c.slug.includes(q) || c.description.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

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
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const cmd = filtered[selectedIndex]
        if (cmd) onSelect(cmd.slug)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [filtered, selectedIndex, onClose, onSelect])

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      style={{ maxHeight: 380 }}
    >
      <div className="flex h-full" style={{ minHeight: 320 }}>
        {/* Left: Categories + Context */}
        <div className="w-[160px] shrink-0 border-r border-slate-100 bg-slate-50 p-3 flex flex-col gap-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-2">
            Categories
          </p>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeCategory === cat.label
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <span className="truncate">{cat.label}</span>
              <span className={`text-[10px] ml-1 shrink-0 ${activeCategory === cat.label ? "text-blue-100" : "text-slate-400"}`}>
                {cat.count}
              </span>
            </button>
          ))}
          {/* Context card */}
          <div className="mt-auto pt-2 border-t border-slate-200">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-2">
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">Context</p>
              <p className="text-[10px] text-blue-800 mt-0.5 leading-tight">{context.section}</p>
              {context.tab && (
                <p className="text-[10px] text-blue-600 leading-tight">{context.tab}</p>
              )}
              {context.entity && (
                <p className="text-[10px] text-blue-500 leading-tight truncate">{context.entity}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Commands */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-2">
            {activeCategory} ({filtered.length})
          </p>
          {filtered.map((cmd, i) => (
            <button
              key={cmd.slug}
              onClick={() => onSelect(cmd.slug)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                i === selectedIndex
                  ? "bg-blue-50 border border-blue-100"
                  : "hover:bg-slate-50"
              }`}
            >
              <div>
                <p className="text-[11.5px] font-semibold text-blue-700">{cmd.label}</p>
                <p className="text-[10px] text-slate-500">{cmd.description}</p>
              </div>
              <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono ml-2 shrink-0">
                {cmd.shortcut}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Recents + Tip */}
        <div className="w-[160px] shrink-0 border-l border-slate-100 bg-slate-50 p-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Suggested
          </p>
          {SUGGESTED_COMMANDS.map((slug) => {
            const cmd = COMMANDS.find((c) => c.slug === slug)
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
              Actions run in the context of the current page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
