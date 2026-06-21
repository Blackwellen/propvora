// Client-safe surface for the copilot command registry.
//
// Re-exports the pure, declarative command catalogue and a local copy of the
// workspace-type → capability map so the slash-command palette can render the
// correct default catalogue WITHOUT importing any server/data-layer code.
//
// The capability map here MUST stay in sync with workspace-context.ts
// (capabilitiesFor). It is intentionally duplicated as a small pure function so
// the client bundle never pulls in the Supabase data layer.

import type { WorkspaceCapabilities, WorkspaceType } from "./workspace-context"

export {
  COPILOT_COMMANDS,
  commandsForCapabilities,
  commandsForPacks,
  getCommand,
  getEnabledPacks,
  packLabel,
  PACK_ORDER,
  parseSlashCommand,
} from "./commands"
export type { CopilotCommand, CommandCategory, CommandPack } from "./commands"

export function capabilitiesFor(type: WorkspaceType): WorkspaceCapabilities {
  switch (type) {
    case "supplier":
      return {
        portfolio: false, bookings: false, marketplace: true, supplier: true,
        payments: true, automations: true, compliance: true, planning: false,
      }
    case "customer":
      return {
        portfolio: false, bookings: true, marketplace: true, supplier: false,
        payments: true, automations: false, compliance: false, planning: false,
      }
    case "operator":
    default:
      return {
        portfolio: true, bookings: true, marketplace: true, supplier: true,
        payments: true, automations: true, compliance: true, planning: true,
      }
  }
}
