"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  ChevronRight, Check, Plus, Trash2, Upload, AlertTriangle,
  ArrowLeft, Building2, Briefcase, User, Receipt, FileText,
  CreditCard, ClipboardList,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { useWorkspace } from "@/providers/AuthProvider"
import { useCreateMoneyBill } from "@/hooks/useMoneyData"
import type { InsertMoneyBill } from "@/hooks/useMoneyData"
import { createClient } from "@/lib/supabase/client"

// ── Types ─────────────────────────────────────────────────────────────────────

type BillType =
  | "maintenance_bill"
  | "renovation_bill"
  | "utility_bill"
  | "compliance_bill"
  | "insurance_bill"
  | "professional_fee"
  | "landlord_rent_bill"

interface LineItem {
  id: string
  description: string
  qty: number
  unit_price: number
  tax_rate: number
}

interface WizardState {
  // Step 1
  bill_type: BillType | ""
  bill_number: string
  issue_date: string
  due_date: string
  // Step 2
  supplier: string
  supplier_reference: string
  // Step 3
  property: string
  unit: string
  job: string
  // Step 4
  line_items: LineItem[]
  // Step 5
  invoice_file: File | null
  // Step 6
  approval_required: boolean
  approval_notes: string
  payment_method: string
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

const PAYMENT_METHODS = ["Bank Transfer (BACS)", "Faster Payments", "CHAPS", "Direct Debit", "Cheque", "Stripe Connect"]

const STEPS = [
  { num: 1, label: "Bill Basics", icon: Receipt },
  { num: 2, label: "Supplier", icon: User },
  { num: 3, label: "Link Records", icon: Building2 },
  { num: 4, label: "Line Items", icon: ClipboardList },
  { num: 5, label: "Upload Invoice", icon: Upload },
  { num: 6, label: "Approval & Payment", icon: CreditCard },
  { num: 7, label: "Review & Create", icon: FileText },
]

function genBillNumber() {
  const year = new Date().getFullYear()
  const seq = crypto.randomUUID().slice(0, 5).toUpperCase()
  return `BILL-${year}-${seq}`
}

function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", qty: 1, unit_price: 0, tax_rate: 20 }
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full h-10 px-3 rounded-lg text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
const selectCls =
  "w-full h-10 px-3 rounded-lg text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"

// ── Main Component ────────────────────────────────────────────────────────────

export default function NewBillPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const createBill = useCreateMoneyBill(workspace?.id)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

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

  const [form, setForm] = useState<WizardState>({
    bill_type: "",
    bill_number: `BILL-${new Date().getFullYear()}-000`,
    issue_date: "",
    due_date: "",
    supplier: "",
    supplier_reference: "",
    property: "",
    unit: "",
    job: "",
    line_items: [{ id: "init-0", description: "", qty: 1, unit_price: 0, tax_rate: 20 }],
    invoice_file: null,
    approval_required: true,
    approval_notes: "",
    payment_method: "Bank Transfer (BACS)",
  })

  useEffect(() => {
    setForm(f => ({
      ...f,
      bill_number: genBillNumber(),
      issue_date: new Date().toISOString().split("T")[0],
    }))
  }, [])

