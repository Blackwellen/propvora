"use client"

import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface CategoryItem {
  label: string
  href: string
}

export interface Category {
  label: string
  icon: LucideIcon
  colour: string
  bg: string
  items: CategoryItem[]
}

export interface WorkspaceSettingsCategoryGridProps {
  categories: readonly Category[]
}

export function WorkspaceSettingsCategoryGrid({ categories }: WorkspaceSettingsCategoryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat) => {
        const Icon = cat.icon
        return (
          <div key={cat.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: cat.bg }}
              >
                <div style={{ color: cat.colour }}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-[13px] font-bold text-slate-900">{cat.label}</h3>
            </div>
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between py-1.5 text-[12.5px] text-slate-600 hover:text-[var(--brand)] transition-colors group"
                >
                  {item.label}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--brand)] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default WorkspaceSettingsCategoryGrid
