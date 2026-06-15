// ============================================================
// Money-event -> journal-entry mapping.
//
// The money section (invoices / bills / expense_records / money_transactions)
// records real cash and obligations. This module translates each money event
// into the balanced double-entry journal the ledger expects, using the seeded
// default chart of accounts (matched by code).
//
// It returns a PostEntryInput (draft lines), which is then handed to
// postJournalEntry(). Nothing here writes directly — composition + posting are
// separate so the UI can preview the entry before committing.
//
// Standard postings (UK property bookkeeping):
//   Invoice raised (sales):   Dr Rent Receivable (1100)   Cr Rental Income (4000)
//   Invoice paid:             Dr Bank (1000)              Cr Rent Receivable (1100)
//   Bill received (purchase): Dr Expense (5xxx)           Cr Trade Creditors (2000)
//   Bill paid:                Dr Trade Creditors (2000)   Cr Bank (1000)
//   Expense (cash):           Dr Expense (5xxx)           Cr Bank (1000)
//   Rent receipt (direct):    Dr Bank (1000)              Cr Rental Income (4000)
// ============================================================

import type { DB } from "./ledger"
import type { DraftLine, LedgerAccount, PostEntryInput } from "./types"
import { toPence } from "./money"

// Default account codes the mapping relies on (seeded by the migration).
export const ACCT = {
  BANK: "1000",
  RENT_RECEIVABLE: "1100",
  TRADE_CREDITORS: "2000",
  RENTAL_INCOME: "4000",
  REPAIRS: "5000",
  MGMT_FEES: "5100",
  INSURANCE: "5200",
  UTILITIES: "5300",
  COUNCIL_TAX: "5400",
  LEGAL: "5700",
  COMPLIANCE: "5800",
  SUNDRY: "6900",
} as const

/** Load workspace accounts keyed by code. */
export async function loadAccountsByCode(
  db: DB,
  workspaceId: string
): Promise<Record<string, LedgerAccount>> {
  const { data, error } = await db
    .from("ledger_accounts")
    .select("*")
    .eq("workspace_id", workspaceId)
  if (error) throw error
  const map: Record<string, LedgerAccount> = {}
  for (const a of (data as LedgerAccount[]) ?? []) map[a.code] = a
  return map
}

function require(map: Record<string, LedgerAccount>, code: string): string {
  const a = map[code]
  if (!a) throw new Error(`Ledger account ${code} not found — seed the chart of accounts first.`)
  return a.id
}

/** Map an expense category string to the closest expense account code. */
export function expenseCodeForCategory(category: string | null | undefined): string {
  const c = (category ?? "").toLowerCase()
  if (/repair|maintenance|fix/.test(c)) return ACCT.REPAIRS
  if (/manage|letting|agent|fee/.test(c)) return ACCT.MGMT_FEES
  if (/insur/.test(c)) return ACCT.INSURANCE
  if (/utilit|gas|electric|water|energy/.test(c)) return ACCT.UTILITIES
  if (/council|rates/.test(c)) return ACCT.COUNCIL_TAX
  if (/legal|professional|solicit|account/.test(c)) return ACCT.LEGAL
  if (/compli|certificate|epc|gas safe|eicr/.test(c)) return ACCT.COMPLIANCE
  return ACCT.SUNDRY
}

interface MoneyRow {
  id: string
  workspace_id: string
  total?: number | string | null
  amount?: number | string | null
  issue_date?: string | null
  date?: string | null
  category?: string | null
  description?: string | null
  property_id?: string | null
}

// ─── Builders (each returns a balanced PostEntryInput) ───────────────────────

export function mapInvoiceRaised(
  invoice: MoneyRow,
  accounts: Record<string, LedgerAccount>,
  createdBy?: string | null
): PostEntryInput {
  const amount = toPence(invoice.total)
  const lines: DraftLine[] = [
    { account_id: require(accounts, ACCT.RENT_RECEIVABLE), debit_pence: amount, credit_pence: 0, property_id: invoice.property_id ?? null },
    { account_id: require(accounts, ACCT.RENTAL_INCOME), debit_pence: 0, credit_pence: amount, property_id: invoice.property_id ?? null },
  ]
  return {
    workspaceId: invoice.workspace_id,
    date: invoice.issue_date ?? new Date().toISOString().slice(0, 10),
    memo: `Invoice ${invoice.id.slice(0, 8)} raised`,
    sourceType: "invoice",
    sourceId: invoice.id,
    createdBy,
    lines,
  }
}

