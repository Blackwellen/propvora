"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Send, FileText, LayoutGrid, Star } from "lucide-react"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface QuickActionsCardProps {
  supplierId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickActionsCard({ supplierId }: QuickActionsCardProps) {
  const router = useRouter()

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => router.push(`/property-manager/work/jobs/new?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">New Job</span>
        </button>
        <button
          onClick={() => router.push(`/property-manager/work/tasks/new?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">New Task</span>
        </button>
        <button
          onClick={() => router.push(`/property-manager/work/jobs?supplierId=${supplierId}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">View Jobs</span>
        </button>
        <Link
          href={`/property-manager/contacts/${supplierId}`}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Star className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[12px] font-medium text-slate-700">Contact</span>
        </Link>
      </div>
    </div>
  )
}
