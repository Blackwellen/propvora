// Builds src/lib/demo/schema-map.json (seeder-scoped) from live-schema.json.
import { readFileSync, writeFileSync } from "fs"
const { tables, enums } = JSON.parse(readFileSync("docs/final-wiring/live-schema.json", "utf8"))
const seedTables = [
  "activity_logs","affiliate_commissions","affiliate_referrals","affiliates","agreement_signatories",
  "ai_chat_messages","ai_chat_threads","calendar_events","chart_of_accounts","client_accounts",
  "compliance_certificates","compliance_inspections","contacts","conversations","documents",
  "expense_records","income_records","invoices","jobs","messages","money_arrears_cases","money_bills",
  "money_deposits","money_expenses","money_income","money_invoice_lines","money_invoices",
  "money_transactions","notifications","planning_assumptions","planning_bill_lines","planning_expense_lines",
  "planning_income_lines","planning_room_lines","planning_scenarios","planning_sets","planning_upfront_costs",
  "possession_cases","ppm_schedules","properties","property_units","property_vacancies","prospects",
  "supplier_invoices","supplier_jobs","tasks","tenancies","tenancy_agreements","viewings",
]
const out = {}
for (const t of seedTables) {
  if (!tables[t]) continue
  const columns = tables[t].map((c) => c.name)
  const enumCols = {}
  for (const c of tables[t]) if (enums[c.type]) enumCols[c.name] = enums[c.type]
  // Columns that are NOT NULL and have no default — must never be dropped to null.
  const required = tables[t].filter((c) => !c.nullable && !c.default).map((c) => c.name)
  out[t] = { columns, enums: enumCols, required }
}
writeFileSync("src/lib/demo/schema-map.json", JSON.stringify(out))
console.log("wrote schema-map.json for", Object.keys(out).length, "tables")
