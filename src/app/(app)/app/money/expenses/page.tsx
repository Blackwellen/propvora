"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  TrendingDown,
  Home,
  Clock,
  Wrench,
  Plus,
  Download,
  Search,
  ChevronDown,
  X,
  Paperclip,
  Filter,
  CalendarDays,
  Table2,
  LayoutGrid,
  Building,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav } from "@/components/money"
import MoneyKpiCard from "@/components/money/MoneyKpiCard"
import MoneyPageHeader from "@/components/money/MoneyPageHeader"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyExpenses, useCreateMoneyExpense, useMoneyExpensesSummary } from "@/hooks/useMoneyData"
import { createClient } from "@/lib/supabase/client"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { Trash2, CheckCircle } from "lucide-react"
import type { MoneyExpenseRow, InsertMoneyExpense } from "@/hooks/useMoneyData"

// ─── CSV export helper ────────────────────────────────────────────────────────

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
const gbp2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 })
function fmtGBP(n: number): string { return gbp.format(Number.isFinite(n) ? n : 0) }
function fmtGBP2(n: number): string { return gbp2.format(Number.isFinite(n) ? n : 0) }

const DONUT_COLORS = ["#8b5cf6", "#2563EB", "#f97316", "#06b6d4", "#ef4444", "#10b981", "#94a3b8"]

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseStatus = "paid" | "approved" | "due" | "planned" | "overdue"
type CostBehaviour = "Fixed" | "Variable" | "Capital"
type ViewMode = "table" | "cards" | "by-property"

interface ExpenseRow {
  id: string
  date: string
  expenseType: string
  typeColor: string
  costBehaviour: CostBehaviour
  propertyName: string
  propertyAddress: string
  supplierName: string
  supplierInitials: string
  description: string
  amount: string
  status: ExpenseStatus
  statusExtra?: string
  hasReceipt: boolean
}

