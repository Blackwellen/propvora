import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Wallet } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listPayouts, fmtPence } from "@/components/admin-marketplace/data"
import PayoutsTable from "@/components/admin-marketplace/PayoutsTable"
import StatusFilter from "@/components/admin-marketplace/StatusFilter"
import { NotProvisioned, EmptyState } from "@/components/admin-marketplace/states"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "reversed", label: "Reversed" },
]

/**
 * Platform-wide payout monitor (read-only). Status, amounts (integer pence), and
 * the receiving workspace. Guard-enforced server-side.
 */
export default async function MarketplacePayoutsPage({ searchParams }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const sp = await searchParams
  const { available, rows } = await listPayouts({ status: sp.status })

  const total = rows.reduce((a, r) => a + r.amountPence, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/marketplace" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Payouts</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payout monitor</h1>
          <p className="text-xs text-slate-500">
            {available ? `${rows.length} payout${rows.length === 1 ? "" : "s"}` : "payouts not provisioned"}
            {available && rows.length > 0 && <> · total {fmtPence(total)}</>}
          </p>
        </div>
        <StatusFilter options={STATUS_OPTIONS} />
      </div>

      {!available ? (
        <NotProvisioned table="payouts" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payouts match"
          hint="Seller payouts will appear here once transactions are released."
        />
      ) : (
        <PayoutsTable rows={rows} />
      )}
    </div>
  )
}
