"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Users, Star, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ResponsiveTable } from "@/components/mobile"
import { Ban, Eye, Briefcase, ExternalLink } from "lucide-react"
import type { SupplierView } from "@/features/suppliers/useSuppliers"
import type { SupplierPreference as WorkspaceSupplierPreference } from "@/lib/suppliers/ratings"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRating(id: string) {
  return 4.3 + ((id.charCodeAt(0) % 7) / 10)
}
function seededResponse(id: string) {
  return (1 + (id.charCodeAt(Math.min(1, id.length - 1)) % 30) / 10).toFixed(1) + " hrs"
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={cn("text-[13px]", i < Math.floor(rating) ? "text-amber-400" : "text-slate-200")}>
          ★
        </span>
      ))}
    </div>
  )
}

function ComplianceBar({ value }: { value: number }) {
  const barColor = value >= 95 ? "bg-emerald-500" : value >= 85 ? "bg-amber-400" : "bg-red-400"
  const textColor = value >= 95 ? "text-emerald-600" : "text-amber-600"
  const badgeClass = value >= 95 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-slate-200">
        <div className={cn("h-1.5 rounded-full", barColor)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-[11px] font-semibold", textColor)}>{value}%</span>
      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", badgeClass)}>
        {value >= 95 ? "Compliant" : "At Risk"}
      </span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AllSuppliersTabProps {
  suppliers: SupplierView[]
  filtered: SupplierView[]
  loading: boolean
  isSeed: boolean
  preferences?: Map<string, WorkspaceSupplierPreference>
  onTogglePreferred: (s: SupplierView) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AllSuppliersTab({
  suppliers,
  filtered,
  loading,
  isSeed,
  preferences,
  onTogglePreferred,
}: AllSuppliersTabProps) {
  const router = useRouter()

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          Supplier Directory <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
        </p>
        {isSeed && (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold">
            Demo data
          </span>
        )}
      </div>

      <ResponsiveTable
        rows={loading ? [] : filtered}
        emptyState={
          <div className="flex flex-col items-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-900 mb-1">No suppliers found</p>
            <p className="text-sm text-slate-500 mb-4">Add a supplier contact or adjust your filters.</p>
            <Link
              href="/property-manager/contacts/new?type=supplier"
              className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold"
            >
              Add Supplier
            </Link>
          </div>
        }
        mobile={{
          getKey: (s) => s.id,
          title: (s) => s.name,
          subtitle: (s) => s.email ?? s.company ?? "—",
          leading: (s) => (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0", s.avatarBg)}>
              {s.initials}
            </div>
          ),
          badge: (s) => <span className="text-[12px] font-semibold text-slate-700">{seededRating(s.id).toFixed(1)}★</span>,
          onRowClick: (s) => router.push(`/property-manager/work/suppliers/${s.id}`),
          fields: [
            { label: "Trade", render: (s) => s.trade },
            { label: "Category", render: (s) => s.category, hideWhenEmpty: true },
            { label: "Location", render: (s) => s.location, hideWhenEmpty: true },
            { label: "Response", render: (s) => seededResponse(s.id) },
          ],
        }}
        className="px-3 pb-3"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Trade / Category</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Location</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Response</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Compliance</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    <td className="px-4 py-3.5" colSpan={7}>
                      <div className="h-9 bg-slate-100 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <Users className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-base font-semibold text-slate-900 mb-1">No suppliers found</p>
                      <p className="text-sm text-slate-500 mb-4">Add a supplier contact or adjust your filters.</p>
                      <Link
                        href="/property-manager/contacts/new?type=supplier"
                        className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"
                      >
                        Add Supplier
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const rating = seededRating(s.id)
                  const pref = preferences?.get(s.id)
                  const showPreferred = (pref?.preferred ?? s.preferred) && !pref?.blocked
                  const showBlocked = pref?.blocked ?? false
                  return (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/property-manager/work/suppliers/${s.id}`)}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0", s.avatarBg)}>
                            {s.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
                              {s.name}
                              {showPreferred && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Preferred
                                </span>
                              )}
                              {showBlocked && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[9px] font-bold text-red-700">
                                  <Ban className="w-2.5 h-2.5" /> Blocked
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{s.email ?? s.company ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-[12.5px] font-medium text-slate-700">{s.trade}</p>
                        <p className="text-[11px] text-slate-400">{s.category}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="text-[12px] text-slate-600">{s.location}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <p className="text-[12.5px] font-semibold text-slate-800">{seededResponse(s.id)}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <ComplianceBar value={96} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <StarRating rating={rating} />
                          <span className="text-[11px] font-semibold text-slate-700 ml-1">{rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex justify-end">
                          <ActionMenu
                            items={[
                              { label: "View Profile", icon: Eye, onClick: () => router.push(`/property-manager/work/suppliers/${s.id}`) },
                              { label: "Assign to Job", icon: Briefcase, onClick: () => router.push(`/property-manager/work/jobs/new?supplierId=${s.id}`) },
                              {
                                label: s.preferred ? "Remove from Preferred" : "Mark Preferred",
                                icon: Star,
                                onClick: () => onTogglePreferred(s),
                              },
                              { label: "View Contact", icon: ExternalLink, onClick: () => router.push(`/property-manager/contacts/${s.id}`) },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </ResponsiveTable>

      {!loading && filtered.length > 0 && (
        <div className="hidden md:flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Showing {filtered.length} of {suppliers.length} suppliers</p>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded text-[12px] font-medium bg-[var(--brand)] text-white">1</button>
            <button className="p-1.5 rounded hover:bg-slate-100" aria-label="Next">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
