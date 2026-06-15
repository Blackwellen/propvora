import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  getSupplierOnboardingState,
  advanceOnboarding,
  provisionSupplierWorkspace,
  SUPPLIER_ONBOARDING_STEPS,
  type SupplierOnboardingStep,
} from "@/lib/supplier/provisioning"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function isSupplierWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    if (data) return true
  } catch {
    /* fall through */
  }
  try {
    const { data } = await supabase
      .from("supplier_workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

/** GET /api/supplier/onboarding?workspaceId=... */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const workspaceId = (new URL(request.url).searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const state = await getSupplierOnboardingState(supabase, workspaceId)
    return NextResponse.json({ state, steps: SUPPLIER_ONBOARDING_STEPS })
  } catch (err) {
    captureException(err, { source: "api/supplier/onboarding GET", requestId })
    return NextResponse.json({ error: "Failed to load onboarding", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier/onboarding
 * Two modes:
 *   - Provision a new supplier workspace: { provision: true, displayName, name?, slug? }
 *   - Advance onboarding for an existing one: { workspaceId, step }
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })

    // Mode 1 — provision a new supplier workspace for the signed-in user.
    if (body.provision === true) {
      const displayName =
        typeof body.displayName === "string" ? body.displayName.trim() : ""
      if (!displayName) {
        return NextResponse.json({ error: "displayName is required" }, { status: 400 })
      }
      const result = await provisionSupplierWorkspace({
        supabase,
        userId: user.id,
        displayName,
        name: typeof body.name === "string" ? body.name : undefined,
        slug: typeof body.slug === "string" ? body.slug : undefined,
      })
      if (!result.workspaceId) {
        return NextResponse.json(
          { error: result.error ?? "Could not create supplier workspace" },
          { status: 502 }
        )
      }
      return NextResponse.json({ workspaceId: result.workspaceId }, { status: 201 })
    }

    // Mode 2 — advance onboarding on an existing workspace.
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    const step = typeof body.step === "string" ? body.step.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!SUPPLIER_ONBOARDING_STEPS.includes(step as SupplierOnboardingStep)) {
      return NextResponse.json({ error: `Invalid step '${step}'` }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const state = await advanceOnboarding(supabase, workspaceId, step as SupplierOnboardingStep)
    return NextResponse.json({ state })
  } catch (err) {
    captureException(err, { source: "api/supplier/onboarding POST", requestId })
    return NextResponse.json({ error: "Failed to update onboarding", requestId }, { status: 500 })
  }
}
