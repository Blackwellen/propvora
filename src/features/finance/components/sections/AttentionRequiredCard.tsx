"use client"

import React from "react"
import Link from "next/link"
import { CheckCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AttentionItem {
  id: string
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  amount?: string
  href: string
}

interface AttentionRequiredCardProps {
  items: AttentionItem[]
  isLoading?: boolean
}

export function AttentionRequiredCard({ items, isLoading }: AttentionRequiredCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Attention Required</h3>
        {items.length > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.iconBg)}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {item.amount && <span className="text-xs font-bold text-slate-900">{item.amount}</span>}
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-200" />
          <p className="text-xs font-medium text-slate-500">
            {isLoading ? "Loading…" : "All clear — nothing needs attention"}
          </p>
        </div>
      )}
    </div>
  )
}
