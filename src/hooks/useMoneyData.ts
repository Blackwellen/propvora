'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────

export type MoneyStatus = 'received' | 'expected' | 'overdue' | 'planned' | 'reconciled' | 'cancelled'
export type ExpenseStatus = 'paid' | 'planned' | 'overdue' | 'cancelled'
export type CostBehaviour = 'fixed' | 'variable' | 'capital_reno'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void'
export type InvoiceType = 'rent' | 'service_charge' | 'one_off' | 'deposit' | 'other'
export type BillApprovalStatus = 'pending_review' | 'approved' | 'rejected'
export type BillPaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'scheduled'
export type ArrearsSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ArrearsStatus = 'open' | 'being_chased' | 'payment_plan' | 'resolved' | 'written_off'
export type DepositStatus = 'expected' | 'received' | 'protected' | 'return_due' | 'returned' | 'disputed'
export type ForecastScenario = 'base' | 'optimistic' | 'pessimistic'
export type TransactionStatus = 'unmatched' | 'matched' | 'ignored' | 'posted'
export type ActivityEventType = string

// ─────────────────────────────────────────────
// Row interfaces
// ─────────────────────────────────────────────

export interface MoneyIncomeRow {
  id: string
  workspace_id: string
  property_id: string | null
  income_type: string
  amount: number
  expected_date: string
  received_date: string | null
  status: MoneyStatus
  description: string | null
  tenant_id: string | null
  tenancy_id: string | null
  created_at: string
  updated_at: string
}

