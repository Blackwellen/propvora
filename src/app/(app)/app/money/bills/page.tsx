"use client"

import React, { useState, useMemo } from "react"
import {
  Plus, Download, Search, Eye, CheckSquare, AlertTriangle, CheckCircle,
  Users, ChevronDown,
  X, Paperclip, Columns3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MoneyTabNav, MoneyKpiCard, MoneyPageHeader } from "@/components/money"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyBills, useMoneyBillsSummary, useCreateMoneyBill, useApproveBill, useMarkBillPaid } from "@/hooks/useMoneyData"
import type { InsertMoneyBill } from "@/hooks/useMoneyData"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { Trash2 } from "lucide-react"

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

// ─── Types ────────────────────────────────────────────────────────────────────

type BillStatus =
  | "overdue"
  | "due_today"
  | "approved"
  | "scheduled"
  | "paid"

type BillType = "Invoice" | "Credit Note"

type PaymentStatus = "ready" | "awaiting_approval" | "missing_details"

interface Bill {
  id: string
  supplierInitials: string
  supplierColor: string
  supplierName: string
  supplierSubtitle: string
  billNumber: string
  poRef: string
  type: BillType
  property: string
  linkedJob: string
  amount: number
  dueDate: string
  dueDateLabel: string
  status: BillStatus
  paymentMethod: string
  paymentWarning?: string
}

interface SupplierPayment {
  id: string
  supplierInitials: string
  supplierColor: string
  supplierName: string
  paymentMethod: string
  amount: number
  status: PaymentStatus
  scheduledDate: string
}

