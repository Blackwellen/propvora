"use client"

// Canvas route client — delegates to the enterprise AutomationCanvasPage.
// Wrapped in Suspense because AutomationCanvasPage uses useSearchParams.

import { Suspense } from "react"
import { AutomationCanvasPage } from "@/features/automations/canvas/AutomationCanvasPage"

interface Props {
  workspaceId?: string
}

function CanvasFallback() {
  return (
    <div className="flex h-[600px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
        <span className="text-sm">Loading canvas…</span>
      </div>
    </div>
  )
}

export default function CanvasClient({ workspaceId }: Props) {
  return (
    <Suspense fallback={<CanvasFallback />}>
      <AutomationCanvasPage workspaceId={workspaceId} />
    </Suspense>
  )
}
