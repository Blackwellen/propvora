import Link from "next/link"
import { ArrowLeft, PoundSterling, TrendingUp, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../../_guard"
import { getTenantPayments, getTenantTenancies } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function directionMeta(direction: string) {
  if (direction === "in") return { label: "Payment received", colour: "text-[#059669]", icon: TrendingUp }
  return { label: "Payment out", colour: "text-[#dc2626]", icon: TrendingDown }
}

function statusBadge(status: string | null) {
  if (!status || status === "completed" || status === "paid") return null
  if (status === "pending") return <Badge variant="warning" dot>Pending</Badge>
  if (status === "failed") return <Badge variant="danger" dot>Failed</Badge>
  return <Badge dot>{status}</Badge>
}

export default async function TenantPaymentsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`

  const [payments, tenancies] = await Promise.all([
    getTenantPayments(session),
    getTenantTenancies(session),
  ])

  const current = tenancies.find((t) => t.status === "active") ?? tenancies[0] ?? null
  const rentPcm = current?.rent_amount ?? null

  const totalIn = payments.filter((p) => p.direction === "in").reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalOut = payments.filter((p) => p.direction === "out").reduce((s, p) => s + (p.amount ?? 0), 0)
  const overdue = payments.filter((p) => p.status === "overdue" || p.status === "failed").length

  return (
    <div className="space-y-5">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500">Your rent payment ledger</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-100">
          <div className="flex items-center gap-2 mb-1">
            <PoundSterling className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-emerald-600">Total received</p>
          </div>
          <p className="text-xl font-bold text-[#059669]">{formatMoney(totalIn)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <PoundSterling className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-500">Monthly rent</p>
          </div>
          <p className="text-xl font-bold text-slate-700">{rentPcm != null ? formatMoney(rentPcm) : "—"}</p>
        </div>
        {overdue > 0 ? (
          <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-[#dc2626]" />
              <p className="text-xs text-red-600">Overdue / Failed</p>
            </div>
            <p className="text-xl font-bold text-[#dc2626]">{overdue} payment{overdue === 1 ? "" : "s"}</p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
              <p className="text-xs text-[#2563EB]">Status</p>
            </div>
            <p className="text-sm font-semibold text-[#059669]">All payments up to date</p>
          </div>
        )}
      </div>

      {/* Payment ledger */}
      <Card className="rounded-2xl border-slate-200">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <PoundSterling className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No payment records yet</h3>
            <p className="text-xs text-slate-400 mt-1">Payment history will appear here once transactions are recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Date", "Description", "Category", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const meta = directionMeta(p.direction)
                  const Icon = meta.icon
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.colour}`} />
                          <span className="text-xs text-slate-700">{p.description ?? meta.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{p.category?.replace(/_/g, " ") ?? "—"}</td>
                      <td className={`px-4 py-3 text-xs font-semibold ${meta.colour}`}>
                        {p.direction === "out" ? "−" : "+"}{formatMoney(p.amount, p.currency ?? "GBP")}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(p.status) ?? <span className="text-xs text-[#059669]">Received</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
