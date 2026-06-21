import React from "react"

export function PersonSkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-2 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-2 bg-slate-100 rounded" />
        <div className="h-2 bg-slate-100 rounded w-5/6" />
      </div>
      <div className="h-px bg-slate-100 my-3" />
      <div className="space-y-1.5">
        <div className="h-2 bg-slate-100 rounded w-2/3" />
        <div className="h-2 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  )
}
