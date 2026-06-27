"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { resolveWhiteLabel, type ResolvedWhiteLabel } from "./white-label-core"

export { resolveWhiteLabel } from "./white-label-core"
export type { ResolvedWhiteLabel, WhiteLabelSettings } from "./white-label-core"

/** Client hook — resolves white-label from the active operator workspace. */
export function useWhiteLabel(): ResolvedWhiteLabel {
  const { workspace } = useWorkspace()
  return resolveWhiteLabel(workspace?.white_label_settings, workspace?.name)
}

/**
 * "Powered by Propvora" attribution that hides itself under white-label.
 *
 * Pure (no hooks) so it is safe on server-resolved portal/public surfaces that
 * have no operator AuthProvider context. Pass the resolved `hide` flag:
 *   - authed app: `hide={useWhiteLabel().hidePoweredBy}`
 *   - portals/public: server-computed `resolveWhiteLabel(ws.white_label_settings, ws.name).hidePoweredBy`
 */
export function PoweredByPropvora({
  hide = false,
  className,
  label = "Powered by Propvora",
}: {
  hide?: boolean
  className?: string
  label?: string
}) {
  if (hide) return null
  return <span className={className}>{label}</span>
}
