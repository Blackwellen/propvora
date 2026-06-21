"use client"

// Canvas route client — delegates to the modular AutomationsCanvasView.
// Suspense boundary is owned inside AutomationsCanvasView.

import AutomationsCanvasView from "@/features/automations/components/AutomationsCanvasView"

interface Props {
  workspaceId?: string
}

export default function CanvasClient({ workspaceId }: Props) {
  return <AutomationsCanvasView workspaceId={workspaceId} />
}
