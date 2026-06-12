"use client"

// ===========================================================================
// Accounting ledger data layer — LIVE Supabase, 42P01-safe.
//
// Single source of truth for ledger reads/writes used across the Accounting
// section. Balances, trial balance and reports are ALL computed from
// journal_lines (the posted double-entry ledger), never hardcoded.
//
// Tables (app lineage):
//   accounting_accounts  — chart of accounts (the account dimension)
//   journal_entries      — header (date, description, posted/reversed flags)
//   journal_lines        — debit/credit lines, account_id -> accounting_accounts.id
//   accounting_audit_events — immutable audit trail
//
// NOTE: journal_lines.account_id is wired to the accounting_accounts UI
// lineage here (the dimension the UI lists/edits). If the database enforces
// the FK to chart_of_accounts, the balanced insert will surface that error
// honestly rather than fabricate a result.
// ===========================================================================

import { createClient } from "@/lib/supabase/client"

// ── Codes that mean "table not provisioned" — treat as honest empty ───────────
export const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST116"])

export function isMissingTable(error: { code?: string } | null | undefined): boolean {
  return !!error?.code && MISSING_TABLE_CODES.has(error.code)
}

export type AccountType = "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses"

export interface LedgerAccount {
  id: string
  code: string
  name: string
  account_type: AccountType
  subcategory: string
  currency: string
  opening_balance: number
  normal_balance: "debit" | "credit"
  property_scope: string | null
  status: "Active" | "Inactive"
}

export interface JournalLineRow {
  id: string
  journal_entry_id: string
  account_id: string
  debit: number
  credit: number
  description: string | null
  currency: string
}

export interface JournalEntryRow {
  id: string
  entry_number: string | null
  entry_date: string
  description: string
  is_posted: boolean
  is_reversed: boolean
  reversal_of: string | null
  created_at: string
  lines: JournalLineRow[]
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function fmtGBP(n: number, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(n)
}

export function fmtGBP0(n: number): string {
  return fmtGBP(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ── Account reads ─────────────────────────────────────────────────────────────

export async function fetchAccounts(workspaceId: string): Promise<LedgerAccount[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("accounting_accounts")
    .select("id, code, name, account_type, subcategory, currency, opening_balance, normal_balance, property_scope, status")
    .eq("workspace_id", workspaceId)
    .order("code", { ascending: true })

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data ?? []) as LedgerAccount[]
}

// ── Journal reads (entries + nested lines) ────────────────────────────────────

export async function fetchJournalEntries(
  workspaceId: string,
  limit = 500
): Promise<JournalEntryRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("journal_entries")
    .select(
      "id, entry_number, entry_date, description, is_posted, is_reversed, reversal_of, created_at, journal_lines(id, journal_entry_id, account_id, debit, credit, description, currency)"
    )
    .eq("workspace_id", workspaceId)
    .order("entry_date", { ascending: false })
    .limit(limit)

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }

  return (data ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    entry_number: (e.entry_number as string) ?? null,
    entry_date: e.entry_date as string,
    description: (e.description as string) ?? "",
    is_posted: !!e.is_posted,
    is_reversed: !!e.is_reversed,
    reversal_of: (e.reversal_of as string) ?? null,
    created_at: e.created_at as string,
    lines: ((e.journal_lines as Record<string, unknown>[]) ?? []).map((l) => ({
      id: l.id as string,
      journal_entry_id: l.journal_entry_id as string,
      account_id: l.account_id as string,
      debit: Number(l.debit ?? 0),
      credit: Number(l.credit ?? 0),
      description: (l.description as string) ?? null,
      currency: (l.currency as string) ?? "GBP",
    })),
  }))
}

// Flat lines for a single account (its statement), most recent first.
export async function fetchAccountLines(
  workspaceId: string,
  accountId: string,
  limit = 50
): Promise<Array<JournalLineRow & { entry_date: string; entry_number: string | null; entry_description: string; is_posted: boolean }>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("journal_lines")
    .select(
      "id, journal_entry_id, account_id, debit, credit, description, currency, journal_entries(entry_date, entry_number, description, is_posted)"
    )
    .eq("workspace_id", workspaceId)
    .eq("account_id", accountId)
    .limit(limit)

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }

  const rows = (data ?? []).map((l: Record<string, unknown>) => {
    const entry = (l.journal_entries ?? {}) as Record<string, unknown>
    return {
      id: l.id as string,
      journal_entry_id: l.journal_entry_id as string,
      account_id: l.account_id as string,
      debit: Number(l.debit ?? 0),
      credit: Number(l.credit ?? 0),
      description: (l.description as string) ?? null,
      currency: (l.currency as string) ?? "GBP",
      entry_date: (entry.entry_date as string) ?? "",
      entry_number: (entry.entry_number as string) ?? null,
      entry_description: (entry.description as string) ?? "",
      is_posted: !!entry.is_posted,
    }
  })
  rows.sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1))
  return rows
}

// ── Balance computation (from journal_lines) ──────────────────────────────────

