import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getWorkspaceTier } from "@/lib/billing/gates"
import type { PlanTier } from "@/lib/billing/plans"

// ============================================================================
// AI permission engine — 7 levels, server-side, fail-SAFE.
//
// The LLM proposes; this module disposes. Every action the Copilot wants to
// take is classified (read / draft / write / comms / navigate / external /
// generate / automation) and checked here BEFORE execution. The result is one
// of: execute (auto), approval (propose → human approves), or denied.
//
// A workspace's EFFECTIVE level is the MINIMUM of:
//   • plan entitlement   (Scale=4, Pro=5, Enterprise=6; no-Copilot tiers = 0)
//   • workspace level    (admin slider)
//   • per-user level      (admin can restrict a specific member)
//   • per-entity level    (e.g. lock a sensitive property to read-only)
// The engine NEVER exceeds the lowest of these. Per-action overrides can force
// approval on an otherwise-auto action (e.g. always confirm email sends).
//
// Defaults are conservative: if no permission rows exist the workspace sits at
// LEVEL 2 (Draft) — the Copilot can read, navigate and produce drafts, but any
// write/comms requires explicit approval. This exactly preserves today's
// draft-only Copilot behaviour until an admin opts into more autonomy.
// ============================================================================

export type PermissionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface PermissionLevelDef {
  level: PermissionLevel
  name: string
  description: string
}

export const PERMISSION_LEVELS: PermissionLevelDef[] = [
  { level: 0, name: "Read Only", description: "Answer, read, search and summarise. No writes." },
  { level: 1, name: "Suggest", description: "Propose actions; never execute." },
  { level: 2, name: "Draft", description: "Create drafts (emails, docs, records) in draft state only." },
  { level: 3, name: "Assist", description: "Execute low-risk writes (notes, tasks, tags); higher actions need approval." },
  { level: 4, name: "Supervised Agent", description: "Execute most actions; critical actions (sends, deletes, money, bulk) need approval." },
  { level: 5, name: "Autonomous", description: "Act independently within budget + policy; post-hoc audit." },
  { level: 6, name: "God Mode", description: "Owner only; full workspace authority, still fully audited." },
]

/** Strictness presets for the settings slider. */
export const STRICTNESS_PRESETS: { key: string; label: string; level: PermissionLevel }[] = [
  { key: "locked", label: "Locked", level: 1 },
  { key: "cautious", label: "Cautious", level: 2 },
  { key: "balanced", label: "Balanced", level: 4 },
  { key: "empowered", label: "Empowered", level: 5 },
  { key: "owner", label: "Owner", level: 6 },
]

export type ActionClass =
  | "read"
  | "draft"
  | "write"
  | "comms"
  | "navigate"
  | "external"
  | "generate"
  | "automation"

/**
 * Per action-class thresholds:
 *   • draftMin — minimum level to PROPOSE/produce a draft of this action.
 *   • autoMin  — minimum level to EXECUTE without approval.
 * Between the two → execution is permitted but gated behind human approval.
 * Below draftMin → denied outright.
 */
const ACTION_THRESHOLDS: Record<ActionClass, { draftMin: PermissionLevel; autoMin: PermissionLevel }> = {
  read: { draftMin: 0, autoMin: 0 },
  navigate: { draftMin: 0, autoMin: 0 },
  external: { draftMin: 1, autoMin: 3 }, // web/market — egress + £, auto at Assist
  draft: { draftMin: 2, autoMin: 2 }, // producing a draft IS the action; low risk
  write: { draftMin: 1, autoMin: 3 }, // notes/tasks/tags auto at Assist
  generate: { draftMin: 2, autoMin: 3 }, // document generation
  automation: { draftMin: 2, autoMin: 4 }, // build/run automations — supervised
  comms: { draftMin: 2, autoMin: 5 }, // sending = critical, auto only when Autonomous
}

/** Plan entitlement ceiling on the Copilot's autonomy. */
export function planMaxLevel(tier: PlanTier): PermissionLevel {
  switch (tier) {
    case "scale":
      return 4
    case "pro_agency":
      return 5
    case "enterprise":
      return 6
    default:
      return 0 // starter / operator — no Copilot
  }
}

/** Default workspace level when no ai_permissions row exists (draft-only). */
export const DEFAULT_WORKSPACE_LEVEL: PermissionLevel = 2

export interface EffectiveLevel {
  level: PermissionLevel
  tier: PlanTier
  /** Per-action overrides resolved from the most specific matching scope. */
  perAction: Record<string, { requiresApproval?: boolean; minLevel?: PermissionLevel }>
}

