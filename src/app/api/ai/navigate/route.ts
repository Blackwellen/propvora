/**
 * POST /api/ai/navigate
 *
 * Navigation agent endpoint. Resolves a natural-language intent (e.g. "take me
 * to expired certificates") into a real Propvora destination the client router
 * can consume: { route, filters, highlightIds, label }.
 *
 * Pure navigation — no privileged data path. Auth-gated (the Copilot is a
 * signed-in surface) but it only ever returns a canonical /property-manager
 * route + query params; it never reads or writes tenant records.
 *
 * Response: { target: NavTarget | null }. `null` means no confident match —
 * the client should fall back to a normal chat answer rather than guess.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { resolveNavigation } from "@/lib/ai/navigation"

export const dynamic = "force-dynamic"

const schema = z.object({
  intent: z.string().min(1, "intent is required").max(500, "intent too long"),
  highlightIds: z.array(z.string().max(100)).max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    }

    const target = resolveNavigation(parsed.data.intent, parsed.data.highlightIds)
    return NextResponse.json({ target })
  } catch {
    return NextResponse.json({ error: "Failed to resolve navigation" }, { status: 500 })
  }
}
