"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check, ChevronRight, Plus, X, AlertTriangle, Sparkles, FileText,
  User, Link2, List, CreditCard, Zap, Mail, Eye, CheckCircle2, ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { useWorkspace } from "@/providers/AuthProvider"
import { useCreateMoneyInvoice } from "@/hooks/useMoneyData"
import type { InsertMoneyInvoice, InvoiceType } from "@/hooks/useMoneyData"
import { createClient } from "@/lib/supabase/client"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

type FormData = {
  invoice_type: string
  invoice_number: string
  issue_date: string
  due_date: string
  notes: string
  recipient_name: string
  recipient_email: string
  billing_address: string
  property: string
  unit: string
  tenancy: string
  job: string
  payment_due_days: string
  late_payment_notes: string
  payment_methods: string[]
  stripe_enabled: boolean
  email_on_send: boolean
  send_to_email: string
  email_template: string
}

/* ------------------------------------------------------------------ */
/* Static constants                                                     */
/* ------------------------------------------------------------------ */
const INVOICE_TYPES = [
  "Rent Invoice", "Service Charge Invoice", "Supplier Recharge", "Management Fee",
  "Utility Recharge Invoice", "Tenant Invoice", "Cleaning Recharge Invoice", "Landlord Charge",
]

const EMAIL_TEMPLATES = ["Basic", "Branded", "Reminder", "Final Notice"]

/* ------------------------------------------------------------------ */
/* Steps config                                                         */
/* ------------------------------------------------------------------ */
const STEPS = [
  { num: 1, label: "Invoice Basics",    icon: FileText },
  { num: 2, label: "Recipient",         icon: User },
  { num: 3, label: "Link Records",      icon: Link2 },
  { num: 4, label: "Line Items",        icon: List },
  { num: 5, label: "Payment Terms",     icon: CreditCard },
  { num: 6, label: "Stripe Link",       icon: Zap },
  { num: 7, label: "Email & PDF",       icon: Mail },
  { num: 8, label: "Review",            icon: Eye },
  { num: 9, label: "Success",           icon: CheckCircle2 },
]

/* ------------------------------------------------------------------ */
/* Input helper                                                         */
/* ------------------------------------------------------------------ */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400",
        props.className
      )}
    />
  )
}
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
    >
      {children}
    </select>
  )
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Line item row                                                        */
/* ------------------------------------------------------------------ */
function LineItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem
  onChange: (updated: LineItem) => void
  onRemove: () => void
}) {
  const lineTotal = item.quantity * item.unit_price * (1 + item.tax_rate / 100)
  return (
    <tr className="border-b border-slate-100 group">
      <td className="px-3 py-2">
        <input
          value={item.description}
          onChange={e => onChange({ ...item, description: e.target.value })}
          placeholder="Description"
          className="w-full text-sm focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2 w-16">
        <input
          type="number"
          value={item.quantity}
          onChange={e => onChange({ ...item, quantity: Number(e.target.value) })}
          className="w-full text-sm text-right focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2 w-28">
        <input
          type="number"
          value={item.unit_price}
          onChange={e => onChange({ ...item, unit_price: Number(e.target.value) })}
          className="w-full text-sm text-right focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2 w-24">
        <select
          value={item.tax_rate}
          onChange={e => onChange({ ...item, tax_rate: Number(e.target.value) })}
          className="w-full text-sm bg-transparent focus:outline-none border-b border-transparent focus:border-blue-400"
        >
          {[0, 5, 20].map(r => <option key={r} value={r}>{r}%</option>)}
        </select>
      </td>
      <td className="px-3 py-2 w-28 text-right font-semibold text-slate-800 text-sm">
        £{lineTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-3 py-2 w-10">
        <button onClick={onRemove} aria-label="Remove line item" className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */
function genInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const seq = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())).slice(0, 5).toUpperCase()
  return `INV-${year}-${seq}`
}

