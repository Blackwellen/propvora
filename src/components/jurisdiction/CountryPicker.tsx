"use client"

import React, { useId, useMemo, useState } from "react"
import { Check, ChevronDown, Globe, Search } from "lucide-react"
import type { SelectableCountry } from "@/lib/international/workspace-jurisdiction"

/**
 * Country picker — lists ONLY selectable (offer, non-sanctioned) countries from
 * the live country packs. Sanctioned / restricted countries never appear here
 * because the server (`listSelectableCountries`) filters them out; this is the
 * UI half of the hard block.
 *
 * Reviewed packs (GB) get a "Full support" tag; non-reviewed get "Limited".
 * Pure light surfaces — no Tailwind `dark:` classes.
 */
export function CountryPicker({
  countries,
  value,
  onChange,
  disabled,
}: {
  countries: SelectableCountry[]
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const labelId = useId()

  const selected = useMemo(
    () => countries.find((c) => c.code === value) ?? null,
    [countries, value]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [countries, query])

  return (
    <div className="relative">
      <label id={labelId} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
        Country / jurisdiction
      </label>
      <button
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 hover:border-slate-300 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Globe className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
          <span className="truncate">
            {selected ? `${selected.name} (${selected.code})` : "Select a country"}
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
      </button>

      {open && !disabled && (
        <>
          {/* click-away */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50">
                <Search className="w-3.5 h-3.5 text-slate-400" aria-hidden />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search countries…"
                  className="w-full bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
            <ul role="listbox" aria-labelledby={labelId} className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3.5 py-3 text-[12.5px] text-slate-400">No countries found.</li>
              )}
              {filtered.map((c) => {
                const active = c.code === value
                const reviewed = c.legalStatus === "reviewed"
                return (
                  <li key={c.code} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c.code)
                        setOpen(false)
                        setQuery("")
                      }}
                      className={[
                        "w-full flex items-center justify-between gap-2 px-3.5 py-2 text-[13px] transition-colors",
                        active ? "bg-[#EFF6FF] text-[#2563EB]" : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {active ? (
                          <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        <span className="truncate">
                          {c.name} <span className="text-slate-400">({c.code})</span>
                        </span>
                      </span>
                      <span
                        className={[
                          "text-[10.5px] font-semibold rounded-full px-2 py-0.5 shrink-0",
                          reviewed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200",
                        ].join(" ")}
                      >
                        {reviewed ? "Full support" : "Limited"}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
