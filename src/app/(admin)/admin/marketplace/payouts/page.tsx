import React from "react"
import { redirect } from "next/navigation"
import { Wallet } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listPayouts, fmtPence } from "@/components/admin-marketplace/data"
import PayoutsTable from "@/components/admin-marketplace/PayoutsTable"
import StatusFilter from "@/components/admin-marketplace/StatusFilter"
import { NotProvisioned, EmptyState } from "@/components/admin-marketplace/states"
import { AdminPageHeader } from "@/components/admin/ui"

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
  if (!identity) redirect("/bw-console-x9f3")

  const sp = await searchParams
  const { available, rows } = await listPayouts({ status: sp.status })

  const total = rows.reduce((a, r) => a + r.amountPence, 0)

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Wallet}
        title="Payout monitor"
        subtitle={available
          ? `${rows.length} payout${rows.length === 1 ? "" : "s"}${rows.length > 0 ? ` · total ${fmtPence(total)}` : ""} — platform-wide`
          : "Payouts not provisioned"}
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Marketplace" }, { label: "Payouts" }]}
        actions={<StatusFilter options={STATUS_OPTIONS} />}
      />

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
