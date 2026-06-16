import Link from "next/link"
import {
  Receipt,
  CreditCard,
  ShieldCheck,
  Info,
  Wallet,
  Banknote,
  ChevronRight,
  Lock,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  CustomerPageHeader,
  CustomerCard,
  CustomerEmptyState,
  CustomerKpiStrip,
  CustomerStatusBadge,
  type CustomerKpi,
} from "@/components/customer/ui"
import { moneyPence, shortDate, toneForStatus } from "@/components/customer/format"
import { requireCustomerContext, listCustomerReceipts } from "@/lib/customer"

export const metadata = { title: "Payments · Propvora" }
export const dynamic = "force-dynamic"

const PAY_LABEL: Record<string, { label: string; tone: "emerald" | "amber" | "slate" }> = {
  paid: { label: "Paid", tone: "emerald" },
  deposit_paid: { label: "Deposit paid", tone: "emerald" },
  unpaid: { label: "Payment due", tone: "amber" },
  refunded: { label: "Refunded", tone: "slate" },
  partially_refunded: { label: "Partially refunded", tone: "slate" },
}

export default async function CustomerPaymentsPage() {
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const receipts = await listCustomerReceipts(supabase, workspaceId, email)

  const live = receipts.filter((r) => !/(cancelled|canceled|expired)/i.test(r.status))
  const currency = live[0]?.currency ?? "GBP"
  const totalPaid = live
    .filter((r) => ["paid", "deposit_paid"].includes(r.payment_status ?? ""))
    .reduce((s, r) => s + (r.total_pence ?? 0), 0)
  const depositsHeld = live
    .filter((r) => ["paid", "deposit_paid", "confirmed"].includes(r.payment_status ?? r.status))
    .reduce((s, r) => s + (r.deposit_pence ?? 0), 0)
  const outstanding = live
    .filter((r) => (r.payment_status ?? "unpaid") === "unpaid")
    .reduce((s, r) => s + (r.total_pence ?? 0), 0)

  const kpis: CustomerKpi[] = [
    { icon: Banknote, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", value: moneyPence(totalPaid, currency), label: "Total paid", sub: "Across your stays" },
    { icon: ShieldCheck, iconBg: "bg-blue-50", iconColor: "text-blue-600", value: moneyPence(depositsHeld, currency), label: "Deposits held", sub: "Refundable in escrow" },
    { icon: Wallet, iconBg: outstanding > 0 ? "bg-amber-50" : "bg-slate-50", iconColor: outstanding > 0 ? "text-amber-600" : "text-slate-400", value: moneyPence(outstanding, currency), label: "Outstanding", sub: outstanding > 0 ? "Balance due" : "Nothing due", subColor: outstanding > 0 ? "text-amber-600" : "text-slate-400" },
  ]

  return (
    <div className="space-y-5">
      <MobileTopBar title="Payments" subtitle={`${receipts.length} receipt${receipts.length === 1 ? "" : "s"}`} />

      <CustomerPageHeader
        title="Payments & receipts"
        subtitle="Every charge, deposit and refund on your account — with the live status the platform recorded. Money is shown exactly as you were charged."
      />

      {receipts.length === 0 ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={Receipt}
            title="No payments yet"
            description="When you pay for a stay, your receipts, deposits and any refunds appear here with their real status."
            action={
              <Link href="/stay/search" className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
                <CreditCard className="w-4 h-4" /> Find a stay
              </Link>
            }
          />
        </CustomerCard>
      ) : (
        <>
          <CustomerKpiStrip kpis={kpis} />

          <CustomerCard className="p-3">
            <ul className="space-y-2">
              {receipts.map((r) => {
                const pay = PAY_LABEL[r.payment_status ?? "unpaid"] ?? PAY_LABEL.unpaid
                const canPay = (r.payment_status ?? "unpaid") === "unpaid" && (r.total_pence ?? 0) > 0
                return (
                  <li key={r.id}>
                    <Link
                      href={`/user/bookings/${r.booking_id}`}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {r.title ?? "Stay"}{r.booking_ref ? ` · ${r.booking_ref}` : ""}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {shortDate(r.check_in)} → {shortDate(r.check_out)}
                          {r.deposit_pence && r.deposit_pence > 0 ? ` · deposit ${moneyPence(r.deposit_pence, r.currency)}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-800">{moneyPence(r.total_pence, r.currency)}</p>
                        <div className="flex items-center justify-end gap-1.5">
                          {canPay ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              <Lock className="w-3 h-3" /> Pay balance
                            </span>
                          ) : (
                            <CustomerStatusBadge tone={pay.tone === "emerald" ? "emerald" : pay.tone === "amber" ? "amber" : toneForStatus(r.status)}>
                              {pay.label}
                            </CustomerStatusBadge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </CustomerCard>

          <p className="flex items-start gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Refundable deposits are held in escrow and returned after checkout, less any agreed deductions. Refunds appear against the original receipt.
          </p>
        </>
      )}
    </div>
  )
}
