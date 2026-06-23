import Link from "next/link"
import { Package, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { listOrders, type OrderSide } from "@/lib/marketplace/orders"
import { getMarketplaceAccess } from "@/components/marketplace/server"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { formatPence } from "@/lib/marketplace/money"
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState"

/* Marketplace ORDERS — buyer + seller fulfilment records from the REAL kernel
   (`listOrders` over `marketplace_orders`). Workspace-scoped via RLS. */

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  accepted: "bg-[#EFF6FF] text-[#2563EB] border border-blue-100",
  active: "bg-violet-50 text-[#7C3AED] border border-violet-100",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  disputed: "bg-red-50 text-red-700 border border-red-100",
  cancelled: "bg-slate-100 text-slate-500 border border-slate-200",
  refunded: "bg-slate-100 text-slate-500 border border-slate-200",
}

export default async function MarketplaceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>
}) {
  const { side: rawSide } = await searchParams
  const side: OrderSide = rawSide === "buyer" || rawSide === "seller" ? rawSide : "any"
  const access = await getMarketplaceAccess()
  const supabase = await createClient()
  const { data: orders } = access.workspaceId
    ? await listOrders(supabase, access.workspaceId, { side, limit: 100 })
    : { data: [] }
  const rows = orders ?? []

  return (
    <DashboardContainer>
      <MobileTopBar title="Orders" subtitle="Your marketplace orders" showBack backHref="/property-manager/marketplace" />
      <div className="hidden md:block">
        <PageHeader title="Marketplace orders" description="Track purchases and sales across the marketplace" />
      </div>

      {/* Side filter */}
      <div className="mb-4 inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
        {([["any", "All"], ["buyer", "Bought"], ["seller", "Sold"]] as const).map(([key, label]) => (
          <Link
            key={key}
            href={key === "any" ? "/property-manager/marketplace/orders" : `/property-manager/marketplace/orders?side=${key}`}
            className={`inline-flex items-center gap-1 h-9 px-3.5 rounded-[10px] text-[12.5px] font-semibold transition-colors ${
              side === key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {key === "buyer" && <ArrowDownLeft className="w-3.5 h-3.5" />}
            {key === "seller" && <ArrowUpRight className="w-3.5 h-3.5" />}
            {label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <MarketplaceEmptyState
            variant="no-results"
            title="No orders yet"
            description="When you book a stay, buy a service or sell to another workspace, your orders appear here with their live status."
            action={{ label: "Browse the marketplace", href: "/property-manager/marketplace" }}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70 border-b border-slate-200">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5">Order</th>
                <th className="px-4 py-2.5 hidden sm:table-cell">Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] shrink-0">
                        <Package className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{o.title ?? "Marketplace order"}</p>
                        <p className="text-[11px] text-slate-400 tabular-nums truncate">{o.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[12px] text-slate-500">{(o.transaction_type ?? "").replace(/_/g, " ") || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[o.status] ?? STATUS_STYLE.pending}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900 tabular-nums">
                    {formatPence(o.gross_pence ?? null, o.currency ?? "GBP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardContainer>
  )
}
