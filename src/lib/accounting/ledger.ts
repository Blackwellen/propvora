// ============================================================
// Posting engine for the canonical double-entry ledger.
//
// All functions take a Supabase client (browser or server, RLS-scoped — never
// the service role) so workspace isolation is enforced by the database. The
// DB additionally enforces:
//   * balance (sum debits = sum credits) on posted entries,
//   * a minimum of two lines,
//   * immutability of posted entries (corrections = reversal, never edit).
// These client functions mirror those rules so the UI fails fast with a clear
// message before hitting the database.
//
// Amounts are integer pence throughout.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  AccountBalance,
  DraftLine,
  JournalEntry,
  JournalLine,
  LedgerAccount,
  PostEntryInput,
  TrialBalance,
  TrialBalanceRow,
} from "./types"

export type DB = SupabaseClient

/** True when an error is "relation does not exist" (migration not applied). */
export function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

// ─── Validation ────────────────────────────────────────────────────────────

export interface BalanceCheck {
  totalDebit: number
  totalCredit: number
  difference: number
  balanced: boolean
  lineCount: number
}

/** Pure, synchronous balance check for a set of draft lines. */
export function checkBalance(lines: DraftLine[]): BalanceCheck {
  const valid = lines.filter((l) => l.account_id && (l.debit_pence > 0 || l.credit_pence > 0))
  const totalDebit = valid.reduce((s, l) => s + (l.debit_pence || 0), 0)
  const totalCredit = valid.reduce((s, l) => s + (l.credit_pence || 0), 0)
  return {
    totalDebit,
    totalCredit,
    difference: totalDebit - totalCredit,
    balanced: totalDebit === totalCredit && totalDebit > 0,
    lineCount: valid.length,
  }
}

function assertPostable(lines: DraftLine[]): DraftLine[] {
  const valid = lines.filter((l) => l.account_id && (l.debit_pence > 0 || l.credit_pence > 0))
  if (valid.length < 2) {
    throw new Error("A journal entry needs at least two lines.")
  }
  for (const l of valid) {
    if (l.debit_pence > 0 && l.credit_pence > 0) {
      throw new Error("A line cannot be both a debit and a credit.")
    }
  }
  const chk = checkBalance(valid)
  if (!chk.balanced) {
    throw new Error(
      `Entry does not balance: debits ${chk.totalDebit} ≠ credits ${chk.totalCredit}.`
    )
  }
  return valid
}

// ─── Posting ───────────────────────────────────────────────────────────────

/**
 * Post a balanced journal entry. Creates the header + lines, then flips
 * `posted = true` (which arms the DB balance constraint). If anything fails,
 * the orphan header is rolled back manually (no client-side transaction in
 * supabase-js, so we compensate on error).
 */
export async function postJournalEntry(
  db: DB,
  input: PostEntryInput
): Promise<JournalEntry> {
  const lines = assertPostable(input.lines)

  // Next entry number for this workspace.
  const { data: noData, error: noErr } = await db.rpc("ledger_next_entry_no", {
    p_workspace: input.workspaceId,
  })
  if (noErr) throw noErr
  const entryNo = (noData as number) ?? 1

  // Insert the (unposted) header.
  const { data: entry, error: entryErr } = await db
    .from("ledger_journal_entries")
    .insert({
      workspace_id: input.workspaceId,
      entry_no: entryNo,
      date: input.date,
      memo: input.memo ?? null,
      source_type: input.sourceType ?? "manual",
      source_id: input.sourceId ?? null,
      created_by: input.createdBy ?? null,
      posted: false,
    })
    .select()
    .single()
  if (entryErr) throw entryErr
  const header = entry as JournalEntry

  // Insert the lines.
  const lineRows = lines.map((l) => ({
    workspace_id: input.workspaceId,
    entry_id: header.id,
    account_id: l.account_id,
    debit_pence: l.debit_pence || 0,
    credit_pence: l.credit_pence || 0,
    memo: l.memo ?? null,
    property_id: l.property_id ?? null,
  }))
  const { error: linesErr } = await db.from("ledger_journal_lines").insert(lineRows)
  if (linesErr) {
    // Compensate: remove the orphan draft header.
    await db.from("ledger_journal_entries").delete().eq("id", header.id)
    throw linesErr
  }

  // Arm the entry: posting triggers the DB balance constraint.
  const { data: posted, error: postErr } = await db
    .from("ledger_journal_entries")
    .update({ posted: true, posted_at: new Date().toISOString() })
    .eq("id", header.id)
    .select()
    .single()
  if (postErr) {
    // Balance/validation failed at DB — clean up the draft + lines.
    await db.from("ledger_journal_lines").delete().eq("entry_id", header.id)
    await db.from("ledger_journal_entries").delete().eq("id", header.id)
    throw postErr
  }
  return posted as JournalEntry
}

// ─── Reversal ──────────────────────────────────────────────────────────────

/**
 * Reverse a posted entry. Creates a NEW mirror entry (debits<->credits
 * swapped), links both ways, and never deletes the original. The reversal is
 * itself a posted, immutable entry.
 */
