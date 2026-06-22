"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft, ChevronRight, Save, Trash2, AlertTriangle, Plus,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

// ── Types ─────────────────────────────────────────────────────────────────────

type BillStatus = "awaiting_review" | "approved" | "overdue" | "paid" | "scheduled_for_payment" | "disputed"
type BillType = "maintenance_bill" | "renovation_bill" | "utility_bill" | "compliance_bill" | "insurance_bill" | "professional_fee" | "landlord_rent_bill"

interface LineItem { id: string; description: string; qty: number; unit_price: number; tax_rate: number }

interface EditForm {
  bill_type: BillType
  bill_number: string
  status: BillStatus
  issue_date: string
  due_date: string
  notes: string
  supplier: string
  property: string
  job: string
  line_items: LineItem[]
  approval_status: string
  payment_method: string
  paid_amount: number
  paid_date: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BILL_TYPES: { value: BillType; label: string }[] = [
  { value: "maintenance_bill", label: "Maintenance Bill" },
  { value: "renovation_bill", label: "Renovation Bill" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "compliance_bill", label: "Compliance Bill" },
  { value: "insurance_bill", label: "Insurance Bill" },
  { value: "professional_fee", label: "Professional Fee" },
  { value: "landlord_rent_bill", label: "Landlord Rent Bill" },
]

const BILL_STATUSES: { value: BillStatus; label: string }[] = [
  { value: "awaiting_review", label: "Awaiting Review" },
  { value: "approved", label: "Approved" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "scheduled_for_payment", label: "Scheduled for Payment" },
  { value: "disputed", label: "Disputed" },
]

const PAYMENT_METHODS = ["Bank Transfer (BACS)","Faster Payments","CHAPS","Direct Debit","Cheque","Stripe Connect"]

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = "w-full h-10 px-3 rounded-lg text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
const selectCls = "w-full h-10 px-3 rounded-lg text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
const textareaCls = "w-full px-3 py-2.5 rounded-lg text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"

function Field({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={cn("space-y-1.5", span2 && "col-span-2")}>
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="text-slate-400">{icon}</div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", qty: 1, unit_price: 0, tax_rate: 20 }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BillEditPage() {
  const params = useParams()
  const { workspace } = useWorkspace()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "bill-001"

  const [dbSuppliers, setDbSuppliers] = useState<string[]>([])
  const [dbProperties, setDbProperties] = useState<{ id: string; address: string }[]>([])
  const [dbJobs, setDbJobs] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient()
    async function fetchDropdowns() {
      try {
        const [suppliersRes, propertiesRes, jobsRes] = await Promise.all([
          supabase
            .from("contacts")
            .select("id, display_name")
            .eq("workspace_id", workspace!.id)
            .eq("type", "supplier")
            .order("display_name")
            .limit(50),
          supabase
            .from("properties")
            .select("id, address_line1")
            .eq("workspace_id", workspace!.id)
            .order("address_line1")
            .limit(50),
          supabase
            .from("jobs")
            .select("id, title")
            .eq("workspace_id", workspace!.id)
            .neq("status", "complete")
            .order("created_at", { ascending: false })
            .limit(50),
        ])
        if (!suppliersRes.error && suppliersRes.data) {
          setDbSuppliers(suppliersRes.data.map((r: { display_name: string }) => r.display_name).filter(Boolean))
        }
        if (!propertiesRes.error && propertiesRes.data) {
          setDbProperties((propertiesRes.data as { id: string; address_line1: string | null }[]).map(r => ({ id: r.id, address: r.address_line1 ?? "" })))
        }
        if (!jobsRes.error && jobsRes.data) {
          setDbJobs(jobsRes.data as { id: string; title: string }[])
        }
      } catch {
        // 42P01-safe: tables may not exist yet
      }
    }
    fetchDropdowns()
  }, [workspace?.id])