// Net movement = debits - credits per account, signed to the account's normal side.
export function computeBalances(
  accounts: LedgerAccount[],
  entries: JournalEntryRow[]
): Map<string, { debit: number; credit: number; balance: number }> {
  const totals = new Map<string, { debit: number; credit: number }>()
  for (const e of entries) {
    if (!e.is_posted || e.is_reversed) continue
    for (const l of e.lines) {
      const t = totals.get(l.account_id) ?? { debit: 0, credit: 0 }
      t.debit += l.debit
      t.credit += l.credit
      totals.set(l.account_id, t)
    }
  }
  const out = new Map<string, { debit: number; credit: number; balance: number }>()
  for (const a of accounts) {
    const t = totals.get(a.id) ?? { debit: 0, credit: 0 }
    const net = t.debit - t.credit // positive = net debit
    // For credit-normal accounts (Liabilities/Equity/Income), the balance is
    // expressed positively when credits exceed debits.
    const signed = a.normal_balance === "credit" ? -net : net
    const balance = a.opening_balance + signed
    out.set(a.id, { debit: t.debit, credit: t.credit, balance })
  }
  return out
}

export function normalBalanceForType(t: AccountType): "debit" | "credit" {
  return t === "Assets" || t === "Expenses" ? "debit" : "credit"
}

// ── Posting (balanced double-entry insert) ────────────────────────────────────

export interface DraftLine {
  account_id: string
  debit: number
  credit: number
  description?: string
}

export interface PostResult {
  ok: boolean
  entryId?: string
  error?: string
  code?: string
}