interface PermRow {
  scope: "workspace" | "user" | "entity"
  scope_id: string | null
  level: number
  per_action: Record<string, { requiresApproval?: boolean; minLevel?: number }> | null
}

/**
 * Resolve the effective permission level for a (workspace, user, entity).
 * effectiveLevel = min(planMax, workspaceLevel, userLevel, entityLevel).
 * Fails SAFE: on any store error or missing rows it returns the conservative
 * default (min(planMax, DEFAULT_WORKSPACE_LEVEL)).
 */
export async function resolveEffectiveLevel(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string | null,
  entityId?: string | null
): Promise<EffectiveLevel> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const planMax = planMaxLevel(tier)

  let workspaceLevel: number = DEFAULT_WORKSPACE_LEVEL
  let userLevel: number | null = null
  let entityLevel: number | null = null
  const perAction: EffectiveLevel["perAction"] = {}

  if (workspaceId && workspaceId !== "demo-workspace") {
    try {
      const { data } = await supabase
        .from("ai_permissions")
        .select("scope, scope_id, level, per_action")
        .eq("workspace_id", workspaceId)
      const rows = (data as PermRow[] | null) ?? []
      // Apply least-specific → most-specific so the specific scope's per-action
      // overrides win.
      const order = { workspace: 0, user: 1, entity: 2 } as const
      for (const r of [...rows].sort((a, b) => order[a.scope] - order[b.scope])) {
        if (r.scope === "workspace") workspaceLevel = r.level
        if (r.scope === "user" && userId && r.scope_id === userId) userLevel = r.level
        if (r.scope === "entity" && entityId && r.scope_id === entityId) entityLevel = r.level
        // merge per-action from any matching scope (specific overrides general)
        const matches =
          r.scope === "workspace" ||
          (r.scope === "user" && r.scope_id === userId) ||
          (r.scope === "entity" && r.scope_id === entityId)
        if (matches && r.per_action) {
          for (const [k, v] of Object.entries(r.per_action)) {
            perAction[k] = { ...perAction[k], ...(v as { requiresApproval?: boolean; minLevel?: PermissionLevel }) }
          }
        }
      }
    } catch {
      /* fail safe — keep conservative defaults */
    }
  }

  const candidates = [planMax, workspaceLevel, userLevel, entityLevel].filter(
    (n): n is number => typeof n === "number"
  )
  const level = Math.max(0, Math.min(...candidates)) as PermissionLevel
  return { level, tier, perAction }
}

export type PermissionMode = "execute" | "approval" | "denied"

export interface PermissionDecision {
  mode: PermissionMode
  /** True when the action may proceed at all (execute OR approval). */
  permitted: boolean
  requiresApproval: boolean
  level: PermissionLevel
  reason?: string
}

/**
 * Decide whether an action class may run at a given effective level. `critical`
 * marks irreversible / money / bulk / delete actions, which can never auto-run
 * below Autonomous (L5) regardless of class. Per-action overrides can force
 * approval or raise the minimum, even at God Mode (an explicit owner choice).
 */
export function decideAction(
  actionClass: ActionClass,
  effective: EffectiveLevel,
  opts: { actionKey?: string; critical?: boolean } = {}
): PermissionDecision {
  const level = effective.level
  const t = ACTION_THRESHOLDS[actionClass]
  const override = opts.actionKey ? effective.perAction[opts.actionKey] : undefined

  const draftMin = Math.max(t.draftMin, override?.minLevel ?? 0) as PermissionLevel
  let autoMin = opts.critical ? (Math.max(t.autoMin, 5) as PermissionLevel) : t.autoMin

  // God Mode auto-executes everything UNLESS an explicit per-action override
  // forces approval.
  if (level >= 6 && !override?.requiresApproval) {
    return { mode: "execute", permitted: true, requiresApproval: false, level }
  }

  if (level < draftMin) {
    return {
      mode: "denied",
      permitted: false,
      requiresApproval: false,
      level,
      reason: `This action needs permission level ${draftMin} (${PERMISSION_LEVELS[draftMin].name}); the Copilot is at level ${level} (${PERMISSION_LEVELS[level].name}).`,
    }
  }

  // An override can force approval on an otherwise-auto action.
  if (override?.requiresApproval) autoMin = 7 as PermissionLevel

  if (level >= autoMin) {
    return { mode: "execute", permitted: true, requiresApproval: false, level }
  }
  return { mode: "approval", permitted: true, requiresApproval: true, level }
}
