import React from "react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft, Building2, Store, Gavel, Wallet, Tag, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { getAdminIdentity } from "@/lib/admin/guard"
import {
  getWorkspaceLite,
  getWorkspaceMarketplaceFootprint,
  fmtPence,
} from "@/components/admin-marketplace/data"
import { PlanBadge } from "@/components/admin-marketplace/badges"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Workspace marketplace-footprint detail (read-only oversight). Shows how a
 * single workspace participates in the marketplace — buyer/seller activity,
 * gross/fees as seller, active listings, open disputes, pending payouts.
 * No destructive actions this wave. Guard-enforced server-side.
 */
export default async function MarketplaceWorkspaceDetailPage({ params }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const { id } = await params
  const ws = await getWorkspaceLite(id)
  if (!ws) notFound()

  const fp = await getWorkspaceMarketplaceFootprint(id)

  const stats: Array<{ label: string; value: string; icon: React.ElementType; colour: string; bg: string }> = [
    { label: "Purchases (as buyer)", value: fp.asBuyer.toLocaleString("en-GB"), icon: Store, colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
    { label: "Sales (as seller)", value: fp.asSeller.toLocaleString("en-GB"), icon: Store, colour: "text-[#059669]", bg: "bg-[#ECFDF5]" },
    { label: "Gross as seller", value: fmtPence(fp.grossAsSellerPence), icon: Tag, colour: "text-[#7C3AED]", bg: "bg-[#F5F3FF]" },
    { label: "Platform fees paid", value: fmtPence(fp.platformFeeFromSellerPence), icon: Tag, colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
    { label: "Active listings", value: fp.activeListings === null ? "—" : fp.activeListings.toLocaleString("en-GB"), icon: Tag, colour: "text-[#d97706]", bg: "bg-[#FFFBEB]" },
    { label: "Open disputes", value: fp.openDisputes === null ? "—" : fp.openDisputes.toLocaleString("en-GB"), icon: Gavel, colour: "text-[#dc2626]", bg: "bg-[#FEF2F2]" },
    { label: "Pending payouts", value: fmtPence(fp.pendingPayoutPence), icon: Wallet, colour: "text-[#d97706]", bg: "bg-[#FFFBEB]" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/marketplace/workspaces" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Workspaces
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-[200px]">{ws.name}</span>
      </div>

      {/* Header */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0D1B2A] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-lg font-bold text-slate-900">{ws.name}</h1>
              <PlanBadge plan={ws.plan} />
            </div>
            <p className="text-xs text-slate-400">
              {ws.type ? <span className="capitalize">{ws.type}</span> : "—"}
              {ws.planStatus ? ` · ${ws.planStatus}` : ""}
              {" · "}
              <span className="font-mono">{ws.id}</span>
            </p>
            <Link
              href={`/admin/workspaces/${ws.id}`}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Full workspace record
            </Link>
          </div>
        </div>
      </Card>

      {/* Marketplace footprint */}
      <Card className="p-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-[#2563EB]" /> Marketplace footprint
        </h3>
        {!fp.available ? (
          <p className="text-sm text-slate-400">
            The marketplace tables are not provisioned in this database yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="p-3 rounded-xl border border-[#E2E8F0] bg-white">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${s.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${s.colour}`} />
                  </div>
                  <p className={`text-base font-bold leading-none ${s.colour}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{s.label}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <p className="text-[11px] text-slate-400">
        Read-only oversight. To resolve a dispute involving this workspace, use the{" "}
        <Link href="/admin/marketplace/disputes" className="text-[#2563EB] hover:underline">dispute queue</Link>.
      </p>
    </div>
  )
}
