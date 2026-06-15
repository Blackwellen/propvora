import type { SupabaseClient } from "@supabase/supabase-js"
import { upsertSupplierProfile, type SupplierProfileInput } from "./profile"

// ============================================================================
// Supplier WORKSPACE provisioning + onboarding (P3).
//
// `provisionSupplierWorkspace` creates a workspace with type='supplier' and the
// supporting supplier rows, reusing the EXISTING workspace-creation primitives:
//
//   - workspaces INSERT under RLS is permitted when owner_user_id = auth.uid()
//     (policy `workspaces_insert_self_owner`). The canonical RPC
//     `create_owned_workspace` cannot be used here because it hardcodes the
//     default type ('operator'); we need type='supplier'. We therefore insert
//     directly with owner_user_id = userId so the RLS check passes.
//   - The `workspaces_bootstrap_owner` trigger then auto-adds the owner to
//     `workspace_members` (role='owner', status='active') exactly as it does for
//     operator workspaces — we do NOT duplicate that.
//   - We additionally register the owner in `supplier_workspace_members` (the P0
//     foundation membership table for supplier-type workspaces).
//   - Finally we seed a DRAFT supplier_workspace_profiles row and an
//     onboarding-state row.
//
// 42P01/42703-tolerant on the supplier-specific seed steps so provisioning still
// yields a usable workspace if a supplier table is not yet migrated.
// ============================================================================

export const SUPPLIER_ONBOARDING_STEPS = [
  "profile",
  "services",
  "coverage",
  "availability",
  "insurance",
  "review",
] as const

export type SupplierOnboardingStep = (typeof SUPPLIER_ONBOARDING_STEPS)[number]

export interface SupplierOnboardingState {
  workspace_id: string
  step: string | null
  completed_steps: string[]
  completed: boolean
  updated_at: string
}

export interface ProvisionSupplierInput {
  supabase: SupabaseClient
  userId: string
  displayName: string
  /** Workspace name; defaults to displayName. */
  name?: string
  /** URL slug; auto-derived from the name when omitted. */
  slug?: string
  /** Optional extra profile fields to seed alongside the draft. */
  profile?: SupplierProfileInput
}

export interface ProvisionResult {
  workspaceId: string | null
  error?: string
}

const ONBOARDING_COLS = "workspace_id, step, completed_steps, completed, updated_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703"
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 8)
  return base ? `${base}-${suffix}` : `supplier-${suffix}`
}

/**
 * Provision a brand-new supplier workspace owned by `userId`, seed its draft
 * profile + onboarding state, and return the new workspace id.
 */
export async function provisionSupplierWorkspace(
  input: ProvisionSupplierInput
): Promise<ProvisionResult> {
  const { supabase, userId, displayName } = input
  if (!userId) return { workspaceId: null, error: "Not authenticated" }
  const name = (input.name ?? displayName ?? "").trim() || "Supplier workspace"
  const slug = input.slug?.trim() || slugify(name)

  // 1. Create the workspace (type='supplier'). owner_user_id = userId satisfies
  //    the workspaces_insert_self_owner RLS policy; the bootstrap trigger adds
  //    the owner to workspace_members.
  let workspaceId: string
  try {
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, slug, owner_user_id: userId, type: "supplier" })
      .select("id")
      .single()
    if (error) return { workspaceId: null, error: error.message }
    workspaceId = (data as { id: string }).id
  } catch (e) {
    return { workspaceId: null, error: (e as Error)?.message ?? "Failed to create workspace" }
  }

  // 2. Register the owner in supplier_workspace_members (idempotent on conflict).
  try {
    await supabase
      .from("supplier_workspace_members")
      .upsert(
        { workspace_id: workspaceId, user_id: userId, role: "owner" },
        { onConflict: "workspace_id,user_id" }
      )
  } catch (e) {
    if (!tolerable(e)) {
      // membership failure is non-fatal to returning the workspace, but worth surfacing
      return { workspaceId, error: (e as Error)?.message }
    }
  }

  // 3. Seed a DRAFT supplier profile (status defaults to 'draft').
  await upsertSupplierProfile(supabase, workspaceId, {
    display_name: displayName,
    status: "draft",
    ...input.profile,
  })

  // 4. Seed onboarding state at the first step.
  try {
    await supabase
      .from("supplier_workspace_onboarding_state")
      .upsert(
        {
          workspace_id: workspaceId,
          step: SUPPLIER_ONBOARDING_STEPS[0],
          completed_steps: [],
          completed: false,
        },
        { onConflict: "workspace_id" }
      )
  } catch (e) {
    if (!tolerable(e)) throw e
  }

  return { workspaceId }
}

/** Read the onboarding state for a supplier workspace (null when none / tolerated). */
export async function getSupplierOnboardingState(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierOnboardingState | null> {
  if (!workspaceId) return null
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_onboarding_state")
      .select(ONBOARDING_COLS)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierOnboardingState | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/**
 * Mark `step` complete and advance the onboarding cursor to the next pending
 * step. When every step is complete, sets completed=true. Idempotent: completing
 * an already-completed step is a no-op on the set. Returns the new state.
 */
export async function advanceOnboarding(
  supabase: SupabaseClient,
  workspaceId: string,
  step: SupplierOnboardingStep
): Promise<SupplierOnboardingState | null> {
  if (!workspaceId) return null

  const current = await getSupplierOnboardingState(supabase, workspaceId)
  const done = new Set(current?.completed_steps ?? [])
  done.add(step)

  // Next step = first canonical step not yet completed.
  const next = SUPPLIER_ONBOARDING_STEPS.find((s) => !done.has(s)) ?? null
  const completedSteps = SUPPLIER_ONBOARDING_STEPS.filter((s) => done.has(s))
  const completed = next === null

  try {
    const { data, error } = await supabase
      .from("supplier_workspace_onboarding_state")
      .upsert(
        {
          workspace_id: workspaceId,
          step: next,
          completed_steps: completedSteps,
          completed,
        },
        { onConflict: "workspace_id" }
      )
      .select(ONBOARDING_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierOnboardingState | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}
