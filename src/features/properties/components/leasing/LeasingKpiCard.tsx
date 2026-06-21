import React from "react"

interface LeasingKpiCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  iconColor: string
  color: string
}

export function LeasingKpiCard({ label, value, sub, icon: Icon, iconColor, color }: LeasingKpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
