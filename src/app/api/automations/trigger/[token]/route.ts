import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit, clientKey } from "@/lib/rate-limit"
import { captureException, requestIdFrom } from "@/lib/observability"
import { gateAutomation } from "@/lib/billing/gates"
import {
  ENDPOINTS_TABLE,
  DELIVERIES_TABLE,
  verifySecretProof,
  type DeliveryStatus,
} from "../../webhooks/_lib"

// ============================================================================
// PUBLIC inbound webhook receiver.
//
// This is the ONLY public surface in the automation system. External systems
// POST here to trigger an automation. Authentication is by the unguessable
// per-endpoint TOKEN in the URL (plus an OPTIONAL signing secret). It:
//   1. rate-limits by IP+token (abuse throttle),
//   2. looks the endpoint up by token via the SERVICE-ROLE admin client
//      (the public route is authorised by the token, NOT a user session),
//   3. validates the optional secret (constant-time),
//   4. records an APPEND-ONLY delivery row, and
//   5. enqueues an automation_v2_run (status 'queued') via the sibling runs lib.
//
// It NEVER runs destructive actions: it only RECORDS a queued run. The existing
// review/approval gates downstream decide whether any action ever executes. The
// run-history UI shows REAL recorded outcomes only — this route fabricates none.
// The service role is used server-side only and is never returned to the caller.
// ============================================================================
export const dynamic = "force-dynamic"

// A short, generous abuse throttle for the public surface.
const RL = { limit: 60, windowMs: 60 * 1000 }

function sourceIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for")
  const firstHop = xff?.split(",")[0]?.trim()
  return firstHop || request.headers.get("x-real-ip")?.trim() || null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const requestId = requestIdFrom(request.headers)
  const { token } = await params

  // Basic shape guard — a real token is a 43-char base64url string. Reject
  // obviously malformed tokens before any DB work (cheap enumeration defence).
  if (!token || token.length < 20 || token.length > 200) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  // Rate-limit FIRST (by IP+token) so a flood can't hammer the lookup.
  const rl = await rateLimit({ key: clientKey(request, `automation-webhook:${token.slice(0, 12)}`), ...RL })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    )
  }

  // Service-role client — authorised by the token, never by a user session.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Receiver not configured." }, { status: 503 })
  }
  const admin = createAdminClient()

  // Read the raw body so an HMAC/secret proof can be validated against it, and
  // parse JSON best-effort (a non-JSON body is recorded as an empty payload).
  const rawBody = await request.text()
  let payload: Record<string, unknown> = {}
  if (rawBody) {
    try {
      const j = JSON.parse(rawBody)
      if (j && typeof j === "object" && !Array.isArray(j)) payload = j as Record<string, unknown>
      else payload = { value: j }
    } catch {
      payload = {}
    }
  }

  const ip = sourceIp(request)

  // Look up the endpoint by token (the credential).
  interface EndpointRow {
    id: string
    workspace_id: string
    definition_id: string | null
    secret_hash: string | null
    active: boolean
  }
  let endpoint: EndpointRow | null = null
  try {
    const { data } = await admin
      .from(ENDPOINTS_TABLE)
      .select("id, workspace_id, definition_id, secret_hash, active")
      .eq("token", token)
      .maybeSingle()
    endpoint = (data as EndpointRow | null) ?? null
  } catch (err) {
    captureException(err, { source: "api/automations/trigger:lookup", requestId })
    return NextResponse.json({ error: "Receiver error." }, { status: 500 })
  }

  // Unknown token → 404 (no enumeration signal — same as a malformed token).
  if (!endpoint) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  const recordDelivery = async (status: DeliveryStatus, runId: string | null) => {
    try {
      await admin.from(DELIVERIES_TABLE).insert({
        endpoint_id: endpoint!.id,
        source_ip: ip,
        payload,
        run_id: runId,
        status,
      })
    } catch {
      /* delivery log is best-effort; never block the response on it */
    }
  }

  // Disabled endpoint → record + reject.
  if (!endpoint.active) {
    await recordDelivery("rejected", null)
    return NextResponse.json({ error: "This webhook is disabled." }, { status: 403 })
  }

  // Optional secret proof. When secret_hash is set, the caller MUST present the
  // signature header (sha256 of the one-time secret). Validated constant-time.
  if (endpoint.secret_hash) {
    const provided =
      request.headers.get("x-propvora-signature") ??
      request.headers.get("x-propvora-secret") ??
      null
    if (!verifySecretProof({ storedSecretHash: endpoint.secret_hash, providedSignature: provided })) {
      await recordDelivery("rejected", null)
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
    }
  }

  // Plan gate: the workspace must still be entitled to automation. (A plan can
  // lapse after an endpoint was minted — we honour the current entitlement.)
  try {
    const gate = await gateAutomation(admin, endpoint.workspace_id)
    if (!gate.allowed) {
      await recordDelivery("rejected", null)
      return NextResponse.json({ error: "Automation isn't enabled for this workspace." }, { status: 402 })
    }
  } catch {
    /* gate read failed — fail open per the gates' own contract */
  }

  // Enqueue a REAL run record (status 'queued'). We do NOT execute actions here:
  // the run is recorded honestly as queued; downstream review/approval decides
  // whether anything runs. Uses the sibling runs lib if present.
  let runId: string | null = null
  try {
    const runsLib = await import("@/lib/automation/runs").catch(() => null)
    if (runsLib?.recordRun) {
      const res = await runsLib.recordRun(admin, endpoint.workspace_id, {
        definitionId: endpoint.definition_id,
        status: "queued",
        triggerContext: {
          source: "webhook",
          endpoint_id: endpoint.id,
          received_at: new Date().toISOString(),
          payload,
        },
        isDryRun: false,
        start: false,
      })
      runId = res?.id ?? null
    } else {
      // Fallback: write the queued run directly (same table/shape the lib uses).
      const { data } = await admin
        .from("automation_v2_runs")
        .insert({
          workspace_id: endpoint.workspace_id,
          definition_id: endpoint.definition_id,
          status: "queued",
          trigger_context: { source: "webhook", endpoint_id: endpoint.id, payload },
          is_dry_run: false,
        })
        .select("id")
        .single()
      runId = data ? String(data.id) : null
    }
  } catch (err) {
    captureException(err, { source: "api/automations/trigger:enqueue", requestId })
    await recordDelivery("error", null)
    return NextResponse.json({ error: "Couldn't enqueue the automation run." }, { status: 500 })
  }

  // Stamp last_triggered_at (best-effort) + record the accepted delivery.
  try {
    await admin
      .from(ENDPOINTS_TABLE)
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", endpoint.id)
  } catch {
    /* non-fatal */
  }
  await recordDelivery("accepted", runId)

  // Honest response: we ACCEPTED + QUEUED a run. We never claim it succeeded.
  return NextResponse.json(
    { ok: true, accepted: true, run_id: runId, status: "queued" },
    { status: 202 },
  )
}

// A GET on the receiver is a liveness/probe affordance — never triggers a run.
export async function GET() {
  return NextResponse.json(
    { ok: true, message: "POST a JSON body to this URL to trigger the automation." },
    { status: 200 },
  )
}
