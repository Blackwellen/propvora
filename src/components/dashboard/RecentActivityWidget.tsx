"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Building2,
  PoundSterling,
  Wrench,
  Map,
} from "lucide-react"

export interface ActivityItem {
  id: string
  type: "created" | "updated" | "completed" | "deleted" | "alert" | "document" | "payment" | "contact" | "property" | "task" | "planning"
  description: string
  entityName: string
  user: string
  timestamp: string
}

const typeConfig: Record<ActivityItem["type"], {
  icon: React.ElementType
  bg: string
  color: string
}> = {
  created: { icon: Plus, bg: "bg-emerald-50", color: "text-[#10B981]" },
  updated: { icon: Edit2, bg: "bg-blue-50", color: "text-[#2563EB]" },
  completed: { icon: CheckCircle, bg: "bg-emerald-50", color: "text-[#10B981]" },
  deleted: { icon: Trash2, bg: "bg-red-50", color: "text-[#EF4444]" },
  alert: { icon: AlertCircle, bg: "bg-amber-50", color: "text-[#F59E0B]" },
  document: { icon: FileText, bg: "bg-slate-50", color: "text-slate-500" },
  payment: { icon: PoundSterling, bg: "bg-emerald-50", color: "text-[#10B981]" },
  contact: { icon: Users, bg: "bg-violet-50", color: "text-[#7C3AED]" },
  property: { icon: Building2, bg: "bg-blue-50", color: "text-[#2563EB]" },
  task: { icon: Wrench, bg: "bg-amber-50", color: "text-[#F59E0B]" },
  planning: { icon: Map, bg: "bg-violet-50", color: "text-[#7C3AED]" },
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export function RecentActivityWidget({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
        <span className="text-xs text-slate-400">Workspace log</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No recent activity</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100" />

          <div className="flex flex-col gap-1">
            {items.slice(0, 10).map((item, idx) => {
              const config = typeConfig[item.type]
              const Icon = config.icon
              return (
                <div key={item.id} className="flex items-start gap-3 pl-2 py-2 hover:bg-slate-50 rounded-lg transition-colors duration-150">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 mt-0.5",
                    config.bg
                  )}>
                    <Icon className={cn("w-3 h-3", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{item.user}</span>{" "}
                      <span className="text-slate-500">{item.description}</span>{" "}
                      <span className="font-medium text-slate-700">{item.entityName}</span>
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
