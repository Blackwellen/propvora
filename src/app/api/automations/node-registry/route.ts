import { NextResponse } from "next/server"
import {
  AUTOMATION_NODE_REGISTRY,
  AUTOMATION_STATUSES,
} from "@/lib/automation/node-registry"
import { resolveAuthedWorkspace } from "../_shared"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const workspaceId = new URL(req.url).searchParams.get("workspaceId") ?? undefined
  const auth = await resolveAuthedWorkspace(workspaceId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  return NextResponse.json({
    statuses: AUTOMATION_STATUSES,
    nodes: AUTOMATION_NODE_REGISTRY,
  })
}
