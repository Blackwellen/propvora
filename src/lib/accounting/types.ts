// Canonical double-entry ledger — shared types.
// Amounts are stored and moved as INTEGER PENCE to avoid float error.

export type LedgerAccountType = "asset" | "liability" | "equity" | "income" | "expense"
export type NormalSide = "debit" | "credit"

export interface LedgerAccount {
  id: string
  workspace_id: string
  code: string
  name: string
  type: LedgerAccountType
  normal_side: NormalSide
  parent_id: string | null
  description: string | null
  is_system: boolean
  archived: boolean
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  workspace_id: string
  entry_no: number
  date: string
  memo: string | null
  source_type: string | null
  source_id: string | null
  posted: boolean
  posted_at: string | null
  reversed_of: string | null
  reversed_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface JournalLine {
  id: string
  workspace_id: string
  entry_id: string
  account_id: string
  debit_pence: number
  credit_pence: number
  memo: string | null
  property_id: string | null
  created_at: string
}

/** A draft line as composed in the UI before posting. */
export interface DraftLine {
  account_id: string
  debit_pence: number
  credit_pence: number
  memo?: string | null
  property_id?: string | null
}

/** Input to post a balanced journal entry. */
export interface PostEntryInput {
  workspaceId: string
  date: string // YYYY-MM-DD
  memo?: string | null
  sourceType?: string | null
  sourceId?: string | null
  createdBy?: string | null
  lines: DraftLine[]
}

export interface AccountBalance {
  account: LedgerAccount
  debit_pence: number
  credit_pence: number
  /** Signed balance in the account's natural (normal-side) orientation. */
  balance_pence: number
}

export interface TrialBalanceRow {
  account_id: string
  code: string
  name: string
  type: LedgerAccountType
  normal_side: NormalSide
  debit_pence: number
  credit_pence: number
  /** Net placed on the side that makes the row's column positive. */
  net_debit_pence: number
  net_credit_pence: number
}

export interface TrialBalance {
  rows: TrialBalanceRow[]
  total_debit_pence: number
  total_credit_pence: number
  balanced: boolean
}
