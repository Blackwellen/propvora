import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"

// Read-only RUN HISTORY. Membership-checked + automation-gated. Honest: it
// returns ONLY real recorded runs/steps from the sibling runs lib — never a
// fabricated outcome. Tolerant of the runs lib / tables being absent (empty).
export const dynamic = "force-dynamic"

type RunStatus = "queued" | "running" | "succeeded" | "failed" | "skipped" | "dry_run"

interface RunsLib {
  listRuns?: (
    supabase: unknown,
    workspaceId: string,
    filters?: { definitionId?: string; status?: RunStatus; isDryRun?: boolean; limit?: number },
  ) => Promise<unknown[]>
  getRun?: (supabase: unknown, workspaceId: string, runId: string) => Promise<unknown>
}

async function loadRunsLib(): Promise<RunsLib | null> {
  try {
    return (await import("@/lib/automation/runs")) as RunsLib
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined
    const runId = url.searchParams.get("runId") ?? undefined
    const statusFilter = (url.searchParams.get("status") as RunStatus | null) ?? undefined
    const definitionId = url.searchParams.get("definitionId") ?? undefined

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) {
      return NextResponse.json({ ok: true, runs: [] }, { status: 200 })
    }

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })
    }

    const lib = await loadRunsLib()
    if (!lib) {
      // Sibling runs lib not present yet — honest empty history.
      return NextResponse.json({ ok: true, runs: [], run: null }, { status: 200 })
    }

    // Single run with steps.
    if (runId && lib.getRun) {
      const run = await lib.getRun(ctx.supabase, ctx.workspaceId, runId)
      return NextResponse.json({ ok: true, run: run ?? null }, { status: 200 })
    }

    // List.
    if (lib.listRuns) {
      const runs = await lib.listRuns(ctx.supabase, ctx.workspaceId, {
        status: statusFilter,
        definitionId,
        limit: 200,
      })
      return NextResponse.json({ ok: true, runs: Array.isArray(runs) ? runs : [] }, { status: 200 })
    }

    return NextResponse.json({ ok: true, runs: [] }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/runs:GET", requestId })
    return NextResponse.json({ error: "Couldn't load run history.", requestId }, { status: 500 })
  }
}
