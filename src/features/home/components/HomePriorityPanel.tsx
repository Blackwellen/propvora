"use client"

import Link from "next/link"
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
} from "lucide-react"
import type { HomePriorityItem } from "../types"

interface HomePriorityPanelProps {
  items: HomePriorityItem[]
}

type Urgency = "red" | "amber" | "blue"

function UrgencyBadge({ label, urgency }: { label: string; urgency: Urgency }) {
  const styles: Record<Urgency, string> = {
    red: "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    blue: "bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${styles[urgency]}`}>
      {label}
    </span>
  )
}

function UrgencyIcon({ urgency }: { urgency: Urgency }) {
  const iconClass: Record<Urgency, string> = {
    red: "text-red-500",
    amber: "text-amber-500",
    blue: "text-[var(--brand)]",
  }
  const bgClass: Record<Urgency, string> = {
    red: "bg-red-50",
    amber: "bg-amber-50",
    blue: "bg-[var(--brand-soft)]",
  }
  const icons = {
    red: AlertTriangle,
    amber: Clock,
    blue: ShieldAlert,
  }
  const Icon = icons[urgency]
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass[urgency]}`}>
      <Icon className={iconClass[urgency]} style={{ width: 15, height: 15 }} />
    </div>
  )
}

export function HomePriorityPanel({ items }: HomePriorityPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-slate-900">Needs attention</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">Priority items requiring action</p>
        </div>
        {items.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldAlert className="text-emerald-500" style={{ width: 20, height: 20 }} />
            </div>
            <p className="text-[13px] font-medium text-slate-700">All clear</p>
            <p className="text-[12px] text-slate-400 text-center">No urgent items requiring attention right now.</p>
          </div>
        ) : (
          items.map((item) => {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
              >
                <UrgencyIcon urgency={item.urgency} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate group-hover:text-[var(--brand)] transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <UrgencyBadge label={item.dueLabel} urgency={item.urgency} />
                  <ArrowRight className="text-slate-300 group-hover:text-slate-500 transition-colors" style={{ width: 14, height: 14 }} />
                </div>
              </Link>
            )
          })
        )}
      </div>

      {items.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Showing {items.length} priority item{items.length !== 1 ? "s" : ""} across your portfolio
          </p>
        </div>
      )}
    </div>
  )
}