export function mapInvoicePaid(
  invoice: MoneyRow,
  accounts: Record<string, LedgerAccount>,
  createdBy?: string | null
): PostEntryInput {
  const amount = toPence(invoice.total)
  return {
    workspaceId: invoice.workspace_id,
    date: new Date().toISOString().slice(0, 10),
    memo: `Invoice ${invoice.id.slice(0, 8)} payment received`,
    sourceType: "invoice_payment",
    sourceId: invoice.id,
    createdBy,
    lines: [
      { account_id: require(accounts, ACCT.BANK), debit_pence: amount, credit_pence: 0, property_id: invoice.property_id ?? null },
      { account_id: require(accounts, ACCT.RENT_RECEIVABLE), debit_pence: 0, credit_pence: amount, property_id: invoice.property_id ?? null },
    ],
  }
}

export function mapBillReceived(
  bill: MoneyRow,
  accounts: Record<string, LedgerAccount>,
  createdBy?: string | null
): PostEntryInput {
  const amount = toPence(bill.total)
  const expenseCode = expenseCodeForCategory(bill.category ?? bill.description)
  return {
    workspaceId: bill.workspace_id,
    date: bill.issue_date ?? new Date().toISOString().slice(0, 10),
    memo: `Bill ${bill.id.slice(0, 8)} received`,
    sourceType: "bill",
    sourceId: bill.id,
    createdBy,
    lines: [
      { account_id: require(accounts, expenseCode), debit_pence: amount, credit_pence: 0, property_id: bill.property_id ?? null },
      { account_id: require(accounts, ACCT.TRADE_CREDITORS), debit_pence: 0, credit_pence: amount, property_id: bill.property_id ?? null },
    ],
  }
}

export function mapBillPaid(
  bill: MoneyRow,
  accounts: Record<string, LedgerAccount>,
  createdBy?: string | null
): PostEntryInput {
  const amount = toPence(bill.total)
  return {
    workspaceId: bill.workspace_id,
    date: new Date().toISOString().slice(0, 10),
    memo: `Bill ${bill.id.slice(0, 8)} paid`,
    sourceType: "bill_payment",
    sourceId: bill.id,
    createdBy,
    lines: [
      { account_id: require(accounts, ACCT.TRADE_CREDITORS), debit_pence: amount, credit_pence: 0, property_id: bill.property_id ?? null },
      { account_id: require(accounts, ACCT.BANK), debit_pence: 0, credit_pence: amount, property_id: bill.property_id ?? null },
    ],
  }
}

export function mapExpense(
  expense: MoneyRow,
  accounts: Record<string, LedgerAccount>,
  createdBy?: string | null
): PostEntryInput {
  const amount = toPence(expense.amount)
  const expenseCode = expenseCodeForCategory(expense.category)
  return {
    workspaceId: expense.workspace_id,
    date: expense.date ?? new Date().toISOString().slice(0, 10),
    memo: expense.description ?? `Expense ${expense.id.slice(0, 8)}`,
    sourceType: "expense",
    sourceId: expense.id,
    createdBy,
    lines: [
      { account_id: require(accounts, expenseCode), debit_pence: amount, credit_pence: 0, property_id: expense.property_id ?? null },
      { account_id: require(accounts, ACCT.BANK), debit_pence: 0, credit_pence: amount, property_id: expense.property_id ?? null },
    ],
  }
}

export function mapRentReceipt(
  receipt: MoneyRow,
  accounts: Record<string, LedgerAccount>,
  createdBy?: string | null
): PostEntryInput {
  const amount = toPence(receipt.amount ?? receipt.total)
  return {
    workspaceId: receipt.workspace_id,
    date: receipt.date ?? new Date().toISOString().slice(0, 10),
    memo: receipt.description ?? `Rent received`,
    sourceType: "rent_receipt",
    sourceId: receipt.id,
    createdBy,
    lines: [
      { account_id: require(accounts, ACCT.BANK), debit_pence: amount, credit_pence: 0, property_id: receipt.property_id ?? null },
      { account_id: require(accounts, ACCT.RENTAL_INCOME), debit_pence: 0, credit_pence: amount, property_id: receipt.property_id ?? null },
    ],
  }
}
