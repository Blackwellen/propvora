"use client"

import Link from "next/link"
import { ShieldCheck, FileText, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import type { HomeComplianceItem } from "../types"

interface HomeComplianceLegalCardProps {
  items: HomeComplianceItem[]
  /** Whether the legalSection feature flag is enabled. Defaults to true for backwards-compat. */
  legalEnabled?: boolean
}

type Status = "overdue" | "due-soon" | "ok"

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    overdue: "bg-red-50 text-red-700 border border-red-200",
    "due-soon": "bg-amber-50 text-amber-700 border border-amber-200",
    ok: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  }
  const labels: Record<Status, string> = {
    overdue: "Overdue",
    "due-soon": "Due soon",
    ok: "OK",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function StatusIcon({ status }: { status: Status }) {
  const icons: Record<Status, typeof AlertTriangle> = {
    overdue: AlertTriangle,
    "due-soon": Clock,
    ok: CheckCircle2,
  }
  const classes: Record<Status, string> = {
    overdue: "text-red-500",
    "due-soon": "text-amber-500",
    ok: "text-emerald-500",
  }
  const bgClasses: Record<Status, string> = {
    overdue: "bg-red-50",
    "due-soon": "bg-amber-50",
    ok: "bg-emerald-50",
  }
  const Icon = icons[status]
  return (
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClasses[status]}`}>
      <Icon className={classes[status]} style={{ width: 13, height: 13 }} />
    </div>
  )
}

function formatDueDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)}d overdue`
    if (diff === 0) return "Due today"
    if (diff === 1) return "Due tomorrow"
    if (diff <= 7) return `Due in ${diff}d`
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  } catch {
    return dateStr
  }
}

export function HomeComplianceLegalCard({ items, legalEnabled = true }: HomeComplianceLegalCardProps) {
  const displayed = items.slice(0, 4)

  // Items tagged as "legal" type route to compliance when the legal section is disabled.
  function itemHref(item: HomeComplianceItem): string {
    if (item.section === "legal" && legalEnabled) return "/property-manager/legal"
    return "/property-manager/compliance"
  }

  const cardTitle = legalEnabled ? "Compliance & legal" : "Compliance"

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-900">{cardTitle}</h3>
        <div className="flex items-center gap-2">
          <Link
            href="/property-manager/compliance"
            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Compliance
          </Link>
          {legalEnabled && (
            <>
              <span className="text-slate-200">·</span>
              <Link
                href="/property-manager/legal"
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Legal
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-6">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="text-emerald-500" style={{ width: 18, height: 18 }} />
            </div>
            <p className="text-[12px] text-slate-500 text-center">All compliance up to date</p>
          </div>
        ) : (
          displayed.map((item) => (
            <Link
              key={item.id}
              href={itemHref(item)}
              className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <StatusIcon status={item.status} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {item.type === "compliance" ? (
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck style={{ width: 10, height: 10 }} />
                      {formatDueDate(item.dueDate)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <FileText style={{ width: 10, height: 10 }} />
                      {formatDueDate(item.dueDate)}
                    </span>
                  )}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </Link>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
        <Link href="/property-manager/compliance" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
          View compliance →
        </Link>
        {legalEnabled && (
          <Link href="/property-manager/legal" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
            View legal →
          </Link>
        )}
      </div>
    </div>
  )
}