// Validates debits === credits, then inserts a posted entry + lines atomically
// (header first, then lines; rolls back header if lines fail). 42P01-safe.
export async function postJournalEntry(
  workspaceId: string,
  input: { entry_date: string; description: string; lines: DraftLine[]; createdBy?: string | null }
): Promise<PostResult> {
  const lines = input.lines.filter((l) => (l.debit ?? 0) > 0 || (l.credit ?? 0) > 0)
  if (lines.length < 2) return { ok: false, error: "A journal entry needs at least two lines." }
  for (const l of lines) {
    if (!l.account_id) return { ok: false, error: "Every line must have an account." }
    if (l.debit > 0 && l.credit > 0) return { ok: false, error: "A line cannot be both debit and credit." }
  }
  const totalDebit = round2(lines.reduce((s, l) => s + (l.debit || 0), 0))
  const totalCredit = round2(lines.reduce((s, l) => s + (l.credit || 0), 0))
  if (Math.abs(totalDebit - totalCredit) > 0.005) {
    return { ok: false, error: `Unbalanced: debits ${fmtGBP(totalDebit)} ≠ credits ${fmtGBP(totalCredit)}.` }
  }
  if (totalDebit === 0) return { ok: false, error: "Entry total cannot be zero." }

  const supabase = createClient()
  const entryNumber = `JE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

  const { data: entry, error: entryErr } = await supabase
    .from("journal_entries")
    .insert({
      workspace_id: workspaceId,
      entry_number: entryNumber,
      entry_date: input.entry_date,
      description: input.description,
      is_posted: true,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single()

  if (entryErr) {
    return { ok: false, error: entryErr.message, code: entryErr.code }
  }

  const entryId = (entry as { id: string }).id
  const { error: linesErr } = await supabase.from("journal_lines").insert(
    lines.map((l) => ({
      workspace_id: workspaceId,
      journal_entry_id: entryId,
      account_id: l.account_id,
      debit: round2(l.debit || 0),
      credit: round2(l.credit || 0),
      currency: "GBP",
      description: l.description ?? null,
    }))
  )

  if (linesErr) {
    // Roll back the header so we never leave an entry with no lines.
    await supabase.from("journal_entries").delete().eq("id", entryId).eq("workspace_id", workspaceId)
    return { ok: false, error: linesErr.message, code: linesErr.code }
  }

  await writeAudit(workspaceId, "journal_entry", entryId, "posted", input.createdBy ?? null, {
    entry_number: entryNumber,
    total: totalDebit,
  })

  return { ok: true, entryId }
}

// Posted entries are immutable. Corrections happen via a reversing entry that
// mirrors debit<->credit, leaving an auditable trail.
export async function reverseJournalEntry(
  workspaceId: string,
  entry: JournalEntryRow,
  createdBy?: string | null
): Promise<PostResult> {
  if (!entry.is_posted) return { ok: false, error: "Only posted entries can be reversed." }
  if (entry.is_reversed) return { ok: false, error: "This entry has already been reversed." }

  const supabase = createClient()
  const entryNumber = `JE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}R`
  const today = new Date().toISOString().slice(0, 10)

  const { data: rev, error: entryErr } = await supabase
    .from("journal_entries")
    .insert({
      workspace_id: workspaceId,
      entry_number: entryNumber,
      entry_date: today,
      description: `Reversal of ${entry.entry_number ?? entry.id} — ${entry.description}`,
      is_posted: true,
      reversal_of: entry.id,
      created_by: createdBy ?? null,
    })
    .select("id")
    .single()

  if (entryErr) return { ok: false, error: entryErr.message, code: entryErr.code }

  const revId = (rev as { id: string }).id
  const { error: linesErr } = await supabase.from("journal_lines").insert(
    entry.lines.map((l) => ({
      workspace_id: workspaceId,
      journal_entry_id: revId,
      account_id: l.account_id,
      debit: round2(l.credit), // swap
      credit: round2(l.debit),
      currency: l.currency,
      description: `Reversal — ${l.description ?? ""}`.trim(),
    }))
  )
  if (linesErr) {
    await supabase.from("journal_entries").delete().eq("id", revId).eq("workspace_id", workspaceId)
    return { ok: false, error: linesErr.message, code: linesErr.code }
  }

  // Mark the original as reversed (best-effort; non-fatal if column missing).
  await supabase
    .from("journal_entries")
    .update({ is_reversed: true })
    .eq("id", entry.id)
    .eq("workspace_id", workspaceId)

  await writeAudit(workspaceId, "journal_entry", entry.id, "reversed", createdBy ?? null, {
    reversal_entry: entryNumber,
  })

  return { ok: true, entryId: revId }
}

// ── Audit (best-effort, never throws) ─────────────────────────────────────────

export async function writeAudit(
  workspaceId: string,
  entityType: string,
  entityId: string | null,
  action: string,
  actorId: string | null,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from("accounting_audit_events").insert({
      workspace_id: workspaceId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_id: actorId,
      changes: changes ?? null,
    })
  } catch {
    /* audit is best-effort; ledger integrity does not depend on it */
  }
}

// ── Reports (computed from the ledger) ────────────────────────────────────────

export interface TrialBalanceRow {
  account: LedgerAccount
  debit: number
  credit: number
}

// Trial balance: each account's net presented on its natural debit/credit side.
export function buildTrialBalance(
  accounts: LedgerAccount[],
  entries: JournalEntryRow[]
): { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number } {
  const balances = computeBalances(accounts, entries)
  const rows: TrialBalanceRow[] = []
  let totalDebit = 0
  let totalCredit = 0
  for (const a of accounts) {
    const b = balances.get(a.id)!
    // Present the net balance (incl. opening) on the account's natural side.
    const bal = b.balance
    let debit = 0
    let credit = 0
    if (a.normal_balance === "debit") {
      if (bal >= 0) debit = bal
      else credit = -bal
    } else {
      if (bal >= 0) credit = bal
      else debit = -bal
    }
    if (debit === 0 && credit === 0) continue
    rows.push({ account: a, debit, credit })
    totalDebit += debit
    totalCredit += credit
  }
  return { rows, totalDebit: round2(totalDebit), totalCredit: round2(totalCredit) }
}

export interface PLSection {
  rows: { account: LedgerAccount; amount: number }[]
  total: number
}

export function buildProfitAndLoss(
  accounts: LedgerAccount[],
  entries: JournalEntryRow[]
): { income: PLSection; expenses: PLSection; netProfit: number } {
  const balances = computeBalances(accounts, entries)
  const income = { rows: [] as PLSection["rows"], total: 0 }
  const expenses = { rows: [] as PLSection["rows"], total: 0 }
  for (const a of accounts) {
    const bal = balances.get(a.id)!.balance
    if (a.account_type === "Income") {
      income.rows.push({ account: a, amount: bal })
      income.total += bal
    } else if (a.account_type === "Expenses") {
      expenses.rows.push({ account: a, amount: bal })
      expenses.total += bal
    }
  }
  income.total = round2(income.total)
  expenses.total = round2(expenses.total)
  return { income, expenses, netProfit: round2(income.total - expenses.total) }
}

export interface BSSection {
  rows: { account: LedgerAccount; amount: number }[]
  total: number
}

export function buildBalanceSheet(
  accounts: LedgerAccount[],
  entries: JournalEntryRow[]
): { assets: BSSection; liabilities: BSSection; equity: BSSection; netProfit: number; balances: boolean } {
  const bal = computeBalances(accounts, entries)
  const assets = { rows: [] as BSSection["rows"], total: 0 }
  const liabilities = { rows: [] as BSSection["rows"], total: 0 }
  const equity = { rows: [] as BSSection["rows"], total: 0 }
  for (const a of accounts) {
    const v = bal.get(a.id)!.balance
    if (a.account_type === "Assets") {
      assets.rows.push({ account: a, amount: v })
      assets.total += v
    } else if (a.account_type === "Liabilities") {
      liabilities.rows.push({ account: a, amount: v })
      liabilities.total += v
    } else if (a.account_type === "Equity") {
      equity.rows.push({ account: a, amount: v })
      equity.total += v
    }
  }
  const { netProfit } = buildProfitAndLoss(accounts, entries)
  assets.total = round2(assets.total)
  liabilities.total = round2(liabilities.total)
  equity.total = round2(equity.total)
  // Assets = Liabilities + Equity + retained profit for the period.
  const rhs = round2(liabilities.total + equity.total + netProfit)
  return {
    assets,
    liabilities,
    equity,
    netProfit,
    balances: Math.abs(assets.total - rhs) < 0.01,
  }
}

// ── CSV export ────────────────────────────────────────────────────────────────

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "")
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n")
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
