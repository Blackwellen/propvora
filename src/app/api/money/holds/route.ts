import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getMoneyActor, assertWorkspaceMember } from "@/lib/money/server"
import { flagGate } from "@/lib/flags/api-gate"
import {
  createDamageOrDepositHold,
  deductFromHold,
  settleHold,
  type HoldType,
} from "@/lib/payments/holds"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   /api/money/holds — DEPOSIT / DAMAGE HOLD movements (workspace-scoped).

   POST  → open a hold     { workspaceId, amountPence, holdType, bookingId?, ... }
   PATCH → deduct/settle   { holdId, op:'deduct'|'release'|'refund', amountPence?, reason? }

   Authorisation: caller must be a member of the owning workspace. Every movement
   appends an immutable hold_ledger_entries row (in the lib). Integer pence.
   No Stripe calls — records the HOLD bookkeeping; funds were captured by a
   verified card event upstream.
─────────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  // V2 marketplace escrow rail — 404 when the flag is off (direct-API gate).
  const gated = await flagGate("marketplaceEscrow")
  if (gated) return gated

  const actor = await getMoneyActor()
  if (!actor) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let body: {
    workspaceId?: string
    amountPence?: number
    holdType?: HoldType
    paymentId?: string
    bookingId?: string
    tenancyId?: string
    depositId?: string
    reason?: string
    releaseCondition?: string
    currency?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const workspaceId = body.workspaceId ?? actor.workspaceId
  if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
  if (!body.amountPence || body.amountPence <= 0) return NextResponse.json({ error: "amountPence must be positive" }, { status: 400 })
  if (!body.holdType) return NextResponse.json({ error: "holdType is required" }, { status: 400 })

  const supabase = await createClient()
  if (!(await assertWorkspaceMember(supabase, actor.userId, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const result = await createDamageOrDepositHold(createAdminClient(), {
      workspaceId,
      amountPence: body.amountPence,
      holdType: body.holdType,
      paymentId: body.paymentId ?? null,
      bookingId: body.bookingId ?? null,
      tenancyId: body.tenancyId ?? null,
      depositId: body.depositId ?? null,
      reason: body.reason ?? null,
      releaseCondition: body.releaseCondition ?? null,
      currency: body.currency,
      createdBy: actor.userId,
    })
    return NextResponse.json({ ok: true, ...result }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to open hold." }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  // V2 marketplace escrow rail — 404 when the flag is off (direct-API gate).
  const gated = await flagGate("marketplaceEscrow")
  if (gated) return gated

  const actor = await getMoneyActor()
  if (!actor) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let body: { holdId?: string; op?: "deduct" | "release" | "refund"; amountPence?: number; reason?: string; currency?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  if (!body.holdId || !body.op) return NextResponse.json({ error: "holdId and op are required" }, { status: 400 })

  const svc = createAdminClient()
  // Resolve the hold's workspace to authorise.
  const { data: hold } = await svc.from("escrow_holds").select("workspace_id").eq("id", body.holdId).maybeSingle()
  const workspaceId = (hold?.workspace_id as string | undefined) ?? null
  if (!workspaceId) return NextResponse.json({ error: "Hold not found" }, { status: 404 })

  const supabase = await createClient()
  if (!(await assertWorkspaceMember(supabase, actor.userId, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    if (body.op === "deduct") {
      if (!body.amountPence || body.amountPence <= 0) return NextResponse.json({ error: "amountPence required for deduct" }, { status: 400 })
      const result = await deductFromHold(svc, {
        holdId: body.holdId,
        workspaceId,
        amountPence: body.amountPence,
        reason: body.reason ?? "Damage deduction",
        currency: body.currency,
        createdBy: actor.userId,
      })
      return NextResponse.json({ ok: true, ...result })
    }
    const result = await settleHold(svc, {
      holdId: body.holdId,
      workspaceId,
      mode: body.op === "refund" ? "refund" : "release",
      currency: body.currency,
      createdBy: actor.userId,
      memo: body.reason ?? null,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Hold movement failed." }, { status: 400 })
  }
}
