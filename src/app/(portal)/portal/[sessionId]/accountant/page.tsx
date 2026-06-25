import Link from "next/link"
import {
  TrendingUp, TrendingDown, PoundSterling, FileText, Building2, Wallet, Receipt,
  ChevronRight, ArrowRight, MessageSquare, ArrowDownLeft, ArrowUpRight,
} from "lucide-react"
import { requirePortalSession } from "../_guard"
import {
  getLandlordTransactions, getLinkedInvoices, getLandlordProperties,
} from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalSectionCard, PortalKpiStrip, StatusChip, PortalEmptyState, type PortalKpi,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const UNPAID = new Set(["sent", "viewed", "approved", "due", "overdue", "disputed"])

export default async function AccountantPortalHome({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "accountant")
  const base = `/portal/${session.id}/accountant`
  const [txns, invoices, properties] = await Promise.all([
    getLandlordTransactions(session),
    getLinkedInvoices(session).catch(() => []),
    getLandlordProperties(session),
  ])

  const income = txns.filter((t) => t.direction === "in").reduce((s, t) => s + (t.amount ?? 0), 0)
  const expenditure = txns.filter((t) => t.direction === "out").reduce((s, t) => s + (t.amount ?? 0), 0)
  const net = income - expenditure
  const outstanding = invoices.filter((i) => UNPAID.has((i.status ?? "").toLowerCase()))
    .reduce((s, i) => s + ((i.total ?? 0) - (i.paid_amount ?? 0)), 0)

  const kpis: PortalKpi[] = [
    { label: "Income YTD", value: formatMoney(income), icon: TrendingUp, tone: "emerald", href: `${base}/transactions` },
    { label: "Expenditure YTD", value: formatMoney(expenditure), icon: TrendingDown, tone: "red", href: `${base}/transactions` },
    { label: "Net P&L YTD", value: formatMoney(net), icon: PoundSterling, tone: net >= 0 ? "emerald" : "red", href: `${base}/statements` },
    { label: "Invoices outstanding", value: formatMoney(outstanding), icon: FileText, tone: outstanding ? "amber" : "emerald", href: `${base}/invoices` },
    { label: "Properties", value: String(properties.length), icon: Building2, tone: "blue" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#071B4D]">Financial overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Read-only access to statements, transactions and invoices shared by {session.workspaceName}.</p>
      </div>

      <PortalKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Recent transactions" icon={Wallet} viewAllHref={`${base}/transactions`}>
            {txns.length === 0 ? (
              <PortalEmptyState icon={Wallet} title="No transactions yet" description="Income and expenditure across the linked properties will appear here." />
            ) : (
              <div className="divide-y divide-[#EEF3FB] -my-1.5">
                {txns.slice(0, 6).map((t) => { const inc = t.direction === "in"; return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${inc ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>{inc ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}</span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#071B4D] truncate">{t.description ?? (inc ? "Income" : "Expense")}</p><p className="text-xs text-slate-400">{formatDate(t.created_at)}</p></div>
                    <span className={`text-sm font-bold ${inc ? "text-emerald-600" : "text-slate-900"}`}>{inc ? "+" : "−"}{formatMoney(t.amount, t.currency ?? "GBP")}</span>
                  </div>
                )})}
              </div>
            )}
          </PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Outstanding invoices" icon={Receipt} viewAllHref={`${base}/invoices`}>
            {invoices.length === 0 ? <PortalEmptyState icon={Receipt} title="No invoices" /> : (
              <ul className="space-y-2">
                {invoices.slice(0, 4).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#EEF3FB] px-3 py-2">
                    <span className="text-sm font-medium text-[#071B4D] truncate">{i.invoice_number ?? "Invoice"}</span>
                    <StatusChip tone={UNPAID.has((i.status ?? "").toLowerCase()) ? "amber" : "emerald"}>{i.status ?? "—"}</StatusChip>
                  </li>
                ))}
              </ul>
            )}
          </PortalSectionCard>
          <PortalSectionCard title="Quick actions" icon={ArrowRight}>
            <div className="grid grid-cols-1 gap-2">
              {[["Statements", `${base}/statements`, Wallet], ["Transactions", `${base}/transactions`, Receipt], ["Invoices", `${base}/invoices`, FileText], ["Messages", `${base}/messages`, MessageSquare]].map(([l, h, I]) => {
                const Icon = I as typeof Wallet
                return <Link key={l as string} href={h as string} className="flex items-center gap-2 rounded-xl border border-[#EEF3FB] hover:bg-[#F8FBFF] px-3 py-2.5 text-sm font-semibold text-[#071B4D]"><Icon className="w-4 h-4 text-[#2563EB]" />{l as string}<ChevronRight className="w-4 h-4 text-slate-300 ml-auto" /></Link>
              })}
            </div>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
