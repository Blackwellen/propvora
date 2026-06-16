import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"
import { SMART_RECIPES, instantiateRecipe } from "@/lib/automation/recipes"

// Smart Recipes: list the curated recipe catalogue, and INSTANTIATE one as a
// DISABLED DRAFT definition (+ node graph). Never enables or runs anything.
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const recipes = SMART_RECIPES.map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description,
      domain: r.domain,
      minPlan: r.minPlan,
      recommended: Boolean(r.recommended),
      nodeCount: r.graph.nodes.length,
      actionCount: r.actions.length,
    }))
    return NextResponse.json({ ok: true, recipes }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/recipes:GET", requestId })
    return NextResponse.json({ error: "Couldn't load recipes.", requestId }, { status: 500 })
  }
}

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  slug: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A recipe slug is required." }, { status: 400 })
    const { workspaceId, slug } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })

    const res = await instantiateRecipe(ctx.supabase, ctx.workspaceId, ctx.userId, slug)
    if (!res.ok) return NextResponse.json({ error: res.error ?? "Couldn't install the recipe." }, { status: 422 })

    return NextResponse.json({ ok: true, definitionId: res.definitionId, versionId: res.versionId, issues: res.issues, disabled: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/recipes:POST", requestId })
    return NextResponse.json({ error: "Couldn't install the recipe.", requestId }, { status: 500 })
  }
}
