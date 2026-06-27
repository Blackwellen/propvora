"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Check, AlertCircle, CreditCard, Download, ExternalLink,
  FileText, Building2, Briefcase, User, Clock, Plus, Receipt,
  ChevronRight, X, Trash2,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { uploadFile } from "@/lib/upload"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { StripeConnectButton } from "@/components/payments/StripeConnectButton"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobileTabs from "@/components/mobile/MobileTabs"

// ── Types ─────────────────────────────────────────────────────────────────────

type BillStatus = "awaiting_review" | "approved" | "overdue" | "paid" | "scheduled_for_payment" | "disputed"

interface LineItem { id: string; description: string; qty: number; unit_price: number; tax_rate: number; line_total: number }

interface PaymentRow {
  id: string
  date: string
  method: string | null
  amount: number
  reference: string | null
}

interface AuditRow {
  id: string
  ts: string
  user: string
  action: string
  detail: string
}

interface BillDoc {
  id: string
  name: string
  url: string | null
  mime: string | null
  size: number | null
  created_at: string | null
}

interface BillDetail {
  id: string
  bill_number: string
  supplier: string
  supplier_email: string
  supplier_phone: string
  bill_type: string
  property: string
  unit: string
  job: string | null
  job_title: string | null
  // Real linkable record ids (route to detail pages):
  contact_id: string | null
  property_ref: string | null
  unit_ref: string | null
  job_ref: string | null
  amount: number
  subtotal: number
  tax: number
  paid: number
  currency: string
  due_date: string
  issue_date: string
  status: BillStatus
  approval_required: boolean
  notes: string
  line_items: LineItem[]
  created_by: string
  created_at: string
  updated_at: string
}

// ── Blank placeholder (no fabricated data — live fetch hydrates real values) ────

