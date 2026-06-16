import { q } from "./_q.mjs"
const OP = "7d9e941b-c6f1-4293-bcbc-76b2197a69bb"
const SUP = "2cb94055-8fd2-4807-8f34-9c88e47aa318"

console.log("======================= PER-TABLE COUNTS (operator) =======================")
const tables = ["deposits","arrears_records","payments","bills","bill_lines","ledger_journal_entries","ledger_journal_lines","calendar_events","automation_definitions","automation_v2_runs","documents","jobs","ppm_plans","tasks","compliance_items","invoices","money_transactions","rent_schedules","properties","units","tenancies","contacts","expense_records","ledger_accounts"]
for (const t of tables) {
  const r = await q(`select count(*)::int n from ${t} where workspace_id='${OP}'`)
  console.log(`  ${t.padEnd(26)} ${r[0].n}`)
}
console.log("\n  supplier automation_definitions:", (await q(`select count(*)::int n from automation_definitions where workspace_id='${SUP}'`))[0].n)
console.log("  supplier automation_v2_runs:   ", (await q(`select count(*)::int n from automation_v2_runs where workspace_id='${SUP}'`))[0].n)

console.log("\n===================== BALANCING ACCOUNTING PROOF =====================")
// Per-entry balance check
const unbal = await q(`
  select e.entry_no, sum(l.debit_pence) d, sum(l.credit_pence) c
  from ledger_journal_entries e join ledger_journal_lines l on l.entry_id=e.id
  where e.workspace_id='${OP}'
  group by e.entry_no having sum(l.debit_pence) <> sum(l.credit_pence)`)
console.log("  Entries where debits != credits:", unbal.length, unbal.length ? JSON.stringify(unbal) : "(all balanced)")

// Trial balance totals
const tb = await q(`
  select sum(debit_pence) d, sum(credit_pence) c
  from ledger_journal_lines where workspace_id='${OP}'`)
console.log(`  Trial balance: total debits = £${(tb[0].d/100).toFixed(2)}  total credits = £${(tb[0].c/100).toFixed(2)}  -> ${tb[0].d===tb[0].c?"BALANCED":"OUT"}`)

// Balance Sheet from account types.
// Convention: assets & expenses carry DEBIT balances (debit-credit);
// liabilities, equity & income carry CREDIT balances (credit-debit).
// Drawings is a contra-equity account (debit-normal) so it naturally
// reduces the credit-side equity total via (credit-debit).
const bs = await q(`
  select a.type,
    sum(case when a.type in ('asset','expense') then l.debit_pence-l.credit_pence else l.credit_pence-l.debit_pence end) bal
  from ledger_journal_lines l join ledger_accounts a on a.id=l.account_id
  where l.workspace_id='${OP}'
  group by a.type order by a.type`)
let assets=0, liab=0, equity=0, income=0, expense=0
for (const r of bs){ const v=Number(r.bal);
  if(r.type==='asset')assets=v; if(r.type==='liability')liab=v; if(r.type==='equity')equity=v; if(r.type==='income')income=v; if(r.type==='expense')expense=v; }
const netProfit = income - expense
console.log("\n  --- PROFIT & LOSS ---")
console.log(`  Income  : £${(income/100).toFixed(2)}`)
console.log(`  Expenses: £${(expense/100).toFixed(2)}`)
console.log(`  NET PROFIT: £${(netProfit/100).toFixed(2)}`)
console.log("\n  --- BALANCE SHEET ---")
console.log(`  Assets              : £${(assets/100).toFixed(2)}`)
console.log(`  Liabilities         : £${(liab/100).toFixed(2)}`)
console.log(`  Equity (capital/draw): £${(equity/100).toFixed(2)}`)
console.log(`  Equity + Net Profit : £${((equity+netProfit)/100).toFixed(2)}`)
const lhs = assets, rhs = liab + equity + netProfit
console.log(`  CHECK: Assets (${(lhs/100).toFixed(2)}) = Liab + Equity + NetProfit (${(rhs/100).toFixed(2)})  -> ${lhs===rhs?"BALANCES ✓":"OUT BY £"+((lhs-rhs)/100).toFixed(2)}`)

console.log("\n===================== CALENDAR (next 90 days) =====================")
const cal = await q(`select type, count(*)::int n from calendar_events where workspace_id='${OP}' and start_date between current_date and current_date+90 group by type order by type`)
for (const r of cal) console.log(`  ${r.type.padEnd(12)} ${r.n}`)
console.log("  total next 90d:", (await q(`select count(*)::int n from calendar_events where workspace_id='${OP}' and start_date between current_date and current_date+90`))[0].n)

console.log("\n===================== AUTOMATIONS =====================")
const au = await q(`select name, enabled, source, (select count(*)::int from automation_v2_runs r where r.definition_id=d.id) runs from automation_definitions d where workspace_id='${OP}' order by name`)
for (const r of au) console.log(`  [${r.enabled?"ON ":"OFF"}] ${r.name.padEnd(42)} runs=${r.runs}`)
const rs = await q(`select status, count(*)::int n from automation_v2_runs where workspace_id='${OP}' group by status order by status`)
console.log("  run statuses:", JSON.stringify(rs))

console.log("\n===================== OPS KPIs =====================")
console.log("  arrears outstanding £:", (await q(`select coalesce(sum(amount_outstanding),0)::numeric s from arrears_records where workspace_id='${OP}' and status not in ('resolved','written_off')`))[0].s)
console.log("  tasks open:", (await q(`select count(*)::int n from tasks where workspace_id='${OP}' and status not in ('done','cancelled')`))[0].n)
console.log("  tasks overdue:", (await q(`select count(*)::int n from tasks where workspace_id='${OP}' and status not in ('done','cancelled') and due_at < now()`))[0].n)
const comp = await q(`select status, count(*)::int n from compliance_items where workspace_id='${OP}' group by status order by status`)
console.log("  compliance by status:", JSON.stringify(comp))
const bills = await q(`select status, count(*)::int n, sum(total)::numeric t from bills where workspace_id='${OP}' group by status order by status`)
console.log("  bills by status:", JSON.stringify(bills))
const inv = await q(`select status, count(*)::int n from invoices where workspace_id='${OP}' and invoice_number like 'INV-EFS-%' group by status`)
console.log("  EFS invoices by status:", JSON.stringify(inv))