export interface MoneyExpenseRow {
  id: string
  workspace_id: string
  property_id: string | null
  expense_type: string
  amount: number
  due_date: string
  paid_date: string | null
  status: ExpenseStatus
  cost_behaviour: CostBehaviour | null
  supplier_id: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface MoneyInvoiceRow {
  id: string
  workspace_id: string
  property_id: string | null
  invoice_type: InvoiceType
  status: InvoiceStatus
  amount: number
  paid_amount: number | null
  issue_date: string
  due_date: string
  paid_at: string | null
  contact_id: string | null
  tenancy_id: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface MoneyBillRow {
  id: string
  workspace_id: string
  property_id: string | null
  supplier_id: string | null
  amount: number
  due_date: string
  approval_status: BillApprovalStatus
  payment_status: BillPaymentStatus
  description: string | null
  reference: string | null
  paid_at: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface MoneyArrearsRow {
  id: string
  workspace_id: string
  property_id: string | null
  tenant_id: string | null
  tenancy_id: string | null
  amount_owed: number
  amount_paid: number
  status: ArrearsStatus
  severity: ArrearsSeverity
  last_chased_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MoneyDepositRow {
  id: string
  workspace_id: string
  property_id: string | null
  tenant_id: string | null
  tenancy_id: string | null
  amount: number
  status: DepositStatus
  scheme_reference: string | null
  protected_at: string | null
  return_due_date: string | null
  returned_at: string | null
  dispute_reason: string | null
  created_at: string
  updated_at: string
}

export interface MoneyForecastRow {
  id: string
  workspace_id: string
  property_id: string | null
  scenario: ForecastScenario
  period_start: string
  period_end: string
  projected_income: number
  projected_expenses: number
  projected_net: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MoneyTransactionRow {
  id: string
  workspace_id: string
  import_id: string | null
  date: string
  description: string
  amount: number
  status: TransactionStatus
  matched_to_type: string | null
  matched_to_id: string | null
  created_at: string
  updated_at: string
}

export interface MoneyReconciliationImportRow {
  id: string
  workspace_id: string
  filename: string
  imported_at: string
  row_count: number
  matched_count: number
  unmatched_count: number
  status: string
}

export interface MoneyReportRow {
  id: string
  workspace_id: string
  report_type: string
  period_start: string
  period_end: string
  generated_at: string
  file_url: string | null
  parameters: Record<string, unknown>
}

export interface MoneyScheduledReportRow {
  id: string
  workspace_id: string
  report_type: string
  frequency: string
  next_run_at: string
  enabled: boolean
  created_at: string
}

export interface MoneyActivityRow {
  id: string
  workspace_id: string
  event_type: ActivityEventType
  entity_type: string
  entity_id: string
  description: string
  performed_by: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface PaymentSettingsRow {
  id: string
  workspace_id: string
  bank_account_name: string | null
  bank_account_number: string | null
  bank_sort_code: string | null
  payment_reference_prefix: string | null
  auto_reconcile: boolean
  late_payment_fee_pct: number | null
  updated_at: string
}

// ─────────────────────────────────────────────
// Insert / update payload types
// ─────────────────────────────────────────────

export type InsertMoneyIncome = Omit<MoneyIncomeRow, 'id' | 'created_at' | 'updated_at'>
export type InsertMoneyExpense = Omit<MoneyExpenseRow, 'id' | 'created_at' | 'updated_at'>
export type InsertMoneyInvoice = Omit<MoneyInvoiceRow, 'id' | 'created_at' | 'updated_at'>
export type InsertMoneyBill = Omit<MoneyBillRow, 'id' | 'created_at' | 'updated_at'>

// ─────────────────────────────────────────────
// Summary return types
// ─────────────────────────────────────────────

export interface IncomeSummary {
  totalReceived: number
  expected: number
  overdue: number
  planned: number
  reconciled: number
}

export interface ExpensesSummary {
  totalPaid: number
  planned: number
  fixedCosts: number
  variableCosts: number
  capitalReno: number
}

export interface InvoicesSummary {
  totalOutstanding: number
  dueThisWeek: number
  overdue: number
  paidThisMonth: number
  collectionRate: number
}

export interface BillsSummary {
  awaitingReview: number
  approvedToPay: number
  overdue: number
  paidThisMonth: number
  supplierPaymentQueue: number
}

export interface ArrearsSummary {
  totalArrears: number
  openCases: number
  beingChased: number
  onPaymentPlans: number
  resolvedThisMonth: number
}

export interface DepositsSummary {
  totalTracked: number
  protected: number
  expected: number
  returnDue: number
  disputed: number
}

export interface MoneyOverview {
  income: IncomeSummary
  expenses: ExpensesSummary
  invoices: InvoicesSummary
  bills: BillsSummary
  arrears: ArrearsSummary
  deposits: DepositsSummary
}

// ─────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────

const QK = {
  income: (wsId: string | undefined, filters?: object) => ['money_income', wsId, filters] as const,
  incomeSummary: (wsId: string | undefined) => ['money_income_summary', wsId] as const,
  expenses: (wsId: string | undefined, filters?: object) => ['money_expenses', wsId, filters] as const,
  expensesSummary: (wsId: string | undefined) => ['money_expenses_summary', wsId] as const,
  invoices: (wsId: string | undefined, filters?: object) => ['money_invoices', wsId, filters] as const,
  invoicesSummary: (wsId: string | undefined) => ['money_invoices_summary', wsId] as const,
  bills: (wsId: string | undefined, filters?: object) => ['money_bills', wsId, filters] as const,
  billsSummary: (wsId: string | undefined) => ['money_bills_summary', wsId] as const,
  arrears: (wsId: string | undefined, filters?: object) => ['money_arrears', wsId, filters] as const,
  arrearsSummary: (wsId: string | undefined) => ['money_arrears_summary', wsId] as const,
  deposits: (wsId: string | undefined, filters?: object) => ['money_deposits', wsId, filters] as const,
  depositsSummary: (wsId: string | undefined) => ['money_deposits_summary', wsId] as const,
  forecasts: (wsId: string | undefined, filters?: object) => ['money_forecasts', wsId, filters] as const,
  transactions: (wsId: string | undefined, filters?: object) => ['money_transactions', wsId, filters] as const,
  reconciliationImports: (wsId: string | undefined) => ['money_reconciliation_imports', wsId] as const,
  reports: (wsId: string | undefined) => ['money_reports', wsId] as const,
  scheduledReports: (wsId: string | undefined) => ['money_scheduled_reports', wsId] as const,
  activity: (wsId: string | undefined, filters?: object) => ['money_activity', wsId, filters] as const,
  paymentSettings: (wsId: string | undefined) => ['payment_settings', wsId] as const,
  overview: (wsId: string | undefined) => ['money_overview', wsId] as const,
}

// ─────────────────────────────────────────────
// INCOME
// ─────────────────────────────────────────────

interface IncomeFilters {
  status?: MoneyStatus
  property_id?: string
  income_type?: string
  date_from?: string
  date_to?: string
}

export function useMoneyIncome(
  workspaceId: string | undefined,
  filters?: IncomeFilters
) {
  const supabase = createClient()

  return useQuery<MoneyIncomeRow[]>({
    queryKey: QK.income(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('money_income')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('expected_date', { ascending: false })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.income_type) q = q.eq('income_type', filters.income_type)
      if (filters?.date_from) q = q.gte('expected_date', filters.date_from)
      if (filters?.date_to) q = q.lte('expected_date', filters.date_to)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMoneyIncomeSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<IncomeSummary>({
    queryKey: QK.incomeSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_income')
        .select('status, amount')
        .eq('workspace_id', workspaceId!)

      if (error) throw error
      const rows = data ?? []

      const sum = (status: MoneyStatus) =>
        rows.filter((r) => r.status === status).reduce((acc, r) => acc + (r.amount ?? 0), 0)

      return {
        totalReceived: sum('received'),
        expected: sum('expected'),
        overdue: sum('overdue'),
        planned: sum('planned'),
        reconciled: sum('reconciled'),
      }
    },
  })
}

export function useCreateMoneyIncome(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyIncomeRow, Error, InsertMoneyIncome>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('money_income')
        .insert(payload)
        .select()
        .single()
      if (error) throw error

      await supabase.from('money_activity').insert({
        workspace_id: workspaceId,
        event_type: 'income_created',
        entity_type: 'money_income',
        entity_id: data.id,
        description: `Income record created for £${payload.amount}`,
      })

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.income(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.incomeSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.activity(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────

interface ExpensesFilters {
  status?: ExpenseStatus
  property_id?: string
  expense_type?: string
  cost_behaviour?: CostBehaviour
}

export function useMoneyExpenses(
  workspaceId: string | undefined,
  filters?: ExpensesFilters
) {
  const supabase = createClient()

  return useQuery<MoneyExpenseRow[]>({
    queryKey: QK.expenses(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('money_expenses')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('due_date', { ascending: false })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.expense_type) q = q.eq('expense_type', filters.expense_type)
      if (filters?.cost_behaviour) q = q.eq('cost_behaviour', filters.cost_behaviour)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMoneyExpensesSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<ExpensesSummary>({
    queryKey: QK.expensesSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_expenses')
        .select('status, cost_behaviour, amount')
        .eq('workspace_id', workspaceId!)

      if (error) throw error
      const rows = data ?? []

      const sumBy = (key: keyof typeof rows[0], val: string) =>
        rows.filter((r) => r[key] === val).reduce((acc, r) => acc + (r.amount ?? 0), 0)

      return {
        totalPaid: sumBy('status', 'paid'),
        planned: sumBy('status', 'planned'),
        fixedCosts: sumBy('cost_behaviour', 'fixed'),
        variableCosts: sumBy('cost_behaviour', 'variable'),
        capitalReno: sumBy('cost_behaviour', 'capital_reno'),
      }
    },
  })
}

export function useCreateMoneyExpense(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyExpenseRow, Error, InsertMoneyExpense>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('money_expenses')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.expenses(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.expensesSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────

interface InvoicesFilters {
  status?: InvoiceStatus
  property_id?: string
  invoice_type?: InvoiceType
}

export function useMoneyInvoices(
  workspaceId: string | undefined,
  filters?: InvoicesFilters
) {
  const supabase = createClient()

  return useQuery<MoneyInvoiceRow[]>({
    queryKey: QK.invoices(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('money_invoices')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('issue_date', { ascending: false })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.invoice_type) q = q.eq('invoice_type', filters.invoice_type)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMoneyInvoice(workspaceId: string | undefined, invoiceId: string | undefined) {
  const supabase = createClient()
  return useQuery<MoneyInvoiceRow | null>({
    queryKey: ['money_invoice', workspaceId, invoiceId],
    enabled: !!workspaceId && !!invoiceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_invoices')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('id', invoiceId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useMoneyInvoicesSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<InvoicesSummary>({
    queryKey: QK.invoicesSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_invoices')
        .select('status, amount, paid_amount, due_date, paid_at')
        .eq('workspace_id', workspaceId!)

      if (error) throw error
      const rows = data ?? []

      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const outstanding = rows
        .filter((r) => r.status !== 'paid' && r.status !== 'cancelled' && r.status !== 'void')
        .reduce((acc, r) => acc + (r.amount ?? 0) - (r.paid_amount ?? 0), 0)

      const dueThisWeek = rows
        .filter((r) => {
          const d = new Date(r.due_date)
          return r.status !== 'paid' && d >= now && d <= weekFromNow
        })
        .reduce((acc, r) => acc + ((r.amount ?? 0) - (r.paid_amount ?? 0)), 0)

      const overdue = rows
        .filter((r) => r.status === 'overdue')
        .reduce((acc, r) => acc + ((r.amount ?? 0) - (r.paid_amount ?? 0)), 0)

      const paidThisMonth = rows
        .filter((r) => r.status === 'paid' && r.paid_at && r.paid_at >= startOfMonth)
        .reduce((acc, r) => acc + (r.paid_amount ?? r.amount ?? 0), 0)

      const totalIssued = rows.reduce((acc, r) => acc + (r.amount ?? 0), 0)
      const totalCollected = rows
        .filter((r) => r.status === 'paid')
        .reduce((acc, r) => acc + (r.paid_amount ?? r.amount ?? 0), 0)
      const collectionRate = totalIssued > 0 ? Math.round((totalCollected / totalIssued) * 100) : 0

      return { totalOutstanding: outstanding, dueThisWeek, overdue, paidThisMonth, collectionRate }
    },
  })
}

export function useCreateMoneyInvoice(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyInvoiceRow, Error, InsertMoneyInvoice>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('money_invoices')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.invoices(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.invoicesSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

export function useUpdateInvoiceStatus(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyInvoiceRow, Error, { id: string; status: InvoiceStatus; paid_at?: string; paid_amount?: number }>({
    mutationFn: async ({ id, status, paid_at, paid_amount }) => {
      const { data, error } = await supabase
        .from('money_invoices')
        .update({ status, paid_at: paid_at ?? null, paid_amount: paid_amount ?? null })
        .eq('id', id)
        .eq('workspace_id', workspaceId!)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.invoices(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.invoicesSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// BILLS
// ─────────────────────────────────────────────

interface BillsFilters {
  approval_status?: BillApprovalStatus
  payment_status?: BillPaymentStatus
  property_id?: string
  supplier_id?: string
}

export function useMoneyBills(
  workspaceId: string | undefined,
  filters?: BillsFilters
) {
  const supabase = createClient()

  return useQuery<MoneyBillRow[]>({
    queryKey: QK.bills(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('money_bills')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('due_date', { ascending: true })

      if (filters?.approval_status) q = q.eq('approval_status', filters.approval_status)
      if (filters?.payment_status) q = q.eq('payment_status', filters.payment_status)
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.supplier_id) q = q.eq('supplier_id', filters.supplier_id)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMoneyBillsSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<BillsSummary>({
    queryKey: QK.billsSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_bills')
        .select('approval_status, payment_status, amount, paid_at')
        .eq('workspace_id', workspaceId!)

      if (error) throw error
      const rows = data ?? []

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      return {
        awaitingReview: rows.filter((r) => r.approval_status === 'pending_review').length,
        approvedToPay: rows.filter((r) => r.approval_status === 'approved' && r.payment_status === 'unpaid').length,
        overdue: rows.filter((r) => r.payment_status === 'overdue').length,
        paidThisMonth: rows.filter((r) => r.payment_status === 'paid' && r.paid_at && new Date(r.paid_at) >= startOfMonth).length,
        supplierPaymentQueue: rows
          .filter((r) => r.approval_status === 'approved' && r.payment_status === 'unpaid')
          .reduce((acc, r) => acc + (r.amount ?? 0), 0),
      }
    },
  })
}

export function useApproveBill(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyBillRow, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const { data, error } = await supabase
        .from('money_bills')
        .update({ approval_status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId!)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.bills(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.billsSummary(workspaceId) })
    },
  })
}

export function useMarkBillPaid(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyBillRow, Error, { id: string; paid_at?: string }>({
    mutationFn: async ({ id, paid_at }) => {
      const { data, error } = await supabase
        .from('money_bills')
        .update({ payment_status: 'paid', paid_at: paid_at ?? new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId!)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.bills(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.billsSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

export function useCreateMoneyBill(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyBillRow, Error, InsertMoneyBill>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('money_bills')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.bills(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.billsSummary(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// ARREARS
// ─────────────────────────────────────────────

interface ArrearsFilters {
  status?: ArrearsStatus
  severity?: ArrearsSeverity
  property_id?: string
}

export function useMoneyArrears(
  workspaceId: string | undefined,
  filters?: ArrearsFilters
) {
  const supabase = createClient()

  return useQuery<MoneyArrearsRow[]>({
    queryKey: QK.arrears(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('money_arrears')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('amount_owed', { ascending: false })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.severity) q = q.eq('severity', filters.severity)
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMoneyArrearsSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<ArrearsSummary>({
    queryKey: QK.arrearsSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_arrears')
        .select('status, amount_owed, amount_paid, updated_at')
        .eq('workspace_id', workspaceId!)

      if (error) throw error
      const rows = data ?? []

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      return {
        totalArrears: rows.reduce((acc, r) => acc + ((r.amount_owed ?? 0) - (r.amount_paid ?? 0)), 0),
        openCases: rows.filter((r) => r.status === 'open').length,
        beingChased: rows.filter((r) => r.status === 'being_chased').length,
        onPaymentPlans: rows.filter((r) => r.status === 'payment_plan').length,
        resolvedThisMonth: rows.filter((r) => r.status === 'resolved' && r.updated_at && new Date(r.updated_at) >= startOfMonth).length,
      }
    },
  })
}

// ─────────────────────────────────────────────
// DEPOSITS
// ─────────────────────────────────────────────

interface DepositsFilters {
  status?: DepositStatus
  property_id?: string
}

export function useMoneyDeposits(
  workspaceId: string | undefined,
  filters?: DepositsFilters
) {
  const supabase = createClient()

  return useQuery<MoneyDepositRow[]>({
    queryKey: QK.deposits(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('money_deposits')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMoneyDepositsSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<DepositsSummary>({
    queryKey: QK.depositsSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_deposits')
        .select('status, amount')
        .eq('workspace_id', workspaceId!)

      if (error) throw error
      const rows = data ?? []

      const sumByStatus = (s: DepositStatus) =>
        rows.filter((r) => r.status === s).reduce((acc, r) => acc + (r.amount ?? 0), 0)

      return {
        totalTracked: rows.reduce((acc, r) => acc + (r.amount ?? 0), 0),
        protected: sumByStatus('protected'),
        expected: sumByStatus('expected'),
        returnDue: sumByStatus('return_due'),
        disputed: sumByStatus('disputed'),
      }
    },
  })
}

export interface InsertMoneyDeposit {
  workspace_id: string
  tenant_name: string
  property_address: string
  amount: number
  received_date: string
  status: DepositStatus
  scheme: string | null
}

export function useCreateMoneyDeposit(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyDepositRow, Error, InsertMoneyDeposit>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('money_deposits')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.deposits(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.depositsSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// FORECASTS
// ─────────────────────────────────────────────

interface ForecastsFilters {
  property_id?: string
  scenario?: ForecastScenario
  period_start?: string
  period_end?: string
}

export function useMoneyForecasts(
  workspaceId: string | undefined,
  filters?: ForecastsFilters
) {
  const supabase = createClient()

  return useQuery<MoneyForecastRow[]>({
    queryKey: QK.forecasts(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase
        .from('money_forecasts')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('period_start', { ascending: true })

      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.scenario) q = q.eq('scenario', filters.scenario)
      if (filters?.period_start) q = q.gte('period_start', filters.period_start)
      if (filters?.period_end) q = q.lte('period_end', filters.period_end)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

// ─────────────────────────────────────────────
// RECONCILIATION
// ─────────────────────────────────────────────

interface TransactionFilters {
  status?: TransactionStatus
  import_id?: string
}

export function useMoneyTransactions(
  workspaceId: string | undefined,
  filters?: TransactionFilters
) {
  const supabase = createClient()

  return useQuery<MoneyTransactionRow[]>({
    queryKey: QK.transactions(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 15_000,
    queryFn: async () => {
      let q = supabase
        .from('money_transactions')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('date', { ascending: false })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.import_id) q = q.eq('import_id', filters.import_id)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMoneyReconciliationImports(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<MoneyReconciliationImportRow[]>({
    queryKey: QK.reconciliationImports(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_reconciliation_imports')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('imported_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

export function useMatchTransaction(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<
    MoneyTransactionRow,
    Error,
    { id: string; matched_to_type: string; matched_to_id: string }
  >({
    mutationFn: async ({ id, matched_to_type, matched_to_id }) => {
      const { data, error } = await supabase
        .from('money_transactions')
        .update({ status: 'matched', matched_to_type, matched_to_id })
        .eq('id', id)
        .eq('workspace_id', workspaceId!)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.transactions(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────

export function useMoneyReports(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<MoneyReportRow[]>({
    queryKey: QK.reports(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_reports')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('generated_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

export function useMoneyScheduledReports(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<MoneyScheduledReportRow[]>({
    queryKey: QK.scheduledReports(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_scheduled_reports')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('next_run_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

// ─────────────────────────────────────────────
// ACTIVITY
// ─────────────────────────────────────────────

interface ActivityFilters {
  event_type?: ActivityEventType
  entity_type?: string
  limit?: number
}

export function useMoneyActivity(
  workspaceId: string | undefined,
  filters?: ActivityFilters
) {
  const supabase = createClient()

  return useQuery<MoneyActivityRow[]>({
    queryKey: QK.activity(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 15_000,
    queryFn: async () => {
      let q = supabase
        .from('money_activity')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (filters?.event_type) q = q.eq('event_type', filters.event_type)
      if (filters?.entity_type) q = q.eq('entity_type', filters.entity_type)
      if (filters?.limit) q = q.limit(filters.limit)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

// ─────────────────────────────────────────────
// PAYMENT SETTINGS
// ─────────────────────────────────────────────

export function usePaymentSettings(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<PaymentSettingsRow | null>({
    queryKey: QK.paymentSettings(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })
}

export function useUpdatePaymentSettings(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<
    PaymentSettingsRow,
    Error,
    Partial<Omit<PaymentSettingsRow, 'id' | 'workspace_id' | 'updated_at'>>
  >({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('payment_settings')
        .upsert({ ...payload, workspace_id: workspaceId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.paymentSettings(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// OVERVIEW AGGREGATE
// ─────────────────────────────────────────────

export function useMoneyOverview(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<MoneyOverview>({
    queryKey: QK.overview(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const [
        incomeRes,
        expensesRes,
        invoicesRes,
        billsRes,
        arrearsRes,
        depositsRes,
      ] = await Promise.all([
        supabase.from('money_income').select('status, amount').eq('workspace_id', workspaceId!),
        supabase.from('money_expenses').select('status, cost_behaviour, amount').eq('workspace_id', workspaceId!),
        supabase.from('money_invoices').select('status, amount, paid_amount, due_date, paid_at').eq('workspace_id', workspaceId!),
        supabase.from('money_bills').select('approval_status, payment_status, amount, paid_at').eq('workspace_id', workspaceId!),
        supabase.from('money_arrears').select('status, amount_owed, amount_paid, updated_at').eq('workspace_id', workspaceId!),
        supabase.from('money_deposits').select('status, amount').eq('workspace_id', workspaceId!),
      ])

      if (incomeRes.error) throw incomeRes.error
      if (expensesRes.error) throw expensesRes.error
      if (invoicesRes.error) throw invoicesRes.error
      if (billsRes.error) throw billsRes.error
      if (arrearsRes.error) throw arrearsRes.error
      if (depositsRes.error) throw depositsRes.error

      const incomeRows = incomeRes.data ?? []
      const expensesRows = expensesRes.data ?? []
      const invoicesRows = invoicesRes.data ?? []
      const billsRows = billsRes.data ?? []
      const arrearsRows = arrearsRes.data ?? []
      const depositsRows = depositsRes.data ?? []

      const sumIncomeBy = (s: MoneyStatus) =>
        incomeRows.filter((r) => r.status === s).reduce((acc, r) => acc + (r.amount ?? 0), 0)

      const sumExpensesBy = (key: 'status' | 'cost_behaviour', val: string) =>
        expensesRows.filter((r) => r[key] === val).reduce((acc, r) => acc + (r.amount ?? 0), 0)

      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)

      const invOutstanding = invoicesRows
        .filter((r) => r.status !== 'paid' && r.status !== 'cancelled' && r.status !== 'void')
        .reduce((acc, r) => acc + ((r.amount ?? 0) - (r.paid_amount ?? 0)), 0)

      const invDueThisWeek = invoicesRows
        .filter((r) => { const d = new Date(r.due_date); return r.status !== 'paid' && d >= now && d <= weekFromNow })
        .reduce((acc, r) => acc + ((r.amount ?? 0) - (r.paid_amount ?? 0)), 0)

      const invOverdue = invoicesRows
        .filter((r) => r.status === 'overdue')
        .reduce((acc, r) => acc + ((r.amount ?? 0) - (r.paid_amount ?? 0)), 0)

      const invPaidThisMonth = invoicesRows
        .filter((r) => r.status === 'paid' && r.paid_at && r.paid_at >= startOfMonth)
        .reduce((acc, r) => acc + (r.paid_amount ?? r.amount ?? 0), 0)

      const totalIssued = invoicesRows.reduce((acc, r) => acc + (r.amount ?? 0), 0)
      const totalCollected = invoicesRows
        .filter((r) => r.status === 'paid')
        .reduce((acc, r) => acc + (r.paid_amount ?? r.amount ?? 0), 0)
      const collectionRate = totalIssued > 0 ? Math.round((totalCollected / totalIssued) * 100) : 0

      const sumDepositsByStatus = (s: DepositStatus) =>
        depositsRows.filter((r) => r.status === s).reduce((acc, r) => acc + (r.amount ?? 0), 0)

      return {
        income: {
          totalReceived: sumIncomeBy('received'),
          expected: sumIncomeBy('expected'),
          overdue: sumIncomeBy('overdue'),
          planned: sumIncomeBy('planned'),
          reconciled: sumIncomeBy('reconciled'),
        },
        expenses: {
          totalPaid: sumExpensesBy('status', 'paid'),
          planned: sumExpensesBy('status', 'planned'),
          fixedCosts: sumExpensesBy('cost_behaviour', 'fixed'),
          variableCosts: sumExpensesBy('cost_behaviour', 'variable'),
          capitalReno: sumExpensesBy('cost_behaviour', 'capital_reno'),
        },
        invoices: {
          totalOutstanding: invOutstanding,
          dueThisWeek: invDueThisWeek,
          overdue: invOverdue,
          paidThisMonth: invPaidThisMonth,
          collectionRate,
        },
        bills: {
          awaitingReview: billsRows.filter((r) => r.approval_status === 'pending_review').length,
          approvedToPay: billsRows.filter((r) => r.approval_status === 'approved' && r.payment_status === 'unpaid').length,
          overdue: billsRows.filter((r) => r.payment_status === 'overdue').length,
          paidThisMonth: billsRows.filter((r) => r.payment_status === 'paid' && r.paid_at && new Date(r.paid_at) >= startOfMonthDate).length,
          supplierPaymentQueue: billsRows
            .filter((r) => r.approval_status === 'approved' && r.payment_status === 'unpaid')
            .reduce((acc, r) => acc + (r.amount ?? 0), 0),
        },
        arrears: {
          totalArrears: arrearsRows.reduce((acc, r) => acc + ((r.amount_owed ?? 0) - (r.amount_paid ?? 0)), 0),
          openCases: arrearsRows.filter((r) => r.status === 'open').length,
          beingChased: arrearsRows.filter((r) => r.status === 'being_chased').length,
          onPaymentPlans: arrearsRows.filter((r) => r.status === 'payment_plan').length,
          resolvedThisMonth: arrearsRows.filter((r) => r.status === 'resolved' && r.updated_at && new Date(r.updated_at) >= startOfMonthDate).length,
        },
        deposits: {
          totalTracked: depositsRows.reduce((acc, r) => acc + (r.amount ?? 0), 0),
          protected: sumDepositsByStatus('protected'),
          expected: sumDepositsByStatus('expected'),
          returnDue: sumDepositsByStatus('return_due'),
          disputed: sumDepositsByStatus('disputed'),
        },
      }
    },
  })
}
