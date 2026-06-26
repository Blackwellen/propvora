// LIVE engine E2E for automation governance + the safety contract.
//
// Findings this suite locks in:
//   1. The strongest guardrail is the DB itself: `smart_rules.action_type` is
//      CHECK-constrained to the 5 safe/reversible actions, so a dangerous action
//      (e.g. update_unit_status / send_webhook) CANNOT be stored as a v1 rule.
//      (The dangerous actions live only on the v2 node path, which the executor
//      already hard-gates to approvals unconditionally.)
//   2. The REAL engine (`evaluateWorkspace`) consults workspace governance and
//      runs a safe auto-run rule without over-holding it — i.e. the guardrail
//      check is wired in and does not break normal auto-execution.
//
// Skips when the service-role env isn't present (CI). Run locally with:
//   npx vitest run src/lib/automation/governance-e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { readFileSync } from "node:fs"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { evaluateWorkspace } from "./engine"

function loadEnv(p: string): Record<string, string> {
  const o: Record<string, string> = {}
  try {
    for (const l of readFileSync(p, "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      o[m[1]] = v
    }
  } catch {/* ignore */}
  return o
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const hasEnv = Boolean(URL && KEY)

// QA fixture workspace + user (scripts/test/seed-qa-user.mjs).
const WS = "7ee76842-a0ee-4ef6-8cb0-cc07c0efd6b4"
const USER = "7590ca4a-40a1-4227-8706-929e86528ec7"

const run = hasEnv ? describe : describe.skip

run("governance + safety contract — live engine E2E", () => {
  let sb: SupabaseClient
  let ruleId: string | null = null
  const itemIds: string[] = []

  async function setGuardrail(on: boolean) {
    const { data } = await sb.from("workspace_settings").select("automations").eq("workspace_id", WS).maybeSingle()
    const automations = { ...((data?.automations as Record<string, unknown> | null) ?? {}), governance: { dangerousActionGuardrails: on } }
    await sb.from("workspace_settings").upsert({ workspace_id: WS, automations, updated_at: new Date().toISOString() }, { onConflict: "workspace_id" })
  }

  async function seedComplianceItem(): Promise<string> {
    const due = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10)
    const { data, error } = await sb.from("compliance_items")
      .insert({ workspace_id: WS, kind: "gas_safety", title: `E2E gas cert ${Date.now()}`, status: "missing", due_date: due })
      .select("id").single()
    if (error) throw new Error(`seed compliance_item: ${error.message}`)
    itemIds.push(data!.id)
    return data!.id
  }

  beforeAll(async () => {
    sb = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  })

  afterAll(async () => {
    if (!sb) return
    if (ruleId) {
      await sb.from("smart_rule_runs").delete().eq("rule_id", ruleId)
      await sb.from("smart_rules").delete().eq("id", ruleId)
    }
    for (const id of itemIds) await sb.from("compliance_items").delete().eq("id", id)
  })

  it("DB guardrail: a dangerous action type cannot be stored as a v1 Smart Rule", async () => {
    const { error } = await sb.from("smart_rules").insert({
      workspace_id: WS,
      name: "E2E should-be-rejected",
      trigger_type: "compliance_due_soon",
      action_type: "update_unit_status", // dangerous — not in the safe-action CHECK
      review_required: false,
      enabled: true,
      created_by: USER,
    }).select("id").single()
    expect(error).toBeTruthy()
    expect(String(error?.message)).toMatch(/action_type|check/i)
  })

  it("the REAL engine runs a SAFE auto-run rule through governance without over-holding it", async () => {
    await setGuardrail(true) // guardrail ON — must NOT block a safe, reversible action
    const { data, error } = await sb.from("smart_rules").insert({
      workspace_id: WS,
      name: `E2E safe auto-run ${Date.now()}`,
      trigger_type: "compliance_due_soon",
      trigger_config: { within_days: 30 },
      action_type: "create_notification", // safe / reversible — allowed on the auto-run path
      action_config: { title: "Gas cert due soon", severity: "warning" },
      review_required: false,
      enabled: true,
      created_by: USER,
    }).select("id").single()
    if (error) throw new Error(`seed rule: ${error.message}`)
    ruleId = data!.id

    const item = await seedComplianceItem()
    const summary = await evaluateWorkspace(sb, WS, USER, { ruleId: ruleId! })
    expect(summary.runsCreated).toBeGreaterThan(0)

    const { data: runs } = await sb.from("smart_rule_runs")
      .select("status, context").eq("rule_id", ruleId!).order("triggered_at", { ascending: false })
    const r = (runs ?? []).find((x) => (x.context as { entity_id?: string })?.entity_id === item)
    expect(r).toBeTruthy()
    // Safe action + guardrail ON → still auto-runs (guardrail only holds dangerous actions).
    expect(r?.status).not.toBe("pending_review")
  }, 30_000)
})
