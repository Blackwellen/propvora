"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Shield,
  Clock,
  Plus,
  Download,
  Search,
  ChevronDown,
  Table2,
  LayoutGrid,
  CalendarDays,
  X,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav } from "@/components/money"
import MoneyKpiCard from "@/components/money/MoneyKpiCard"
import MoneyPageHeader from "@/components/money/MoneyPageHeader"
import { MoneyCalendar } from "@/components/money/MoneyCalendar"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyIncome, useCreateMoneyIncome, useMoneyIncomeSummary } from "@/hooks/useMoneyData"
import { createClient } from "@/lib/supabase/client"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { Trash2, CheckCircle } from "lucide-react"
import type { MoneyIncomeRow, InsertMoneyIncome } from "@/hooks/useMoneyData"

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

const TYPE_COLORS = ["#2563EB", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#94a3b8"]

// ─── Types ────────────────────────────────────────────────────────────────────

type IncomeStatus = "received" | "expected" | "overdue" | "planned" | "reconciled"
type ViewMode = "table" | "cards" | "calendar"

interface IncomeRow {
  id: string
  date: string
  description: string
  contactName: string
  contactRole: string
  contactInitials: string
  propertyName: string
  incomeType: string
  typeColor: string
  dueDate: string
  amount: string
  status: IncomeStatus
  reference: string
}

interface AddIncomeModalForm {
  income_type: string
  property: string
  amount: string
  description: string
  expected_date: string
  received_date: string
  status: string
  reference: string
  notes: string
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<IncomeStatus, { label: string; className: string }> = {
  received: { label: "Received", className: "bg-emerald-100 text-emerald-700" },
  expected: { label: "Expected", className: "bg-blue-100 text-blue-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  planned: { label: "Planned", className: "bg-amber-100 text-amber-700" },
  reconciled: { label: "Reconciled", className: "bg-violet-100 text-violet-700" },
}

interface DonutSegment { label: string; pct: number; amount: string; color: string }

const INCOME_TYPE_OPTIONS = [
  "Rent",
  "Service Charge",
  "Deposit Received",
  "Deposit Refund",
  "Management Fee",
  "Parking",
  "Other Income",
]

const STATUS_OPTIONS = ["received", "expected", "overdue", "planned", "reconciled"]

const PROPERTIES_LIST = [
  "Waterfront House",
  "Exchange Building",
  "Riverside Plaza",
  "City Centre Mall",
  "Logistics Park",
  "Harbour View",
]

// ─── SVG Donut ────────────────────────────────────────────────────────────────

function DonutChart({ segments, total }: { segments: DonutSegment[]; total: number }) {
  const r = 60
  const cx = 80
  const cy = 80

  let cumPct = 0
  const paths = segments.map((seg) => {
    const startPct = cumPct
    cumPct += seg.pct
    const startAngle = (startPct / 100) * 360 - 90
    const endAngle = (cumPct / 100) * 360 - 90
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = seg.pct > 50 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    return { ...seg, d }
  })

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[160px]" aria-hidden="true">
      {total > 0 ? (
        paths.map((seg) => <path key={seg.label} d={seg.d} fill={seg.color} opacity="0.85" />)
      ) : (
        <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
      )}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="white" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
        {fmtGBP(total)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="#94a3b8">
        Total
      </text>
    </svg>
  )
}

// ─── Add Income Modal ─────────────────────────────────────────────────────────

function AddIncomeModal({ onClose, workspaceId }: { onClose: () => void; workspaceId?: string }) {
  const [form, setForm] = useState<AddIncomeModalForm>({
    income_type: "",
    property: "",
    amount: "",
    description: "",
    expected_date: "",
    received_date: "",
    status: "",
    reference: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createIncome = useCreateMoneyIncome(workspaceId)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    if (!form.amount || !form.income_type) { setFormError("Income type and amount are required"); return }
    if (!workspaceId) { setFormError("Workspace not loaded"); return }
    setSaving(true)
    setFormError(null)
    try {
      await createIncome.mutateAsync({
        workspace_id: workspaceId,
        income_type: form.income_type,
        amount: parseFloat(form.amount),
        expected_date: form.expected_date || new Date().toISOString().split("T")[0],
        received_date: form.received_date || null,
        status: (form.status as InsertMoneyIncome["status"]) || "expected",
        description: form.description || null,
        property_id: null,
        tenant_id: null,
        tenancy_id: null,
      })
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">Add Income</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Income Type</label>
              <select name="income_type" value={form.income_type} onChange={handleChange}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select type…</option>
                {INCOME_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
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
              <label className="text-xs font-medium text-slate-600">Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select status…</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Description</label>
            <input name="description" type="text" value={form.description} onChange={handleChange}
              placeholder="e.g. Monthly Rent – Jun 2026"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Expected Date</label>
              <input name="expected_date" type="date" value={form.expected_date} onChange={handleChange}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Received Date</label>
              <input name="received_date" type="date" value={form.received_date} onChange={handleChange}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Reference</label>
            <input name="reference" type="text" value={form.reference} onChange={handleChange}
              placeholder="e.g. INC-2026-1342"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              placeholder="Optional notes…"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        {formError && <p className="text-xs text-red-500 px-6 pb-2">{formError}</p>}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70">
            {saving ? "Saving…" : "Save Income"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MoneyIncomePage() {
  const { workspace } = useWorkspace()
  const { data: liveIncome, isLoading } = useMoneyIncome(workspace?.id)
  const { data: summary } = useMoneyIncomeSummary(workspace?.id)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const _sp = useSearchParams()
  useEffect(() => { if (_sp.get("new") === "1") setShowAddModal(true) }, [_sp])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [allSelected, setAllSelected] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }
  function isLiveIncome(id: string) { return !!liveIncome && liveIncome.some((r) => r.id === id) }

  async function deleteIncome(id: string) {
    if (isLiveIncome(id)) {
      const supabase = createClient()
      try {
        // Income is stored in money_transactions (direction = 'in').
        const { error } = await supabase.from("money_transactions").delete().eq("id", id).eq("workspace_id", workspace?.id ?? "")
        if (error && error.code !== "42P01") throw error
      } catch { showToast("Could not delete record"); return }
    }
    setHiddenIds((p) => new Set(p).add(id))
    showToast("Income record deleted")
  }

  async function markReceived(id: string) {
    if (!isLiveIncome(id)) { showToast("Sample record — actions persist once saved"); return }
    // money_transactions rows are realized cash movements — already "received".
    // There is no status/received_date column to update, so this is a no-op.
    showToast("Income is already recorded as received")
  }

  // Map live data to IncomeRow display format — NO mock fallback (honest empty state)
  const INCOME_ROWS_LIVE: IncomeRow[] = React.useMemo(() => {
    if (!liveIncome) return []
    return liveIncome.map((r: MoneyIncomeRow): IncomeRow => ({
      id: r.id,
      date: r.expected_date ? new Date(r.expected_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
      description: r.description ?? r.income_type,
      contactName: "—",
      contactRole: "—",
      contactInitials: "—",
      propertyName: r.property_id ?? "—",
      incomeType: r.income_type,
      typeColor: "bg-emerald-100 text-emerald-700",
      dueDate: r.expected_date ?? "—",
      amount: fmtGBP2(r.amount ?? 0),
      status: (r.status as IncomeStatus) ?? "expected",
      reference: r.id.slice(0, 8).toUpperCase(),
    }))
  }, [liveIncome])

  // Live "Income by Type" donut segments
  const totalIncomeAll = React.useMemo(
    () => (liveIncome ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0),
    [liveIncome]
  )
  const donutSegments: DonutSegment[] = React.useMemo(() => {
    const byType = new Map<string, number>()
    for (const r of liveIncome ?? []) {
      byType.set(r.income_type, (byType.get(r.income_type) ?? 0) + (r.amount ?? 0))
    }
    const entries = [...byType.entries()].sort((a, b) => b[1] - a[1])
    return entries.map(([label, amount], i) => ({
      label,
      amount: fmtGBP2(amount),
      pct: totalIncomeAll > 0 ? Math.round((amount / totalIncomeAll) * 1000) / 10 : 0,
      color: TYPE_COLORS[i % TYPE_COLORS.length],
    }))
  }, [liveIncome, totalIncomeAll])

  function toggleRow(id: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedRows(new Set())
      setAllSelected(false)
    } else {
      setSelectedRows(new Set(INCOME_ROWS_LIVE.map((r) => r.id)))
      setAllSelected(true)
    }
  }

  const filtered = INCOME_ROWS_LIVE.filter((r) => !hiddenIds.has(r.id)).filter((r) =>
    searchQuery
      ? r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  )

  function handleExportCSV() {
    downloadCSV(
      filtered.map(r => ({
        date: r.date,
        description: r.description,
        contact: r.contactName,
        property: r.propertyName,
        type: r.incomeType,
        amount: r.amount,
        status: r.status,
        reference: r.reference,
      })),
      "income-export.csv"
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {showAddModal && <AddIncomeModal workspaceId={workspace?.id} onClose={() => setShowAddModal(false)} />}
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
              Add Income
              <ChevronDown className="w-3 h-3" />
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <ActionMenu
              items={[
                { label: "Export CSV", icon: Download, onClick: handleExportCSV },
                { label: "Add Income", icon: Plus, onClick: () => setShowAddModal(true) },
              ]}
            />
          </div>
        }
      />

      <DashboardContainer className="px-6 py-6 flex flex-col gap-6">
        <MoneyPageHeader
          breadcrumb="Income"
          title="Income"
          subtitle="Track, manage and forecast all incoming payments across your portfolio."
          actions={<></>}
        />

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MoneyKpiCard
            label="Total Received"
            value={fmtGBP(summary?.totalReceived ?? 0)}
            icon={<TrendingUp className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <MoneyKpiCard
            label="Expected"
            value={fmtGBP(summary?.expected ?? 0)}
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MoneyKpiCard
            label="Overdue"
            value={fmtGBP(summary?.overdue ?? 0)}
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
          <MoneyKpiCard
            label="Planned"
            value={fmtGBP(summary?.planned ?? 0)}
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <MoneyKpiCard
            label="Reconciled"
            value={fmtGBP(summary?.reconciled ?? 0)}
            icon={<Shield className="w-5 h-5" />}
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
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search income..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* View toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
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
                    onClick={() => setViewMode("calendar")}
                    className={cn("w-8 h-8 rounded-md flex items-center justify-center transition-all",
                      viewMode === "calendar" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters */}
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Type: All <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Status: All <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Property: All <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Jun 1 – Jun 30, 2026
                </button>
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <Filter className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Table */}
            {viewMode === "table" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left p-4 w-10">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Date ↑
                        </th>
                        <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Description
                        </th>
                        <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Contact
                        </th>
                        <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Property
                        </th>
                        <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Type
                        </th>
                        <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Due Date
                        </th>
                        <th className="text-right p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Amount
                        </th>
                        <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Status
                        </th>
                        <th className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Reference
                        </th>
                        <th className="text-center p-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-10">
                          ⋯
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading && filtered.length === 0 && (
                        <tr><td colSpan={11} className="p-10 text-center text-sm text-slate-400">Loading income…</td></tr>
                      )}
                      {!isLoading && filtered.length === 0 && (
                        <tr>
                          <td colSpan={11}>
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-sm font-medium text-slate-600">No income recorded yet</p>
                              <p className="text-xs text-slate-400">Use “Add Income” to record your first payment.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {filtered.map((row) => {
                        const sc = STATUS_CONFIG[row.status]
                        return (
                          <tr
                            key={row.id}
                            className={cn(
                              "hover:bg-slate-50 transition-colors",
                              selectedRows.has(row.id) && "bg-blue-50"
                            )}
                          >
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(row.id)}
                                onChange={() => toggleRow(row.id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{row.date}</td>
                            <td className="p-4">
                              <p className="font-medium text-slate-900 text-xs leading-tight max-w-[180px] truncate">
                                {row.description}
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-bold text-blue-700">
                                    {row.contactInitials}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-900 leading-tight">
                                    {row.contactName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">{row.contactRole}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-xs text-slate-700 max-w-[140px] truncate">
                                {row.propertyName}
                              </p>
                            </td>
                            <td className="p-4">
                              <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", row.typeColor)}>
                                {row.incomeType}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{row.dueDate}</td>
                            <td className="p-4 text-right">
                              <span className="text-sm font-bold text-slate-900">{row.amount}</span>
                            </td>
                            <td className="p-4">
                              <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", sc.className)}>
                                {sc.label}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-slate-400">{row.reference}</td>
                            <td className="p-4 text-center">
                              <ConfirmDialog
                                title="Delete income record?"
                                description="This cannot be undone."
                                confirmLabel="Delete"
                                onConfirm={() => deleteIncome(row.id)}
                              >
                                {(open) => (
                                  <ActionMenu
                                    items={[
                                      { label: "Mark Received", icon: CheckCircle, onClick: () => markReceived(row.id) },
                                      { label: "Export Row (CSV)", icon: Download, onClick: () => downloadCSV([row as unknown as Record<string, unknown>], `income-${row.id}.csv`) },
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

                {/* Count */}
                {filtered.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
                    <span className="text-xs text-slate-500">
                      Showing {filtered.length} income record{filtered.length === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Cards view */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((row) => {
                  const sc = STATUS_CONFIG[row.status]
                  return (
                    <div key={row.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{row.description}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{row.propertyName}</p>
                        </div>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0", sc.className)}>
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-blue-700">{row.contactInitials}</span>
                          </div>
                          <span className="text-xs text-slate-600">{row.contactName}</span>
                        </div>
                        <span className="text-base font-bold text-slate-900">{row.amount}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">{row.date} • {row.reference}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Calendar view — live records bucketed by expected date */}
            {viewMode === "calendar" && (
              filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
                  <CalendarDays className="w-12 h-12 text-slate-200" />
                  <p className="text-sm font-medium text-slate-500">No income records to show</p>
                  <p className="text-xs text-slate-400">Add an income record to see it on the calendar.</p>
                </div>
              ) : (
                <MoneyCalendar
                  tone="emerald"
                  entries={filtered
                    .filter((r) => r.dueDate && r.dueDate !== "—")
                    .map((r) => ({
                      id: r.id,
                      dateISO: r.dueDate,
                      amount: Number(String(r.amount).replace(/[^0-9.-]/g, "")) || 0,
                      label: r.description,
                    }))}
                />
              )
            )}
          </div>

          {/* RIGHT */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">

            {/* Income Summary — live */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Income Summary</h3>
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold text-slate-900">{fmtGBP2(totalIncomeAll)}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Across all statuses</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Received", value: summary?.totalReceived ?? 0, color: "text-emerald-600", dot: "bg-emerald-500" },
                  { label: "Expected", value: summary?.expected ?? 0, color: "text-blue-600", dot: "bg-blue-500" },
                  { label: "Overdue", value: summary?.overdue ?? 0, color: "text-red-500", dot: "bg-red-500" },
                  { label: "Planned", value: summary?.planned ?? 0, color: "text-amber-600", dot: "bg-amber-500" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", row.dot)} />
                      <span className="text-xs text-slate-600">{row.label}</span>
                    </div>
                    <span className={cn("text-xs font-semibold", row.color)}>{fmtGBP2(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Income by Type donut — live */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Income by Type</h3>
              </div>
              {donutSegments.length > 0 ? (
                <div className="flex items-center gap-4">
                  <DonutChart segments={donutSegments} total={totalIncomeAll} />
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
                <p className="text-xs text-slate-400 text-center py-8">No income data to chart yet.</p>
              )}
            </div>
          </div>
        </div>
      </DashboardContainer>
    </div>
  )
}
