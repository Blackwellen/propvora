"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Wrench, MessageSquare, Receipt, AlertTriangle, ShieldCheck,
  CalendarClock, Sparkles, UserPlus, ShieldAlert, CreditCard,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface AlertToggles {
  workReminders: boolean
  supplierReplies: boolean
  invoiceDue: boolean
  arrears: boolean
  complianceExpiry: boolean
  planningOfferExpiry: boolean
  aiApproval: boolean
  teamInvite: boolean
  securityAlerts: boolean
  billingAlerts: boolean
}

const ALERT_ROWS: { key: keyof AlertToggles; label: string; desc: string; icon: LucideIcon; tint: string }[] = [
  { key: "workReminders",       label: "Work reminders",               desc: "Due dates and task reminders for maintenance and inspections",    icon: Wrench,        tint: "bg-[var(--brand-soft)] text-[var(--brand)]"      },
  { key: "supplierReplies",     label: "Supplier reply notifications", desc: "When a supplier responds to a message or quote request",          icon: MessageSquare, tint: "bg-violet-50 text-violet-600"  },
  { key: "invoiceDue",          label: "Invoice due alerts",           desc: "Alerts when tenant or supplier invoices are approaching due date", icon: Receipt,       tint: "bg-amber-50 text-amber-600"    },
  { key: "arrears",             label: "Arrears alerts",               desc: "When rent payments are overdue or a tenant falls into arrears",    icon: AlertTriangle, tint: "bg-red-50 text-red-600"        },
  { key: "complianceExpiry",    label: "Compliance expiry alerts",     desc: "Gas safety, EPC, EICR and other certificates nearing expiry",     icon: ShieldCheck,   tint: "bg-emerald-50 text-emerald-600" },
  { key: "planningOfferExpiry", label: "Planning offer expiry",        desc: "When planning or legal offer deadlines are approaching",          icon: CalendarClock, tint: "bg-orange-50 text-orange-600"  },
  { key: "aiApproval",          label: "AI approval notifications",    desc: "When AI actions are queued and awaiting your review",             icon: Sparkles,      tint: "bg-violet-50 text-violet-600"  },
  { key: "teamInvite",          label: "Team invite notifications",    desc: "When someone accepts or declines a workspace invite",             icon: UserPlus,      tint: "bg-[var(--brand-soft)] text-[var(--brand)]"      },
  { key: "securityAlerts",      label: "Security alerts",              desc: "Suspicious login attempts, MFA changes, and access events",       icon: ShieldAlert,   tint: "bg-red-50 text-red-600"        },
  { key: "billingAlerts",       label: "Billing alerts",               desc: "Payment failures, subscription changes and invoice notices",      icon: CreditCard,    tint: "bg-emerald-50 text-emerald-600" },
]

function ToggleRow({ label, desc, enabled, onToggle, icon: Icon, tint }: {
  label: string; desc: string; enabled: boolean; onToggle: () => void; icon: LucideIcon; tint: string
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", tint)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 pr-4 min-w-0">
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className={cn(
          "w-10 h-6 rounded-full transition-colors shrink-0 relative",
          enabled ? "bg-[var(--brand)]" : "bg-slate-200"
        )}
      >
        <span className={cn(
          "absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm motion-safe:transition-transform",
          enabled ? "translate-x-5" : "translate-x-1"
        )} />
      </button>
    </div>
  )
}

export interface NotificationAlertTypesSectionProps {
  alerts: AlertToggles
  onToggle: (key: keyof AlertToggles) => void
  onAllOn: () => void
  onAllOff: () => void
}

export function NotificationAlertTypesSection({
  alerts, onToggle, onAllOn, onAllOff,
}: NotificationAlertTypesSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900">Alert Types</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">Choose which workspace events trigger notifications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAllOn}
            className="text-[11.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors"
          >
            All on
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={onAllOff}
            className="text-[11.5px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            All off
          </button>
        </div>
      </div>
      {ALERT_ROWS.map((row) => (
        <ToggleRow
          key={row.key}
          label={row.label}
          desc={row.desc}
          icon={row.icon}
          tint={row.tint}
          enabled={alerts[row.key]}
          onToggle={() => onToggle(row.key)}
        />
      ))}
    </div>
  )
}

export default NotificationAlertTypesSection
