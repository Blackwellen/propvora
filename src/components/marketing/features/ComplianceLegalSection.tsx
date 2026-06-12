import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

type StatusType = "compliant" | "expiring" | "overdue"

interface ComplianceRow {
  category: string
  compliant: number
  total: number
  status: StatusType
  note: string
}

const complianceRows: ComplianceRow[] = [
  {
    category: "Gas Safety Certificate",
    compliant: 12,
    total: 14,
    status: "expiring",
    note: "2 expiring within 30 days",
  },
  {
    category: "Electrical Safety (EICR)",
    compliant: 10,
    total: 14,
    status: "overdue",
    note: "4 due for renewal",
  },
  {
    category: "EPC Rating",
    compliant: 13,
    total: 14,
    status: "expiring",
    note: "1 requires upgrade to min. E",
  },
  {
    category: "Fire Safety Check",
    compliant: 14,
    total: 14,
    status: "compliant",
    note: "All properties compliant",
  },
  {
    category: "Legionella Risk Assessment",
    compliant: 11,
    total: 14,
    status: "expiring",
    note: "3 assessments pending",
  },
  {
    category: "HMO Licence",
    compliant: 6,
    total: 6,
    status: "compliant",
    note: "All 6 HMOs licensed",
  },
]

const bullets = [
  "Centralised document management per property",
  "Automatic expiry alerts (30, 14 & 7 days)",
  "Full audit trail for every compliance event",
  "Compliance calendar with team assignments",
]

function StatusBadge({ status }: { status: StatusType }) {
  if (status === "compliant") {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Compliant
      </span>
    )
  }
  if (status === "expiring") {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
        <AlertTriangle className="h-3 w-3" />
        Action needed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-200">
      <XCircle className="h-3 w-3" />
      Overdue
    </span>
  )
}

export default function ComplianceLegalSection() {
  return (
    <section id="compliance" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Compliance & Legal
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Never miss a compliance{" "}
              <span className="text-emerald-600">deadline again</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Propvora tracks every certificate, licence, and legal obligation across your portfolio
              — flagging issues before they become enforcement notices or fines.
            </p>

            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-slate-200">
              <div>
                <div className="text-4xl font-bold text-emerald-600">6</div>
                <div className="text-sm text-slate-500 mt-0.5">compliance categories</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900">Auto</div>
                <div className="text-sm text-slate-500 mt-0.5">expiry alerts</div>
              </div>
            </div>
          </div>

          {/* Right: compliance tracker card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-white text-sm font-semibold">Compliance Overview</span>
              </div>
              <span className="text-slate-400 text-xs">14 properties</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {complianceRows.map((row) => {
                const pct = Math.round((row.compliant / row.total) * 100)
                const barColor =
                  row.status === "compliant"
                    ? "bg-emerald-500"
                    : row.status === "expiring"
                    ? "bg-amber-400"
                    : "bg-red-500"

                return (
                  <div key={row.category} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-800">{row.category}</span>
                      <StatusBadge status={row.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Progress bar */}
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-20 text-right shrink-0">
                        {row.compliant}/{row.total} · {row.note}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">3 items require attention this month</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