interface AddExpenseForm {
  expense_type: string
  cost_behaviour: string
  supplier: string
  property: string
  amount: string
  date: string
  status: string
  description: string
  notes: string
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700" },
  approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  due: { label: "Due", className: "bg-red-100 text-red-700" },
  planned: { label: "Planned", className: "bg-amber-100 text-amber-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
}

const BEHAVIOUR_CONFIG: Record<CostBehaviour, { className: string }> = {
  Fixed: { className: "bg-emerald-100 text-emerald-700" },
  Variable: { className: "bg-amber-100 text-amber-700" },
  Capital: { className: "bg-violet-100 text-violet-700" },
}

interface DonutSeg { label: string; amount: string; pct: number; color: string }

const EXPENSE_TYPE_OPTIONS = [
  "Utilities",
  "Maintenance",
  "Management",
  "Insurance",
  "Cleaning",
  "Council Tax",
  "Repairs",
  "Internet",
  "Landscaping",
  "Safety",
  "Capital Expenditure",
  "Other",
]

const PROPERTIES_LIST = [
  "12 Maple Avenue",
  "7 Elm Close",
  "Riverside Lofts",
  "Oakwood House",
  "3 Bridge Street",
  "14 Birchwood Rd",
]

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function ExpenseDonut({ segments, total }: { segments: DonutSeg[]; total: number }) {
  const cx = 80
  const cy = 80
  const r = 58

  let cumPct = 0
  const segs = segments.map((seg) => {
    const start = cumPct
    cumPct += seg.pct
    const startAngle = (start / 100) * 360 - 90
    const endAngle = (cumPct / 100) * 360 - 90
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const large = seg.pct > 50 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    return { ...seg, d }
  })

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[160px]" aria-hidden="true">
      {total > 0 ? (
        segs.map((seg) => <path key={seg.label} d={seg.d} fill={seg.color} opacity="0.85" />)
      ) : (
        <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
      )}
      <circle cx={cx} cy={cy} r={r * 0.58} fill="white" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
        {fmtGBP(total)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="#94a3b8">
        Total
      </text>
    </svg>
  )
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────

function AddExpenseModal({ onClose, workspaceId }: { onClose: () => void; workspaceId?: string }) {
  const [form, setForm] = useState<AddExpenseForm>({
    expense_type: "",
    cost_behaviour: "",
    supplier: "",
    property: "",
    amount: "",
    date: "",
    status: "",
    description: "",
    notes: "",
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createExpense = useCreateMoneyExpense(workspaceId)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setReceiptFile(e.target.files?.[0] ?? null)
  }

  async function handleSave() {
    if (!form.amount || !form.expense_type) { setFormError("Expense type and amount are required"); return }
    if (!workspaceId) { setFormError("Workspace not loaded"); return }
    setSaving(true)
    setFormError(null)
    try {
      await createExpense.mutateAsync({
        workspace_id: workspaceId,
        expense_type: form.expense_type,
        amount: parseFloat(form.amount),
        due_date: form.date || new Date().toISOString().split("T")[0],
        paid_date: null,
        status: (form.status as InsertMoneyExpense["status"]) || "planned",
        cost_behaviour: (form.cost_behaviour as InsertMoneyExpense["cost_behaviour"]) || null,
        description: form.description || null,
        property_id: null,
        supplier_id: null,
      })
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
    void receiptFile // receipt upload requires storage integration
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">Add Expense</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Expense Type</label>
              <select name="expense_type" value={form.expense_type} onChange={handleChange}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select type…</option>
                {EXPENSE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Cost Behaviour</label>
              <select name="cost_behaviour" value={form.cost_behaviour} onChange={handleChange}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select…</option>
                <option value="Fixed">Fixed</option>
                <option value="Variable">Variable</option>
                <option value="Capital">Capital / Reno</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Supplier</label>
              <input name="supplier" type="text" value={form.supplier} onChange={handleChange}
                placeholder="Supplier name…"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Property</label>
              <select name="property" value={form.property} onChange={handleChange}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select property…</option>
                {PROPERTIES_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Amount (£)</label>
              <input name="amount" type="number" value={form.amount} onChange={handleChange}
                placeholder="0.00"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select status…</option>
              <option value="paid">Paid</option>
              <option value="approved">Approved</option>
              <option value="due">Due</option>
              <option value="planned">Planned</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Description</label>
            <input name="description" type="text" value={form.description} onChange={handleChange}
              placeholder="Brief description…"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              placeholder="Optional notes…"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Receipt</label>
            <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors">
              <Paperclip className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">
                {receiptFile ? receiptFile.name : "Attach receipt (PDF, JPG, PNG)"}
              </span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
            </label>
          </div>
        </div>
        {formError && <p className="text-xs text-red-500 px-6 pb-2">{formError}</p>}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70">
            {saving ? "Saving…" : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MoneyExpensesPage() {
  const { workspace } = useWorkspace()
  const { data: liveExpenses, isLoading } = useMoneyExpenses(workspace?.id)
  const { data: summary } = useMoneyExpensesSummary(workspace?.id)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const _sp = useSearchParams()
  useEffect(() => { if (_sp.get("new") === "1") setShowAddModal(true) }, [_sp])
  const [showAllRows, setShowAllRows] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }
  function isLiveExpense(id: string) { return !!liveExpenses && liveExpenses.some((r) => r.id === id) }

  async function deleteExpense(id: string) {
    if (isLiveExpense(id)) {
      const supabase = createClient()
      try {
        const { error } = await supabase.from("expense_records").delete().eq("id", id).eq("workspace_id", workspace?.id ?? "")
        if (error && error.code !== "42P01") throw error
      } catch { showToast("Could not delete expense"); return }
    }
    setHiddenIds((p) => new Set(p).add(id))
    showToast("Expense deleted")
  }

  async function markExpensePaid(id: string) {
    if (!isLiveExpense(id)) { showToast("Sample expense — actions persist once saved"); return }
    const supabase = createClient()
    try {
      // expense_records has no paid_date column; the status enum carries 'paid'.
      const { error } = await supabase.from("expense_records").update({ status: "paid" }).eq("id", id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      showToast(error?.code === "42P01" ? "Expenses table not provisioned yet" : "Marked as paid")
    } catch { showToast("Could not update expense") }
  }

  // Map live data to ExpenseRow display format — NO mock fallback (honest empty state)
  const EXPENSE_ROWS_LIVE: ExpenseRow[] = React.useMemo(() => {
    if (!liveExpenses) return []
    return liveExpenses.map((r: MoneyExpenseRow): ExpenseRow => ({
      id: r.id,
      date: r.due_date ? new Date(r.due_date).toLocaleDateString("en-GB") : "—",
      expenseType: r.expense_type,
      typeColor: "bg-blue-100 text-blue-700",
      costBehaviour: (r.cost_behaviour === "fixed" ? "Fixed" : r.cost_behaviour === "variable" ? "Variable" : r.cost_behaviour === "capital_reno" ? "Capital" : "Variable") as CostBehaviour,
      propertyName: r.property_id ?? "—",
      propertyAddress: "—",
      supplierName: r.supplier_id ?? "—",
      supplierInitials: "—",
      description: r.description ?? r.expense_type,
      amount: fmtGBP2(r.amount ?? 0),
      status: (r.status as ExpenseStatus) ?? "planned",
      hasReceipt: false,
    }))
  }, [liveExpenses])

  // Live "Cost Breakdown" donut by expense type
  const totalExpensesAll = React.useMemo(
    () => (liveExpenses ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0),
    [liveExpenses]
  )
  const donutSegments: DonutSeg[] = React.useMemo(() => {
    const byType = new Map<string, number>()
    for (const r of liveExpenses ?? []) {
      byType.set(r.expense_type, (byType.get(r.expense_type) ?? 0) + (r.amount ?? 0))
    }
    return [...byType.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount], i) => ({
        label,
        amount: fmtGBP2(amount),
        pct: totalExpensesAll > 0 ? Math.round((amount / totalExpensesAll) * 100) : 0,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      }))
  }, [liveExpenses, totalExpensesAll])

  const filtered = EXPENSE_ROWS_LIVE.filter((r) => !hiddenIds.has(r.id)).filter((r) =>
    searchQuery
      ? r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  )

  const visibleRows = showAllRows ? filtered : filtered.slice(0, 10)

  // Grouped breakdown per property for the "by-property" view.
  const byProperty = React.useMemo(() => {
    const map = new Map<string, { total: number; count: number; types: Map<string, number> }>()
    for (const r of filtered) {
      const key = r.propertyName || "Unassigned"
      const amount = Number(String(r.amount).replace(/[^0-9.-]/g, "")) || 0
      const cur = map.get(key) ?? { total: 0, count: 0, types: new Map<string, number>() }
      cur.total += amount
      cur.count++
      cur.types.set(r.expenseType, (cur.types.get(r.expenseType) ?? 0) + amount)
      map.set(key, cur)
    }
    const groups = [...map.entries()]
      .map(([property, v]) => ({
        property,
        total: v.total,
        count: v.count,
        topType: [...v.types.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      }))
      .sort((a, b) => b.total - a.total)
    const max = groups.reduce((m, g) => Math.max(m, g.total), 0)
    return { groups, max }
  }, [filtered])

  function handleExportCSV() {
    downloadCSV(
      filtered.map(r => ({
        date: r.date,
        type: r.expenseType,
        behaviour: r.costBehaviour,
        property: r.propertyName,
        supplier: r.supplierName,
        description: r.description,
        amount: r.amount,
        status: r.status,
      })),
      "expenses-export.csv"
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {showAddModal && <AddExpenseModal workspaceId={workspace?.id} onClose={() => setShowAddModal(false)} />}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <MoneyTabNav
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Expense
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        }
      />

      <DashboardContainer className="px-6 py-6 flex flex-col gap-6">
        <MoneyPageHeader
          breadcrumb="Expenses"
          title="Expenses"
          subtitle="Track, manage and optimise all property expenses in one place."
          actions={<></>}
        />

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MoneyKpiCard
            label="Total Paid"
            value={fmtGBP(summary?.totalPaid ?? 0)}
            icon={<TrendingDown className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <MoneyKpiCard
            label="Planned"
            value={fmtGBP(summary?.planned ?? 0)}
            icon={<CalendarDays className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MoneyKpiCard
            label="Fixed Costs"
            value={fmtGBP(summary?.fixedCosts ?? 0)}
            subtitle={totalExpensesAll > 0 ? `${Math.round(((summary?.fixedCosts ?? 0) / totalExpensesAll) * 100)}% of total` : "—"}
            icon={<Home className="w-5 h-5" />}
            iconBg="bg-slate-50"
            iconColor="text-slate-500"
          />
          <MoneyKpiCard
            label="Variable Costs"
            value={fmtGBP(summary?.variableCosts ?? 0)}
            subtitle={totalExpensesAll > 0 ? `${Math.round(((summary?.variableCosts ?? 0) / totalExpensesAll) * 100)}% of total` : "—"}
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <MoneyKpiCard
            label="Capital / Reno"
            value={fmtGBP(summary?.capitalReno ?? 0)}
            subtitle={totalExpensesAll > 0 ? `${Math.round(((summary?.capitalReno ?? 0) / totalExpensesAll) * 100)}% of total` : "—"}
            icon={<Wrench className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search expenses by description, supplier or property..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <CalendarDays className="w-3.5 h-3.5" />
                  This Month <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  All Properties <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  All Types <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  All Statuses <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <Filter className="w-3.5 h-3.5" />
                  More filters
                </button>
                <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-1">
                  Clear
                </button>

                {/* View toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-auto">
                  <button
                    onClick={() => setViewMode("table")}
                    className={cn("w-8 h-8 rounded-md flex items-center justify-center transition-all",
                      viewMode === "table" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
                  >
                    <Table2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={cn("w-8 h-8 rounded-md flex items-center justify-center transition-all",
                      viewMode === "cards" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("by-property")}
                    className={cn("w-8 h-8 rounded-md flex items-center justify-center transition-all",
                      viewMode === "by-property" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
                  >
                    <Building className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {visibleRows.length} of {filtered.length} expense{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {/* Table */}
            {viewMode === "table" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {[
                          "Date",
                          "Type",
                          "Cost Behaviour",
                          "Property",
                          "Supplier",
                          "Description",
                          "Amount",
                          "Status",
                          "Receipt",
                          "",
                        ].map((col) => (
                          <th
                            key={col}
                            className={cn(
                              "p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400",
                              col === "Amount" ? "text-right" : "text-left"
                            )}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading && visibleRows.length === 0 && (
                        <tr><td colSpan={10} className="p-10 text-center text-sm text-slate-400">Loading expenses…</td></tr>
                      )}
                      {!isLoading && filtered.length === 0 && (
                        <tr>
                          <td colSpan={10}>
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-sm font-medium text-slate-600">No expenses recorded yet</p>
                              <p className="text-xs text-slate-400">Use “Add Expense” to log your first cost.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {visibleRows.map((row) => {
                        const sc = STATUS_CONFIG[row.status]
                        const bc = BEHAVIOUR_CONFIG[row.costBehaviour]
                        return (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{row.date}</td>
                            <td className="p-4">
                              <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", row.typeColor)}>
                                {row.expenseType}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", bc.className)}>
                                {row.costBehaviour}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-xs font-medium text-slate-900 truncate max-w-[120px]">
                                {row.propertyName}
                              </p>
                              <p className="text-[10px] text-slate-400">{row.propertyAddress}</p>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-bold text-slate-600">
                                    {row.supplierInitials}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-slate-700 truncate max-w-[100px]">
                                  {row.supplierName}
                                </p>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-xs text-slate-700 max-w-[160px] truncate">{row.description}</p>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-sm font-bold text-slate-900">{row.amount}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-0.5">
                                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit", sc.className)}>
                                  {sc.label}
                                </span>
                                {row.statusExtra && (
                                  <span className="text-[10px] text-red-500">{row.statusExtra}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              {row.hasReceipt ? (
                                <Paperclip className="w-4 h-4 text-blue-400 mx-auto" />
                              ) : (
                                <span className="text-slate-200 text-sm">—</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <ConfirmDialog
                                title="Delete expense?"
                                description="This cannot be undone."
                                confirmLabel="Delete"
                                onConfirm={() => deleteExpense(row.id)}
                              >
                                {(open) => (
                                  <ActionMenu
                                    items={[
                                      { label: "Mark Paid", icon: CheckCircle, onClick: () => markExpensePaid(row.id) },
                                      { label: "Export Row (CSV)", icon: Download, onClick: () => downloadCSV([row as unknown as Record<string, unknown>], `expense-${row.id}.csv`) },
                                      { label: "Delete", icon: Trash2, onClick: open, variant: "danger" },
                                    ]}
                                  />
                                )}
                              </ConfirmDialog>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {!showAllRows && filtered.length > 10 && (
                  <div className="p-4 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setShowAllRows(true)}
                      className="flex items-center gap-2 text-xs font-medium text-[#2563EB] hover:underline mx-auto"
                    >
                      Load more ↓
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cards view */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleRows.map((row) => {
                  const sc = STATUS_CONFIG[row.status]
                  return (
                    <div key={row.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", row.typeColor)}>
                              {row.expenseType}
                            </span>
                            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", BEHAVIOUR_CONFIG[row.costBehaviour].className)}>
                              {row.costBehaviour}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 truncate">{row.description}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{row.propertyName}</p>
                        </div>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0", sc.className)}>
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-slate-600">{row.supplierInitials}</span>
                          </div>
                          <span className="text-xs text-slate-600">{row.supplierName}</span>
                        </div>
                        <span className="text-base font-bold text-slate-900">{row.amount}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">{row.date}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* By Property view — live grouped breakdown */}
            {viewMode === "by-property" && (
              byProperty.groups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
                  <Building className="w-12 h-12 text-slate-200" />
                  <p className="text-sm font-medium text-slate-500">No expenses to group</p>
                  <p className="text-xs text-slate-400">Add an expense to see the per-property breakdown.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                  {byProperty.groups.map((g) => (
                    <div key={g.property} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{g.property}</p>
                            <p className="text-[11px] text-slate-400">
                              {g.count} expense{g.count > 1 ? "s" : ""} · mostly {g.topType}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-900 shrink-0">{fmtGBP2(g.total)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-rose-400"
                          style={{ width: `${byProperty.max > 0 ? Math.max(4, (g.total / byProperty.max) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* RIGHT */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">

            {/* Expense Summary — live */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Expense Summary</h3>
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold text-slate-900">{fmtGBP2(totalExpensesAll)}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Total recorded</p>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Total Paid", value: summary?.totalPaid ?? 0, dot: "bg-emerald-500" },
                  { label: "Total Planned", value: summary?.planned ?? 0, dot: "bg-blue-500" },
                  { label: "Fixed Costs", value: summary?.fixedCosts ?? 0, dot: "bg-slate-400" },
                  { label: "Capital / Reno", value: summary?.capitalReno ?? 0, dot: "bg-violet-500" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", row.dot)} />
                      <span className="text-xs text-slate-600">{row.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">{fmtGBP2(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown donut — live */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Cost Breakdown</h3>
              </div>
              {donutSegments.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ExpenseDonut segments={donutSegments} total={totalExpensesAll} />
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {donutSegments.map((seg) => (
                      <div key={seg.label} className="flex items-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: seg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-slate-700 truncate">{seg.label}</span>
                            <span className="text-[11px] font-semibold text-slate-900 shrink-0">{seg.pct}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{seg.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No expense data to chart yet.</p>
              )}
            </div>
          </div>
        </div>
      </DashboardContainer>
    </div>
  )
}
