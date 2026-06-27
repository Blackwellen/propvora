"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Search, Trash2, ArrowUpRight } from "lucide-react"
import { CustomerCard } from "./ui"
import type { CustomerSavedSearch } from "@/lib/customer/types"

function toQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === "") continue
    params.set(k, String(v))
  }
  const s = params.toString()
  return s ? `?${s}` : ""
}

function describe(query: Record<string, unknown>): string {
  const parts: string[] = []
  if (query.location) parts.push(String(query.location))
  if (query.guests) parts.push(`${query.guests} guests`)
  if (query.check_in) parts.push(String(query.check_in))
  return parts.join(" · ") || "All stays"
}

export default function SavedSearchesList({
  searches,
  deleteAction,
}: {
  searches: CustomerSavedSearch[]
  deleteAction: (id: string) => Promise<void>
}) {
  const [pending, startTransition] = useTransition()

  return (
    <CustomerCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Saved searches</h2>
      </div>
      {searches.length === 0 ? (
        <p className="text-sm text-slate-500">
          Save a stay search from the marketplace and re-run it here in one tap. Your saved searches are private to your account.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {searches.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{s.label}</p>
                <p className="text-[12px] text-slate-400 truncate">{describe(s.query)}</p>
              </div>
              <Link
                href={`/stay/search${toQueryString(s.query)}`}
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--brand)] hover:underline shrink-0"
              >
                Run <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => { await deleteAction(s.id) })}
                aria-label={`Delete saved search ${s.label}`}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </CustomerCard>
  )
}
