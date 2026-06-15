"use client"

// ===========================================================================
// MTD for Income Tax (ITSA) — quarterly period + obligation computation.
//
// HMRC MTD ITSA uses standard quarterly update periods aligned to the tax year
// (6 Apr – 5 Apr). These are the four standard periods. We compute each period's
// income and (allowable) expenses from the LIVE ledger sources so the figures a
// landlord would *prepare* are real — actual submission stays gated behind a
// real HMRC OAuth connection (we never fabricate a submission or an obligation
// status returned by HMRC).
// ===========================================================================

import { createClient } from "@/lib/supabase/client"

const MISSING = new Set(["42P01", "PGRST205", "PGRST116"])
function isMissing(e: { code?: string } | null | undefined): boolean {
  return !!e?.code && MISSING.has(e.code)
}

export interface MtdPeriod {
  key: string
  label: string
  start: string // ISO date (inclusive)
  end: string   // ISO date (inclusive)
  income: number
  expenses: number
  net: number
  dueDate: string // HMRC quarterly update deadline
  status: "open" | "current" | "overdue" | "future"
}

/** UK tax year that the date falls into (year of the 6 Apr start). */
export function taxYearStartFor(d: Date): number {
  const y = d.getUTCFullYear()
  // Before 6 Apr → belongs to previous tax year.
  const aprilSix = new Date(Date.UTC(y, 3, 6))
  return d < aprilSix ? y - 1 : y
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** The four standard MTD ITSA quarterly periods for a given tax-year start year. */
export function standardPeriods(taxYearStart: number): Omit<MtdPeriod, "income" | "expenses" | "net" | "status">[] {
  // Tax year: 6 Apr {start} – 5 Apr {start+1}. Quarterly deadlines are the 7th of
  // the month following the quarter end (HMRC standard quarterly update dates).
  return [
    { key: `${taxYearStart}-Q1`, label: "Q1 · 6 Apr – 5 Jul", start: iso(new Date(Date.UTC(taxYearStart, 3, 6))),  end: iso(new Date(Date.UTC(taxYearStart, 6, 5))),  dueDate: iso(new Date(Date.UTC(taxYearStart, 7, 7))) },
    { key: `${taxYearStart}-Q2`, label: "Q2 · 6 Jul – 5 Oct", start: iso(new Date(Date.UTC(taxYearStart, 6, 6))),  end: iso(new Date(Date.UTC(taxYearStart, 9, 5))),  dueDate: iso(new Date(Date.UTC(taxYearStart, 10, 7))) },
    { key: `${taxYearStart}-Q3`, label: "Q3 · 6 Oct – 5 Jan", start: iso(new Date(Date.UTC(taxYearStart, 9, 6))),  end: iso(new Date(Date.UTC(taxYearStart + 1, 0, 5))), dueDate: iso(new Date(Date.UTC(taxYearStart + 1, 1, 7))) },
    { key: `${taxYearStart}-Q4`, label: "Q4 · 6 Jan – 5 Apr", start: iso(new Date(Date.UTC(taxYearStart + 1, 0, 6))), end: iso(new Date(Date.UTC(taxYearStart + 1, 3, 5))), dueDate: iso(new Date(Date.UTC(taxYearStart + 1, 4, 7))) },
  ]
}

function statusFor(start: string, end: string, due: string, today: string): MtdPeriod["status"] {
  if (today < start) return "future"
  if (today >= start && today <= end) return "current"
  // Period has ended.
  if (today > due) return "overdue"
  return "open"
}

export interface MtdComputation {
  taxYearStart: number
  taxYearLabel: string
  periods: MtdPeriod[]
  totalIncome: number
  totalExpenses: number
  totalNet: number
  /** True when no live ledger source was readable (tables missing/empty). */
  noData: boolean
}

/**
 * Computes quarterly income/expenses for the active tax year from live tables:
 *   income   = customer (outbound) invoices, by issue_date
 *   expenses = expense_records (by date) + supplier bills (by issue_date)
 * All workspace-scoped. 42P01-safe (missing tables contribute zero).
 */
export async function computeMtd(workspaceId: string, taxYearStart?: number): Promise<MtdComputation> {
  const supabase = createClient()
  const today = iso(new Date())
  const tyStart = taxYearStart ?? taxYearStartFor(new Date())
  const periods = standardPeriods(tyStart)
  const yearStart = periods[0].start
  const yearEnd = periods[3].end

  const incomeByPeriod = new Array(4).fill(0)
  const expenseByPeriod = new Array(4).fill(0)
  let anyData = false

  function bucket(dateStr: string | null): number {
    if (!dateStr) return -1
    for (let i = 0; i < periods.length; i++) {
      if (dateStr >= periods[i].start && dateStr <= periods[i].end) return i
    }
    return -1
  }

  // Income — outbound invoices (exclude cancelled). Use total, by issue_date.
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("total, issue_date, invoice_type, status")
      .eq("workspace_id", workspaceId)
      .gte("issue_date", yearStart)
      .lte("issue_date", yearEnd)
    if (!error && data) {
      anyData = true
      for (const r of data as Record<string, unknown>[]) {
        if (r.invoice_type === "supplier") continue // supplier invoices are not income
        if (r.status === "cancelled") continue
        const i = bucket(r.issue_date as string)
        if (i >= 0) incomeByPeriod[i] += Number(r.total ?? 0)
      }
    } else if (error && !isMissing(error)) {
      throw error
    }
  } catch { /* income source unreadable — contributes zero */ }

  // Expenses — expense_records (by date).
  try {
    const { data, error } = await supabase
      .from("expense_records")
      .select("amount, date, status")
      .eq("workspace_id", workspaceId)
      .gte("date", yearStart)
      .lte("date", yearEnd)
    if (!error && data) {
      anyData = true
      for (const r of data as Record<string, unknown>[]) {
        const i = bucket(r.date as string)
        if (i >= 0) expenseByPeriod[i] += Number(r.amount ?? 0)
      }
    } else if (error && !isMissing(error)) {
      throw error
    }
  } catch { /* expense source unreadable — contributes zero */ }

  // Expenses — supplier bills (by issue_date).
  try {
    const { data, error } = await supabase
      .from("bills")
      .select("total, issue_date, status")
      .eq("workspace_id", workspaceId)
      .gte("issue_date", yearStart)
      .lte("issue_date", yearEnd)
    if (!error && data) {
      anyData = true
      for (const r of data as Record<string, unknown>[]) {
        const i = bucket(r.issue_date as string)
        if (i >= 0) expenseByPeriod[i] += Number(r.total ?? 0)
      }
    } else if (error && !isMissing(error)) {
      throw error
    }
  } catch { /* bills source unreadable — contributes zero */ }

  const out: MtdPeriod[] = periods.map((p, i) => {
    const income = Math.round(incomeByPeriod[i] * 100) / 100
    const expenses = Math.round(expenseByPeriod[i] * 100) / 100
    return {
      ...p,
      income,
      expenses,
      net: Math.round((income - expenses) * 100) / 100,
      status: statusFor(p.start, p.end, p.dueDate, today),
    }
  })

  const totalIncome = Math.round(out.reduce((s, p) => s + p.income, 0) * 100) / 100
  const totalExpenses = Math.round(out.reduce((s, p) => s + p.expenses, 0) * 100) / 100

  return {
    taxYearStart: tyStart,
    taxYearLabel: `${tyStart}/${String((tyStart + 1) % 100).padStart(2, "0")}`,
    periods: out,
    totalIncome,
    totalExpenses,
    totalNet: Math.round((totalIncome - totalExpenses) * 100) / 100,
    noData: !anyData,
  }
}

export function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export function fmtDate(d: string): string {
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
