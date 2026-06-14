import { readFileSync } from "fs"
import ts from "typescript"
import { createClient } from "@supabase/supabase-js"

const env = readFileSync(".env.local", "utf8")
const get = (k) => { const m = env.match(new RegExp("^" + k + "=(.*)$", "m")); return m ? m[1].trim() : "" }
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"))

// Transpile seed.ts with the admin import stubbed to our service-role client.
let src = readFileSync("src/lib/demo/seed.ts", "utf8")
src = src.replace(/import \{ createAdminClient \} from '@\/lib\/supabase\/admin'/, "const createAdminClient = () => __sb")
const js = ts.transpileModule(src, { compilerOptions: { module: "CommonJS", target: "ES2020" } }).outputText
const schemaMap = JSON.parse(readFileSync("src/lib/demo/schema-map.json", "utf8"))
const req = (p) => { if (p.includes("schema-map.json")) return Object.assign({ default: schemaMap }, schemaMap); throw new Error("no require: " + p) }
const mod = { exports: {} }
const fn = new Function("module", "exports", "require", "__sb", "crypto", js)
fn(mod, mod.exports, req, sb, globalThis.crypto)

const { data: ws } = await sb.from("workspaces").select("id, owner_user_id").limit(1).maybeSingle()
console.log("seeding into ws:", ws.id)
const countBefore = {}
const tables = ["contacts", "properties", "property_units", "tenancies", "tasks", "jobs", "planning_sets", "money_income"]
for (const t of tables) { const { count } = await sb.from(t).select("id", { head: true, count: "exact" }).eq("workspace_id", ws.id).eq("demo", true); countBefore[t] = count ?? 0 }

await mod.exports.seedDemoData(ws.id, ws.owner_user_id, "full")

console.log("\nDemo rows after seed (delta):")
let batch = null
for (const t of tables) {
  const { count } = await sb.from(t).select("id", { head: true, count: "exact" }).eq("workspace_id", ws.id).eq("demo", true)
  console.log("  " + t.padEnd(16), (count ?? 0) - countBefore[t], "added (total demo:", count, ")")
}
// grab a batch id to clean up this run
const { data: oneProp } = await sb.from("properties").select("demo_batch_id").eq("workspace_id", ws.id).eq("demo", true).not("demo_batch_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle()
batch = oneProp?.demo_batch_id
console.log("\ncleaning up batch:", batch)
if (batch) {
  for (const t of ["money_income", "tasks", "tenancies", "property_units", "jobs", "planning_sets", "properties", "contacts"]) {
    await sb.from(t).delete().eq("demo_batch_id", batch)
  }
}
console.log("done")
