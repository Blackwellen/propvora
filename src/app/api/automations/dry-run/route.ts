import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace, validateDefinition, dryRun } from "../_shared"
import type { DryRunResponse } from "@/components/automations-builder/types"

// Side-effect-free preview of what an automation definition WOULD do. Nothing is
// ever executed or saved here.
export const dynamic = "force-dynamic"

const bodySchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  // The definition is validated against the catalogue, so we accept it loosely.
  definition: z.record(z.string(), z.unknown()),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "A definition is required for the preview." }, { status: 400 })
    }
    const { definition: raw, workspaceId } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth

    if (ctx.workspaceId) {
      const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
      if (!gate.allowed) {
        return NextResponse.json(
          { error: gate.reason, upgrade: true, tier: gate.tier },
          { status: gate.status ?? 402 }
        )
      }
    }

    const { definition, notes } = validateDefinition(raw)
    if (!definition) {
      const res: DryRunResponse = {
        ok: false,
        preview: true,
        steps: [],
        estimatedMatches: 0,
        notes,
        error: "This automation isn't complete enough to preview yet.",
      }
      return NextResponse.json(res, { status: 200 })
    }

    const result = await dryRun(ctx, definition)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/dry-run", requestId })
    return NextResponse.json(
      { error: "Couldn't run the preview right now. Please try again.", requestId },
      { status: 500 }
    )
  }
}
