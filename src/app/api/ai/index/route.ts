/**
 * POST /api/ai/index
 *
 * Build (or refresh) the RAG embedding index for the caller's workspace from
 * its real records (properties, tenancies, compliance, tasks, contacts). After
 * this runs, the Copilot's retrieval (src/lib/ai/embeddings.ts) returns grounded
 * matches from live data.
 *
 * Auth + Scale+ gated. Returns { indexed, byType }.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { gateAiCopilot } from "@/lib/billing/gates"
import { indexWorkspace } from "@/lib/ai/indexer"
import { captureException, requestIdFrom } from "@/lib/observability"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const schema = z.object({ workspaceId: z.string().min(1).max(100) })

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    const { workspaceId } = parsed.data

    // Membership check (RLS-scoped) + plan gate.
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const gate = await gateAiCopilot(supabase, workspaceId)
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })
    }

    const result = await indexWorkspace(workspaceId)
    return NextResponse.json(result)
  } catch (err) {
    captureException(err, { source: "api/ai/index", requestId })
    return NextResponse.json({ error: "Indexing failed.", requestId }, { status: 500 })
  }
}
