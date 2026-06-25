"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  KeyRound, Clock, Upload, XCircle, Plus, Globe, ShieldCheck,
  ArrowUpRight, Users,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { PortalsTabNav } from "@/components/portals/PortalsTabNav"
import { GrantPortalAccessModal } from "@/components/portals/GrantPortalAccessModal"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePortalGrants, usePortalUploadsCount } from "@/hooks/usePortals"
import { GRANT_STATUS_META, profileLabel } from "@/lib/portals/config"
import { cn } from "@/lib/utils"

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const t = new Date(expiresAt).getTime()
  const now = Date.now()
  return t > now && t - now < 7 * 24 * 60 * 60 * 1000
}

export default function PortalsOverviewPage() {
  const { workspace } = useWorkspace()
  const { data: grants = [], isLoading, isError, refetch } = usePortalGrants(workspace?.id)
  const { data: uploadsCount = 0 } = usePortalUploadsCount(workspace?.id)
  const [showGrant, setShowGrant] = useState(false)
  // Open the grant modal when arrived via the global "New" quick-create (?new=1).
  const _searchParams = useSearchParams()
  useEffect(() => {
    if (_searchParams.get("new") === "1") setShowGrant(true)
  }, [_searchParams])

  const kpis = useMemo(() => {
    const active = grants.filter((g) => ["active", "opened", "email_sent", "created"].includes(g.status) && g.status !== "revoked").length
    const expiring = grants.filter(
      (g) => g.status !== "revoked" && g.status !== "expired" && isExpiringSoon(g.expires_at)
    ).length
    const revoked = grants.filter((g) => g.status === "revoked").length
    return { active, expiring, revoked }
  }, [grants])

  const recent = grants.slice(0, 6)

  const KPI_CARDS = [
    { label: "Active grants", value: kpis.active, icon: KeyRound, tint: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Expiring (7d)", value: kpis.expiring, icon: Clock, tint: "text-amber-600", bg: "bg-amber-50" },
    { label: "Recipient uploads", value: uploadsCount, icon: Upload, tint: "text-blue-600", bg: "bg-blue-50" },
    { label: "Revoked", value: kpis.revoked, icon: XCircle, tint: "text-red-500", bg: "bg-red-50" },
  ]

  return (
    <DashboardContainer>
      <div className="px-6 pt-6 pb-10 space-y-6">
        <SectionHeader
          title="Customer Portals"
          subtitle="Provision secure, scoped portal access for landlords, suppliers and tenants."
          actions={
            <button
              onClick={() => setShowGrant(true)}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Grant portal access
            </button>
          }
          tabs={<PortalsTabNav />}
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map((k) => {
            const Icon = k.icon
            return (
              <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", k.bg)}>
                    <Icon className={cn("w-5 h-5", k.tint)} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-3 tabular-nums">
                  {isLoading ? "—" : k.value}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{k.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Recent grants */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent portal grants</h3>
              <Link href="/property-manager/portals/access" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
            ) : isError ? (
              <div className="py-16 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Couldn’t load portal grants</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Something went wrong fetching this workspace’s portal access. Please try again.
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : recent.length === 0 ? (
              <div className="py-16 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600">No portal access granted yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Grant a contact secure, scoped access to start exchanging documents, invoices or applications.
                </p>
                <button
                  onClick={() => setShowGrant(true)}
                  className="mt-4 inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Grant portal access
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recent.map((g) => {
                  const meta = GRANT_STATUS_META[g.status] ?? GRANT_STATUS_META.created
                  return (
                    <Link
                      key={g.id}
                      href={`/property-manager/portals/access/${g.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {(g.contact?.full_name ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {g.contact?.full_name || "Unknown contact"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{profileLabel(g.access_type)}</p>
                      </div>
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0", meta.cls)}>
                        {meta.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Side column */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Quick actions</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setShowGrant(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-white text-sm font-medium px-4 py-2.5 hover:bg-[#1d4ed8] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Grant portal access
                </button>
                <Link
                  href="/property-manager/portals/profiles"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  Manage profiles
                </Link>
              </div>
            </div>

            {/* Recipient portal status */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800 mb-1">Recipient portal active</p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Grants are provisioned here (server-side hashed token). Recipients open their scoped portal
                    via the secure link — token entry, expiry and revoked states are all live.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Secure by design</h3>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-500 leading-relaxed">
                <li>Tokens minted server-side and stored hashed only.</li>
                <li>Raw tokens are never shown in this UI.</li>
                <li>Every grant is scoped to a single contact + purpose.</li>
                <li>Links expire automatically and can be revoked instantly.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showGrant && (
        <GrantPortalAccessModal
          workspaceId={workspace?.id}
          onClose={() => setShowGrant(false)}
        />
      )}
    </DashboardContainer>
  )
}
