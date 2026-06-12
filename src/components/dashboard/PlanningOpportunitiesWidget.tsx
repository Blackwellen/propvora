"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Map, Plus, ArrowRight, TrendingUp } from "lucide-react"

export interface PlanningSetSummary {
  id: string
  title: string
  profileLabel: string
  profileColour: string
  status: "draft" | "active" | "offer_sent" | "accepted" | "converted"
  netMonthlyIncome: number
  netYield: number
  riskScore: number
}

const statusConfig = {
  draft: { label: "Draft", variant: "default" as const },
  active: { label: "Active", variant: "primary" as const },
  offer_sent: { label: "Offer Sent", variant: "warning" as const },
  accepted: { label: "Accepted", variant: "success" as const },
  converted: { label: "Converted", variant: "success" as const },
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(n)
}

export function PlanningOpportunitiesWidget({ sets }: { sets: PlanningSetSummary[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Map className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Planning Opportunities</h3>
            <p className="text-xs text-slate-500">Active scenarios</p>
          </div>
        </div>
        <Button variant="ai-soft" size="xs" asChild>
          <Link href="/app/planning/sets/new">
            <Plus className="w-3 h-3" />
            New
          </Link>
        </Button>
      </div>

      {sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Map className="w-6 h-6 text-[#7C3AED]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">No planning sets yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Start modelling your first deal</p>
          </div>
          <Button variant="ai" size="sm" asChild>
            <Link href="/app/planning/sets/new">
              <Plus className="w-4 h-4" />
              Start planning your first deal
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sets.slice(0, 3).map((set) => {
            const sConfig = statusConfig[set.status]
            return (
              <Link
                key={set.id}
                href={`/app/planning/sets/${set.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] transition-all duration-150"
              >
                <div
                  className="w-2 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: set.profileColour }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{set.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${set.profileColour}15`, color: set.profileColour }}
                    >
                      {set.profileLabel}
                    </span>
                    <Badge variant={sConfig.variant} size="sm">{sConfig.label}</Badge>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-[#10B981]">
                    {formatCurrency(set.netMonthlyIncome)}<span className="text-xs text-slate-400">/mo</span>
                  </p>
                  <div className="flex items-center justify-end gap-0.5 text-xs text-slate-400 mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>{set.netYield}% yield</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {sets.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <Button variant="ghost" size="sm" asChild className="w-full justify-center text-[#7C3AED] hover:bg-violet-50">
            <Link href="/app/planning/sets">
              View all planning sets
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
