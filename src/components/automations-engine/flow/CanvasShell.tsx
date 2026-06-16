"use client"

// Responsive canvas shell: chooses the real React Flow drag-drop canvas on
// tablet + desktop, and the vertical node-list editor on mobile. Both persist
// through the same /api/automations/nodes save, so a graph built on one device
// reloads on the other.

import React from "react"
import { useBreakpoint, useHasMounted } from "@/components/mobile/useBreakpoint"
import ReactFlowCanvas, { type InitialGraph } from "./ReactFlowCanvas"
import MobileCanvasEditor from "./MobileCanvasEditor"

interface Props {
  workspaceId: string
  definitionId: string
  definitionName: string
  initialGraph: InitialGraph
  canEditJson?: boolean
}

export default function CanvasShell(props: Props) {
  const mounted = useHasMounted()
  const bp = useBreakpoint()
  // Render a stable desktop canvas during SSR/first paint to avoid hydration
  // mismatch; swap to mobile only after mount on a phone-width viewport.
  if (mounted && bp === "mobile") return <MobileCanvasEditor {...props} />
  return <ReactFlowCanvas {...props} />
}
