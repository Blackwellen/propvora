import type {
  ActorContext,
  CountryContext,
  PermissionContext,
  WorkspaceContext,
} from "./context-types"
import { packAtLeast } from "./_safe"

/**
 * Derive the PERMISSION block (pure — no I/O).
 *
 * These are COARSE situational capability booleans for UI gating and to
 * pre-empt obviously-disallowed actions. They are NOT the security boundary —
 * Supabase RLS remains authoritative. They combine the actor's role within the
 * workspace with the workspace type and the country pack posture.
 */

const MANAGE_ROLES = new Set(["owner", "admin", "manager"])

export function resolvePermissionContext(args: {
  actor: ActorContext
  workspace: WorkspaceContext
  country: CountryContext
}): PermissionContext {
  const { actor, workspace, country } = args

  const isAdmin = actor.isPlatformAdmin
  const canManage =
    isAdmin || (actor.workspaceRole != null && MANAGE_ROLES.has(actor.workspaceRole))
  const isOperator = workspace.type === "operator"

  // Legal/compliance features require a country posture that actually has them.
  const legalUsable = packAtLeast(country.legalStatus, "research_only")
  const complianceUsable = packAtLeast(country.propertyFeaturesStatus, "research_only")

  return {
    canManageWorkspace: canManage,
    canManageProperty: isOperator && canManage,
    canViewMoney: actor.userId != null,
    canManageMoney: canManage,
    canUseLegalFeatures: isOperator && legalUsable,
    canUseComplianceFeatures: isOperator && complianceUsable,
    canAdminister: isAdmin || workspace.type === "platform_admin",
  }
}
