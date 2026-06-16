import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { SMART_RECIPES, instantiateRecipe, type RecipeDomain } from "@/lib/automation/recipes"
import { listDefinitions } from "@/lib/automation/definitions"

// Supplier-workspace automations. Suppliers get a curated, supplier-relevant
// slice of the recipe catalogue + a list of their own automations. Every recipe
// installs as a DISABLED DRAFT (never auto-runs). Access is gated on real
// supplier-workspace membership — no feature flags.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Recipe domains that make sense for a supplier workspace.
const SUPPLIER_DOMAINS: RecipeDomain[] = ["supplier", "booking", "money", "admin", "compliance"]

async function resolveSupplierWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requested: string | null,
): Promise<string | null> {
  try {
    // If a workspace was passed, verify membership; else resolve the first.
    if (requested) {
      const { data } = await supabase
        .from("supplier_workspace_members")
        .select("workspace_id")
        .eq("workspace_id", requested)
        .eq("user_id", userId)
        .maybeSingle()
      return data?.workspace_id ?? null
    }
    const { data } = await supabase
      .from("supplier_workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle()
    return data?.workspace_id ?? null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = await resolveSupplierWorkspace(supabase, user.id, url.searchParams.get("workspaceId"))
    if (!workspaceId) return NextResponse.json({ error: "No supplier workspace" }, { status: 403 })

    const recipes = SMART_RECIPES
      .filter((r) => SUPPLIER_DOMAINS.includes(r.domain))
      .map((r) => ({ slug: r.slug, name: r.name, description: r.description, domain: r.domain, minPlan: r.minPlan, recommended: Boolean(r.recommended), nodeCount: r.graph.nodes.length }))

    let definitions: Array<Record<string, unknown>> = []
    try {
      const defs = await listDefinitions(supabase as never, workspaceId)
      definitions = defs as unknown as Array<Record<string, unknown>>
    } catch { /* tolerant */ }

    return NextResponse.json({ ok: true, workspaceId, recipes, definitions }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/supplier/automations:GET", requestId })
    return NextResponse.json({ error: "Couldn't load automations.", requestId }, { status: 500 })
  }
}

const postSchema = z.object({
  workspaceId: z.string().min(1).optional(),
  slug: z.string().min(1),
})

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: "A recipe slug is required." }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const workspaceId = await resolveSupplierWorkspace(supabase, user.id, parsed.data.workspaceId ?? null)
    if (!workspaceId) return NextResponse.json({ error: "No supplier workspace" }, { status: 403 })

    // Suppliers may only install supplier-relevant recipes.
    const recipe = SMART_RECIPES.find((r) => r.slug === parsed.data.slug)
    if (!recipe || !SUPPLIER_DOMAINS.includes(recipe.domain)) {
      return NextResponse.json({ error: "That recipe isn't available for suppliers." }, { status: 422 })
    }

    const res = await instantiateRecipe(supabase as never, workspaceId, user.id, parsed.data.slug)
    if (!res.ok) return NextResponse.json({ error: res.error ?? "Couldn't install the recipe." }, { status: 422 })

    return NextResponse.json({ ok: true, definitionId: res.definitionId, disabled: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/supplier/automations:POST", requestId })
    return NextResponse.json({ error: "Couldn't install the recipe.", requestId }, { status: 500 })
  }
}
