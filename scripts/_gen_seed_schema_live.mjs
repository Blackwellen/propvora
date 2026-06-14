// Regenerate src/lib/demo/schema-map.json directly from the LIVE DB.
// More accurate than docs/final-wiring/live-schema.json (which is incomplete).
import { readFileSync, writeFileSync } from "node:fs"
function loadEnv(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{}return o}
const env={...loadEnv(".env"),...loadEnv(".env.local")}
const token=env.SUPABASE_PERSONAL_ACCESS_KEY
const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
async function q(query){const res=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({query})});const j=await res.json();if(!res.ok)throw new Error(JSON.stringify(j));return j}

// The tables the demo seeder writes (curated; existing list with phantoms removed + real ones added).
const seedTables = [
  "activity_logs","affiliate_commissions","affiliate_referrals","affiliates","agreement_signatories",
  "ai_chat_messages","ai_chat_threads","arrears_records","calendar_events","chart_of_accounts","client_accounts",
  "compliance_certificates","compliance_inspections","compliance_items","contacts","documents",
  "expense_records","income_records","invoices","job_schedules","jobs","message_threads","messages",
  "money_transactions","notifications","planning_assumptions","planning_bill_lines","planning_expense_lines",
  "planning_income_lines","planning_room_lines","planning_scenarios","planning_sets","planning_upfront_costs",
  "ppm_plans","properties","property_units","property_vacancies","prospects","rent_schedules",
  "supplier_invoices","supplier_jobs","tasks","tenancies","tenancy_agreements","viewings",
]

const inList = seedTables.map(t=>`'${t}'`).join(',')
// 1) columns + nullability + default
const cols = await q(`SELECT table_name, column_name, is_nullable, column_default, udt_name, data_type
  FROM information_schema.columns WHERE table_schema='public' AND table_name = ANY(ARRAY[${inList}])
  ORDER BY table_name, ordinal_position`)
// 2) enum labels per udt
const enumRows = await q(`SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid ORDER BY t.typname, e.enumsortorder`)
const enumMap = {}
for (const r of enumRows) (enumMap[r.typname] ??= []).push(r.enumlabel)

const out = {}
for (const c of cols) {
  const t = c.table_name
  out[t] ??= { columns: [], enums: {}, required: [] }
  out[t].columns.push(c.column_name)
  if (enumMap[c.udt_name]) out[t].enums[c.column_name] = enumMap[c.udt_name]
  if (c.is_nullable === 'NO' && !c.column_default) out[t].required.push(c.column_name)
}
const missing = seedTables.filter(t => !out[t])
writeFileSync("src/lib/demo/schema-map.json", JSON.stringify(out))
console.log("wrote schema-map.json for", Object.keys(out).length, "tables")
if (missing.length) console.log("NOTE absent from live DB:", missing.join(', '))
