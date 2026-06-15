import Link from "next/link"
import { ShoppingBag, Store, Info } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  CustomerPageHeader,
  CustomerCard,
  CustomerEmptyState,
  CustomerStatusBadge,
} from "@/components/customer/ui"
import { moneyPence, shortDate, humanise, toneForStatus } from "@/components/customer/format"
import { requireCustomerContext, listCustomerOrders } from "@/lib/customer"

export const metadata = { title: "Orders · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerOrdersPage() {
  const { supabase, workspaceId } = await requireCustomerContext()
  const orders = await listCustomerOrders(supabase, workspaceId)

  return (
    <div className="space-y-5">
      <MobileTopBar title="Orders" subtitle={`${orders.length} total`} />

      <CustomerPageHeader
        title="Orders"
        subtitle="Your marketplace purchases. Each row shows the live transaction status as recorded by the platform."
      />

      {orders.length === 0 ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="When you buy a service or product from the marketplace, your order — with its real payment and fulfilment status — appears here."
            action={
              <Link
                href="/app/marketplace"
                className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
              >
                <Store className="w-4 h-4" /> Browse marketplace
              </Link>
            }
          />
        </CustomerCard>
      ) : (
        <>
          <CustomerCard className="p-3">
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id}>
                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {o.listing?.title ?? o.listing?.company_name ?? humanise(o.transaction_type) ?? "Order"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {shortDate(o.created_at)}
                        {o.transaction_type ? ` · ${humanise(o.transaction_type)}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-800">{moneyPence(o.gross_pence, o.currency)}</p>
                      <CustomerStatusBadge tone={toneForStatus(o.status)}>{humanise(o.status)}</CustomerStatusBadge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CustomerCard>
          <p className="flex items-start gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Amounts shown are the gross you were charged. Refunds and disputes are reflected in the status above.
          </p>
        </>
      )}
    </div>
  )
}
