import { NextResponse } from "next/server"
import { RULE_TEMPLATES } from "@/lib/automation/templates"
import { resolveAuthedWorkspace } from "../_shared"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const workspaceId = new URL(req.url).searchParams.get("workspaceId") ?? undefined
  const auth = await resolveAuthedWorkspace(workspaceId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  return NextResponse.json({ templates: RULE_TEMPLATES })
}
