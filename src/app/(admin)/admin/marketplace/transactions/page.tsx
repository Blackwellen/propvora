import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, PoundSterling } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listTransactions, fmtPence } from "@/components/admin-marketplace/data"
import TransactionsTable from "@/components/admin-marketplace/TransactionsTable"
import StatusFilter from "@/components/admin-marketplace/StatusFilter"
import { NotProvisioned, EmptyState } from "@/components/admin-marketplace/states"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ status?: string; type?: string }>
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "captured", label: "Captured" },
  { value: "released", label: "Released" },
  { value: "disputed", label: "Disputed" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
]

/**
 * Cross-workspace transaction monitor (read-only). Filter by status; shows the
 * buyer→seller flow and full fee breakdown. Guard-enforced server-side.
 */
export default async function MarketplaceTransactionsPage({ searchParams }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const sp = await searchParams
  const { available, rows } = await listTransactions({ status: sp.status, type: sp.type })

  const grossTotal = rows.reduce((a, r) => a + r.grossPence, 0)
  const feeTotal = rows.reduce((a, r) => a + r.platformFeePence, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/marketplace" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Transactions</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transaction monitor</h1>
          <p className="text-xs text-slate-500">
            {available ? `${rows.length} transaction${rows.length === 1 ? "" : "s"}` : "marketplace not provisioned"}
            {available && rows.length > 0 && (
              <>
                {" · "}gross {fmtPence(grossTotal)} · platform fees {fmtPence(feeTotal)}
              </>
            )}
          </p>
        </div>
        <StatusFilter options={STATUS_OPTIONS} />
      </div>

      {!available ? (
        <NotProvisioned table="marketplace_transactions" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PoundSterling}
          title="No transactions match"
          hint="Marketplace transactions will appear here as commerce flows through the platform."
        />
      ) : (
        <TransactionsTable rows={rows} />
      )}
    </div>
  )
}