  function setField<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Line item helpers
  function updateLineItem(id: string, key: keyof LineItem, value: string | number) {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.map((li) =>
        li.id === id ? { ...li, [key]: value } : li
      ),
    }))
  }

  function removeLineItem(id: string) {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((li) => li.id !== id),
    }))
  }

  function addLineItem() {
    setForm((prev) => ({ ...prev, line_items: [...prev.line_items, newLineItem()] }))
  }

  // Totals
  const subtotal = form.line_items.reduce((s, li) => s + li.qty * li.unit_price, 0)
  const totalTax = form.line_items.reduce((s, li) => s + li.qty * li.unit_price * (li.tax_rate / 100), 0)
  const grandTotal = subtotal + totalTax
  // form.property holds the selected property id; resolve its address for display.
  const selectedPropertyLabel = dbProperties.find((p) => p.id === form.property)?.address || ""

  async function handleSubmit() {
    setSubmitError(null)
    if (!workspace?.id) { setSubmitError("Workspace not loaded — please refresh."); return }
    if (grandTotal <= 0) { setSubmitError("Bill total must be greater than £0. Add line item prices."); setStep(4); return }
    if (!form.due_date) { setSubmitError("Due date is required."); setStep(1); return }
    if (form.issue_date && new Date(form.due_date) < new Date(form.issue_date)) { setSubmitError("Due date cannot be before the issue date."); setStep(1); return }

    setSubmitting(true)
    try {
      const propertyLabel = dbProperties.find((p) => p.id === form.property)?.address || ""
      const description = [
        BILL_TYPES.find((t) => t.value === form.bill_type)?.label,
        form.supplier && `from ${form.supplier}`,
        propertyLabel && `(${propertyLabel})`,
      ].filter(Boolean).join(" ")

      const payload: InsertMoneyBill = {
        workspace_id: workspace.id,
        property_id: form.property || null,
        supplier_id: form.supplier || null,
        amount: Math.round(grandTotal * 100) / 100,
        due_date: form.due_date,
        approval_status: form.approval_required ? "pending_review" : "approved",
        payment_status: "unpaid",
        description: description || null,
        reference: (form.supplier_reference.trim() || form.bill_number.trim()) || null,
        paid_at: null,
        approved_at: form.approval_required ? null : new Date().toISOString(),
      }
      const created = await createBill.mutateAsync(payload)
      setCreatedId(created.id)
      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create bill. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bill Created</h2>
            <p className="text-slate-500 text-sm mt-1">
              {form.bill_number} has been created{form.approval_required ? " and sent for approval" : ""}.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" className="w-full" onClick={() => { if (createdId) router.push(`/property-manager/money/bills/${createdId}`) }}>
              View Bill
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setDone(false); setCreatedId(null); setStep(1); setForm({ bill_type: "", bill_number: genBillNumber(), issue_date: new Date().toISOString().split("T")[0], due_date: "", supplier: "", supplier_reference: "", property: "", unit: "", job: "", line_items: [newLineItem()], invoice_file: null, approval_required: true, approval_notes: "", payment_method: "Bank Transfer (BACS)" }) }}>
              Add Another Bill
            </Button>
            <Link href="/property-manager/money/bills">
              <Button variant="ghost" className="w-full">
                Back to Bills
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Step Content ──────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Field label="Bill Type">
              <select value={form.bill_type} onChange={(e) => setField("bill_type", e.target.value as BillType)} className={selectCls}>
                <option value="">Select bill type…</option>
                {BILL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Bill Number">
              <input value={form.bill_number} onChange={(e) => setField("bill_number", e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Issue Date">
                <input type="date" value={form.issue_date} onChange={(e) => setField("issue_date", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Due Date">
                <input type="date" value={form.due_date} onChange={(e) => setField("due_date", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <Field label="Supplier">
              <select value={form.supplier} onChange={(e) => setField("supplier", e.target.value)} className={selectCls}>
                <option value="">Select supplier…</option>
                {dbSuppliers.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Supplier Reference Number">
              <input
                value={form.supplier_reference}
                onChange={(e) => setField("supplier_reference", e.target.value)}
                placeholder="e.g. INV-20891"
                className={inputCls}
              />
            </Field>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">All fields optional — link this bill to a property, unit, and job.</p>
            <Field label="Property">
              <select value={form.property} onChange={(e) => setField("property", e.target.value)} className={selectCls}>
                <option value="">No property linked</option>
                {dbProperties.map((p) => (
                  <option key={p.id} value={p.id}>{p.address || "Unnamed property"}</option>
                ))}
              </select>
            </Field>
            <Field label="Unit / Flat">
              <input
                value={form.unit}
                onChange={(e) => setField("unit", e.target.value)}
                placeholder="e.g. Flat 2"
                className={inputCls}
              />
            </Field>
            <Field label="Linked Job">
              <select value={form.job} onChange={(e) => setField("job", e.target.value)} className={selectCls}>
                <option value="">No job linked</option>
                {dbJobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </Field>
          </div>
        )

      case 4:
        return (
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
                          <input
                            value={li.description}
                            onChange={(e) => updateLineItem(li.id, "description", e.target.value)}
                            placeholder="Description"
                            className="w-full h-8 px-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                          />
                        </td>
                        <td className="py-2 pr-1">
                          <input
                            type="number"
                            min={1}
                            value={li.qty}
                            onChange={(e) => updateLineItem(li.id, "qty", Number(e.target.value))}
                            className="w-full h-8 px-2 rounded border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                          />
                        </td>
                        <td className="py-2 pr-1">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">£</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={li.unit_price}
                              onChange={(e) => updateLineItem(li.id, "unit_price", Number(e.target.value))}
                              className="w-full h-8 pl-5 pr-2 rounded border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                            />
                          </div>
                        </td>
                        <td className="py-2 pr-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={li.tax_rate}
                            onChange={(e) => updateLineItem(li.id, "tax_rate", Number(e.target.value))}
                            className="w-full h-8 px-2 rounded border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
                          />
                        </td>
                        <td className="py-2 pr-1 text-right text-sm font-medium text-slate-900 whitespace-nowrap">
                          £{lineTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => removeLineItem(li.id)}
                            disabled={form.line_items.length === 1}
                            className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={addLineItem}
              className="flex items-center gap-2 text-sm text-[var(--brand)] hover:text-[var(--brand)] font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
            {/* Totals */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>£{subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>VAT / Tax</span>
                <span>£{totalTax.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Total</span>
                <span>£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Upload the supplier&apos;s invoice PDF for your records. This step is optional.
            </p>
            {form.invoice_file ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">{form.invoice_file.name}</p>
                  <p className="text-xs text-emerald-600">{(form.invoice_file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => setField("invoice_file", null)} className="text-emerald-600 hover:text-emerald-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-[var(--color-brand-300)] bg-slate-50 hover:bg-[var(--brand-soft)]/30 transition-all p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Upload Supplier Invoice PDF</p>
                    <p className="text-xs text-slate-500 mt-0.5">Drag and drop or click to browse</p>
                  </div>
                  <p className="text-xs text-slate-300">PDF up to 25 MB</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setField("invoice_file", file)
                  }}
                />
              </label>
            )}
            <button
              onClick={() => setStep(6)}
              className="text-sm text-slate-500 hover:text-slate-600 underline underline-offset-2"
            >
              Skip this step
            </button>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            {/* Stripe callout */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Stripe Connect not configured</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Connect your Stripe account in Settings to enable direct pay-out to suppliers.
                </p>
              </div>
            </div>

            <Field label="Approval Required">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setField("approval_required", !form.approval_required)}
                  className={cn(
                    "relative w-10 h-5.5 rounded-full transition-colors",
                    form.approval_required ? "bg-[var(--brand)]" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform",
                      form.approval_required ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
                <span className="text-sm text-slate-700">
                  {form.approval_required ? "Approval required before payment" : "No approval needed"}
                </span>
              </div>
            </Field>

            {form.approval_required && (
              <Field label="Approval Notes">
                <textarea
                  value={form.approval_notes}
                  onChange={(e) => setField("approval_notes", e.target.value)}
                  placeholder="e.g. Please approve by 2026-06-10 for BACS run"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] resize-none"
                />
              </Field>
            )}

            <Field label="Payment Method">
              <select value={form.payment_method} onChange={(e) => setField("payment_method", e.target.value)} className={selectCls}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>
        )

      case 7:
        return (
          <div className="space-y-5">
            <ReviewRow label="Bill Type" value={BILL_TYPES.find((t) => t.value === form.bill_type)?.label ?? "—"} />
            <ReviewRow label="Bill Number" value={form.bill_number} />
            <ReviewRow label="Issue Date" value={form.issue_date || "—"} />
            <ReviewRow label="Due Date" value={form.due_date || "—"} />
            <ReviewRow label="Supplier" value={form.supplier || "—"} />
            <ReviewRow label="Supplier Reference" value={form.supplier_reference || "—"} />
            <ReviewRow label="Property" value={selectedPropertyLabel || "None"} />
            <ReviewRow label="Linked Job" value={form.job || "None"} />
            <ReviewRow label="Line Items" value={`${form.line_items.length} items`} />
            <ReviewRow label="Subtotal" value={`£${subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} />
            <ReviewRow label="VAT" value={`£${totalTax.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} />
            <div className="flex items-center justify-between py-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-lg font-bold text-[var(--brand)]">£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
            </div>
            <ReviewRow label="Invoice PDF" value={form.invoice_file ? form.invoice_file.name : "Not uploaded"} />
            <ReviewRow label="Approval Required" value={form.approval_required ? "Yes" : "No"} />
            <ReviewRow label="Payment Method" value={form.payment_method} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileTopBar title="Create Bill" subtitle={`Step ${step} of ${STEPS.length}`} showBack backHref="/property-manager/money/bills" />
      {/* Top bar */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-5 md:px-7 py-4 items-center gap-3">
        <Link href="/property-manager/money/bills" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" />
          Bills
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-sm font-medium text-slate-900">Create Bill</span>
      </div>

      <div className="px-5 md:px-7 lg:px-8 py-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Left Stepper ─────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-60 shrink-0 sticky top-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
              {STEPS.map((s) => {
                const Icon = s.icon
                const isCompleted = s.num < step
                const isActive = s.num === step
                return (
                  <button
                    key={s.num}
                    onClick={() => s.num < step && setStep(s.num)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                      isActive && "bg-[var(--brand-soft)] text-[var(--brand)]",
                      !isActive && isCompleted && "hover:bg-slate-50 text-slate-600 cursor-pointer",
                      !isActive && !isCompleted && "text-slate-400 cursor-default"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isActive && "bg-[var(--brand)] text-white",
                        isCompleted && "bg-emerald-500 text-white",
                        !isActive && !isCompleted && "bg-slate-100 text-slate-400"
                      )}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-medium">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* ── Center Card ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[var(--brand)] uppercase tracking-wide">
                    Step {step} of {STEPS.length}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{STEPS[step - 1].label}</h2>
              </div>
              <div className="px-6 py-6">{renderStep()}</div>
              {submitError && (
                <div className="px-6 pb-3">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
                </div>
              )}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <Button variant="outline" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1}>
                  Back
                </Button>
                {step < 7 ? (
                  <Button variant="primary" onClick={() => setStep(step + 1)}>
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                    Create Bill
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Summary Rail ────────────────────────────────────────── */}
          <aside className="w-full lg:w-70 shrink-0 lg:sticky lg:top-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bill Preview</h3>
              </div>

              <div className="space-y-3">
                <SummaryRow label="Bill #" value={form.bill_number} mono />
                <SummaryRow label="Type" value={BILL_TYPES.find((t) => t.value === form.bill_type)?.label ?? "—"} />
                <SummaryRow label="Supplier" value={form.supplier || "—"} />
                <SummaryRow label="Property" value={selectedPropertyLabel || "—"} />
                <SummaryRow label="Job" value={form.job || "—"} mono />
                <SummaryRow label="Due Date" value={form.due_date || "—"} />
                <SummaryRow label="Lines" value={`${form.line_items.length} item${form.line_items.length !== 1 ? "s" : ""}`} />
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>£{subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>VAT</span>
                  <span>£{totalTax.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-[var(--brand)]">£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-900 text-right">{value}</span>
    </div>
  )
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn("text-xs font-medium text-slate-700 text-right truncate max-w-[140px]", mono && "font-mono")}>
        {value}
      </span>
    </div>
  )
}
