import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { flagGate } from "@/lib/flags/api-gate"
import {
  listFeeRules,
  createFeeRule,
  updateFeeRule,
  setFeeRuleActive,
  type FeeRuleInput,
} from "@/lib/money/fee-rules"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   /api/money/fee-rules — PLATFORM-ADMIN fee-rules editor (CRUD).

   GET    → list all fee rules (priority asc).
   POST   → create a rule        { ...FeeRuleInput }
   PATCH  → update a rule        { id, ...FeeRuleInput }
   DELETE → archive/restore      { id, active:boolean }

   Every write appends an immutable fee_rule_audit row (handled in the lib).
   requireAdmin() is fail-closed: a non-admin throws → 403. Service-role client
   so the admin can manage the global matrix.
─────────────────────────────────────────────────────────────────────────── */

async function guard(): Promise<{ ok: true; actorId: string } | { ok: false; res: NextResponse }> {
  // V2 marketplace payments rail (commission/fee matrix) — 404 when the flag is
  // off (direct-API gate), before any admin check leaks its existence.
  const gated = await flagGate("marketplacePayments")
  if (gated) return { ok: false, res: gated }
  try {
    const admin = await requireAdmin()
    return { ok: true, actorId: admin.userId }
  } catch {
    return { ok: false, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
}

export async function GET() {
  const g = await guard()
  if (!g.ok) return g.res
  try {
    const rules = await listFeeRules(createAdminClient())
    return NextResponse.json({ rules })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to list fee rules." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const g = await guard()
  if (!g.ok) return g.res
  let body: FeeRuleInput
  try {
    body = (await request.json()) as FeeRuleInput
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  try {
    const rule = await createFeeRule(createAdminClient(), body, g.actorId)
    return NextResponse.json({ rule }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create rule." }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const g = await guard()
  if (!g.ok) return g.res
  let body: FeeRuleInput & { id?: string }
  try {
    body = (await request.json()) as FeeRuleInput & { id?: string }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  try {
    const { id, ...input } = body
    const rule = await updateFeeRule(createAdminClient(), id, input, g.actorId)
    return NextResponse.json({ rule })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update rule." }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const g = await guard()
  if (!g.ok) return g.res
  let body: { id?: string; active?: boolean }
  try {
    body = (await request.json()) as { id?: string; active?: boolean }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  try {
    const rule = await setFeeRuleActive(createAdminClient(), body.id, body.active ?? false, g.actorId)
    return NextResponse.json({ rule })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update rule." }, { status: 400 })
  }
}