function mapInvoiceType(label: string): InvoiceType {
  const l = label.toLowerCase()
  if (l.includes("rent")) return "rent"
  if (l.includes("service")) return "service_charge"
  if (l.includes("deposit")) return "deposit"
  if (l.includes("management") || l.includes("fee") || l.includes("recharge") || l.includes("charge")) return "one_off"
  return "other"
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const createInvoice = useCreateMoneyInvoice(workspace?.id)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [dbContacts, setDbContacts] = useState<{ id: string; name: string; email: string | null }[]>([])
  const [dbProperties, setDbProperties] = useState<{ id: string; address: string }[]>([])
  const [dbTenancies, setDbTenancies] = useState<{ id: string; reference: string | null }[]>([])
  const [dbJobs, setDbJobs] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient()
    async function fetchDropdowns() {
      try {
        const [contactsRes, propertiesRes, tenanciesRes, jobsRes] = await Promise.all([
          supabase
            .from("contacts")
            .select("id, display_name, email")
            .eq("workspace_id", workspace!.id)
            .order("display_name")
            .limit(50),
          supabase
            .from("properties")
            .select("id, address_line1")
            .eq("workspace_id", workspace!.id)
            .order("address_line1")
            .limit(50),
          supabase
            .from("tenancies")
            .select("id, start_date, end_date")
            .eq("workspace_id", workspace!.id)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("jobs")
            .select("id, title")
            .eq("workspace_id", workspace!.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ])
        if (!contactsRes.error && contactsRes.data) {
          setDbContacts((contactsRes.data as { id: string; display_name: string; email: string | null }[]).map(c => ({ id: c.id, name: c.display_name, email: c.email })))
        }
        if (!propertiesRes.error && propertiesRes.data) {
          setDbProperties((propertiesRes.data as { id: string; address_line1: string | null }[]).map(r => ({ id: r.id, address: r.address_line1 ?? "" })))
        }
        if (!tenanciesRes.error && tenanciesRes.data) {
          setDbTenancies((tenanciesRes.data as { id: string; start_date: string | null; end_date: string | null }[]).map(r => ({ id: r.id, reference: r.start_date ? `Tenancy from ${r.start_date}` : r.id.slice(0, 8) })))
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

  const [formData, setFormData] = useState<FormData>({
    invoice_type: "Rent Invoice",
    invoice_number: "",
    issue_date: "",
    due_date: "",
    notes: "",
    recipient_name: "",
    recipient_email: "",
    billing_address: "",
    property: "",
    unit: "",
    tenancy: "",
    job: "",
    payment_due_days: "30",
    late_payment_notes: "",
    payment_methods: ["bank_transfer"],
    stripe_enabled: false,
    email_on_send: true,
    send_to_email: "",
    email_template: "Branded",
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "li-1", description: "Rent — July 2026", quantity: 1, unit_price: 0, tax_rate: 0 },
  ])

  useEffect(() => {
    const today = new Date()
    const due = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    setFormData(prev => ({
      ...prev,
      invoice_number: prev.invoice_number || genInvoiceNumber(),
      issue_date: prev.issue_date || today.toISOString().split("T")[0],
      due_date: prev.due_date || due.toISOString().split("T")[0],
    }))
  }, [])

  function updateForm(patch: Partial<FormData>) {
    setFormData(prev => ({ ...prev, ...patch }))
  }

  function addLineItem() {
    setLineItems(prev => [
      ...prev,
      { id: `li-${Date.now()}`, description: "", quantity: 1, unit_price: 0, tax_rate: 0 },
    ])
  }

  function updateLineItem(id: string, updated: LineItem) {
    setLineItems(prev => prev.map(li => li.id === id ? updated : li))
  }

  function removeLineItem(id: string) {
    setLineItems(prev => prev.filter(li => li.id !== id))
  }

  /* totals */
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0)
  const taxTotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price * (li.tax_rate / 100), 0)
  const grandTotal = subtotal + taxTotal

  async function handleSubmit() {
    setSubmitError(null)
    // Validation
    if (!workspace?.id) { setSubmitError("Workspace not loaded — please refresh."); return }
    if (grandTotal <= 0) { setSubmitError("Invoice total must be greater than £0. Add line item prices."); setCurrentStep(4); return }
    if (!formData.recipient_name.trim()) { setSubmitError("A recipient is required."); setCurrentStep(2); return }
    if (!formData.issue_date) { setSubmitError("Issue date is required."); setCurrentStep(1); return }
    if (!formData.due_date) { setSubmitError("Due date is required."); setCurrentStep(1); return }
    if (new Date(formData.due_date) < new Date(formData.issue_date)) { setSubmitError("Due date cannot be before the issue date."); setCurrentStep(1); return }

    setIsSubmitting(true)
    try {
      const description = [
        formData.invoice_number,
        formData.recipient_name && `for ${formData.recipient_name}`,
        formData.notes && `— ${formData.notes}`,
      ].filter(Boolean).join(" ")

      const payload: InsertMoneyInvoice = {
        workspace_id: workspace.id,
        property_id: null,
        invoice_type: mapInvoiceType(formData.invoice_type),
        status: formData.email_on_send ? "sent" : "draft",
        amount: Math.round(grandTotal * 100) / 100,
        paid_amount: 0,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        paid_at: null,
        contact_id: null,
        tenancy_id: null,
        description: description || null,
      }
      const created = await createInvoice.mutateAsync(payload)
      setCreatedId(created.id)
      setCurrentStep(9)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create invoice. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  /* health checks */
  const healthItems = [
    { label: "Recipient set", done: !!formData.recipient_name },
    { label: "Due date set", done: !!formData.due_date },
    { label: "At least 1 line item", done: lineItems.length > 0 },
    { label: "Line items have prices", done: lineItems.some(li => li.unit_price > 0) },
    { label: "Invoice type selected", done: !!formData.invoice_type },
  ]

  /* ---------------------------------------------------------------- */
  /* Step content                                                       */
  /* ---------------------------------------------------------------- */
  function StepContent() {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Invoice Basics</h2>
              <p className="text-sm text-slate-500 mt-0.5">Set the core invoice details and dates.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Invoice Type">
                <Select value={formData.invoice_type} onChange={e => updateForm({ invoice_type: e.target.value })}>
                  {INVOICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Invoice Number">
                <Input value={formData.invoice_number} onChange={e => updateForm({ invoice_number: e.target.value })} />
              </Field>
              <Field label="Issue Date">
                <Input type="date" value={formData.issue_date} onChange={e => updateForm({ issue_date: e.target.value })} />
              </Field>
              <Field label="Due Date">
                <Input type="date" value={formData.due_date} onChange={e => updateForm({ due_date: e.target.value })} />
              </Field>
              <Field label="Notes (optional)">
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => updateForm({ notes: e.target.value })}
                  placeholder="Payment terms, references, special instructions…"
                  className="col-span-2"
                />
              </Field>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recipient</h2>
              <p className="text-sm text-slate-500 mt-0.5">Who should receive this invoice?</p>
            </div>
            <Field label="Select Contact">
              <Select value={formData.recipient_name} onChange={e => updateForm({ recipient_name: e.target.value })}>
                <option value="">— Select a contact —</option>
                {dbContacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Email Address">
              <Input
                type="email"
                value={formData.recipient_email}
                onChange={e => updateForm({ recipient_email: e.target.value })}
                placeholder="recipient@example.com"
              />
            </Field>
            <Field label="Billing Address">
              <Textarea
                rows={3}
                value={formData.billing_address}
                onChange={e => updateForm({ billing_address: e.target.value })}
                placeholder="Street address, city, postcode…"
              />
            </Field>
          </div>
        )

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Link Records</h2>
              <p className="text-sm text-slate-500 mt-0.5">Optionally link this invoice to properties, units, tenancies, or jobs.</p>
            </div>
            <Field label="Property (optional)">
              <Select value={formData.property} onChange={e => updateForm({ property: e.target.value })}>
                <option value="">— None —</option>
                {dbProperties.map(p => <option key={p.id} value={p.address}>{p.address}</option>)}
              </Select>
            </Field>
            <Field label="Unit (optional)">
              <Select value={formData.unit} onChange={e => updateForm({ unit: e.target.value })}>
                <option value="">— None —</option>
                <option>Flat 1</option>
                <option>Flat 2</option>
                <option>Ground Floor</option>
              </Select>
            </Field>
            <Field label="Tenancy (optional)">
              <Select value={formData.tenancy} onChange={e => updateForm({ tenancy: e.target.value })}>
                <option value="">— None —</option>
                {dbTenancies.map(t => <option key={t.id} value={t.id}>{t.reference ?? t.id}</option>)}
              </Select>
            </Field>
            <Field label="Job (optional)">
              <Select value={formData.job} onChange={e => updateForm({ job: e.target.value })}>
                <option value="">— None —</option>
                {dbJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </Select>
            </Field>
          </div>
        )

      case 4:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Line Items</h2>
              <p className="text-sm text-slate-500 mt-0.5">Add the charges for this invoice.</p>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Description</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 w-16">Qty</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 w-28">Unit Price (£)</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 w-24">Tax</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 w-28">Total</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(li => (
                    <LineItemRow
                      key={li.id}
                      item={li}
                      onChange={updated => updateLineItem(li.id, updated)}
                      onRemove={() => removeLineItem(li.id)}
                    />
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-xs font-medium text-slate-500 text-right">Subtotal</td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-slate-700">
                      £{subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-xs font-medium text-slate-500 text-right">Tax</td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-slate-700">
                      £{taxTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td colSpan={4} className="px-3 py-2.5 text-sm font-bold text-slate-900 text-right">Total</td>
                    <td className="px-3 py-2.5 text-right text-base font-bold text-slate-900">
                      £{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table></div>
            </div>
            <button
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>
        )

      case 5:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Terms</h2>
              <p className="text-sm text-slate-500 mt-0.5">Define how and when payment is expected.</p>
            </div>
            <Field label="Payment Due (days)">
              <Select value={formData.payment_due_days} onChange={e => updateForm({ payment_due_days: e.target.value })}>
                {["7", "14", "21", "30", "45", "60"].map(d => <option key={d} value={d}>{d} days</option>)}
              </Select>
            </Field>
            <Field label="Late Payment Notes (optional)">
              <Textarea
                rows={2}
                value={formData.late_payment_notes}
                onChange={e => updateForm({ late_payment_notes: e.target.value })}
                placeholder="e.g. Late payments incur a £25 administration fee after 7 days."
              />
            </Field>
            <Field label="Accepted Payment Methods">
              <div className="space-y-2.5 mt-1">
                {[
                  { key: "bank_transfer", label: "Bank Transfer (BACS)" },
                  { key: "card", label: "Credit / Debit Card" },
                  { key: "stripe", label: "Stripe Online Payment" },
                  { key: "cheque", label: "Cheque" },
                  { key: "other", label: "Other" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.payment_methods.includes(key)}
                      onChange={e => {
                        if (e.target.checked) {
                          updateForm({ payment_methods: [...formData.payment_methods, key] })
                        } else {
                          updateForm({ payment_methods: formData.payment_methods.filter(m => m !== key) })
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )

      case 6:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Stripe Payment Link</h2>
              <p className="text-sm text-slate-500 mt-0.5">Let tenants pay online via a secure Stripe link.</p>
            </div>
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3">
              <div style={{ color: "#D97706" }}><AlertTriangle className="w-4 h-4 mt-0.5" /></div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Stripe not connected</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Connect your Stripe account in{" "}
                  <Link href="/app/money/stripe" className="underline font-medium">Money › Stripe</Link>{" "}
                  to enable online payment links.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                disabled
                role="switch"
                aria-checked={formData.stripe_enabled}
                aria-label="Enable Stripe payments"
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors border-2 border-transparent opacity-40 cursor-not-allowed",
                  formData.stripe_enabled ? "bg-blue-600" : "bg-slate-200"
                )}
              >
                <span className={cn(
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                  formData.stripe_enabled ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
              <span className="text-sm text-slate-500 opacity-50">Create Stripe payment link (requires Stripe connection)</span>
            </label>
          </div>
        )

      case 7:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Email &amp; PDF Options</h2>
              <p className="text-sm text-slate-500 mt-0.5">Configure how this invoice is delivered.</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => updateForm({ email_on_send: !formData.email_on_send })}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors border-2 border-transparent",
                  formData.email_on_send ? "bg-blue-600" : "bg-slate-200"
                )}
              >
                <span className={cn(
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                  formData.email_on_send ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
              <span className="text-sm font-medium text-slate-700">Email recipient on send</span>
            </label>
            {formData.email_on_send && (
              <div className="space-y-4 pl-1">
                <Field label="Send To Email">
                  <Input
                    type="email"
                    value={formData.send_to_email}
                    onChange={e => updateForm({ send_to_email: e.target.value })}
                    placeholder={formData.recipient_email || "recipient@example.com"}
                  />
                </Field>
                <Field label="Email Template">
                  <Select value={formData.email_template} onChange={e => updateForm({ email_template: e.target.value })}>
                    {EMAIL_TEMPLATES.map(t => <option key={t}>{t}</option>)}
                  </Select>
                </Field>
              </div>
            )}
            <div className="pt-2">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                <Eye className="w-4 h-4 text-slate-400" />
                Preview PDF
              </button>
              <p className="text-xs text-slate-500 mt-1.5">Opens a formatted invoice preview panel.</p>
            </div>
            {/* PDF preview card */}
            <div className="mt-2 p-5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Propvora</p>
                  <p className="text-slate-500">Property Management</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-sm">{formData.invoice_number}</p>
                  <p>Issue: {formData.issue_date}</p>
                  <p>Due: {formData.due_date}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <p className="font-medium text-slate-700">Bill To: {formData.recipient_name || "—"}</p>
                <p>{formData.billing_address || "No address set"}</p>
              </div>
              <div className="border-t border-slate-200 pt-2 space-y-1">
                {lineItems.map((li, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{li.description || `Line ${i + 1}`}</span>
                    <span>£{(li.quantity * li.unit_price).toLocaleString("en-GB")}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1 mt-1">
                  <span>Total</span>
                  <span>£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Review Invoice</h2>
              <p className="text-sm text-slate-500 mt-0.5">Check everything before creating.</p>
            </div>
            <div className="space-y-4">
              {/* summary card */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice Details</p>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-slate-500">Type</p><p className="font-medium text-slate-800">{formData.invoice_type}</p></div>
                  <div><p className="text-xs text-slate-500">Number</p><p className="font-mono font-semibold text-blue-600">{formData.invoice_number}</p></div>
                  <div><p className="text-xs text-slate-500">Recipient</p><p className="font-medium text-slate-800">{formData.recipient_name || "—"}</p></div>
                  <div><p className="text-xs text-slate-500">Property</p><p className="font-medium text-slate-800">{formData.property || "—"}</p></div>
                  <div><p className="text-xs text-slate-500">Issue Date</p><p className="font-medium text-slate-800">{formData.issue_date}</p></div>
                  <div><p className="text-xs text-slate-500">Due Date</p><p className="font-medium text-slate-800">{formData.due_date}</p></div>
                </div>
              </div>
              {/* line items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Line Items ({lineItems.length})</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {lineItems.map((li, i) => (
                    <div key={i} className="px-4 py-2.5 flex justify-between text-sm">
                      <span className="text-slate-700">{li.description || `Line ${i + 1}`}</span>
                      <span className="font-semibold text-slate-900">£{(li.quantity * li.unit_price).toLocaleString("en-GB")}</span>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 flex justify-between text-sm bg-slate-50">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold text-slate-900 text-base">£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              {/* send options */}
              <div className="border border-slate-200 rounded-xl px-4 py-3 text-sm space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Send Options</p>
                <div className="flex justify-between"><span className="text-slate-500">Email on send</span><span className="font-medium">{formData.email_on_send ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Template</span><span className="font-medium">{formData.email_template}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Stripe link</span><span className="font-medium">{formData.stripe_enabled ? "Yes" : "No"}</span></div>
              </div>
            </div>
          </div>
        )

      case 9:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Invoice Created!</h2>
              <p className="text-slate-500 mt-1.5 text-sm max-w-sm">
                {formData.invoice_number} has been created successfully
                {formData.recipient_name ? ` for ${formData.recipient_name}` : ""}.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 px-6 py-4 text-left min-w-[260px]">
              <p className="text-xs text-slate-500 font-medium mb-2">Invoice Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Number</span><span className="font-mono font-semibold text-blue-600">{formData.invoice_number}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-bold text-slate-900">£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Due</span><span className="font-medium text-slate-700">{formData.due_date}</span></div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => { if (createdId) router.push(`/app/money/invoices/${createdId}`) }}
                disabled={!createdId}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
              >
                <Eye className="w-4 h-4" /> View Invoice
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1)
                  setCreatedId(null)
                  setFormData(prev => ({ ...prev, invoice_number: genInvoiceNumber(), recipient_name: "", recipient_email: "" }))
                  setLineItems([{ id: "li-new", description: "", quantity: 1, unit_price: 0, tax_rate: 0 }])
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Another
              </button>
              <Link
                href="/app/money"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Money
              </Link>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-0">
      <MobileTopBar title="New Invoice" subtitle={`Step ${currentStep} of ${STEPS.length}`} showBack backHref="/app/money/invoices" />
      {/* Header */}
      <div className="hidden md:flex items-center gap-3 mb-6">
        <Link href="/app/money/invoices" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Invoices
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-sm font-medium text-slate-900">New Invoice</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left stepper rail */}
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Steps</p>
            {STEPS.map(step => {
              const isDone = currentStep > step.num
              const isActive = currentStep === step.num
              const Icon = step.icon
              return (
                <button
                  key={step.num}
                  onClick={() => currentStep !== 9 && setCurrentStep(step.num)}
                  disabled={step.num === 9}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm",
                    isActive ? "bg-blue-50 text-blue-700 font-semibold" : isDone ? "text-emerald-700 hover:bg-emerald-50" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isActive ? "bg-blue-600 text-white" : isDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </span>
                  <span className="truncate">{step.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Center content */}
        <div className="flex-1 min-w-0 w-full">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[420px]">
            <StepContent />
          </div>

          {/* Submit error */}
          {submitError && currentStep < 9 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Nav buttons */}
          {currentStep < 9 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {currentStep < 8 ? (
                <button
                  onClick={() => setCurrentStep(s => Math.min(8, s + 1))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Create Invoice
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right summary rail */}
        <aside className="w-full lg:w-[260px] shrink-0 lg:sticky lg:top-6 space-y-4">
          {/* Live preview card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Invoice #</span>
                <span className="font-mono text-xs font-semibold text-blue-600">{formData.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Recipient</span>
                <span className="text-xs font-medium text-slate-800 text-right max-w-[130px] truncate">{formData.recipient_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Issue Date</span>
                <span className="text-xs text-slate-700">{formData.issue_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Due Date</span>
                <span className="text-xs text-slate-700">{formData.due_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Lines</span>
                <span className="text-xs text-slate-700">{lineItems.length}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-1 space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Subtotal</span>
                  <span className="text-xs text-slate-700">£{subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Tax</span>
                  <span className="text-xs text-slate-700">£{taxTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-900">Total</span>
                  <span className="text-sm font-bold text-slate-900">£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice health */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice Health</p>
            <div className="space-y-2">
              {healthItems.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                    item.done ? "bg-emerald-100" : "bg-slate-100"
                  )}>
                    {item.done
                      ? <Check className="w-2.5 h-2.5 text-emerald-600" />
                      : <X className="w-2.5 h-2.5 text-slate-400" />}
                  </span>
                  <span className={cn("text-xs", item.done ? "text-emerald-700" : "text-slate-400")}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI suggestion card */}
          <div className="bg-violet-50 rounded-2xl border border-violet-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div style={{ color: "#7C3AED" }}><Sparkles className="w-4 h-4" /></div>
              <p className="text-xs font-bold text-violet-700">AI Assistant</p>
            </div>
            <p className="text-xs text-violet-600">Tip: Set a due date within 30 days for faster payment. Invoices with clear descriptions are paid 2× faster.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
