import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface SupplierHealthEntry {
  name: string
  value: number
  color: string
}

interface SupplierResponseHealthPanelProps {
  supplierHealth: SupplierHealthEntry[]
}

export function SupplierResponseHealthPanel({ supplierHealth }: SupplierResponseHealthPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Supplier Response Health</h2>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie
            data={supplierHealth}
            cx="50%"
            cy="50%"
            innerRadius={32}
            outerRadius={50}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {supplierHealth.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 11 }}
            formatter={(val) => [`${val}%`]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1 mt-2">
        {supplierHealth.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-slate-600">{s.name}</span>
            </span>
            <span className="font-semibold text-slate-700">{s.value}%</span>
          </div>
        ))}
      </div>
      <Link
        href="/property-manager/work/suppliers"
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
      >
        View Suppliers <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
