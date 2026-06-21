"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MapPin, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NominatimResult {
  place_id: number
  display_name: string
  type: string
  class: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    postcode?: string
    road?: string
    country?: string
  }
}

export interface LocationValue {
  label: string
  lat: number
  lng: number
}

interface Props {
  value: string
  onChange: (label: string, coords?: { lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  /** Label shown above the input (e.g. "Where") */
  label?: string
  /** If true, input is borderless/transparent (for embedding in a segmented bar) */
  bare?: boolean
}

function placeTypeLabel(result: NominatimResult): string {
  const addr = result.address ?? {}
  if (addr.postcode && result.class === "place") return "Postcode"
  if (result.type === "city" || result.type === "administrative") return "City"
  if (result.type === "town") return "Town"
  if (result.type === "village") return "Village"
  if (result.type === "road" || result.class === "highway") return "Road"
  if (result.type === "postcode") return "Postcode"
  return result.type.charAt(0).toUpperCase() + result.type.slice(1)
}

function formatDisplayName(result: NominatimResult): string {
  const addr = result.address ?? {}
  const parts: string[] = []
  if (addr.road) parts.push(addr.road)
  const locality = addr.city ?? addr.town ?? addr.village
  if (locality) parts.push(locality)
  if (addr.county && locality !== addr.county) parts.push(addr.county)
  if (addr.postcode) parts.push(addr.postcode)
  return parts.length > 0 ? parts.join(", ") : result.display_name.split(",").slice(0, 3).join(",").trim()
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "City, area or postcode",
  className,
  inputClassName,
  label,
  bare = false,
}: Props) {
  const [inputValue, setInputValue] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Sync external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(false)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=gb&format=json&limit=5&addressdetails=1`
      const res = await fetch(url, {
        headers: { "User-Agent": "Propvora/1.0 (propvora.com)" },
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error("Network error")
      const data = (await res.json()) as NominatimResult[]
      setResults(Array.isArray(data) ? data : [])
      setOpen(true)
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setError(true)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInputValue(v)
    onChange(v) // keep parent in sync with typed text
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(v)
    }, 300)
  }

  function handleSelect(result: NominatimResult) {
    const label = formatDisplayName(result)
    setInputValue(label)
    setOpen(false)
    onChange(label, { lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
  }

  function handleClear() {
    setInputValue("")
    setResults([])
    setOpen(false)
    onChange("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="min-w-0 flex-1">
          {label && (
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
          )}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (results.length > 0) setOpen(true)
              }}
              placeholder={placeholder}
              autoComplete="off"
              className={cn(
                bare
                  ? "w-full text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent mt-0.5"
                  : "h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-[13.5px] text-slate-700 shadow-sm transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20",
                inputClassName
              )}
              aria-label={label ?? placeholder}
              aria-autocomplete="list"
              aria-expanded={open}
              role="combobox"
            />
            {(loading) && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 shrink-0" />}
            {!loading && inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="shrink-0 text-slate-400 hover:text-slate-600"
                aria-label="Clear location"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[260px] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
          role="listbox"
        >
          {error ? (
            <div className="px-4 py-3 text-[13px] text-slate-500">
              Could not load suggestions. Check your connection and try again.
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-[13px] text-slate-500">No locations found.</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    role="option"
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">
                        {formatDisplayName(r)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{placeTypeLabel(r)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 px-4 py-2 text-[10.5px] text-slate-400">
            Powered by OpenStreetMap
          </div>
        </div>
      )}

      {/* Mobile: bottom sheet overlay on narrow viewports */}
      {open && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      {open && results.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl pb-safe-area-inset-bottom">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-700">Select a location</span>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-[14px] font-medium text-slate-800">{formatDisplayName(r)}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">{placeTypeLabel(r)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 text-[11px] text-slate-400 border-t border-slate-100">
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  )
}
