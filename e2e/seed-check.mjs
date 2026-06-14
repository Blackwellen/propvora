import { chromium } from "playwright"
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
function le(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v[0]=='"'&&v.endsWith('"'))||(v[0]=="'"&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{}return o}
const env={...le(".env"),...le(".env.local")}
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// reset demo_data_loaded flag so seed will run
await admin.from("workspaces").update({ demo_data_loaded: false }).eq("id", fx.workspaceId)

const b = await chromium.launch()
const p = await (await b.newContext()).newPage()
await p.goto(BASE + "/login", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(500)
for (const t of ["Reject non-essential","Accept all","Reject","Accept"]) { const x=p.getByRole("button",{name:t}); if(await x.count()){await x.first().click().catch(()=>{});break} }
const email=p.locator('input[name="email"]'), pw=p.locator('input[name="password"]')
await email.click(); await email.pressSequentially(fx.email,{delay:8})
await pw.click(); await pw.pressSequentially(fx.password,{delay:8}); await pw.press("Enter")
await p.waitForURL(/\/app/,{timeout:20000}).catch(()=>{})
console.log("logged in:", p.url())
const r = await p.request.post(BASE + "/api/demo/seed", { data: { workspaceId: fx.workspaceId, variant: "full" } })
console.log("seed status:", r.status())
let body; try { body = await r.json() } catch {}
console.log("seed body:", JSON.stringify(body).slice(0, 400))
await b.close()
await new Promise((s)=>setTimeout(s,1500))
for (const t of ["properties","contacts","tasks","supplier_jobs","tenancies","documents","compliance_items","jobs","money_transactions"]) {
  const { count } = await admin.from(t).select("id",{head:true,count:"exact"}).eq("workspace_id", fx.workspaceId)
  console.log("  ", t, "=", count)
}
process.exit(0)
