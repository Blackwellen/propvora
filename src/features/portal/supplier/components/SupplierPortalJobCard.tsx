import Link from "next/link"
import { Building2, CalendarClock, PoundSterling } from "lucide-react"
import { StatusChip, type PortalTone } from "@/components/portals/portal-ui"
import { formatMoney, formatDate, jobStatusMeta } from "@/lib/portal/format"
import type { SupplierJob } from "@/lib/portal/data"

interface SupplierPortalJobCardProps {
  job: SupplierJob
  href: string
}

export function SupplierPortalJobCard({ job, href }: SupplierPortalJobCardProps) {
  const meta = jobStatusMeta(job.status)
  const tone: PortalTone =
    meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "blue"
  const amount = job.approved_amount ?? job.quoted_amount
  const pct =
    job.status === "complete" || job.status === "invoiced"
      ? 100
      : job.status === "in_progress"
        ? 60
        : job.status === "scheduled"
          ? 35
          : 15

  return (
    <Link
      href={href}
      className="block rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] p-3.5 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#071B4D] truncate">{job.title}</p>
        <StatusChip tone={tone} dot>
          {meta.label}
        </StatusChip>
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
        {job.propertyLabel && (
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            {job.propertyLabel}
          </span>
        )}
        {job.scheduled_date && (
          <span className="flex items-center gap-1">
            <CalendarClock className="w-3.5 h-3.5" />
            {formatDate(job.scheduled_date)}
          </span>
        )}
        {amount != null && (
          <span className="flex items-center gap-1">
            <PoundSterling className="w-3.5 h-3.5" />
            {formatMoney(amount)}
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2.5">
        <div className="h-full bg-[var(--brand)] rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  )
}