  const [saving, setSaving] = useState(false)
  const [showDangerous, setShowDangerous] = useState(false)
  const [rejectConfirm, setRejectConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  const [form, setForm] = useState<EditForm>({
    bill_type: "maintenance_bill",
    bill_number: `BILL-${id.slice(-3).toUpperCase()}`,
    status: "awaiting_review",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date().toISOString().slice(0, 10),
    notes: "",
    supplier: "",
    property: "",
    job: "",
    line_items: [],
    approval_status: "pending",
    payment_method: "Bank Transfer (BACS)",
    paid_amount: 0,
    paid_date: "",
  })

  // Load the real bill into the form (42P01-tolerant). Maps the live single
  // `status` column onto the UI BillStatus and pulls real dates/number/notes.
  useEffect(() => {
    if (!id || !workspace?.id) return
    const supabase = createClient()
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .eq("id", id)
          .eq("workspace_id", workspace.id)
          .maybeSingle()
        if (error || !data) return // keep blank form; save disabled until live
        const r = data as Record<string, unknown>
        const liveStatus = (r.status as string) ?? "awaiting_review"
        const status: BillStatus =
          liveStatus === "paid" || liveStatus === "part_paid" || liveStatus === "reconciled" ? "paid"
          : liveStatus === "overdue" ? "overdue"
          : liveStatus === "scheduled_for_payment" ? "scheduled_for_payment"
          : liveStatus === "disputed" ? "disputed"
          : liveStatus === "approved" ? "approved"
          : "awaiting_review"
        setForm((prev) => ({
          ...prev,
          bill_number: (r.bill_number as string | null) ?? prev.bill_number,
          status,
          issue_date: ((r.issue_date as string | null) ?? prev.issue_date)?.slice(0, 10),
          due_date: ((r.due_date as string | null) ?? prev.due_date)?.slice(0, 10),
          notes: (r.notes as string | null) ?? "",
          approval_status: status === "approved" ? "approved" : "pending",
          paid_amount: liveStatus === "paid" ? Number(r.total ?? 0) : 0,
        }))
        setIsLive(true)
      } catch { /* table may not exist — keep blank form */ }
    })()
  }, [id, workspace?.id])

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateLineItem(liId: string, key: keyof LineItem, value: string | number) {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.map((li) => (li.id === liId ? { ...li, [key]: value } : li)),
    }))
  }

  function removeLineItem(liId: string) {
    setForm((prev) => ({ ...prev, line_items: prev.line_items.filter((li) => li.id !== liId) }))
  }

  function addLineItem() {
    setForm((prev) => ({ ...prev, line_items: [...prev.line_items, newLineItem()] }))
  }

  const subtotal = form.line_items.reduce((s, li) => s + li.qty * li.unit_price, 0)
  const totalTax = form.line_items.reduce((s, li) => s + li.qty * li.unit_price * (li.tax_rate / 100), 0)
  const grandTotal = subtotal + totalTax

  async function handleSave() {
    if (!isLive) { showToast("This bill isn't in the database yet — nothing to save"); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const liveStatus =
        form.status === "scheduled_for_payment" ? "scheduled_for_payment"
        : form.status
      const { error } = await supabase
        .from("bills")
        .update({
          bill_number: form.bill_number,
          status: liveStatus,
          issue_date: form.issue_date || null,
          due_date: form.due_date || null,
          notes: form.notes || null,
          subtotal: subtotal,
          tax_amount: totalTax,
          total: grandTotal,
        })
        .eq("id", id)
        .eq("workspace_id", workspace?.id ?? "")
      if (error) {
        showToast(error.code === "42P01" ? "Bills table not provisioned yet" : "Could not save changes")
        return
      }
      showToast("Bill saved")
      window.location.assign(`/property-manager/money/bills/${id}`)
    } catch {
      showToast("Could not save changes")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteInput !== form.bill_number) return
    if (!isLive) { window.location.assign("/property-manager/money/bills"); return }
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("bills").delete().eq("id", id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") {
        showToast("Could not delete bill")
        return
      }
      window.location.assign("/property-manager/money/bills")
    } catch {
      showToast("Could not delete bill")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 lg:pb-24">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <span>{toastMsg}</span>
        </div>
      )}
      <MobileTopBar
        title="Edit Bill"
        subtitle={form.bill_number}
        showBack
        backHref={`/property-manager/money/bills/${id}`}
        primaryAction={{ label: "Save Changes", icon: Save, onClick: handleSave }}
      />
      {/* Top bar */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-5 md:px-7 py-4 items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/property-manager/money/bills/${id}`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Bill Detail
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-sm font-medium text-slate-900">Edit Bill</span>
      </div>

      <div className="px-5 md:px-7 lg:px-8 py-6 max-w-[900px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Edit Bill</h1>
            <p className="text-sm text-slate-500 mt-0.5 font-mono">{form.bill_number}</p>
          </div>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>

        {/* Section 1 — Bill Basics */}
        <SectionCard title="Bill Basics" icon={<ChevronDown className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bill Type">
              <select value={form.bill_type} onChange={(e) => setField("bill_type", e.target.value as BillType)} className={selectCls}>
                {BILL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Bill Number">
              <input value={form.bill_number} onChange={(e) => setField("bill_number", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setField("status", e.target.value as BillStatus)} className={selectCls}>
                {BILL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Issue Date">
              <input type="date" value={form.issue_date} onChange={(e) => setField("issue_date", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Due Date">
              <input type="date" value={form.due_date} onChange={(e) => setField("due_date", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Notes" span2>
              <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} className={textareaCls} placeholder="Internal notes about this bill…" />
            </Field>
          </div>
        </SectionCard>

        {/* Section 2 — Supplier */}
        <SectionCard title="Supplier" icon={<ChevronDown className="w-4 h-4" />}>
          <Field label="Supplier Contact">
            <select value={form.supplier} onChange={(e) => setField("supplier", e.target.value)} className={selectCls}>
              <option value="">Select supplier…</option>
              {dbSuppliers.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </SectionCard>

        {/* Section 3 — Line Items */}
        <SectionCard title="Line Items" icon={<ChevronDown className="w-4 h-4" />}>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-2 text-left text-xs font-semibold text-slate-500 pr-2">Description</th>
                    <th className="pb-2 text-right text-xs font-semibold text-slate-500 w-16">Qty</th>
                    <th className="pb-2 text-right text-xs font-semibold text-slate-500 w-24">Unit Price</th>
                    <th className="pb-2 text-right text-xs font-semibold text-slate-500 w-20">Tax %</th>
                    <th className="pb-2 text-right text-xs font-semibold text-slate-500 w-24">Line Total</th>
                    <th className="pb-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.line_items.map((li) => {
                    const lineTotal = li.qty * li.unit_price * (1 + li.tax_rate / 100)
                    return (
                      <tr key={li.id}>
                        <td className="py-2 pr-2">
                          <input value={li.description} onChange={(e) => updateLineItem(li.id, "description", e.target.value)} placeholder="Description" className="w-full h-8 px-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </td>
                        <td className="py-2 pr-1">
                          <input type="number" min={1} value={li.qty} onChange={(e) => updateLineItem(li.id, "qty", Number(e.target.value))} className="w-full h-8 px-2 rounded border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </td>
                        <td className="py-2 pr-1">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">£</span>
                            <input type="number" min={0} step={0.01} value={li.unit_price} onChange={(e) => updateLineItem(li.id, "unit_price", Number(e.target.value))} className="w-full h-8 pl-5 pr-2 rounded border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                          </div>
                        </td>
                        <td className="py-2 pr-1">
                          <input type="number" min={0} max={100} value={li.tax_rate} onChange={(e) => updateLineItem(li.id, "tax_rate", Number(e.target.value))} className="w-full h-8 px-2 rounded border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </td>
                        <td className="py-2 pr-1 text-right text-sm font-medium text-slate-900 whitespace-nowrap">
                          £{lineTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2">
                          <button onClick={() => removeLineItem(li.id)} disabled={form.line_items.length === 1} className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={addLineItem} className="flex items-center gap-2 text-sm text-[#2563EB] hover:text-blue-700 font-medium">
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>£{subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>VAT</span>
                <span>£{totalTax.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Total</span>
                <span>£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 4 — Link Records */}
        <SectionCard title="Link Records" icon={<ChevronDown className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Property">
              <select value={form.property} onChange={(e) => setField("property", e.target.value)} className={selectCls}>
                <option value="">No property linked</option>
                {dbProperties.map((p) => <option key={p.id} value={p.address}>{p.address}</option>)}
              </select>
            </Field>
            <Field label="Linked Job">
              <select value={form.job} onChange={(e) => setField("job", e.target.value)} className={selectCls}>
                <option value="">No job linked</option>
                {dbJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Section 5 — Payment & Approval */}
        <SectionCard title="Payment & Approval" icon={<ChevronDown className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Approval Status">
              <select value={form.approval_status} onChange={(e) => setField("approval_status", e.target.value)} className={selectCls}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </Field>
            <Field label="Payment Method">
              <select value={form.payment_method} onChange={(e) => setField("payment_method", e.target.value)} className={selectCls}>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Paid Amount (£)">
              <input type="number" min={0} step={0.01} value={form.paid_amount} onChange={(e) => setField("paid_amount", Number(e.target.value))} className={inputCls} />
            </Field>
            <Field label="Paid Date">
              <input type="date" value={form.paid_date} onChange={(e) => setField("paid_date", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </SectionCard>

        {/* Dangerous Actions */}
        <div className="rounded-2xl border border-red-200 bg-white overflow-hidden">
          <button
            onClick={() => setShowDangerous(!showDangerous)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">Dangerous Actions</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-red-400 transition-transform", showDangerous && "rotate-180")} />
          </button>

          {showDangerous && (
            <div className="px-6 pb-6 space-y-5 border-t border-red-100">
              {/* Reject Bill */}
              <div className="space-y-2 pt-4">
                <h4 className="text-sm font-semibold text-slate-800">Reject Bill</h4>
                <p className="text-xs text-slate-500">Mark this bill as rejected. This will notify the relevant parties and prevent payment.</p>
                {rejectConfirm ? (
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={() => setRejectConfirm(false)}>Confirm Reject</Button>
                    <Button variant="outline" size="sm" onClick={() => setRejectConfirm(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="destructive-soft" size="sm" onClick={() => setRejectConfirm(true)}>
                    Reject Bill
                  </Button>
                )}
              </div>

              {/* Delete Bill */}
              <div className="space-y-2 pt-2 border-t border-red-100">
                <h4 className="text-sm font-semibold text-slate-800">Delete Bill</h4>
                <p className="text-xs text-slate-500">
                  Permanently delete this bill. This action cannot be undone. Type{" "}
                  <span className="font-mono font-bold">{form.bill_number}</span> to confirm.
                </p>
                <input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={`Type ${form.bill_number} to confirm`}
                  className="w-full h-10 px-3 rounded-lg text-sm border border-red-200 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 placeholder:text-red-300"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  loading={deleting}
                  disabled={deleteInput !== form.bill_number}
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" /> Delete Bill Permanently
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 px-5 md:px-7 py-4 flex items-center justify-between">
        <Link href={`/property-manager/money/bills/${id}`} className="text-sm text-slate-500 hover:text-slate-700">
          Discard changes
        </Link>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>
    </div>
  )
}