export async function reverseJournalEntry(
  db: DB,
  workspaceId: string,
  entryId: string,
  opts: { createdBy?: string | null; memo?: string | null } = {}
): Promise<JournalEntry> {
  const { data: original, error: oErr } = await db
    .from("ledger_journal_entries")
    .select("*")
    .eq("id", entryId)
    .eq("workspace_id", workspaceId)
    .single()
  if (oErr) throw oErr
  const orig = original as JournalEntry
  if (!orig.posted) throw new Error("Only posted entries can be reversed.")
  if (orig.reversed_by) throw new Error("This entry has already been reversed.")

  const { data: linesData, error: lErr } = await db
    .from("ledger_journal_lines")
    .select("*")
    .eq("entry_id", entryId)
  if (lErr) throw lErr
  const lines = (linesData as JournalLine[]) ?? []
  if (lines.length === 0) throw new Error("Original entry has no lines to reverse.")

  // Mirror: swap debit and credit on each line.
  const mirrored: DraftLine[] = lines.map((l) => ({
    account_id: l.account_id,
    debit_pence: l.credit_pence,
    credit_pence: l.debit_pence,
    memo: l.memo,
    property_id: l.property_id,
  }))

  const reversal = await postJournalEntry(db, {
    workspaceId,
    date: new Date().toISOString().slice(0, 10),
    memo: opts.memo ?? `Reversal of entry #${orig.entry_no}${orig.memo ? ` — ${orig.memo}` : ""}`,
    sourceType: "reversal",
    sourceId: orig.id,
    createdBy: opts.createdBy ?? null,
    lines: mirrored,
  })

  // Link original -> reversal. (reversed_by is one of the few mutable fields on
  // a posted entry, permitted by the immutability trigger.)
  await db
    .from("ledger_journal_entries")
    .update({ reversed_by: reversal.id })
    .eq("id", orig.id)
    .eq("workspace_id", workspaceId)

  // Link reversal -> original.
  await db
    .from("ledger_journal_entries")
    .update({ reversed_of: orig.id })
    .eq("id", reversal.id)
    .eq("workspace_id", workspaceId)

  return reversal
}

// ─── Balances & trial balance (computed from lines, never stored) ────────────

interface LineForBalance {
  account_id: string
  debit_pence: number
  credit_pence: number
}

/** Fetch all POSTED lines for a workspace (optionally up to a date). */
async function fetchPostedLines(
  db: DB,
  workspaceId: string,
  upToDate?: string
): Promise<LineForBalance[]> {
  let q = db
    .from("ledger_journal_lines")
    .select("account_id, debit_pence, credit_pence, ledger_journal_entries!inner(posted, date, workspace_id)")
    .eq("workspace_id", workspaceId)
    .eq("ledger_journal_entries.posted", true)
  if (upToDate) q = q.lte("ledger_journal_entries.date", upToDate)
  const { data, error } = await q
  if (error) throw error
  return ((data as unknown[]) ?? []).map((r) => {
    const row = r as { account_id: string; debit_pence: number; credit_pence: number }
    return {
      account_id: row.account_id,
      debit_pence: row.debit_pence,
      credit_pence: row.credit_pence,
    }
  })
}

/**
 * Compute the running balance for a single account from its posted lines.
 * `balance_pence` is signed in the account's natural orientation: positive
 * means a debit-normal account is "up" / a credit-normal account is "up".
 */
export async function computeAccountBalance(
  db: DB,
  workspaceId: string,
  account: LedgerAccount,
  upToDate?: string
): Promise<AccountBalance> {
  const lines = (await fetchPostedLines(db, workspaceId, upToDate)).filter(
    (l) => l.account_id === account.id
  )
  const debit = lines.reduce((s, l) => s + l.debit_pence, 0)
  const credit = lines.reduce((s, l) => s + l.credit_pence, 0)
  const natural = account.normal_side === "debit" ? debit - credit : credit - debit
  return { account, debit_pence: debit, credit_pence: credit, balance_pence: natural }
}

/** Compute a full trial balance across every account, from posted lines. */
export async function computeTrialBalance(
  db: DB,
  workspaceId: string,
  upToDate?: string
): Promise<TrialBalance> {
  const [{ data: acctData, error: aErr }, lines] = await Promise.all([
    db.from("ledger_accounts").select("*").eq("workspace_id", workspaceId),
    fetchPostedLines(db, workspaceId, upToDate),
  ])
  if (aErr) throw aErr
  const accounts = (acctData as LedgerAccount[]) ?? []

  const byAccount = new Map<string, { debit: number; credit: number }>()
  for (const l of lines) {
    const cur = byAccount.get(l.account_id) ?? { debit: 0, credit: 0 }
    cur.debit += l.debit_pence
    cur.credit += l.credit_pence
    byAccount.set(l.account_id, cur)
  }

  const rows: TrialBalanceRow[] = []
  for (const acc of accounts) {
    const agg = byAccount.get(acc.id)
    if (!agg || (agg.debit === 0 && agg.credit === 0)) continue
    const net = agg.debit - agg.credit
    rows.push({
      account_id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      normal_side: acc.normal_side,
      debit_pence: agg.debit,
      credit_pence: agg.credit,
      net_debit_pence: net > 0 ? net : 0,
      net_credit_pence: net < 0 ? -net : 0,
    })
  }
  rows.sort((a, b) => a.code.localeCompare(b.code))

  const totalDebit = rows.reduce((s, r) => s + r.net_debit_pence, 0)
  const totalCredit = rows.reduce((s, r) => s + r.net_credit_pence, 0)
  return {
    rows,
    total_debit_pence: totalDebit,
    total_credit_pence: totalCredit,
    balanced: totalDebit === totalCredit,
  }
}

// ─── CSV helper (shared with UI export) ──────────────────────────────────────

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const esc = (v: string | number | null) => {
    const s = v == null ? "" : String(v)
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
  a.click()
  URL.revokeObjectURL(url)
}
