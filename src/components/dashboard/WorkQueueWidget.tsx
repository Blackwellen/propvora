"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Wrench, ArrowRight, Clock, AlertCircle } from "lucide-react"

export interface WorkItem {
  id: string
  title: string
  priority: "critical" | "high" | "medium" | "low"
  propertyName: string
  propertyId: string
  dueDate: string
  status: string
  type: "task" | "job"
}

const priorityConfig = {
  critical: { label: "Critical", variant: "danger" as const },
  high: { label: "High", variant: "warning" as const },
  medium: { label: "Medium", variant: "primary" as const },
  low: { label: "Low", variant: "default" as const },
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date()
}

export function WorkQueueWidget({ items }: { items: WorkItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Work Queue</h3>
            <p className="text-xs text-slate-500">Open tasks &amp; jobs</p>
          </div>
        </div>
        <Badge variant="warning" size="sm">{items.length} open</Badge>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600">All clear</p>
          <p className="text-xs text-slate-400">No open tasks or jobs</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.slice(0, 5).map((item) => {
            const overdue = isOverdue(item.dueDate)
            const pConfig = priorityConfig[item.priority]
            return (
              <Link
                key={item.id}
                href={`/app/work/${item.type}s/${item.id}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-150",
                  "hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0]"
                )}
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Badge variant={pConfig.variant} size="sm" className="shrink-0 mt-0.5">
                    {pConfig.label}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.propertyName}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs shrink-0",
                  overdue ? "text-[#EF4444]" : "text-slate-400"
                )}>
                  {overdue ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  <span>
                    {overdue ? "Overdue" : new Date(item.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <Button variant="ghost" size="sm" asChild className="w-full justify-center text-[#2563EB] hover:bg-blue-50">
          <Link href="/app/work/tasks">
            View all work
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
