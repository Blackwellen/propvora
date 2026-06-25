/**
 * POST /api/ai/agent
 *
 * Multi-step agent (V1). Given a GOAL like "find overdue tasks and reschedule
 * them to next week", it:
 *   1. reads the user's real actionable records (RLS-scoped, with ids),
 *   2. asks the model for a STRUCTURED JSON PLAN of record.update actions
 *      grounded in those real ids (reliable on any model — no native tool-calls),
 *   3. VALIDATES every action (id must be a real record the user can see; only
 *      whitelisted fields), and returns the plan as a batch of proposals.
 *
 * NOTHING is executed here — each proposal is approved + run via /api/ai/tool
 * (permission → credit → audit). Reads happen here; writes need the human.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { gateAiCopilot } from "@/lib/billing/gates"
import { checkRate } from "@/lib/ai/metering"
import { resolveModelChain, gatewayComplete, recordUsageEvent } from "@/lib/ai/gateway"
import { orderChainForRole } from "@/lib/ai/routing"
import { debitCredits, creditsForTokens } from "@/lib/ai/credits"
import { captureException, requestIdFrom } from "@/lib/observability"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const schema = z.object({
  goal: z.string().min(1).max(500),
  workspaceId: z.string().min(1).max(100),
})

type Row = Record<string, unknown>
const s = (v: unknown) => (v == null ? "" : String(v))

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    const { goal, workspaceId } = parsed.data

    const { data: member } = await supabase.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", user.id).single()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const gate = await gateAiCopilot(supabase, workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true }, { status: gate.status ?? 402 })
    const rate = await checkRate(supabase, workspaceId)
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

    // 1. Read actionable records (RLS-scoped) with ids.
    const fetchRows = async (table: string): Promise<Row[]> => {
      try { const { data } = await supabase.from(table).select("*").eq("workspace_id", workspaceId).limit(60); return Array.isArray(data) ? (data as Row[]) : [] } catch { return [] }
    }
    const [tasks, compliance, propsRows, tenancies, contacts] = await Promise.all([
      fetchRows("tasks"), fetchRows("compliance_items"), fetchRows("properties"), fetchRows("tenancies"), fetchRows("contacts"),
    ])
    const propName: Record<string, string> = {}
    for (const p of propsRows) propName[s(p.id)] = s(p.nickname || p.address_line1 || "Property")
    const contact: Record<string, { name: string; email: string }> = {}
    for (const c of contacts) contact[s(c.id)] = { name: s(c.display_name || "Contact"), email: s(c.email || "") }

    const validIds = new Set<string>()
    const lines: string[] = []
    for (const t of tasks.filter((t) => s(t.status) !== "done").slice(0, 30)) {
      validIds.add(s(t.id))
      lines.push(`[task:${s(t.id)}] ${s(t.title || "Task")}${propName[s(t.property_id)] ? ` (${propName[s(t.property_id)]})` : ""} — status ${s(t.status) || "?"}${s(t.due_at) ? `, due ${s(t.due_at).slice(0, 10)}` : ""}`)
    }
    for (const c of compliance.filter((c) => !["ok", "compliant", "valid"].includes(s(c.status).toLowerCase())).slice(0, 20)) {
      validIds.add(s(c.id))
      lines.push(`[compliance:${s(c.id)}] ${s(c.title || c.kind || "Compliance")}${propName[s(c.property_id)] ? ` (${propName[s(c.property_id)]})` : ""} — status ${s(c.status) || "?"}${s(c.due_date) ? `, due ${s(c.due_date)}` : ""}`)
    }
    for (const t of tenancies.filter((t) => s(t.status) === "active").slice(0, 30)) {
      validIds.add(s(t.id))
      const ct = contact[s(t.primary_contact_id)]
      lines.push(`[tenancy:${s(t.id)}] Tenant ${ct?.name || "?"}${ct?.email ? ` <${ct.email}>` : ""} at ${propName[s(t.property_id)] || "property"} — rent £${s(t.rent_amount) || "?"} pcm${s(t.end_date) ? `, ends ${s(t.end_date)}` : ""}`)
    }

    if (lines.length === 0) return NextResponse.json({ summary: "There are no actionable records for this goal right now.", actions: [] })

    // 2. Ask the model for a strict JSON plan (record updates AND email drafts).
    const today = new Date().toISOString().slice(0, 10)
    const system = `You are the Propvora agent. Today is ${today}. Turn the user's GOAL into a JSON PLAN over the RECORDS below. Output ONLY a JSON array (no prose) of action objects. Two action types are allowed:\n1) {"tool":"record.update","args":{"recordType":"task"|"compliance"|"tenancy","recordId":"<exact id from RECORDS>","status"?:string,"priority"?:"low"|"normal"|"high"|"urgent","dueDate"?:"YYYY-MM-DD","rent"?:number,"endDate"?:"YYYY-MM-DD"},"label":"..."}\n2) {"tool":"comms.email.draft","args":{"to":"<real tenant email from RECORDS>","subject":"...","body":"<full grounded email using the real tenant name, property and rent>"},"label":"Email <name>"}\nUse ONLY ids/emails/names that appear in RECORDS. For an email goal, write one draft per relevant tenant with a complete, professional, UK-property body (no placeholders). Only include records that match the goal. If nothing matches, output [].`
    const userMsg = `GOAL: ${goal}\n\nRECORDS:\n${lines.join("\n")}`
    const chain = orderChainForRole(await resolveModelChain(supabase), "agentic")
    const gen = await gatewayComplete(chain, { maxTokens: 900, temperature: 0.2, messages: [{ role: "system", content: system }, { role: "user", content: userMsg }] })

    await recordUsageEvent(supabase, { workspaceId, userId: user.id, route: "ai/agent", usage: gen })
    await debitCredits(supabase, { workspaceId, userId: user.id, operationKey: "agent.run", credits: 25 + creditsForTokens(gen.tokensIn, gen.tokensOut), refType: "agent", refId: workspaceId })

    // 3. Parse + VALIDATE the plan.
    let plan: unknown[] = []
    try { const m = gen.text.match(/\[[\s\S]*\]/); plan = m ? JSON.parse(m[0]) : [] } catch { plan = [] }
    const allowed = new Set(["status", "priority", "notes", "dueDate", "rent", "endDate", "priority"])
    const actions = (Array.isArray(plan) ? plan : [])
      .filter((a): a is { tool: string; args: Record<string, unknown>; label?: string } => !!a && typeof a === "object" && !!(a as { args?: unknown }).args)
      .map((a) => {
        if (a.tool === "comms.email.draft" && (a.args.subject || a.args.body)) {
          return { tool: "comms.email.draft", args: { to: s(a.args.to), subject: s(a.args.subject), body: s(a.args.body) }, label: String(a.label ?? "Email draft") }
        }
        if (a.tool === "record.update" && validIds.has(s(a.args.recordId))) {
          const args: Record<string, unknown> = { recordType: s(a.args.recordType), recordId: s(a.args.recordId) }
          for (const k of Object.keys(a.args)) if (allowed.has(k)) args[k] = a.args[k]
          return { tool: "record.update", args, label: String(a.label ?? "Update record") }
        }
        return null
      })
      .filter((a): a is { tool: string; args: Record<string, unknown>; label: string } => a !== null)
      .slice(0, 25)

    return NextResponse.json({
      summary: actions.length ? `Planned ${actions.length} update${actions.length === 1 ? "" : "s"} for: "${goal}". Review and approve.` : "I couldn't find records matching that goal.",
      actions,
    })
  } catch (err) {
    captureException(err, { source: "api/ai/agent", requestId })
    return NextResponse.json({ error: "The agent could not complete the plan.", requestId }, { status: 500 })
  }
}
