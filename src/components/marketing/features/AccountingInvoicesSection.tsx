import { Wallet, CheckCircle2, TrendingUp } from "lucide-react"

const bullets = [
  "Full Chart of Accounts with category mapping",
  "Profit & loss reports by property or portfolio",
  "Bank statement reconciliation",
  "MTD VAT reporting ready",
  "Invoice management with supplier linkage",
  "Supplier payment tracking",
]

const invoices = [
  { ref: "#INV-0041", property: "12 Maple Street", amount: "£1,850", status: "Paid" },
  { ref: "#INV-0042", property: "Unit 5A, Riverview", amount: "£3,200", status: "Paid" },
  { ref: "#INV-0043", property: "8 Park Lane", amount: "£950", status: "Pending" },
]

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
const incomeData = [38000, 42000, 39500, 45000, 43000, 48390]
const expenseData = [11200, 13500, 10800, 14200, 11900, 12840]
const maxVal = 55000

export default function AccountingInvoicesSection() {
  return (
    <section id="accounting" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-emerald-200">
              <Wallet className="h-3.5 w-3.5" />
              Accounting & Invoices
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Full accounting{" "}
              <span className="text-emerald-600">built right in</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Double-entry bookkeeping, invoice management, and bank reconciliation — all inside
              Propvora. Know exactly where every pound goes, at property level and portfolio level.
            </p>

            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>

            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-slate-100">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 sm:p-3.5 text-center">
                <div className="text-base sm:text-xl font-bold text-emerald-700">£48,390</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Total Income</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 sm:p-3.5 text-center">
                <div className="text-base sm:text-xl font-bold text-red-600">£12,840</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Expenses</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 sm:p-3.5 text-center">
                <div className="text-base sm:text-xl font-bold text-blue-700">£35,550</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Net Profit</div>
              </div>
            </div>
          </div>

          {/* Right: financial dashboard card */}
          <div className="space-y-4">
            {/* Bar chart card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-800">Income vs Expenses</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Income</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Expenses</span>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-end gap-3 h-36">
                  {months.map((month, i) => {
                    const incH = Math.round((incomeData[i] / maxVal) * 144)
                    const expH = Math.round((expenseData[i] / maxVal) * 144)
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-end gap-0.5 w-full">
                          <div
                            className="flex-1 bg-emerald-500 rounded-t"
                            style={{ height: `${incH}px` }}
                          />
                          <div
                            className="flex-1 bg-rose-400 rounded-t"
                            style={{ height: `${expH}px` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{month}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Invoice table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-800">Recent Invoices</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-6 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Property</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.ref}>
                      <td className="px-6 py-3 text-slate-700 font-mono text-xs">{inv.ref}</td>
                      <td className="px-3 py-3 text-slate-600 text-xs">{inv.property}</td>
                      <td className="px-3 py-3 text-slate-800 font-semibold text-xs">{inv.amount}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            inv.status === "Paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
