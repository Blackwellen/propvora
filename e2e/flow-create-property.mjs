// EXACT end-to-end: create a property through the multi-step wizard and verify
// it persisted (DB count +1 + row exists). Validates the property-insert fix
// (nickname/floor_area_sqm/target_rent_pcm + dropped non-columns).
import { chromium } from "playwright"
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
function le(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v[0]=='"'&&v.endsWith('"'))||(v[0]=="'"&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{}return o}
const env={...le(".env"),...le(".env.local")}
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const UNIQUE = "QAProp-" + Date.now()

const before = (await admin.from("properties").select("id",{head:true,count:"exact"}).eq("workspace_id",fx.workspaceId)).count
console.log("properties before:", before)

const b = await chromium.launch()
const page = await (await b.newContext({ viewport:{width:1440,height:1000} })).newPage()
const errs=[]; page.on("console",m=>m.type()==="error"&&errs.push(m.text().slice(0,90)))
const dismiss=async()=>{for(let i=0;i<4;i++){const s=page.getByRole("button",{name:/skip|finish|done|got it/i});if(await s.count()){await s.first().click().catch(()=>{});await page.waitForTimeout(250)}else break}await page.keyboard.press("Escape").catch(()=>{})}
let pass=true, notes=[]
try {
  await page.goto(BASE+"/login",{waitUntil:"domcontentloaded"}); await page.waitForTimeout(500)
  for(const t of ["Reject non-essential","Accept all","Reject","Accept"]){const x=page.getByRole("button",{name:t});if(await x.count()){await x.first().click().catch(()=>{});break}}
  const em=page.locator('input[name="email"]'),pw=page.locator('input[name="password"]')
  await em.click(); await em.pressSequentially(fx.email,{delay:8})
  await pw.click(); await pw.pressSequentially(fx.password,{delay:8}); await pw.press("Enter")
  await page.waitForURL(/\/app/,{timeout:20000}).catch(()=>{}); await page.waitForTimeout(800); await dismiss()

  await page.goto(BASE+"/app/portfolio/properties/new",{waitUntil:"domcontentloaded"}); await page.waitForTimeout(1000); await dismiss()
  // Step 1: name + type
  await page.locator('input[placeholder="e.g. Brunswick Road HMO"]:visible').fill(UNIQUE)
  await page.locator("select:visible").first().selectOption({ index: 1 }).catch(()=>{})
  notes.push("step1 filled")
  await page.getByRole("button",{name:/continue/i}).click(); await page.waitForTimeout(500)
  // Step 2: address
  await page.locator('input[placeholder="12 Brunswick Road"]:visible').fill("1 QA Street")
  await page.locator('input[placeholder="Nottingham"]:visible').fill("Birmingham")
  await page.locator('input[placeholder="NG1 4EX"]:visible').fill("B1 1AA")
  notes.push("step2 filled")
  // Advance through remaining steps (9-step wizard) until "Create property" appears
  for (let i=0;i<10;i++){
    const create = page.getByRole("button",{name:/create property/i})
    if (await create.count() && await create.first().isVisible()) break
    const cont = page.getByRole("button",{name:/continue/i})
    if (await cont.count() && await cont.first().isEnabled()) { await cont.first().click().catch(()=>{}); await page.waitForTimeout(450) } else break
  }
  await page.screenshot({path:"e2e/.report/flow_property_review.png"}).catch(()=>{})
  await page.getByRole("button",{name:/create property/i}).first().click()
  await page.waitForTimeout(3000)
  notes.push("submitted → " + page.url().replace(BASE,""))
  await page.screenshot({path:"e2e/.report/flow_property_after.png"}).catch(()=>{})

  const after = (await admin.from("properties").select("id",{head:true,count:"exact"}).eq("workspace_id",fx.workspaceId)).count
  const { data: found } = await admin.from("properties").select("id, nickname, category, template").eq("workspace_id",fx.workspaceId).ilike("nickname",`%${UNIQUE}%`)
  notes.push(`count ${before} → ${after}`)
  if (after !== before+1) { pass=false; notes.push("FAIL: count did not increment by 1") }
  if (!found || !found.length) { pass=false; notes.push("FAIL: property not found in DB") }
  else notes.push("DB row: " + JSON.stringify(found[0]))
} catch(e){ pass=false; notes.push("EXCEPTION: "+String(e.message).slice(0,140)) } finally { await b.close() }
console.log("\n=== CREATE PROPERTY FLOW: " + (pass?"✅ PASS":"❌ FAIL") + " ===")
for(const n of notes) console.log("  • "+n)
console.log("  console errors:", errs.length)
process.exit(pass?0:1)
