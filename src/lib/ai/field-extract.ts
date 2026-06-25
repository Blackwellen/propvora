import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveModelChain, gatewayComplete } from "./gateway"
import { orderChainForRole } from "./routing"
import { FIELD_SCHEMA, coerceField } from "./field-schema"

// ============================================================================
// Field extraction — the natural-language surface for ANY editable field.
//
// When the user @-mentions a record and says something like "set current value
// to 425k" or "change the rent to 1,250 and end date to 31 Aug", the model maps
// the free-form phrasing to the EXACT record.update fields from field-schema.ts.
// This is a constrained extraction (output a JSON of {field: value}), not open
// tool-calling — so it's reliable on any model and crisp on Azure GPT-5.4.
//
// Every extracted value is re-validated against the field schema before it can
// become a record.update proposal; unknown fields and bad values are dropped.
// ============================================================================

export interface MentionRef { type: string; id: string; label: string }

export async function extractFieldUpdate(
  supabase: SupabaseClient,
  message: string,
  mention: MentionRef
): Promise<{ tool: string; args: Record<string, unknown>; summary: string } | null> {
  const schema = FIELD_SCHEMA[mention.type]
  if (!schema) return null

  const fieldList = Object.entries(schema)
    .map(([k, d]) => `${k} (${d.type}${d.enum ? `: ${d.enum.join("|")}` : ""})`)
    .join(", ")
  const system = `You extract record edits. The user wants to update a ${mention.type}. Editable fields: ${fieldList}. Output ONLY a JSON object mapping field name to its NEW value. Rules: use ONLY the field names listed; numbers as plain numbers (e.g. "425k" → 425000, "£1,250" → 1250); dates as YYYY-MM-DD; pick the closest enum value. Output {} if the message asks for no field change.`
  const user = `${mention.type} "${mention.label}". User message: ${message}`

  let text = ""
  try {
    const chain = orderChainForRole(await resolveModelChain(supabase), "workhorse")
    const gen = await gatewayComplete(chain, {
      maxTokens: 200,
      temperature: 0,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    })
    text = gen.text
  } catch {
    return null
  }

  let obj: Record<string, unknown> = {}
  try {
    const m = text.match(/\{[\s\S]*\}/)
    obj = m ? (JSON.parse(m[0]) as Record<string, unknown>) : {}
  } catch {
    return null
  }

  const args: Record<string, unknown> = { recordType: mention.type, recordId: mention.id }
  const changed: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const def = schema[k]
    if (!def || v === null || v === "") continue
    try {
      coerceField(def, v) // validates; throws on bad value
      args[k] = v
      changed.push(`${k} → ${v}`)
    } catch {
      /* drop invalid field */
    }
  }
  if (changed.length === 0) return null
  return { tool: "record.update", args, summary: `Update “${mention.label}”: ${changed.join(", ")}` }
}