function blankBill(id: string): BillDetail {
  return {
    id, bill_number: "", supplier: "Supplier", supplier_email: "", supplier_phone: "",
    bill_type: "supplier_invoice", property: "—", unit: "—", job: null, job_title: null,
    contact_id: null, property_ref: null, unit_ref: null, job_ref: null,
    amount: 0, subtotal: 0, tax: 0, paid: 0, currency: "GBP", due_date: "", issue_date: "",
    status: "awaiting_review", approval_required: true, notes: "",
    line_items: [],
    created_by: "—", created_at: "", updated_at: "",
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

// Live `bills.bill_type` values mapped to human labels (safe fallback for unknowns).
const TYPE_LABEL: Record<string, string> = {
  supplier_invoice: "Supplier Invoice",
  maintenance_bill: "Maintenance",
  renovation_bill: "Renovation",
  utility_bill: "Utility",
  compliance_bill: "Compliance",
  insurance_bill: "Insurance",
  professional_fee: "Professional Fee",
  landlord_rent_bill: "Landlord Rent",
}
function typeLabel(t: string): string {
  return TYPE_LABEL[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// Map a live `bills.status` value onto the BillStatus UI type.
function liveToBillStatus(s: string): BillStatus {
  switch (s) {
    case "paid":
    case "part_paid":
    case "reconciled": return "paid"
    case "overdue": return "overdue"
    case "scheduled_for_payment": return "scheduled_for_payment"
    case "disputed": return "disputed"
    case "approved": return "approved"
    default: return "awaiting_review"
  }
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

// Format money against the bill's own currency (i18n-safe — never raw £ concat).
function gbp(n: number, currency = "GBP"): string {
  return formatCurrency(Number.isFinite(n) ? n : 0, currency)
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

function initials(name: string) { return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() }
function supplierColor(name: string) {
  const colors = ["#2563EB","#7C3AED","#059669","#D97706","#DC2626","#0284C7","#DB2777","#65A30D"]
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return colors[Math.abs(h) % colors.length]
}

const TABS = ["Overview","Line Items","Payment","Supplier Invoice","Linked Job","Documents","Activity","Audit"]

// ── Record Payment Modal ──────────────────────────────────────────────────────

interface PaymentInput { date: string; amount: number; method: string; reference: string }

function RecordPaymentModal({ bill, onClose, onRecord }: { bill: BillDetail; onClose: () => void; onRecord: (p: PaymentInput) => Promise<void> }) {
  const outstanding = Math.max(bill.amount - bill.paid, 0)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState(String(outstanding > 0 ? outstanding : bill.amount))
  const [method, setMethod] = useState("Bank Transfer (BACS)")
  const [ref, setRef] = useState("")
  const [err, setErr] = useState<string | null>(null)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount || "0")
    if (!amt || amt <= 0) { setErr("Enter a payment amount greater than zero."); return }
    setSaving(true); setErr(null)
    try {
      await onRecord({ date, amount: amt, method, reference: ref.trim() })
      onClose()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not record payment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Record Payment</h3>
          <button aria-label="Close" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handle} className="space-y-3">
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Payment Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount (£)</label>
            <input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]">
              {["Bank Transfer (BACS)","Faster Payments","CHAPS","Direct Debit","Cheque","Card"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reference</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. BACS-20240610" className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]" />
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
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : ""

  const [bill, setBill] = useState<BillDetail>(() => blankBill(id))
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [docs, setDocs] = useState<BillDoc[]>([])
  const [auditRows, setAuditRows] = useState<AuditRow[]>([])
  const [supplierBillCount, setSupplierBillCount] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Load real payments for this bill from the `payments` ledger.
  const loadPayments = useCallback(async () => {
    if (!id) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("id, payment_date, payment_method, amount, reference, created_at")
        .eq("linked_type", "bill")
        .eq("linked_id", id)
        .order("payment_date", { ascending: false })
      if (error) return
      setPayments((data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        date: ((r.payment_date ?? r.created_at) as string) ?? "",
        method: (r.payment_method as string) ?? null,
        amount: num(r.amount),
        reference: (r.reference as string) ?? null,
      })))
    } catch { /* payments table may not exist — stay empty */ }
  }, [id])

  // Load documents attached to this bill (category 'bill', metadata.bill_id === id).
  const loadDocs = useCallback(async () => {
    if (!id || !workspace?.id) return
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, url, mime_type, size_bytes, created_at, metadata")
        .eq("workspace_id", workspace.id)
        .eq("category", "bill")
        .order("created_at", { ascending: false })
      if (error) return
      const linked = (data ?? []).filter((r: Record<string, unknown>) => {
        const m = r.metadata as { bill_id?: string } | null
        return m?.bill_id === id
      })
      setDocs(linked.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: r.name as string,
        url: (r.url as string) ?? null,
        mime: (r.mime_type as string) ?? null,
        size: (r.size_bytes as number) ?? null,
        created_at: (r.created_at as string) ?? null,
      })))
    } catch { /* documents table may not exist — stay empty */ }
  }, [id, workspace?.id])

  // Main fetch: real bill + joined supplier/property/unit/job + line items.
  useEffect(() => {
    if (!id || !workspace?.id) return
    setLoading(true)
    const supabase = createClient();
    (async () => {
      try {
        // NOTE: bills.unit_id → units and bills.job_id → jobs have no FK constraint
        // registered, so PostgREST cannot embed them (it 400s). Only contacts +
        // properties have working FK relationships; unit/job are fetched separately.
        const { data, error } = await supabase
          .from("bills")
          .select("*, contacts!supplier_contact_id(display_name, email, phone), properties(address_line1)")
          .eq("id", id)
          .eq("workspace_id", workspace.id)
          .maybeSingle()
        if (error) {
          if (error.code === "42P01") { setLoading(false); return }
          throw error
        }
        if (!data) { setNotFound(true); setLoading(false); return }

        const r = data as Record<string, unknown>
        const supplierJoin = r.contacts as { display_name?: string; email?: string; phone?: string } | null
        const propertyJoin = r.properties as { address_line1?: string } | null

        // Resolve unit + job labels separately (no embeddable FK relationship).
        let unitLabel = "—"
        let jobTitle: string | null = null
        let jobRefLabel: string | null = null
        if (r.unit_id) {
          const { data: u } = await supabase.from("units").select("label").eq("id", r.unit_id as string).maybeSingle()
          if (u?.label) unitLabel = u.label as string
        }
        if (r.job_id) {
          const { data: j } = await supabase.from("jobs").select("title, reference").eq("id", r.job_id as string).maybeSingle()
          if (j) { jobTitle = (j.title as string) ?? null; jobRefLabel = (j.reference as string) ?? null }
        }
        const total = num(r.total)

        setBill({
          id: r.id as string,
          bill_number: (r.bill_number as string) ?? "",
          supplier: supplierJoin?.display_name ?? "Supplier",
          supplier_email: supplierJoin?.email ?? "",
          supplier_phone: supplierJoin?.phone ?? "",
          bill_type: (r.bill_type as string) ?? "supplier_invoice",
          property: propertyJoin?.address_line1 ?? "—",
          unit: unitLabel,
          job: jobRefLabel ?? jobTitle ?? null,
          job_title: jobTitle,
          contact_id: (r.supplier_contact_id as string) ?? null,
          property_ref: (r.property_id as string) ?? null,
          unit_ref: (r.unit_id as string) ?? null,
          job_ref: (r.job_id as string) ?? null,
          amount: total,
          subtotal: num(r.subtotal) || total,
          tax: num(r.tax_amount),
          paid: 0, // hydrated from real payments below
          currency: (r.currency as string) ?? "GBP",
          due_date: (r.due_date as string) ?? "",
          issue_date: (r.issue_date as string) ?? "",
          status: liveToBillStatus((r.status as string) ?? "awaiting_review"),
          approval_required: true,
          notes: (r.notes as string) ?? "",
          line_items: [],
          created_by: (r.created_by as string) ?? "—",
          created_at: (r.created_at as string) ?? "",
          updated_at: (r.updated_at as string) ?? "",
        })
        setIsLive(true)

        // Line items
        try {
          const { data: lines } = await supabase
            .from("bill_lines")
            .select("id, description, quantity, unit_price, tax_rate, line_total, sort_order")
            .eq("bill_id", id)
            .order("sort_order", { ascending: true })
          if (lines) {
            setBill((prev) => ({
              ...prev,
              line_items: lines.map((l: Record<string, unknown>) => ({
                id: l.id as string,
                description: (l.description as string) ?? "",
                qty: num(l.quantity),
                unit_price: num(l.unit_price),
                tax_rate: num(l.tax_rate),
                line_total: num(l.line_total),
              })),
            }))
          }
        } catch { /* bill_lines may not exist — keep empty */ }

        // Supplier history (real count of other bills from same supplier)
        if (r.supplier_contact_id) {
          try {
            const { count } = await supabase
              .from("bills")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspace.id)
              .eq("supplier_contact_id", r.supplier_contact_id as string)
              .neq("id", id)
            setSupplierBillCount(count ?? 0)
          } catch { /* ignore */ }
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [id, workspace?.id])

  // Hydrate `paid` from real payments whenever they change.
  useEffect(() => {
    const paid = payments.reduce((s, p) => s + p.amount, 0)
    setBill((prev) => (prev.paid === paid ? prev : { ...prev, paid }))
  }, [payments])

  useEffect(() => { loadPayments() }, [loadPayments])
  useEffect(() => { loadDocs() }, [loadDocs])

  // Audit log (real)
  useEffect(() => {
    if (!id) return
    const supabase = createClient();
    (async () => {
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("resource_type", "bill")
          .eq("resource_id", id)
          .order("created_at", { ascending: false })
        if (!error) {
          setAuditRows((data ?? []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            ts: ((r.created_at as string) ?? "").slice(0, 16).replace("T", " "),
            user: (r.actor_email ?? r.user_email ?? r.user_id ?? "system") as string,
            action: (r.action ?? r.event_type ?? "") as string,
            detail: (r.detail ?? r.description ?? "") as string,
          })))
        }
      } catch { /* audit_logs may not exist — stay empty */ }
    })()
  }, [id])

  // Persist a field to the live `bills` row (only meaningful when isLive).
  async function saveField(field: string, value: string | number | null) {
    const supabase = createClient()
    let patch: Record<string, unknown>
    if (field === "amount") {
      patch = { subtotal: value, total: value }
    } else if (field === "notes") {
      patch = { notes: value }
    } else {
      patch = { [field]: value } // due_date etc. map 1:1
    }
    const { error } = await supabase
      .from("bills")
      .update(patch)
      .eq("id", bill.id)
      .eq("workspace_id", workspace?.id ?? "")
    if (error) {
      if (error.code === "42P01") { showToast("Bills table not provisioned yet"); return }
      throw error
    }
  }

  // Update the live `bills.status` column from a UI status value.
  async function setBillStatus(uiStatus: BillStatus, label: string) {
    if (!isLive) { showToast("Demo bill — actions persist once the bill is saved"); return }
    const supabase = createClient()
    const patch: Record<string, unknown> =
      uiStatus === "paid" ? { status: "paid", paid_at: new Date().toISOString() }
      : uiStatus === "overdue" ? { status: "overdue" }
      : uiStatus === "disputed" ? { status: "disputed" }
      : uiStatus === "approved" ? { status: "approved", approved_at: new Date().toISOString() }
      : uiStatus === "scheduled_for_payment" ? { status: "scheduled_for_payment" }
      : { status: "awaiting_review" }
    try {
      const { error } = await supabase
        .from("bills")
        .update(patch)
        .eq("id", bill.id)
        .eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      if (error?.code === "42P01") { showToast("Bills table not provisioned yet"); return }
      setBill((prev) => ({ ...prev, status: uiStatus }))
      showToast(label)
    } catch {
      showToast("Could not update bill")
    }
  }

  // Record a real payment row against this bill, then settle status if fully paid.
  async function recordPayment(p: PaymentInput) {
    if (!isLive || !workspace?.id) { showToast("Demo bill — payments persist once the bill is saved"); return }
    const supabase = createClient()
    const { error } = await supabase.from("payments").insert({
      workspace_id: workspace.id,
      payment_type: "outbound",
      linked_type: "bill",
      linked_id: bill.id,
      contact_id: bill.contact_id,
      property_id: bill.property_ref,
      amount: p.amount,
      currency: bill.currency,
      payment_date: p.date,
      payment_method: p.method,
      status: "completed",
      reference: p.reference || null,
    })
    if (error) {
      if (error.code === "42P01") { showToast("Payments table not provisioned yet"); return }
      throw error
    }
    await loadPayments()
    const newPaid = payments.reduce((s, x) => s + x.amount, 0) + p.amount
    if (newPaid >= bill.amount && bill.amount > 0) {
      await setBillStatus("paid", "Payment recorded — bill marked paid")
    } else {
      showToast("Payment recorded")
    }
  }

  async function deleteBill() {
    if (!isLive) { router.push("/property-manager/money/bills"); return }
    const supabase = createClient()
    try {
      const { error } = await supabase.from("bills").delete().eq("id", bill.id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      router.push("/property-manager/money/bills")
    } catch {
      showToast("Could not delete bill")
    }
  }

  // Upload a supporting document to R2 and link it to this bill.
  async function uploadBillDoc(file: File) {
    if (!id || !workspace?.id) { showToast("No workspace found — please refresh and try again"); return }
    setUploading(true)
    try {
      const uploaded = await uploadFile(file, workspace.id, "bills")
      const supabase = createClient()
      const { error: docErr } = await supabase.from("documents").insert({
        workspace_id: workspace.id,
        name: file.name,
        category: "bill",
        mime_type: uploaded.type || file.type || null,
        size_bytes: uploaded.size ?? file.size,
        r2_key: uploaded.key,
        r2_bucket: "propvora",
        url: uploaded.url,
        status: "uploaded",
        metadata: { bill_id: id },
      })
      if (docErr) {
        showToast(docErr.code === "42P01" ? "Documents table not provisioned yet" : (docErr.message ?? "Could not save document"))
        return
      }
      showToast("Document uploaded and linked to bill")
      await loadDocs()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function pickFile() { docInputRef.current?.click() }

  const [activeTab, setActiveTab] = useState("Overview")
  const [showPayModal, setShowPayModal] = useState(false)

  // ── Loading / not-found states ───────────────────────────────────────────────
  if (loading && !isLive && !notFound) {
    return (
      <div className="px-5 md:px-7 lg:px-8 py-6 max-w-[1600px] mx-auto space-y-5 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="h-40 bg-white border border-slate-200 rounded-2xl" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-white border border-slate-200 rounded-xl" />)}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-2xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Receipt className="w-12 h-12 text-slate-300" />
        <p className="text-slate-600 font-medium">Bill not found</p>
        <p className="text-sm text-slate-400 max-w-sm text-center">This bill doesn&apos;t exist, has been deleted, or belongs to another workspace.</p>
        <Link href="/property-manager/money/bills" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Bills
        </Link>
      </div>
    )
  }

  const outstanding = bill.amount - bill.paid
  const paidPct = bill.amount > 0 ? Math.round((bill.paid / bill.amount) * 100) : 0
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
      <input ref={docInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBillDoc(f); e.target.value = "" }} />
      <MobileTopBar
        title={bill.bill_number || "Bill"}
        subtitle={bill.supplier}
        showBack
        backHref="/property-manager/money/bills"
        overflowActions={[
          ...(bill.status === "awaiting_review"
            ? [{ label: "Approve Bill", icon: Check, onClick: () => setBillStatus("approved", "Bill approved") }]
            : []),
          { label: "Record Payment", icon: CreditCard, onClick: () => setShowPayModal(true) },
          { label: "Download PDF", icon: Download, onClick: () => id && window.open(`/api/pdf/invoice/${id}?type=bill`, "_blank") },
        ]}
      />
      {showPayModal && (
        <RecordPaymentModal
          bill={bill}
          onClose={() => setShowPayModal(false)}
          onRecord={recordPayment}
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
        <div className="hidden md:flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/property-manager/money/bills" className="hover:text-slate-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Bills
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-900 font-medium">{bill.bill_number || "Bill"}</span>
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Content ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 w-full space-y-5">
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
                      {bill.due_date && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Due {bill.due_date}
                        </span>
                      )}
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
                        label="Amount"
                        readOnly={bill.status === "paid"}
                        readOnlyReason="Paid bill — amount is locked."
                        displayClassName="text-3xl font-bold text-slate-900"
                        onSave={async (v) => { await saveField("amount", Number(v)); setBill((p) => ({ ...p, amount: Number(v) })) }}
                      />
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-slate-900">{gbp(bill.amount, bill.currency)}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{typeLabel(bill.bill_type)}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap mt-5 pt-4 border-t border-slate-100">
                {bill.status === "awaiting_review" && (
                  <Button variant="success" size="sm" onClick={() => setBillStatus("approved", "Bill approved")}>
                    <Check className="w-4 h-4" /> Approve Bill
                  </Button>
                )}
                <Button variant="destructive-soft" size="sm" onClick={() => setBillStatus("disputed", "Bill marked disputed")}>
                  <AlertCircle className="w-4 h-4" /> Dispute Bill
                </Button>
                <Button variant="soft" size="sm" onClick={() => setShowPayModal(true)}>
                  <CreditCard className="w-4 h-4" /> Record Payment
                </Button>
                <StripeConnectButton onReady={() => setShowPayModal(true)} />
                <Button variant="outline" size="sm" onClick={() => id && window.open(`/api/pdf/invoice/${id}?type=bill`, "_blank")}>
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                {bill.job_ref && (
                  <Link href={`/property-manager/work/jobs/${bill.job_ref}`}>
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
                        { label: "Mark as Paid", icon: Check, onClick: () => setBillStatus("paid", "Bill marked paid"), disabled: bill.status === "paid" },
                        { label: "Approve Bill", icon: Check, onClick: () => setBillStatus("approved", "Bill approved"), disabled: bill.status !== "awaiting_review" },
                        { label: "Download PDF", icon: Download, onClick: () => id && window.open(`/api/pdf/invoice/${id}?type=bill`, "_blank") },
                        { label: "Delete Bill", icon: Trash2, onClick: open, variant: "danger" },
                      ]}
                    />
                  )}
                </ConfirmDialog>
              </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { label: "Subtotal", value: gbp(bill.subtotal, bill.currency), colour: "text-slate-900" },
                { label: "Tax", value: gbp(bill.tax, bill.currency), colour: "text-slate-600" },
                { label: "Total", value: gbp(bill.amount, bill.currency), colour: "text-[var(--brand)] font-bold" },
                { label: "Paid", value: gbp(bill.paid, bill.currency), colour: "text-emerald-600" },
                { label: "Outstanding", value: gbp(outstanding, bill.currency), colour: outstanding > 0 ? "text-red-600 font-bold" : "text-emerald-600" },
              ].map((k) => (
                <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                  <p className={cn("text-sm font-semibold", k.colour)}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Mobile tab strip — same state as desktop */}
            <div className="md:hidden">
              <MobileTabs
                tabs={TABS.map((t) => ({ id: t, label: t }))}
                value={activeTab}
                onChange={setActiveTab}
                aria-label="Bill sections"
              />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="hidden md:block border-b border-slate-200 overflow-x-auto">
                <div className="flex items-center gap-0">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
                        activeTab === tab
                          ? "border-[var(--brand)] text-[var(--brand)]"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-6">
                {activeTab === "Overview" && (
                  <OverviewTab
                    bill={bill}
                    paidPct={paidPct}
                    outstanding={outstanding}
                    isLive={isLive}
                    onSaveNotes={async (v) => { await saveField("notes", v); setBill((p) => ({ ...p, notes: v })) }}
                  />
                )}
                {activeTab === "Line Items" && <LineItemsTab bill={bill} />}
                {activeTab === "Payment" && <PaymentTab bill={bill} payments={payments} onRecordPayment={() => setShowPayModal(true)} />}
                {activeTab === "Supplier Invoice" && <SupplierInvoiceTab docs={docs} uploading={uploading} onUpload={pickFile} />}
                {activeTab === "Linked Job" && <LinkedJobTab bill={bill} />}
                {activeTab === "Documents" && <DocumentsTab docs={docs} uploading={uploading} onUpload={pickFile} />}
                {activeTab === "Activity" && <ActivityTab bill={bill} audit={auditRows} />}
                {activeTab === "Audit" && <AuditTab bill={bill} audit={auditRows} />}
              </div>
            </div>
          </div>

          {/* ── Right Rail ────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-70 shrink-0 lg:sticky lg:top-6 space-y-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quick Actions</h3>
              <div className="space-y-2">
                {bill.status === "awaiting_review" && (
                  <Button variant="success" size="sm" className="w-full justify-start" onClick={() => setBillStatus("approved", "Bill approved")}>
                    <Check className="w-4 h-4" /> Approve Bill
                  </Button>
                )}
                <Button variant="soft" size="sm" className="w-full justify-start" onClick={() => setShowPayModal(true)}>
                  <CreditCard className="w-4 h-4" /> Record Payment
                </Button>
                <StripeConnectButton fullWidth onReady={() => setShowPayModal(true)} />
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => id && window.open(`/api/pdf/invoice/${id}?type=bill`, "_blank")}>
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
              </div>
            </div>

            {/* Bill Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bill Info</h3>
              <div className="space-y-2.5">
                <RailRow label="Created" value={bill.created_at ? bill.created_at.split("T")[0] : "—"} />
                <RailRow label="Updated" value={bill.updated_at ? bill.updated_at.split("T")[0] : "—"} />
                <RailRow label="Bill Type" value={typeLabel(bill.bill_type)} />
                <RailRow label="Issue Date" value={bill.issue_date || "—"} />
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-slate-500 shrink-0">Status</span>
                  <InlineEditField
                    value={bill.status}
                    type="select"
                    options={statusOptions}
                    disabled={!isLive}
                    displayClassName="text-xs font-medium text-slate-700"
                    onSave={async (v) => { await setBillStatus(v as BillStatus, "Status updated") }}
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-slate-500 shrink-0">Due Date</span>
                  <InlineEditField
                    value={bill.due_date}
                    type="date"
                    disabled={!isLive}
                    displayClassName="text-xs font-medium text-slate-700"
                    onSave={async (v) => { await saveField("due_date", v); setBill((p) => ({ ...p, due_date: v })) }}
                  />
                </div>
              </div>
            </div>

            {/* Related */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Related</h3>
              <div className="space-y-2">
                {bill.contact_id ? (
                  <Link href={`/property-manager/contacts/${bill.contact_id}`} className="flex items-center gap-2 text-sm text-[var(--brand)] hover:underline">
                    <User className="w-3.5 h-3.5" /> {bill.supplier}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-slate-400"><User className="w-3.5 h-3.5" /> {bill.supplier}</span>
                )}
                {bill.property_ref ? (
                  <Link href={`/property-manager/portfolio/properties/${bill.property_ref}`} className="flex items-center gap-2 text-sm text-[var(--brand)] hover:underline">
                    <Building2 className="w-3.5 h-3.5" /> {bill.property}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-slate-400"><Building2 className="w-3.5 h-3.5" /> {bill.property}</span>
                )}
                {bill.job_ref && (
                  <Link href={`/property-manager/work/jobs/${bill.job_ref}`} className="flex items-center gap-2 text-sm text-[var(--brand)] hover:underline">
                    <Briefcase className="w-3.5 h-3.5" /> {bill.job}
                  </Link>
                )}
              </div>
            </div>

            {/* Supplier History (real count) */}
            {bill.contact_id && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Supplier History</p>
                <p className="text-xs text-slate-500">
                  {supplierBillCount === null
                    ? "Loading…"
                    : supplierBillCount === 0
                      ? "No other bills from this supplier"
                      : `${supplierBillCount} other bill${supplierBillCount === 1 ? "" : "s"} from ${bill.supplier}`}
                </p>
                <Link href={`/property-manager/money/bills?supplier=${bill.contact_id}`} className="text-xs text-[var(--brand)] hover:underline mt-1 block">
                  View all supplier bills →
                </Link>
              </div>
            )}
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
            <p className="text-xs text-slate-500">
              {[bill.supplier_email, bill.supplier_phone].filter(Boolean).join(" · ") || "No contact details on file"}
            </p>
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
          <span className="text-emerald-600 font-medium">{gbp(bill.paid, bill.currency)} paid</span>
          <span className="text-red-600 font-medium">{gbp(outstanding, bill.currency)} outstanding</span>
        </div>
      </div>

      {/* Approval timeline (derived from real status) */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approval Timeline</p>
        <div className="space-y-3">
          {[
            { label: "Bill created", date: bill.created_at ? bill.created_at.split("T")[0] : "—", done: !!bill.created_at },
            { label: "Awaiting review", date: "", done: bill.status !== "awaiting_review" },
            { label: "Approved", date: "", done: ["approved","paid","scheduled_for_payment"].includes(bill.status) },
            { label: "Payment recorded", date: "", done: bill.status === "paid" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", step.done ? "bg-emerald-500" : "bg-slate-200")}>
                {step.done && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={cn("text-sm", step.done ? "text-slate-700" : "text-slate-400")}>{step.label}</span>
              {step.date && <span className="ml-auto text-xs text-slate-500">{step.date}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LineItemsTab({ bill }: { bill: BillDetail }) {
  if (bill.line_items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Receipt className="w-8 h-8 text-slate-300" />
        <p className="text-sm text-slate-500">No line items on this bill</p>
      </div>
    )
  }
  const subtotal = bill.line_items.reduce((s, li) => s + li.qty * li.unit_price, 0)
  const totalTax = bill.line_items.reduce((s, li) => s + li.qty * li.unit_price * (li.tax_rate / 100), 0)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
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
            const lineTotal = li.line_total || li.qty * li.unit_price * (1 + li.tax_rate / 100)
            return (
              <tr key={li.id}>
                <td className="px-4 py-3 text-slate-700">{li.description}</td>
                <td className="px-4 py-3 text-right text-slate-600">{li.qty}</td>
                <td className="px-4 py-3 text-right text-slate-600">{gbp(li.unit_price, bill.currency)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{li.tax_rate}%</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{gbp(lineTotal, bill.currency)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50">
            <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Subtotal</td>
            <td className="px-4 py-3 text-right font-semibold text-slate-900">{gbp(subtotal, bill.currency)}</td>
          </tr>
          <tr className="border-t border-slate-100 bg-slate-50">
            <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">VAT</td>
            <td className="px-4 py-3 text-right font-semibold text-slate-900">{gbp(totalTax, bill.currency)}</td>
          </tr>
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Total</td>
            <td className="px-4 py-3 text-right font-bold text-[var(--brand)] text-base">{gbp(bill.amount, bill.currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function PaymentTab({ bill, payments, onRecordPayment }: { bill: BillDetail; payments: PaymentRow[]; onRecordPayment: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Payment History</p>
        <Button variant="soft" size="sm" onClick={onRecordPayment}>
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>
      {payments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Date","Method","Amount","Reference"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{p.date}</td>
                  <td className="px-4 py-3 text-slate-700">{p.method ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{gbp(p.amount, bill.currency)}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function fmtSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function SupplierInvoiceTab({ docs, uploading, onUpload }: { docs: BillDoc[]; uploading: boolean; onUpload: () => void }) {
  return (
    <div className="space-y-4">
      {docs.length > 0 ? (
        <div className="space-y-3">
          {docs.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{d.name}</p>
                  <p className="text-xs text-slate-500">
                    {[d.created_at ? d.created_at.split("T")[0] : null, fmtSize(d.size)].filter(Boolean).join(" · ") || "Uploaded"}
                  </p>
                </div>
              </div>
              {d.url && (
                <a href={d.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Download</Button>
                </a>
              )}
            </div>
          ))}
          <Button variant="soft" size="sm" loading={uploading} onClick={onUpload}>
            <Plus className="w-4 h-4" /> Upload another
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FileText className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">No invoice uploaded</p>
            <p className="text-xs text-slate-500 mt-0.5">Upload the supplier&apos;s PDF invoice for your records</p>
          </div>
          <Button variant="soft" size="sm" loading={uploading} onClick={onUpload}>
            <Plus className="w-4 h-4" /> Upload Invoice
          </Button>
        </div>
      )}
    </div>
  )
}

function LinkedJobTab({ bill }: { bill: BillDetail }) {
  if (!bill.job_ref) {
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
              {bill.job_title && <p className="text-xs text-slate-500">{bill.job_title}</p>}
            </div>
          </div>
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
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Bill Total</p>
            <p className="font-medium text-slate-900">{gbp(bill.amount, bill.currency)}</p>
          </div>
        </div>
        <Link href={`/property-manager/work/jobs/${bill.job_ref}`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4" /> Open Job Detail
          </Button>
        </Link>
      </div>
    </div>
  )
}

function DocumentsTab({ docs, uploading, onUpload }: { docs: BillDoc[]; uploading: boolean; onUpload: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Documents</p>
        <Button variant="soft" size="sm" loading={uploading} onClick={onUpload}>
          <Plus className="w-4 h-4" /> Upload
        </Button>
      </div>
      {docs.length > 0 ? (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400">{[d.created_at ? d.created_at.split("T")[0] : null, fmtSize(d.size)].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              {d.url && (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--brand)] hover:underline shrink-0">Download</a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <FileText className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-500">No documents yet</p>
        </div>
      )}
    </div>
  )
}

function ActivityTab({ bill, audit }: { bill: BillDetail; audit: AuditRow[] }) {
  // Real audit events; fall back to the bill's own creation event (real data).
  const events = audit.length > 0
    ? audit.map((a) => ({ date: a.ts || (bill.created_at ? bill.created_at.split("T")[0] : ""), action: a.action.replace(/_/g, " ") || "Updated", user: a.user }))
    : bill.created_at
      ? [{ date: bill.created_at.split("T")[0], action: "Bill created", user: bill.created_by }]
      : []

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Receipt className="w-8 h-8 text-slate-300" />
        <p className="text-sm text-slate-500">No activity recorded yet</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {events.map((e, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm text-slate-700 capitalize">{e.action}</p>
            <p className="text-xs text-slate-500">{[e.date, e.user].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditTab({ bill, audit }: { bill: BillDetail; audit: AuditRow[] }) {
  if (audit.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <FileText className="w-8 h-8 text-slate-300" />
        <p className="text-sm text-slate-500">No audit entries recorded yet</p>
        {bill.created_at && (
          <p className="text-xs text-slate-400">Bill created {bill.created_at.slice(0, 16).replace("T", " ")}</p>
        )}
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Timestamp","User","Action","Detail"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {audit.map((a) => (
            <tr key={a.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">{a.ts}</td>
              <td className="px-4 py-3 text-slate-700">{a.user}</td>
              <td className="px-4 py-3"><Badge variant="primary" size="sm">{(a.action || "—").toUpperCase()}</Badge></td>
              <td className="px-4 py-3 text-slate-600">{a.detail || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-slate-700 text-right">{value}</span>
    </div>
  )
}
