"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Check, X, Pencil, Search, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInlineEdit } from "@/hooks/useInlineEdit"
import { useIsMobile } from "@/components/mobile/useBreakpoint"
import MobileSheet from "@/components/mobile/MobileSheet"

/* ──────────────────────────────────────────────────────────────────────────
   InlineEditRelationshipSelect — searchable FK editor.

   For foreign-key fields (property_id, contact_id, supplier_id, …) where the
   raw value is a UUID. NEVER renders a raw UUID: the display always resolves
   to the option label (or a placeholder). Editing opens a searchable list —
   a popover on desktop, a MobileSheet on mobile — with full keyboard support.

   Presentation + state only. The caller owns the Supabase mutation via onSave.
─────────────────────────────────────────────────────────────────────────── */

export interface RelationshipOption {
  value: string
  label: string
  /** Optional secondary line (e.g. address, email) shown muted. */
  sublabel?: string
}

export interface InlineEditRelationshipSelectProps {
  value: string | null | undefined
  options: RelationshipOption[]
  onSave: (val: string) => Promise<void>
  label?: string
  placeholder?: string
  className?: string
  displayClassName?: string
  /** Allow clearing the relationship to empty. */
  clearable?: boolean
  readOnly?: boolean
  disabled?: boolean
  permission?: boolean
  readOnlyReason?: string
  silentToast?: boolean
}

export function InlineEditRelationshipSelect({
  value,
  options,
  onSave,
  label,
  placeholder,
  className,
  displayClassName,
  clearable,
  readOnly,
  disabled,
  permission,
  readOnlyReason,
  silentToast,
}: InlineEditRelationshipSelectProps) {
  const locked = readOnly || disabled || permission === false
  const isMobile = useIsMobile()

  const {
    editing,
    saving,
    error,
    displayValue,
    enterEdit,
    cancel,
    commit,
  } = useInlineEdit<string>({
    value: String(value ?? ""),
    onSave,
    permission: !locked,
    label,
    silent: silentToast,
  })

  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const ariaLabel = label ? `Edit ${label}` : "Edit relationship"

  // Never render a raw UUID — always resolve to the label.
  const currentLabel = useMemo(
    () => options.find((o) => o.value === String(displayValue ?? ""))?.label,
    [options, displayValue]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.sublabel?.toLowerCase().includes(q)
    )
  }, [options, query])

  // Focus search on open; reset query each time.
  useEffect(() => {
    if (editing) {
      setQuery("")
      if (!isMobile) {
        const t = setTimeout(() => searchRef.current?.focus(), 20)
        return () => clearTimeout(t)
      }
    }
  }, [editing, isMobile])

  // Close desktop popover on outside click.
  useEffect(() => {
    if (!editing || isMobile) return
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        cancel()
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [editing, isMobile, cancel])

  function choose(next: string) {
    void commit(next)
  }

  function DisplayText() {
    return (
      <span className={cn("text-[13px] text-slate-700", displayClassName)}>
        {currentLabel ?? (
          <span className="text-slate-400 italic">{placeholder ?? "—"}</span>
        )}
      </span>
    )
  }

  // ── Locked path ───────────────────────────────────────────────────────────
  if (locked) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5", className)}
        title={readOnlyReason}
      >
        <DisplayText />
        {readOnlyReason && (
          <>
            <Lock className="w-3 h-3 text-slate-300 shrink-0" aria-hidden="true" />
            <span className="sr-only">
              {label ? `${label} is read-only. ` : "Read-only. "}
              {readOnlyReason}
            </span>
          </>
        )}
      </span>
    )
  }

  const list = (
    <ul role="listbox" aria-label={label ?? "Options"} className="py-1">
      {clearable && (
        <li role="option" aria-selected={!displayValue}>
          <button
            type="button"
            onClick={() => void choose("")}
            className="w-full text-left px-3 py-2 text-[13px] text-slate-500 italic hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]/40 rounded-md"
          >
            Clear selection
          </button>
        </li>
      )}
      {filtered.length === 0 ? (
        <li className="px-3 py-3 text-[12.5px] text-slate-400">No matches</li>
      ) : (
        filtered.map((o) => {
          const selected = o.value === String(displayValue ?? "")
          return (
            <li key={o.value} role="option" aria-selected={selected}>
              <button
                type="button"
                onClick={() => void choose(o.value)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md flex items-start justify-between gap-2",
                  "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]/40 transition-colors",
                  isMobile && "min-h-[44px]"
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[13px] text-slate-800 truncate">{o.label}</span>
                  {o.sublabel && (
                    <span className="block text-[11.5px] text-slate-400 truncate">{o.sublabel}</span>
                  )}
                </span>
                {selected && <Check className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />}
              </button>
            </li>
          )
        })
      )}
    </ul>
  )

  const searchBox = (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
      <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
      <input
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel()
        }}
        placeholder={`Search ${label ?? "options"}…`}
        aria-label={`Search ${label ?? "options"}`}
        className="flex-1 text-[13px] bg-transparent focus-visible:outline-none text-slate-900 placeholder:text-slate-400"
      />
    </div>
  )

  // ── Mobile sheet ──────────────────────────────────────────────────────────
  if (editing && isMobile) {
    return (
      <span ref={containerRef} className={cn("inline-flex items-center gap-1", className)}>
        <DisplayText />
        <MobileSheet open={editing} onClose={cancel} title={label ? `Edit ${label}` : "Select"}>
          {searchBox}
          <div className="max-h-[55vh] overflow-y-auto">{list}</div>
          {error && (
            <p className="px-3 py-2 text-[12px] text-red-500" role="alert">
              {error}
            </p>
          )}
        </MobileSheet>
      </span>
    )
  }

  // ── Display + always-visible pen (and desktop popover when editing) ───────
  return (
    <span ref={containerRef} className={cn("relative inline-flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={enterEdit}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={editing}
        className="inline-flex items-center gap-1 text-left rounded-md cursor-pointer px-0.5 -mx-0.5 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30"
      >
        <DisplayText />
      </button>
      <button
        type="button"
        onClick={enterEdit}
        aria-label={ariaLabel}
        className={cn(
          "shrink-0 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-[var(--brand)] hover:bg-[var(--brand)]/8 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30",
          isMobile ? "w-9 h-9" : "w-6 h-6"
        )}
      >
        {saving ? (
          <span className="w-3.5 h-3.5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin motion-reduce:animate-none" />
        ) : (
          <Pencil className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />
        )}
      </button>

      {editing && !isMobile && (
        <div
          className="absolute top-full left-0 mt-1 z-50 w-72 max-w-[80vw] bg-white rounded-xl border border-[#E2EAF6] shadow-[0_12px_40px_rgba(15,23,42,0.16)] motion-safe:animate-[fadeIn_0.12s_ease-out]"
          role="dialog"
          aria-label={label ? `Edit ${label}` : "Select"}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <span className="text-[12px] font-semibold text-[#071B4D]">{label ?? "Select"}</span>
            <button
              type="button"
              onClick={cancel}
              aria-label="Cancel"
              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {searchBox}
          <div className="max-h-64 overflow-y-auto">{list}</div>
          {error && (
            <p className="px-3 py-2 text-[12px] text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </span>
  )
}

export default InlineEditRelationshipSelect
