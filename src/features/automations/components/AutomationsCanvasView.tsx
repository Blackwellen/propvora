"use client"

// Thin client wrapper around AutomationCanvasPage.
// Suspense boundary required because AutomationCanvasPage uses useSearchParams.

import { Suspense } from "react"
import { AutomationCanvasPage } from "@/features/automations/canvas/AutomationCanvasPage"

export interface AutomationsCanvasViewProps {
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

/**
 * Renders the visual automation canvas inside a Suspense boundary.
 * Import this instead of directly importing AutomationCanvasPage wherever
 * you need to embed the canvas surface within a client component tree.
 */
export default function AutomationsCanvasView({ workspaceId }: AutomationsCanvasViewProps) {
  return (
    <Suspense fallback={<CanvasFallback />}>
      <AutomationCanvasPage workspaceId={workspaceId} />
    </Suspense>
  )
}
