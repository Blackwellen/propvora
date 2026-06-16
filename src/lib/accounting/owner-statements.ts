import "server-only"

/**
 * P5+ — OWNER STATEMENTS.
 *
 * A landlord/owner statement summarises, for a period and (optionally) a
 * property, the money collected on the owner's behalf, fees/commission retained,
 * expenses paid, deposits/holds movement, and the net due to the owner. It is
 * derived from POSTED journal lines (the single source of truth) so it always
 * ties to the ledger.
 *
 * Money is integer pence. Read-only.
 */

import type { DB } from "./ledger"
import { MONEY_ACCT } from "./payments-journal"
import { ACCT } from "./money-mapping"

export interface OwnerStatementLine {
  label: string
  code: string
  amountPence: number
  kind: "income" | "fee" | "expense" | "deposit" | "net"
}

export interface OwnerStatement {
  workspaceId: string
  propertyId: string | null
  fromDate: string
  toDate: string
  lines: OwnerStatementLine[]
  grossCollectedPence: number
  feesPence: number
  expensesPence: number
  netDuePence: number
  provisioned: boolean
}

interface PostedLine {
  account_id: string
  debit_pence: number
  credit_pence: number
  code: string
  type: string
  property_id: string | null
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/**
 * Fetch posted journal lines (joined to account code/type and entry date) in a
 * window, optionally property-scoped.
 */
async function fetchPostedLines(
  db: DB,
  workspaceId: string,
  fromDate: string,
  toDate: string,
  propertyId?: string | null
): Promise<{ lines: PostedLine[]; provisioned: boolean }> {
  try {
    let q = db
      .from("ledger_journal_lines")
      .select(
        "account_id, debit_pence, credit_pence, property_id, ledger_accounts!inner(code, type), ledger_journal_entries!inner(posted, date, workspace_id)"
      )
      .eq("workspace_id", workspaceId)
      .eq("ledger_journal_entries.posted", true)
      .gte("ledger_journal_entries.date", fromDate)
      .lte("ledger_journal_entries.date", toDate)
    if (propertyId) q = q.eq("property_id", propertyId)
    const { data, error } = await q
    if (error) {
      if (isNotProvisioned(error)) return { lines: [], provisioned: false }
      throw error
    }
    const lines = ((data as unknown[]) ?? []).map((r) => {
      const row = r as {
        account_id: string
        debit_pence: number
        credit_pence: number
        property_id: string | null
        ledger_accounts: { code: string; type: string }
      }
      return {
        account_id: row.account_id,
        debit_pence: row.debit_pence,
        credit_pence: row.credit_pence,
        property_id: row.property_id,
        code: row.ledger_accounts?.code ?? "",
        type: row.ledger_accounts?.type ?? "",
      }
    })
    return { lines, provisioned: true }
  } catch (err) {
    if (isNotProvisioned(err)) return { lines: [], provisioned: false }
    throw err
  }
}

const INCOME_CODES = new Set<string>([
  ACCT.RENTAL_INCOME,
  MONEY_ACCT.BOOKING_REVENUE,
  "4100",
  "4200",
])
const FEE_CODES = new Set<string>([MONEY_ACCT.COMMISSION_INCOME, ACCT.MGMT_FEES, MONEY_ACCT.PROCESSING_FEES])
const DEPOSIT_CODES = new Set<string>([MONEY_ACCT.TENANT_DEPOSITS, MONEY_ACCT.DAMAGE_HOLDS, MONEY_ACCT.DEPOSITS_PAYABLE])

/**
 * buildOwnerStatement — aggregate posted lines into the owner statement. Income
 * is the credit balance on income accounts; expenses the debit on expense
 * accounts; management fee/commission shown separately; deposits movement net.
 */
export async function buildOwnerStatement(
  db: DB,
  args: { workspaceId: string; fromDate: string; toDate: string; propertyId?: string | null }
): Promise<OwnerStatement> {
  const { lines, provisioned } = await fetchPostedLines(db, args.workspaceId, args.fromDate, args.toDate, args.propertyId)

  const byCode = new Map<string, { code: string; type: string; net: number }>()
  for (const l of lines) {
    const cur = byCode.get(l.code) ?? { code: l.code, type: l.type, net: 0 }
    // Credit-normal (income/liability) → credit positive; debit-normal → debit positive.
    const creditNormal = l.type === "income" || l.type === "liability" || l.type === "equity"
    cur.net += creditNormal ? l.credit_pence - l.debit_pence : l.debit_pence - l.credit_pence
    byCode.set(l.code, cur)
  }

  let grossCollected = 0
  let fees = 0
  let expenses = 0
  const out: OwnerStatementLine[] = []

  for (const { code, type, net } of byCode.values()) {
    if (INCOME_CODES.has(code)) {
      grossCollected += net
      out.push({ label: labelFor(code), code, amountPence: net, kind: "income" })
    } else if (FEE_CODES.has(code)) {
      fees += net
      out.push({ label: labelFor(code), code, amountPence: net, kind: "fee" })
    } else if (DEPOSIT_CODES.has(code)) {
      out.push({ label: labelFor(code), code, amountPence: net, kind: "deposit" })
    } else if (type === "expense") {
      expenses += net
      out.push({ label: labelFor(code), code, amountPence: net, kind: "expense" })
    }
  }

  const netDue = grossCollected - fees - expenses
  out.push({ label: "Net due to owner", code: "—", amountPence: netDue, kind: "net" })

  return {
    workspaceId: args.workspaceId,
    propertyId: args.propertyId ?? null,
    fromDate: args.fromDate,
    toDate: args.toDate,
    lines: out.sort((a, b) => a.code.localeCompare(b.code)),
    grossCollectedPence: grossCollected,
    feesPence: fees,
    expensesPence: expenses,
    netDuePence: netDue,
    provisioned,
  }
}

function labelFor(code: string): string {
  const m: Record<string, string> = {
    [ACCT.RENTAL_INCOME]: "Rental income",
    [MONEY_ACCT.BOOKING_REVENUE]: "Booking revenue",
    "4100": "Management fee income",
    "4200": "Other property income",
    [MONEY_ACCT.COMMISSION_INCOME]: "Marketplace commission",
    [ACCT.MGMT_FEES]: "Management fees",
    [MONEY_ACCT.PROCESSING_FEES]: "Processing fees",
    [MONEY_ACCT.TENANT_DEPOSITS]: "Tenant deposits held",
    [MONEY_ACCT.DAMAGE_HOLDS]: "Damage / security holds",
    [MONEY_ACCT.DEPOSITS_PAYABLE]: "Deposits payable",
  }
  return m[code] ?? `Account ${code}`
}
