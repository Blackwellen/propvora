"use client"

import React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

export interface StatCard {
  label: string
  value: string
  sub: string
  colour: string
  icon: LucideIcon
  href: string
}

export interface WorkspaceHealthStatsStripProps {
  cards: readonly StatCard[]
}

export function WorkspaceHealthStatsStrip({ cards }: WorkspaceHealthStatsStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${card.colour}18` }}
              >
                <div style={{ color: card.colour }}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
            </div>
            <p className="text-[15px] font-bold text-slate-900">{card.value}</p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">{card.sub}</p>
          </Link>
        )
      })}
    </div>
  )
}

export default WorkspaceHealthStatsStrip