type ViewTab = "bills" | "supplier_payments"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount)
  const prefix = amount < 0 ? "-£" : "£"
  return `${prefix}${abs.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const _gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
function fmtGBP(amount: number): string { return _gbp0.format(Number.isFinite(amount) ? amount : 0) }

function billStatusConfig(status: BillStatus): { label: string; className: string } {
  switch (status) {
    case "overdue":   return { label: "Overdue",   className: "bg-red-100 text-red-700" }
    case "due_today": return { label: "Due Today", className: "bg-amber-100 text-amber-700" }
    case "approved":  return { label: "Approved",  className: "bg-emerald-100 text-emerald-700" }
    case "scheduled": return { label: "Scheduled", className: "bg-blue-100 text-blue-700" }
    case "paid":      return { label: "Paid",      className: "bg-emerald-50 text-emerald-600" }
  }
}

function paymentStatusConfig(status: PaymentStatus): { label: string; className: string } {
  switch (status) {
    case "ready":            return { label: "Ready to Pay",       className: "bg-emerald-100 text-emerald-700" }
    case "awaiting_approval":return { label: "Awaiting Approval",  className: "bg-amber-100 text-amber-700" }
    case "missing_details":  return { label: "Missing Details",    className: "bg-red-100 text-red-700" }
  }
}

function billTypeBadge(type: BillType): string {
  return type === "Invoice" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"
}

// ─── Add Bill Modal ───────────────────────────────────────────────────────────

function AddBillModal({ onClose, workspaceId, onSaved }: { onClose: () => void; workspaceId: string | undefined; onSaved: () => void }) {
  const createBill = useCreateMoneyBill(workspaceId)
  const [supplier, setSupplier] = useState("")
  const [property, setProperty] = useState("")
  const [billNumber, setBillNumber] = useState("")
  const [reference, setReference] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSave() {
    if (!amount || isNaN(parseFloat(amount))) { setFormError("A valid amount is required"); return }
    if (!dueDate) { setFormError("Due date is required"); return }
    if (!workspaceId) { setFormError("Workspace not loaded"); return }
    setSaving(true)
    setFormError(null)
    try {
      const payload: InsertMoneyBill = {
        workspace_id: workspaceId,
        property_id: null,
        supplier_id: null,
        amount: parseFloat(amount),
        due_date: dueDate,
        approval_status: "pending_review",
        payment_status: "unpaid",
        description: notes.trim() || null,
        reference: (reference.trim() || billNumber.trim()) || null,
        paid_at: null,
        approved_at: null,
      }
      await createBill.mutateAsync(payload)
      onSaved()
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save bill")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add Bill</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Supplier</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search suppliers…"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Property</label>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select property…</option>
                <option value="maple">Maple House</option>
                <option value="oakwood">Oakwood Court</option>
                <option value="riverside">Riverside Apartments</option>
                <option value="harbor">Harbor View</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Bill Number</label>
              <input
                type="text"
                placeholder="e.g. INV-24568"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Reference</label>
              <input
                type="text"
                placeholder="e.g. PO-1289"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Amount (£) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Notes</label>
            <textarea
              placeholder="Add any notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Receipt / Attachment</label>
            <label className="flex items-center gap-2.5 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
              <Paperclip className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] text-slate-500">Click to attach file or drag & drop</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-2">
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Bill"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillsPage() {
  const { workspace } = useWorkspace()
  const router = useRouter()
  const { data: liveBills } = useMoneyBills(workspace?.id)
  const { data: liveSummary } = useMoneyBillsSummary(workspace?.id)
  const approveBill = useApproveBill(workspace?.id)
  const markPaid = useMarkBillPaid(workspace?.id)

  const [viewTab, setViewTab] = useState<ViewTab>("bills")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  function isLiveBill(id: string) { return !!liveBills && liveBills.some((r) => r.id === id) }

  async function deleteBill(id: string) {
    if (isLiveBill(id)) {
      const supabase = createClient()
      try {
        const { error } = await supabase.from("bills").delete().eq("id", id).eq("workspace_id", workspace?.id ?? "")
        if (error && error.code !== "42P01") throw error
      } catch { showToast("Could not delete bill"); return }
    }
    setHiddenIds((p) => new Set(p).add(id))
    showToast("Bill deleted")
  }

  async function approveBillRow(id: string) {
    if (!isLiveBill(id)) { showToast("Sample bill — actions persist once saved"); return }
    try { await approveBill.mutateAsync({ id }); showToast("Bill approved") }
    catch (e: unknown) { showToast((e as { code?: string })?.code === "42P01" ? "Bills table not provisioned yet" : "Could not approve bill") }
  }

  async function markBillPaidRow(id: string) {
    if (!isLiveBill(id)) { showToast("Sample bill — actions persist once saved"); return }
    try { await markPaid.mutateAsync({ id }); showToast("Bill marked as Paid") }
    catch (e: unknown) { showToast((e as { code?: string })?.code === "42P01" ? "Bills table not provisioned yet" : "Could not update bill") }
  }

  // ─── Bulk actions over selected ids (workspace-scoped via existing mutations) ───
  const [bulkBusy, setBulkBusy] = useState(false)

  function selectedLiveIds(): string[] {
    return Array.from(selectedIds).filter((id) => isLiveBill(id) && !hiddenIds.has(id))
  }

  async function bulkApprove() {
    if (selectedIds.size === 0) { showToast("Select one or more bills first"); return }
    const ids = selectedLiveIds()
    if (ids.length === 0) { showToast("Sample bills — actions persist once saved"); return }
    setBulkBusy(true)
    let ok = 0
    let failed = 0
    for (const id of ids) {
      try { await approveBill.mutateAsync({ id }); ok++ }
      catch { failed++ }
    }
    setBulkBusy(false)
    setSelectedIds(new Set())
    showToast(failed === 0 ? `Approved ${ok} bill${ok === 1 ? "" : "s"}` : `Approved ${ok}, ${failed} failed`)
  }

  async function bulkMarkPaid() {
    if (selectedIds.size === 0) { showToast("Select one or more bills first"); return }
    const ids = selectedLiveIds()
    if (ids.length === 0) { showToast("Sample bills — actions persist once saved"); return }
    setBulkBusy(true)
    let ok = 0
    let failed = 0
    for (const id of ids) {
      try { await markPaid.mutateAsync({ id }); ok++ }
      catch { failed++ }
    }
    setBulkBusy(false)
    setSelectedIds(new Set())
    showToast(failed === 0 ? `Marked ${ok} bill${ok === 1 ? "" : "s"} as Paid` : `Paid ${ok}, ${failed} failed`)
  }

  // No bank/BACS rail configured — export selected bills as a BACS-style CSV (a real action).
  function bulkPaySupplierBACS() {
    if (selectedIds.size === 0) { showToast("Select one or more bills first"); return }
    const rows = BILLS_LIVE.filter((b) => selectedIds.has(b.id) && !hiddenIds.has(b.id))
    if (rows.length === 0) { showToast("No bills selected to export"); return }
    downloadCSV(
      rows.map((b) => ({
        supplier: b.supplierName,
        bill_number: b.billNumber,
        reference: b.poRef,
        amount: b.amount.toFixed(2),
        currency: "GBP",
        due_date: b.dueDate,
        status: b.status,
      })),
      "bacs-payment-run.csv"
    )
    showToast(`Exported ${rows.length} bill${rows.length === 1 ? "" : "s"} as BACS payment file`)
  }

  // Map live Supabase data to display format — NO mock fallback (honest empty state)
  const BILLS_LIVE: Bill[] = useMemo(() => {
    if (!liveBills) return []
    return liveBills.map((r, i) => ({
      id: r.id,
      supplierInitials: (r.supplier_id ?? "??").slice(0, 2).toUpperCase(),
      supplierColor: "bg-slate-500",
      supplierName: r.supplier_id ?? "Unknown Supplier",
      supplierSubtitle: "",
      billNumber: r.reference ?? `BILL-${String(i + 1).padStart(4, "0")}`,
      poRef: r.reference ?? "—",
      type: "Invoice" as BillType,
      property: r.property_id ?? "—",
      linkedJob: "—",
      amount: r.amount,
      dueDate: r.due_date,
      dueDateLabel: (() => {
        const due = new Date(r.due_date)
        const now = new Date()
        const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000)
        if (diffDays < 0) return `Overdue ${Math.abs(diffDays)} days`
        if (diffDays === 0) return "Due today"
        return `Due in ${diffDays} days`
      })(),
      status: (r.payment_status === "paid" ? "paid" :
               r.payment_status === "overdue" ? "overdue" :
               r.approval_status === "approved" ? "approved" :
               r.approval_status === "pending_review" ? "due_today" : "scheduled") as BillStatus,
      paymentMethod: "BACS",
    }))
  }, [liveBills])

  // Supplier payments derived from approved+unpaid live bills
  const supplierPayments: SupplierPayment[] = useMemo(() => {
    return (liveBills ?? [])
      .filter((r) => r.approval_status === "approved" && r.payment_status !== "paid")
      .map((r, i): SupplierPayment => ({
        id: r.id,
        supplierInitials: (r.supplier_id ?? "??").slice(0, 2).toUpperCase(),
        supplierColor: "bg-slate-500",
        supplierName: r.supplier_id ?? `Supplier ${i + 1}`,
        paymentMethod: "BACS",
        amount: r.amount,
        status: r.payment_status === "scheduled" ? "ready" : "awaiting_approval",
        scheduledDate: r.due_date ? new Date(r.due_date).toLocaleDateString("en-GB") : "—",
      }))
  }, [liveBills])

  // Top suppliers by spend (live)
  const topSuppliers = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of liveBills ?? []) {
      const key = r.supplier_id ?? "Unknown Supplier"
      map.set(key, (map.get(key) ?? 0) + (r.amount ?? 0))
    }
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        initials: name.slice(0, 2).toUpperCase(),
        color: "bg-slate-500",
        amount,
        pct: Math.round((amount / total) * 1000) / 10,
      }))
  }, [liveBills])

  // Payment summary (live)
  const paymentSummary = useMemo(() => {
    const rows = liveBills ?? []
    const sum = (pred: (r: typeof rows[number]) => boolean) =>
      rows.filter(pred).reduce((acc, r) => acc + (r.amount ?? 0), 0)
    return {
      total: rows.reduce((acc, r) => acc + (r.amount ?? 0), 0),
      paid: sum((r) => r.payment_status === "paid"),
      scheduled: sum((r) => r.payment_status === "scheduled" || (r.approval_status === "approved" && r.payment_status === "unpaid")),
      overdue: sum((r) => r.payment_status === "overdue"),
    }
  }, [liveBills])

  function handleExportCSV() {
    downloadCSV(
      BILLS_LIVE.map(b => ({
        supplier: b.supplierName,
        billNumber: b.billNumber,
        amount: b.amount,
        dueDate: b.dueDate,
        status: b.status,
        property: b.property,
      })),
      "bills.csv"
    )
  }

  const filteredBills = BILLS_LIVE.filter((b) => {
    if (hiddenIds.has(b.id)) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      b.supplierName.toLowerCase().includes(q) ||
      b.billNumber.toLowerCase().includes(q) ||
      b.poRef.toLowerCase().includes(q)
    )
  })

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === filteredBills.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredBills.map((b) => b.id)))
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      <MoneyTabNav />

      {showAddModal && <AddBillModal onClose={() => setShowAddModal(false)} workspaceId={workspace?.id} onSaved={() => showToast("Bill saved successfully")} />}
      <DashboardContainer className="px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <MoneyPageHeader
          breadcrumb="Bills"
          title="Bills & Supplier Pay"
          subtitle="Manage vendor bills, approvals and supplier payments in one place."
          actions={
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Bill
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              <button onClick={bulkMarkPaid} disabled={bulkBusy} className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap disabled:opacity-60">
                Mark Paid{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
              </button>
              <button onClick={bulkApprove} disabled={bulkBusy} className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60">
                Approve{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
              </button>
              <button onClick={bulkPaySupplierBACS} disabled={bulkBusy} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap disabled:opacity-60">
                Pay Supplier (BACS)
                <Download className="w-3.5 h-3.5 opacity-70" />
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              <ActionMenu
                items={[
                  { label: "Export all bills (CSV)", icon: Download, onClick: handleExportCSV },
                  { label: "Add Bill", icon: Plus, onClick: () => setShowAddModal(true) },
                ]}
              />
            </>
          }
        />

        {/* KPI Row — live */}
        <div className="grid grid-cols-5 gap-4">
          <MoneyKpiCard
            label="Awaiting Review"
            value={liveSummary?.awaitingReview ?? 0}
            subtitle="bills"
            icon={<Eye className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <MoneyKpiCard
            label="Approved to Pay"
            value={liveSummary?.approvedToPay ?? 0}
            subtitle="bills"
            icon={<CheckSquare className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <MoneyKpiCard
            label="Overdue"
            value={liveSummary?.overdue ?? 0}
            subtitle="bills"
            alert={liveSummary && liveSummary.overdue > 0 ? String(liveSummary.overdue) : undefined}
            alertColor="bg-red-100 text-red-700"
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
          <MoneyKpiCard
            label="Paid This Month"
            value={liveSummary?.paidThisMonth ?? 0}
            subtitle="bills"
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <MoneyKpiCard
            label="Supplier Pay Queue"
            value={fmtGBP(liveSummary?.supplierPaymentQueue ?? 0)}
            subtitle="approved & unpaid"
            icon={<Users className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
        </div>

        {/* Internal Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {(["bills", "supplier_payments"] as ViewTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setViewTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                viewTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === "bills" ? "Bills" : "Supplier Payments"}
            </button>
          ))}
        </div>

        {/* Main Layout */}
        <div className="flex gap-5 items-start">
          {/* LEFT */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Search + Filters */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search bills by supplier, bill #, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                "Status (5 selected)",
                "Approval Status: All",
                "Due Date: Anytime",
                "Property: All",
                "Supplier: All",
                "Amount: Any",
              ].map((f) => (
                <button
                  key={f}
                  className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all whitespace-nowrap"
                >
                  {f} <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              ))}
              <button className="text-[12px] font-medium text-blue-600 hover:text-blue-800 px-2 transition-colors">
                Clear all
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 ml-auto">
                Saved Views <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              <button className="p-1.5 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                <Columns3 className="w-4 h-4" />
              </button>
            </div>

            {/* Selection row */}
            {viewTab === "bills" && (
              <div className="flex items-center gap-3 text-[13px] text-slate-500">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === filteredBills.length &&
                    filteredBills.length > 0
                  }
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600"
                />
                <span>{selectedIds.size} selected</span>
                <button className="text-blue-600 font-medium hover:underline">
                  Select all {filteredBills.length} bills
                </button>
              </div>
            )}

            {/* Bills Table */}
            {viewTab === "bills" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="pl-4 pr-2 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={
                              selectedIds.size === filteredBills.length &&
                              filteredBills.length > 0
                            }
                            onChange={toggleAll}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600"
                          />
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Supplier
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Bill # / Ref
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Type
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Property
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Linked Job
                        </th>
                        <th className="px-3 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Amount
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          <span className="flex items-center gap-1">
                            Due Date <span className="text-blue-500">↑</span>
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Payment
                        </th>
                        <th className="px-3 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.length === 0 && (
                        <tr>
                          <td colSpan={11}>
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <CheckSquare className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-sm font-medium text-slate-600">No bills yet</p>
                              <p className="text-xs text-slate-400">Use “Add Bill” to record your first supplier bill.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {filteredBills.map((bill, idx) => {
                        const { label: statusLabel, className: statusClass } =
                          billStatusConfig(bill.status)
                        return (
                          <tr
                            key={bill.id}
                            className={cn(
                              "border-b border-slate-50 hover:bg-slate-50/60 transition-colors",
                              idx === filteredBills.length - 1 && "border-0"
                            )}
                          >
                            <td className="pl-4 pr-2 py-3.5">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(bill.id)}
                                onChange={() => toggleSelect(bill.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600"
                              />
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                                    bill.supplierColor
                                  )}
                                >
                                  {bill.supplierInitials}
                                </div>
                                <div>
                                  <div className="text-[13px] font-medium text-slate-900">
                                    {bill.supplierName}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {bill.supplierSubtitle}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <div
                                onClick={() => router.push(`/app/money/bills/${bill.id}`)}
                                className="text-[13px] font-semibold text-blue-600 hover:underline cursor-pointer"
                              >
                                {bill.billNumber}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {bill.poRef}
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                  billTypeBadge(bill.type)
                                )}
                              >
                                {bill.type}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-[13px] text-slate-700 whitespace-nowrap">
                              {bill.property}
                            </td>
                            <td className="px-3 py-3.5 text-[12px] text-slate-500 max-w-[140px] truncate">
                              {bill.linkedJob}
                            </td>
                            <td className="px-3 py-3.5 text-right">
                              <span
                                className={cn(
                                  "text-[13px] font-semibold",
                                  bill.amount < 0 ? "text-violet-600" : "text-slate-900"
                                )}
                              >
                                {formatCurrency(bill.amount)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="text-[13px] text-slate-600 whitespace-nowrap">
                                {bill.dueDate}
                              </div>
                              <div
                                className={cn(
                                  "text-[11px] font-medium mt-0.5",
                                  bill.status === "overdue"
                                    ? "text-red-500"
                                    : bill.status === "due_today"
                                    ? "text-amber-600"
                                    : "text-slate-400"
                                )}
                              >
                                {bill.dueDateLabel}
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                  statusClass
                                )}
                              >
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="text-[12px] text-slate-600">
                                {bill.paymentMethod}
                              </div>
                              {bill.paymentWarning && (
                                <div className="text-[11px] text-orange-500 font-medium mt-0.5">
                                  ⊘ {bill.paymentWarning}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3.5">
                              <ConfirmDialog
                                title="Delete bill?"
                                description={`Remove ${bill.billNumber}? This cannot be undone.`}
                                confirmLabel="Delete"
                                onConfirm={() => deleteBill(bill.id)}
                              >
                                {(open) => (
                                  <ActionMenu
                                    items={[
                                      { label: "View", icon: Eye, onClick: () => router.push(`/app/money/bills/${bill.id}`) },
                                      { label: "Approve", icon: CheckSquare, onClick: () => approveBillRow(bill.id) },
                                      { label: "Mark as Paid", icon: CheckCircle, onClick: () => markBillPaidRow(bill.id) },
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
                {filteredBills.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[13px] text-slate-500">
                      Showing {filteredBills.length} bill{filteredBills.length === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Supplier Payments Table */}
            {viewTab === "supplier_payments" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Supplier
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Payment Method
                        </th>
                        <th className="px-3 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Amount
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Scheduled Date
                        </th>
                        <th className="px-3 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {supplierPayments.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                              <Users className="w-8 h-8 text-slate-300" />
                              <p className="text-sm font-medium text-slate-500">No supplier payments queued</p>
                              <p className="text-xs text-slate-400">Approve unpaid bills to build the payment queue.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {supplierPayments.map((sp, idx) => {
                        const { label, className } = paymentStatusConfig(sp.status)
                        return (
                          <tr
                            key={sp.id}
                            className={cn(
                              "border-b border-slate-50 hover:bg-slate-50/60 transition-colors",
                              idx === supplierPayments.length - 1 && "border-0"
                            )}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                                    sp.supplierColor
                                  )}
                                >
                                  {sp.supplierInitials}
                                </div>
                                <span className="text-[13px] font-medium text-slate-900">
                                  {sp.supplierName}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-[13px] text-slate-600">
                              {sp.paymentMethod}
                            </td>
                            <td className="px-3 py-3.5 text-right">
                              <span className="text-[13px] font-semibold text-slate-900">
                                {formatCurrency(sp.amount)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                  className
                                )}
                              >
                                {label}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-[13px] text-slate-600">
                              {sp.scheduledDate}
                            </td>
                            <td className="px-3 py-3.5">
                              <ActionMenu
                                items={[
                                  { label: "View Bill", icon: Eye, onClick: () => router.push(`/app/money/bills/${sp.id}`) },
                                  { label: "Mark as Paid", icon: CheckCircle, onClick: () => markBillPaidRow(sp.id) },
                                ]}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT Sidebar */}
          <div className="w-72 shrink-0 flex flex-col gap-4 sticky top-6">
            {/* Top Suppliers — live */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-slate-900">
                  Top Suppliers by Spend
                </h3>
              </div>
              {topSuppliers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {topSuppliers.map((s) => (
                    <div key={s.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0", s.color)}>
                            {s.initials}
                          </div>
                          <span className="text-slate-700 font-medium truncate max-w-[110px]">{s.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-slate-900 text-[12px]">{fmtGBP(s.amount)}</span>
                          <span className="text-slate-400 text-[11px] ml-1">{s.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", s.color)} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-slate-400 text-center py-4">No supplier spend recorded yet.</p>
              )}
            </div>

            {/* Payment Summary — live */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-slate-900">
                  Payment Summary
                </h3>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">Total Bills</span>
                  <span className="text-[13px] font-bold text-slate-900">{formatCurrency(paymentSummary.total)}</span>
                </div>
                {[
                  { label: "Paid", value: paymentSummary.paid, color: "text-emerald-600", dot: "bg-emerald-500" },
                  { label: "Approved / Scheduled", value: paymentSummary.scheduled, color: "text-blue-600", dot: "bg-blue-500" },
                  { label: "Overdue", value: paymentSummary.overdue, color: "text-red-600", dot: "bg-red-500" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between pl-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", row.dot)} />
                      <span className="text-[12px] text-slate-500">{row.label}</span>
                    </div>
                    <span className={cn("text-[12px] font-semibold", row.color)}>
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout Readiness Queue — live */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-slate-900">
                  Payout Readiness Queue
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {liveSummary?.approvedToPay ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { color: "bg-emerald-500", ring: "ring-emerald-200", label: "Approved to Pay", count: liveSummary?.approvedToPay ?? 0, amount: liveSummary?.supplierPaymentQueue ?? 0 },
                  { color: "bg-amber-500", ring: "ring-amber-200", label: "Awaiting Review", count: liveSummary?.awaitingReview ?? 0, amount: null as number | null },
                  { color: "bg-red-500", ring: "ring-red-200", label: "Overdue", count: liveSummary?.overdue ?? 0, amount: null as number | null },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center ring-2 shrink-0", row.color, row.ring)}>
                      <span className="text-white text-[11px] font-bold">{row.count}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-slate-900">{row.label}</div>
                      <div className="text-[11px] text-slate-400">{row.count} bill{row.count === 1 ? "" : "s"}</div>
                    </div>
                    {row.amount !== null && (
                      <span className="text-[12px] font-semibold text-slate-900 shrink-0">
                        {fmtGBP(row.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardContainer>

    </div>
  )
}
