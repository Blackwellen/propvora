import React from "react"
import Link from "next/link"
import { Building2, Plus } from "lucide-react"
import { ChevronLeft } from "lucide-react"

interface LinkedRecord {
  type: string
  label: string
  status?: string
  href: string
}

interface TaskLinkedWorkTabProps {
  linkedRecords: LinkedRecord[]
  propertyId: string | null
}

export function TaskLinkedWorkTab({ linkedRecords, propertyId }: TaskLinkedWorkTabProps) {
  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Linked Records</h3>
        {linkedRecords.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No linked records</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Link this task to a property to see it here.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {linkedRecords.map((rec) => (
              <Link
                key={rec.label}
                href={rec.href}
                className="group flex items-center gap-3 py-3 px-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#2563EB]/40 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{rec.type}</p>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-[#2563EB] transition-colors truncate">{rec.label}</p>
                </div>
                {rec.status && (
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">{rec.status}</span>
                )}
                <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180 group-hover:text-[#2563EB] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
        <Link
          href={propertyId ? `/property-manager/work/jobs/new?propertyId=${propertyId}` : "/property-manager/work/jobs/new"}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2563EB] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Raise a job from this task
        </Link>
      </div>
    </div>
  )
}
