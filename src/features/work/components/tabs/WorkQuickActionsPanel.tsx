import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

interface WorkQuickActionsPanelProps {
  actions: QuickAction[]
}

export function WorkQuickActionsPanel({ actions }: WorkQuickActionsPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  action.iconBg
                )}
              >
                <Icon className={cn("w-5 h-5", action.iconColor)} />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
