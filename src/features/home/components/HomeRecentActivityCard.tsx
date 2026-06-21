"use client"

import Link from "next/link"
import {
  FileText,
  Wrench,
  Users,
  PoundSterling,
  ShieldCheck,
  Home,
  Activity,
} from "lucide-react"
import type { HomeActivity } from "../types"

interface HomeRecentActivityCardProps {
  activities: HomeActivity[]
}

type EntityType = "tenancy" | "job" | "document" | "invoice" | "compliance" | "property" | "contact" | string

const ENTITY_ICONS: Record<string, typeof Activity> = {
  tenancy: Users,
  job: Wrench,
  document: FileText,
  invoice: PoundSterling,
  compliance: ShieldCheck,
  property: Home,
  contact: Users,
  default: Activity,
}

const ENTITY_STYLES: Record<string, string> = {
  tenancy: "bg-green-50 text-green-600",
  job: "bg-orange-50 text-orange-600",
  document: "bg-blue-50 text-blue-600",
  invoice: "bg-emerald-50 text-emerald-600",
  compliance: "bg-violet-50 text-violet-600",
  property: "bg-indigo-50 text-indigo-600",
  contact: "bg-teal-50 text-teal-600",
  default: "bg-slate-50 text-slate-500",
}

function ActivityIcon({ entityType }: { entityType: EntityType }) {
  const Icon = ENTITY_ICONS[entityType] ?? ENTITY_ICONS.default
  const cls = ENTITY_STYLES[entityType] ?? ENTITY_STYLES.default
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cls}`}>
      <Icon style={{ width: 14, height: 14 }} />
    </div>
  )
}

export function HomeRecentActivityCard({ activities }: HomeRecentActivityCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-900">Recent activity</h3>
        <Link href="/property-manager/portfolio/timeline" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
          View all →
        </Link>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-6">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
              <Activity className="text-slate-300" style={{ width: 20, height: 20 }} />
            </div>
            <p className="text-[13px] font-medium text-slate-600">No recent activity</p>
            <p className="text-[12px] text-slate-400 text-center">Activity will appear here as you use Propvora</p>
          </div>
        ) : (
          activities.map((activity) => {
            const row = (
              <>
                <ActivityIcon entityType={activity.iconType ?? activity.entityName ?? "default"} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-slate-800 leading-snug">{activity.actionText}</p>
                  {activity.entityName && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 capitalize">{activity.entityName}</p>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 flex-shrink-0 mt-0.5">{activity.timeAgo}</span>
              </>
            )
            if (activity.href) {
              return (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="flex items-start gap-2.5 -mx-1.5 px-1.5 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {row}
                </Link>
              )
            }
            return (
              <div key={activity.id} className="flex items-start gap-2.5">
                {row}
              </div>
            )
          })
        )}
      </div>

      {activities.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <Link href="/property-manager/portfolio/timeline" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
            See more activity →
          </Link>
        </div>
      )}
    </div>
  )
}
