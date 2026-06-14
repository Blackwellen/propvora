// EXACT end-to-end flow: open Add Contact → fill the form → Save → verify the
// contact actually persisted (DB count +1 AND the new row exists AND it shows
// in the list UI). No approximation — follows the create flow to the item.
import { chromium } from "playwright"
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
function le(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v[0]=='"'&&v.endsWith('"'))||(v[0]=="'"&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{}return o}
const env={...le(".env"),...le(".env.local")}
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const UNIQUE = "ExactQA-" + Date.now()

const before = (await admin.from("contacts").select("id", { head: true, count: "exact" }).eq("workspace_id", fx.workspaceId)).count
console.log("contacts before:", before)

const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
const errs = []; page.on("console", m => m.type() === "error" && errs.push(m.text().slice(0, 90)))
const dismiss = async () => { for (let i=0;i<4;i++){const s=page.getByRole("button",{name:/skip|finish|done|got it/i}); if(await s.count()){await s.first().click().catch(()=>{});await page.waitForTimeout(250)}else break} await page.keyboard.press("Escape").catch(()=>{}) }
let pass = true, notes = []
try {
  await page.goto(BASE+"/login",{waitUntil:"domcontentloaded"}); await page.waitForTimeout(500)
  for (const t of ["Reject non-essential","Accept all","Reject","Accept"]){const x=page.getByRole("button",{name:t});if(await x.count()){await x.first().click().catch(()=>{});break}}
  const em=page.locator('input[name="email"]'),pw=page.locator('input[name="password"]')
  await em.click(); await em.pressSequentially(fx.email,{delay:8})
  await pw.click(); await pw.pressSequentially(fx.password,{delay:8}); await pw.press("Enter")
  await page.waitForURL(/\/app/,{timeout:20000}).catch(()=>{}); await page.waitForTimeout(800); await dismiss()

  await page.goto(BASE+"/app/contacts",{waitUntil:"domcontentloaded"}); await page.waitForTimeout(1000); await dismiss()
  // open Add Contact
  const addBtn = page.getByRole("button", { name: /add contact/i })
  notes.push("Add Contact button found: " + (await addBtn.count()))
  await addBtn.first().click(); await page.waitForTimeout(600)
  // scope to the modal overlay (avoids duplicate placeholders elsewhere on page)
  notes.push("DUPLICATE-DOM check: 'James' inputs total = " + (await page.locator('input[placeholder="James"]').count()))
  await page.locator('input[placeholder="James"]:visible').fill("ExactQA")
  await page.locator('input[placeholder="Okafor"]:visible').fill(UNIQUE)
  await page.locator('select:visible').first().selectOption("supplier").catch(()=>{})
  await page.locator('input[placeholder="james@example.com"]:visible').fill(`${UNIQUE.toLowerCase()}@qa-test.com`)
  await page.locator('input[placeholder="07700 900000"]:visible').fill("07700 123456")
  await page.screenshot({ path: "e2e/.report/flow_contact_form.png" }).catch(()=>{})
  // Save
  await page.getByRole("button", { name: /save contact/i }).click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: "e2e/.report/flow_contact_after.png" }).catch(()=>{})

  // VERIFY 1: DB
  const after = (await admin.from("contacts").select("id",{head:true,count:"exact"}).eq("workspace_id",fx.workspaceId)).count
  const { data: found } = await admin.from("contacts").select("id, display_name, type, email").eq("workspace_id",fx.workspaceId).ilike("display_name", `%${UNIQUE}%`)
  notes.push(`count ${before} → ${after}`)
  if (after !== before + 1) { pass = false; notes.push("FAIL: count did not increment by 1") }
  if (!found || !found.length) { pass = false; notes.push("FAIL: new contact not found in DB") }
  else notes.push("DB row: " + JSON.stringify(found[0]))

  // VERIFY 2: UI list shows it (search/reload)
  await page.goto(BASE+"/app/contacts",{waitUntil:"domcontentloaded"}); await page.waitForTimeout(1200); await dismiss()
  const inList = await page.getByText(UNIQUE).count()
  notes.push("appears in contacts list UI: " + (inList > 0))
  if (inList === 0) { pass = false; notes.push("FAIL: created contact not visible in list UI") }
} catch (e) { pass = false; notes.push("EXCEPTION: " + String(e.message).slice(0,120)) } finally { await b.close() }
console.log("\n=== CREATE CONTACT FLOW: " + (pass ? "✅ PASS" : "❌ FAIL") + " ===")
for (const n of notes) console.log("  • " + n)
console.log("  console errors during flow:", errs.length)
process.exit(pass ? 0 : 1)
