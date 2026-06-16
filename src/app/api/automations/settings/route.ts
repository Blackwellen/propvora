import { NextResponse } from "next/server"
import {
  AUTOMATION_HARD_CAPS,
  AUTOMATION_PLAN_LIMITS,
  AUTOMATION_SETTINGS_SECTIONS,
} from "@/lib/automation/node-registry"
import { resolveAuthedWorkspace } from "../_shared"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const workspaceId = new URL(req.url).searchParams.get("workspaceId") ?? undefined
  const auth = await resolveAuthedWorkspace(workspaceId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  return NextResponse.json({
    sections: AUTOMATION_SETTINGS_SECTIONS,
    planLimits: AUTOMATION_PLAN_LIMITS,
    hardCaps: AUTOMATION_HARD_CAPS,
  })
}
