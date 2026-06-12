"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Check, AlertCircle, CreditCard, Download, ExternalLink,
  FileText, Building2, Briefcase, User, Clock, Plus, Receipt,
  ChevronRight, X, Pencil, Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"

// ── Types ─────────────────────────────────────────────────────────────────────

type BillStatus = "awaiting_review" | "approved" | "overdue" | "paid" | "scheduled_for_payment" | "disputed"
type BillType = "maintenance_bill" | "renovation_bill" | "utility_bill" | "compliance_bill" | "insurance_bill" | "professional_fee" | "landlord_rent_bill"

interface LineItem { id: string; description: string; qty: number; unit_price: number; tax_rate: number }

interface BillDetail {
  id: string
  bill_number: string
  supplier: string
  supplier_email: string
  supplier_phone: string
  type: BillType
  property: string
  unit: string
  job: string | null
  job_title: string | null
  job_estimated_cost: number | null
  amount: number
  subtotal: number
  tax: number
  paid: number
  due_date: string
  issue_date: string
  status: BillStatus
  payment_method: string
  approval_required: boolean
  notes: string
  line_items: LineItem[]
  created_by: string
  created_at: string
  updated_at: string
  has_invoice_pdf: boolean
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_BILLS: Record<string, BillDetail> = {
  "bill-001": {
    id: "bill-001", bill_number: "BILL-001", supplier: "Kevin Walsh Plumbing", supplier_email: "kevin@kwplumbing.co.uk", supplier_phone: "07712 345678",
    type: "maintenance_bill", property: "14 Birchwood Rd", unit: "Ground Floor", job: "JOB-2026-034", job_title: "Boiler replacement",
    job_estimated_cost: 350, amount: 320, subtotal: 266.67, tax: 53.33, paid: 0, due_date: "2026-06-15", issue_date: "2026-06-01",
    status: "awaiting_review", payment_method: "Bank Transfer (BACS)", approval_required: true,
    notes: "Boiler replaced on 2026-05-30. Bill includes parts and labour. VAT invoice attached.",
    line_items: [
      { id: "li-1", description: "Boiler replacement — parts", qty: 1, unit_price: 180, tax_rate: 20 },
      { id: "li-2", description: "Labour (4 hrs @ £21.67)", qty: 4, unit_price: 21.67, tax_rate: 20 },
    ],
    created_by: "Alex Johnson", created_at: "2026-06-01T09:00:00Z", updated_at: "2026-06-01T09:00:00Z", has_invoice_pdf: true,
  },
}

function getOrCreateBill(id: string): BillDetail {
  if (MOCK_BILLS[id]) return MOCK_BILLS[id]
  return {
    id, bill_number: `BILL-${id.slice(-3).toUpperCase()}`, supplier: "Example Supplier Ltd",
    supplier_email: "accounts@example.co.uk", supplier_phone: "07700 000000",
    type: "maintenance_bill", property: "14 Birchwood Rd", unit: "Flat 1", job: "JOB-2026-099", job_title: "General maintenance",
    job_estimated_cost: 400, amount: 360, subtotal: 300, tax: 60, paid: 0, due_date: "2026-06-30", issue_date: "2026-06-05",
    status: "awaiting_review", payment_method: "Bank Transfer (BACS)", approval_required: true, notes: "",
    line_items: [
      { id: "li-a", description: "Labour", qty: 3, unit_price: 80, tax_rate: 20 },
      { id: "li-b", description: "Materials", qty: 1, unit_price: 60, tax_rate: 20 },
    ],
    created_by: "Alex Johnson", created_at: "2026-06-05T10:00:00Z", updated_at: "2026-06-05T10:00:00Z", has_invoice_pdf: false,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BillStatus, string> = {
  awaiting_review: "Awaiting Review",
  approved: "Approved",
  overdue: "Overdue",
  paid: "Paid",
  scheduled_for_payment: "Scheduled",
  disputed: "Disputed",
}

const TYPE_LABEL: Record<BillType, string> = {
  maintenance_bill: "Maintenance", renovation_bill: "Renovation", utility_bill: "Utility",
  compliance_bill: "Compliance", insurance_bill: "Insurance", professional_fee: "Professional Fee",
  landlord_rent_bill: "Landlord Rent",
}

function statusVariant(s: BillStatus): "warning" | "primary" | "danger" | "success" | "ai" | "default" {
  switch (s) {
    case "awaiting_review": return "warning"
    case "approved": return "primary"
    case "overdue": return "danger"
    case "paid": return "success"
    case "scheduled_for_payment": return "ai"
    default: return "default"
  }
}

// Reflect a money_bills status patch back onto the BillDetail UI shape
function mapStatusPatch(patch: Record<string, unknown>): Partial<BillDetail> {
  const out: Partial<BillDetail> = {}
  if (patch.approval_status === "approved") out.status = "approved"
  if (patch.payment_status === "paid") { out.status = "paid" }
  if (patch.payment_status === "overdue") out.status = "overdue"
  return out
}

function initials(name: string) { return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() }
function supplierColor(name: string) {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#DC2626","#0284C7","#DB2777","#65A30D"]
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return colors[Math.abs(h) % colors.length]
}

const TABS = ["Overview","Line Items","Payment","Supplier Invoice","Linked Job","Documents","Activity","Audit"]

// ── Record Payment Modal ──────────────────────────────────────────────────────

function RecordPaymentModal({ bill, onClose, onRecord }: { bill: BillDetail; onClose: () => void; onRecord: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState(String(bill.amount))
  const [method, setMethod] = useState(bill.payment_method)
  const [ref, setRef] = useState("")

  async function handle(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await onRecord() } finally { setSaving(false); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Record Payment</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handle} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Payment Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount (£)</label>
            <input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
              {["Bank Transfer (BACS)","Faster Payments","CHAPS","Direct Debit","Cheque"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reference</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. BACS-20240610" className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">Save Payment</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BillDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { workspace } = useWorkspace()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "bill-001"

  const [bill, setBill] = useState<BillDetail>(() => getOrCreateBill(id))
  // Live = a real row was found in money_bills; only then is inline editing persisted
  const [isLive, setIsLive] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Map a live money_bills row onto the BillDetail shape used by the UI
  useEffect(() => {
    if (!id || !workspace?.id) return
    const supabase = createClient();
    (async () => {
      try {
        const { data, error } = await supabase
          .from("money_bills")
          .select("*")
          .eq("id", id)
          .eq("workspace_id", workspace.id)
          .maybeSingle()
        if (error) {
          // 42P01 (table missing) or other — fall back to mock, editing disabled
          return
        }
        if (data) {
          const r = data as Record<string, unknown>
          const approval = (r.approval_status as string) ?? "pending_review"
          const payment = (r.payment_status as string) ?? "unpaid"
          const status: BillStatus =
            payment === "paid" ? "paid"
            : payment === "overdue" ? "overdue"
            : payment === "scheduled" ? "scheduled_for_payment"
            : approval === "approved" ? "approved"
            : "awaiting_review"
          setBill((prev) => ({
            ...prev,
            id: r.id as string,
            amount: (r.amount as number) ?? prev.amount,
            due_date: (r.due_date as string) ?? prev.due_date,
            status,
            notes: (r.description as string | null) ?? prev.notes,
            bill_number: (r.reference as string | null) ?? prev.bill_number,
            paid: payment === "paid" ? ((r.amount as number) ?? prev.amount) : 0,
          }))
          setIsLive(true)
        }
      } catch { /* table may not exist — keep mock */ }
    })()
  }, [id, workspace?.id])

  // Persist a field to the live money_bills row (only called when isLive)
  async function saveField(field: string, value: string | number | null) {
    const supabase = createClient()
    const { error } = await supabase
      .from("money_bills")
      .update({ [field]: value })
      .eq("id", bill.id)
      .eq("workspace_id", workspace?.id ?? "")
    if (error) {
      if (error.code === "42P01") { showToast("Bills table not provisioned yet"); return }
      throw error
    }
  }

  async function setBillStatus(patch: Record<string, unknown>, label: string) {
    if (!isLive) { showToast("Demo bill — actions persist once the bill is saved"); return }
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("money_bills")
        .update(patch)
        .eq("id", bill.id)
        .eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      if (error?.code === "42P01") { showToast("Bills table not provisioned yet"); return }
      setBill((prev) => ({ ...prev, ...mapStatusPatch(patch) }))
      showToast(label)
    } catch {
      showToast("Could not update bill")
    }
  }

  async function deleteBill() {
    if (!isLive) { router.push("/app/money/bills"); return }
    const supabase = createClient()
    try {
      const { error } = await supabase.from("money_bills").delete().eq("id", bill.id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      router.push("/app/money/bills")
    } catch {
      showToast("Could not delete bill")
    }
  }

  const [activeTab, setActiveTab] = useState("Overview")
  const [showPayModal, setShowPayModal] = useState(false)

  const outstanding = bill.amount - bill.paid
  const paidPct = bill.amount > 0 ? Math.round((bill.paid / bill.amount) * 100) : 0
  const costVariance = bill.job_estimated_cost != null ? bill.amount - bill.job_estimated_cost : null
  const color = supplierColor(bill.supplier)

  const statusOptions = [
    { value: "awaiting_review", label: "Awaiting Review" },
    { value: "approved", label: "Approved" },
    { value: "overdue", label: "Overdue" },
    { value: "paid", label: "Paid" },
    { value: "scheduled_for_payment", label: "Scheduled" },
    { value: "disputed", label: "Disputed" },
  ]

  return (
    <div className="space-y-0">
      {showPayModal && (
        <RecordPaymentModal
          bill={bill}
          onClose={() => setShowPayModal(false)}
          onRecord={async () => {
            await setBillStatus({ payment_status: "paid", paid_at: new Date().toISOString() }, "Payment recorded — bill marked paid")
          }}
        />
      )}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="px-5 md:px-7 lg:px-8 py-6 lg:py-7 max-w-[1600px] mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/app/money/bills" className="hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Bills
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-900 font-medium">{bill.bill_number}</span>
        </div>

        {/* Main layout */}
        <div className="flex gap-6 items-start">
          {/* ── Content ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Hero Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Left */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {initials(bill.supplier)}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold text-slate-900">{bill.supplier}</h1>
                      <Badge variant={statusVariant(bill.status)} size="sm" dot>
                        {STATUS_LABEL[bill.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 font-mono">{bill.bill_number}</p>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {bill.property}
                      </span>
                      {bill.job && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-mono">
                          <Briefcase className="w-3 h-3" /> {bill.job}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Due {bill.due_date}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Right amount */}
                <div className="text-right shrink-0">
                  {isLive ? (
                    <div className="flex justify-end">
                      <InlineEditField
                        value={bill.amount}
                        type="number"
                        prefix="£"
                        displayClassName="text-3xl font-bold text-slate-900"
                        onSave={async (v) => { await saveField("amount", Number(v)); setBill((p) => ({ ...p, amount: Number(v) })) }}
                      />
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-slate-900">£{bill.amount.toLocaleString()}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{TYPE_LABEL[bill.type]}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap mt-5 pt-4 border-t border-slate-100">
                {bill.status === "awaiting_review" && (
                  <Button variant="success" size="sm" onClick={() => setBillStatus({ approval_status: "approved", approved_at: new Date().toISOString() }, "Bill approved")}>
                    <Check className="w-4 h-4" /> Approve Bill
                  </Button>
                )}
                <Button variant="destructive-soft" size="sm" onClick={() => setBillStatus({ payment_status: "overdue" }, "Bill marked disputed")}>
                  <AlertCircle className="w-4 h-4" /> Dispute Bill
                </Button>
                <Button variant="soft" size="sm" onClick={() => setShowPayModal(true)}>
                  <CreditCard className="w-4 h-4" /> Record Payment
                </Button>
                <div title="Stripe Connect not configured — go to Settings to enable">
                  <Button variant="outline" size="sm" disabled>
                    <div style={{ color: "#7C3AED" }}><CreditCard className="w-4 h-4" /></div>
                    Pay via Stripe
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => showToast("PDF download requires document service — coming soon")}>
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                {bill.job && (
                  <Link href={`/app/jobs/${bill.job}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" /> Open Linked Job
                    </Button>
                  </Link>
                )}
                <ConfirmDialog
                  title="Delete bill?"
                  description="This permanently removes the bill record. This cannot be undone."
                  confirmLabel="Delete"
                  onConfirm={deleteBill}
                >
                  {(open) => (
                    <ActionMenu
                      items={[
                        { label: "Mark as Paid", icon: Check, onClick: () => setBillStatus({ payment_status: "paid", paid_at: new Date().toISOString() }, "Bill marked paid"), disabled: bill.status === "paid" },
                        { label: "Approve Bill", icon: Check, onClick: () => setBillStatus({ approval_status: "approved", approved_at: new Date().toISOString() }, "Bill approved"), disabled: bill.status !== "awaiting_review" },
                        { label: "Download PDF", icon: Download, onClick: () => showToast("PDF download requires document service — coming soon") },
                        { label: "Delete Bill", icon: Trash2, onClick: open, variant: "danger" },
                      ]}
                    />
                  )}
                </ConfirmDialog>
              </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: "Subtotal", value: `£${bill.subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, colour: "text-slate-900" },
                { label: "Tax", value: `£${bill.tax.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, colour: "text-slate-600" },
                { label: "Total", value: `£${bill.amount.toLocaleString()}`, colour: "text-[#2563EB] font-bold" },
                { label: "Paid", value: `£${bill.paid.toLocaleString()}`, colour: "text-emerald-600" },
                { label: "Outstanding", value: `£${outstanding.toLocaleString()}`, colour: outstanding > 0 ? "text-red-600 font-bold" : "text-emerald-600" },
                ...(costVariance != null ? [{ label: "Cost Variance", value: `${costVariance >= 0 ? "+" : ""}£${costVariance.toLocaleString()}`, colour: costVariance > 0 ? "text-red-600" : "text-emerald-600" }] : []),
              ].map((k) => (
                <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                  <p className={cn("text-sm font-semibold", k.colour)}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 overflow-x-auto">
                <div className="flex items-center gap-0">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
                        activeTab === tab
                          ? "border-[#2563EB] text-[#2563EB]"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === "Overview" && (
                  <OverviewTab
                    bill={bill}
                    paidPct={paidPct}
                    outstanding={outstanding}
                    isLive={isLive}
                    onSaveNotes={async (v) => { await saveField("description", v); setBill((p) => ({ ...p, notes: v })) }}
                  />
                )}
                {activeTab === "Line Items" && <LineItemsTab bill={bill} />}
                {activeTab === "Payment" && <PaymentTab bill={bill} onRecordPayment={() => setShowPayModal(true)} />}
                {activeTab === "Supplier Invoice" && <SupplierInvoiceTab bill={bill} />}
                {activeTab === "Linked Job" && <LinkedJobTab bill={bill} />}
                {activeTab === "Documents" && <DocumentsTab />}
                {activeTab === "Activity" && <ActivityTab bill={bill} />}
                {activeTab === "Audit" && <AuditTab bill={bill} />}
              </div>
            </div>
          </div>

          {/* ── Right Rail ────────────────────────────────────────────────── */}
          <aside className="w-70 shrink-0 sticky top-6 space-y-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quick Actions</h3>
              <div className="space-y-2">
                {bill.status === "awaiting_review" && (
                  <Button variant="success" size="sm" className="w-full justify-start" onClick={() => setBillStatus({ approval_status: "approved", approved_at: new Date().toISOString() }, "Bill approved")}>
                    <Check className="w-4 h-4" /> Approve Bill
                  </Button>
                )}
                <Button variant="soft" size="sm" className="w-full justify-start" onClick={() => setShowPayModal(true)}>
                  <CreditCard className="w-4 h-4" /> Record Payment
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                  <div style={{ color: "#7C3AED" }}><CreditCard className="w-4 h-4" /></div>
                  Pay via Stripe
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => showToast("PDF download requires document service — coming soon")}>
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
              </div>
            </div>

            {/* Bill Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bill Info</h3>
              <div className="space-y-2.5">
                <RailRow label="Created by" value={bill.created_by} />
                <RailRow label="Created" value={bill.created_at.split("T")[0]} />
                <RailRow label="Updated" value={bill.updated_at.split("T")[0]} />
                <RailRow label="Bill Type" value={TYPE_LABEL[bill.type]} />
                <RailRow label="Issue Date" value={bill.issue_date} />
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-slate-400 shrink-0">Status</span>
                  <InlineEditField
                    value={bill.status}
                    type="select"
                    options={statusOptions}
                    disabled={!isLive}
                    displayClassName="text-xs font-medium text-slate-700"
                    onSave={async (v) => {
                      // Map BillStatus -> money_bills approval/payment columns
                      const patch =
                        v === "paid" ? { payment_status: "paid", paid_at: new Date().toISOString() }
                        : v === "overdue" || v === "disputed" ? { payment_status: "overdue" }
                        : v === "approved" ? { approval_status: "approved", approved_at: new Date().toISOString() }
                        : v === "scheduled_for_payment" ? { payment_status: "scheduled" }
                        : { approval_status: "pending_review", payment_status: "unpaid" }
                      const supabase = createClient()
                      const { error } = await supabase.from("money_bills").update(patch).eq("id", bill.id).eq("workspace_id", workspace?.id ?? "")
                      if (error && error.code !== "42P01") throw error
                      setBill((p) => ({ ...p, status: v as BillStatus }))
                    }}
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-slate-400 shrink-0">Due Date</span>
                  <InlineEditField
                    value={bill.due_date}
                    type="date"
                    disabled={!isLive}
                    displayClassName="text-xs font-medium text-slate-700"
                    onSave={async (v) => { await saveField("due_date", v); setBill((p) => ({ ...p, due_date: v })) }}
                  />
                </div>
                <RailRow label="Payment Method" value={bill.payment_method} />
              </div>
            </div>

            {/* Related */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Related</h3>
              <div className="space-y-2">
                <Link href={`/app/contacts`} className="flex items-center gap-2 text-sm text-[#2563EB] hover:underline">
                  <User className="w-3.5 h-3.5" /> {bill.supplier}
                </Link>
                <Link href={`/app/properties`} className="flex items-center gap-2 text-sm text-[#2563EB] hover:underline">
                  <Building2 className="w-3.5 h-3.5" /> {bill.property}
                </Link>
                {bill.job && (
                  <Link href={`/app/jobs/${bill.job}`} className="flex items-center gap-2 text-sm text-[#2563EB] hover:underline">
                    <Briefcase className="w-3.5 h-3.5" /> {bill.job}
                  </Link>
                )}
              </div>
            </div>

            {/* Supplier History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Supplier History</p>
              <p className="text-xs text-slate-500">3 previous bills from {bill.supplier.split(" ")[0]}</p>
              <Link href="/app/money/bills" className="text-xs text-[#2563EB] hover:underline mt-1 block">
                View all supplier bills →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ── Tab Components ────────────────────────────────────────────────────────────

function OverviewTab({ bill, paidPct, outstanding, isLive, onSaveNotes }: { bill: BillDetail; paidPct: number; outstanding: number; isLive: boolean; onSaveNotes: (v: string) => Promise<void> }) {
  return (
    <div className="space-y-6">
      {/* Notes */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
        <InlineEditField
          value={bill.notes}
          type="textarea"
          disabled={!isLive}
          placeholder={isLive ? "Add notes" : (bill.notes || "—")}
          displayClassName="text-sm text-slate-700"
          onSave={onSaveNotes}
        />
      </div>

      {/* Supplier info */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier Details</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: supplierColor(bill.supplier) }}>
            {initials(bill.supplier)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{bill.supplier}</p>
            <p className="text-xs text-slate-500">{bill.supplier_email} · {bill.supplier_phone}</p>
          </div>
        </div>
      </div>

      {/* Payment progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Payment progress</span>
          <span>{paidPct}% paid</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-emerald-600 font-medium">£{bill.paid.toLocaleString()} paid</span>
          <span className="text-red-600 font-medium">£{outstanding.toLocaleString()} outstanding</span>
        </div>
      </div>

      {/* Approval timeline */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approval Timeline</p>
        <div className="space-y-3">
          {[
            { label: "Bill created", date: bill.created_at.split("T")[0], done: true },
            { label: "Awaiting review", date: bill.created_at.split("T")[0], done: bill.status !== "awaiting_review" },
            { label: "Approved", date: "—", done: ["approved","paid","scheduled_for_payment"].includes(bill.status) },
            { label: "Payment recorded", date: "—", done: bill.status === "paid" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", step.done ? "bg-emerald-500" : "bg-slate-200")}>
                {step.done && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={cn("text-sm", step.done ? "text-slate-700" : "text-slate-400")}>{step.label}</span>
              <span className="ml-auto text-xs text-slate-400">{step.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LineItemsTab({ bill }: { bill: BillDetail }) {
  const subtotal = bill.line_items.reduce((s, li) => s + li.qty * li.unit_price, 0)
  const totalTax = bill.line_items.reduce((s, li) => s + li.qty * li.unit_price * (li.tax_rate / 100), 0)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Description", "Qty", "Unit Price", "Tax Rate", "Line Total"].map((h) => (
              <th key={h} className={cn("px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide", h !== "Description" ? "text-right" : "text-left")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bill.line_items.map((li) => {
            const lineTotal = li.qty * li.unit_price * (1 + li.tax_rate / 100)
            return (
              <tr key={li.id}>
                <td className="px-4 py-3 text-slate-700">{li.description}</td>
                <td className="px-4 py-3 text-right text-slate-600">{li.qty}</td>
                <td className="px-4 py-3 text-right text-slate-600">£{li.unit_price.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right text-slate-600">{li.tax_rate}%</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">£{lineTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50">
            <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Subtotal</td>
            <td className="px-4 py-3 text-right font-semibold text-slate-900">£{subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr className="border-t border-slate-100 bg-slate-50">
            <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">VAT</td>
            <td className="px-4 py-3 text-right font-semibold text-slate-900">£{totalTax.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Total</td>
            <td className="px-4 py-3 text-right font-bold text-[#2563EB] text-base">£{bill.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function PaymentTab({ bill, onRecordPayment }: { bill: BillDetail; onRecordPayment: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Payment History</p>
        <Button variant="soft" size="sm" onClick={onRecordPayment}>
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>
      {bill.paid > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Date","Method","Amount","Reference"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-4 py-3 text-slate-700">2026-06-10</td>
              <td className="px-4 py-3 text-slate-700">{bill.payment_method}</td>
              <td className="px-4 py-3 font-semibold text-emerald-700">£{bill.paid.toLocaleString()}</td>
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">BACS-20260610</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">No payments recorded yet</p>
          <Button variant="soft" size="sm" onClick={onRecordPayment}>
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>
      )}
    </div>
  )
}

function SupplierInvoiceTab({ bill }: { bill: BillDetail }) {
  return (
    <div className="space-y-4">
      {bill.has_invoice_pdf ? (
        <div className="rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">supplier-invoice-{bill.bill_number}.pdf</p>
              <p className="text-xs text-slate-500">Uploaded 2026-06-01 · 284 KB</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-100 h-64 flex items-center justify-center">
            <p className="text-sm text-slate-400">PDF preview</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" /> Download Invoice
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FileText className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">No invoice uploaded</p>
            <p className="text-xs text-slate-400 mt-0.5">Upload the supplier&apos;s PDF invoice for your records</p>
          </div>
          <Button variant="soft" size="sm">
            <Plus className="w-4 h-4" /> Upload Invoice
          </Button>
        </div>
      )}
    </div>
  )
}

function LinkedJobTab({ bill }: { bill: BillDetail }) {
  if (!bill.job) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Briefcase className="w-8 h-8 text-slate-300" />
        <p className="text-sm text-slate-500">No job linked to this bill</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{bill.job}</p>
              <p className="text-xs text-slate-500">{bill.job_title}</p>
            </div>
          </div>
          <Badge variant="warning" size="sm" dot>In Progress</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Property</p>
            <p className="font-medium text-slate-900">{bill.property}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Unit</p>
            <p className="font-medium text-slate-900">{bill.unit}</p>
          </div>
          {bill.job_estimated_cost != null && (
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Estimated Cost</p>
              <p className="font-medium text-slate-900">£{bill.job_estimated_cost.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Actual Cost (this bill)</p>
            <p className="font-medium text-slate-900">£{bill.amount.toLocaleString()}</p>
          </div>
        </div>
        <Link href={`/app/jobs/${bill.job}`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4" /> Open Job Detail
          </Button>
        </Link>
      </div>
    </div>
  )
}

function DocumentsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Documents</p>
        <Button variant="soft" size="sm">
          <Plus className="w-4 h-4" /> Upload
        </Button>
      </div>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <FileText className="w-8 h-8 text-slate-300" />
        <p className="text-sm text-slate-500">No documents yet</p>
      </div>
    </div>
  )
}

function ActivityTab({ bill }: { bill: BillDetail }) {
  const events = [
    { date: bill.created_at.split("T")[0], action: "Bill created", user: bill.created_by },
    { date: bill.created_at.split("T")[0], action: "Status set to Awaiting Review", user: "System" },
  ]
  return (
    <div className="space-y-4">
      {events.map((e, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm text-slate-700">{e.action}</p>
            <p className="text-xs text-slate-400">{e.date} · {e.user}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditTab({ bill }: { bill: BillDetail }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Timestamp","User","Action","Field","Old Value","New Value"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">{bill.created_at}</td>
            <td className="px-4 py-3 text-slate-700">{bill.created_by}</td>
            <td className="px-4 py-3"><Badge variant="primary" size="sm">CREATE</Badge></td>
            <td className="px-4 py-3 text-slate-500">—</td>
            <td className="px-4 py-3 text-slate-500">—</td>
            <td className="px-4 py-3 text-slate-700">{bill.bill_number}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-slate-700 text-right">{value}</span>
    </div>
  )
}
