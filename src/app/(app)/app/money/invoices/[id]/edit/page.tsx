"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, ChevronRight, Plus, X, AlertTriangle, Trash2,
  ChevronDown, Save, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type Invoice = {
  id: string
  invoice_number: string
  recipient: string
  property: string
  type: string
  amount: number
  issue_date: string
  due_date: string
  status: string
}

type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

/* ------------------------------------------------------------------ */
/* Mock data                                                            */
/* ------------------------------------------------------------------ */
const MOCK_INVOICES: Invoice[] = [
  { id: "inv-001", invoice_number: "INV-2026-001", recipient: "Sarah Mitchell",  property: "14 Birchwood Rd",  type: "rent_invoice",              amount: 1150, issue_date: "2026-05-01", due_date: "2026-06-01", status: "paid" },
  { id: "inv-002", invoice_number: "INV-2026-002", recipient: "James Okafor",    property: "7 Elm Close",       type: "rent_invoice",              amount: 1400, issue_date: "2026-05-01", due_date: "2026-06-01", status: "overdue" },
  { id: "inv-003", invoice_number: "INV-2026-003", recipient: "Emily Patel",     property: "22 Park Lane",      type: "rent_invoice",              amount: 1350, issue_date: "2026-05-15", due_date: "2026-06-15", status: "sent" },
  { id: "inv-004", invoice_number: "INV-2026-004", recipient: "David Thornton",  property: "5 Bridge St",       type: "service_charge_invoice",    amount: 480,  issue_date: "2026-05-20", due_date: "2026-06-20", status: "due" },
  { id: "inv-005", invoice_number: "INV-2026-005", recipient: "Kevin Walsh Ltd", property: "12 Maple Avenue",   type: "supplier_recharge",         amount: 320,  issue_date: "2026-05-10", due_date: "2026-05-31", status: "overdue" },
  { id: "inv-006", invoice_number: "INV-2026-006", recipient: "Mark Johnson",    property: "All Properties",    type: "management_fee",            amount: 920,  issue_date: "2026-06-01", due_date: "2026-06-15", status: "draft" },
  { id: "inv-007", invoice_number: "INV-2026-007", recipient: "Sarah Mitchell",  property: "14 Birchwood Rd",  type: "rent_invoice",              amount: 1150, issue_date: "2026-06-01", due_date: "2026-07-01", status: "planned" },
  { id: "inv-008", invoice_number: "INV-2026-008", recipient: "Chen Wei",        property: "3 Oak Street",      type: "utility_recharge_invoice",  amount: 145,  issue_date: "2026-05-28", due_date: "2026-06-10", status: "sent" },
  { id: "inv-009", invoice_number: "INV-2026-009", recipient: "Priya Sharma",   property: "18 Rose Lane",      type: "rent_invoice",              amount: 1600, issue_date: "2026-04-01", due_date: "2026-05-01", status: "paid" },
  { id: "inv-010", invoice_number: "INV-2026-010", recipient: "Tom Bradley",    property: "9 Cedar Drive",     type: "tenant_invoice",            amount: 280,  issue_date: "2026-05-25", due_date: "2026-06-08", status: "due" },
  { id: "inv-011", invoice_number: "INV-2026-011", recipient: "Lisa Park",      property: "45 Grove Road",     type: "rent_invoice",              amount: 1250, issue_date: "2026-06-01", due_date: "2026-07-01", status: "scheduled" },
  { id: "inv-012", invoice_number: "INV-2026-012", recipient: "Ahmed Hassan",   property: "2 Willow Way",      type: "cleaning_recharge_invoice", amount: 195,  issue_date: "2026-05-22", due_date: "2026-06-05", status: "paid" },
  { id: "inv-013", invoice_number: "INV-2026-013", recipient: "Rachel Green",   property: "7 Elm Close",       type: "landlord_charge",           amount: 6200, issue_date: "2026-06-01", due_date: "2026-06-15", status: "draft" },
  { id: "inv-014", invoice_number: "INV-2026-014", recipient: "Daniel Moore",   property: "14 Birchwood Rd",  type: "service_charge_invoice",    amount: 360,  issue_date: "2026-05-05", due_date: "2026-05-20", status: "disputed" },
  { id: "inv-015", invoice_number: "INV-2026-015", recipient: "Sophie Turner",  property: "22 Park Lane",      type: "rent_invoice",              amount: 1350, issue_date: "2026-05-01", due_date: "2026-06-01", status: "paid" },
]

const INVOICE_TYPES = [
  "Rent Invoice", "Service Charge Invoice", "Supplier Recharge", "Management Fee",
  "Utility Recharge Invoice", "Tenant Invoice", "Cleaning Recharge Invoice", "Landlord Charge",
]

const INVOICE_STATUSES = ["draft", "planned", "scheduled", "sent", "viewed", "due", "overdue", "part_paid", "paid", "disputed", "cancelled"]

const MOCK_CONTACTS = [
  "Sarah Mitchell", "James Okafor", "Emily Patel", "David Thornton",
  "Kevin Walsh Ltd", "Chen Wei", "Priya Sharma", "Tom Bradley",
]

const PAYMENT_METHODS = ["Bank Transfer (BACS)", "Credit / Debit Card", "Stripe Online", "Cheque", "Other"]

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      {children}
    </div>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400",
        props.className
      )}
    />
  )
}

function SelectInput({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
    >
      {children}
    </select>
  )
}

function TextareaInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
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
function EditLineItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem
  onChange: (u: LineItem) => void
  onRemove: () => void
}) {
  const lineTotal = item.quantity * item.unit_price * (1 + item.tax_rate / 100)
  return (
    <tr className="border-b border-slate-100 group">
      <td className="px-3 py-2.5">
        <input
          value={item.description}
          onChange={e => onChange({ ...item, description: e.target.value })}
          placeholder="Description"
          className="w-full text-sm focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2.5 w-16">
        <input
          type="number"
          value={item.quantity}
          onChange={e => onChange({ ...item, quantity: Number(e.target.value) })}
          className="w-full text-sm text-right focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2.5 w-28">
        <input
          type="number"
          value={item.unit_price}
          onChange={e => onChange({ ...item, unit_price: Number(e.target.value) })}
          className="w-full text-sm text-right focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2.5 w-24">
        <select
          value={item.tax_rate}
          onChange={e => onChange({ ...item, tax_rate: Number(e.target.value) })}
          className="w-full text-sm bg-transparent focus:outline-none border-b border-transparent focus:border-blue-400"
        >
          {[0, 5, 20].map(r => <option key={r} value={r}>{r}%</option>)}
        </select>
      </td>
      <td className="px-3 py-2.5 w-28 text-right font-semibold text-slate-800 text-sm">
        £{lineTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-3 py-2.5 w-10">
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove line item"
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}

/* ------------------------------------------------------------------ */
/* Delete confirm modal                                                 */
/* ------------------------------------------------------------------ */
function DeleteConfirmModal({
  invoiceNumber,
  onClose,
  onConfirm,
}: {
  invoiceNumber: string
  onClose: () => void
  onConfirm: () => void
}) {
  const [inputVal, setInputVal] = useState("")
  const canDelete = inputVal === invoiceNumber
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Delete Invoice</h3>
            <p className="text-sm text-slate-500">This action cannot be undone.</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">
            Deleting this invoice will permanently remove all associated records, payments, and email history.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{invoiceNumber}</span> to confirm:
          </label>
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder={invoiceNumber}
            className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onConfirm}
            disabled={!canDelete}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Delete Invoice
          </button>
          <button aria-label="Close"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cancel confirm modal                                                 */
/* ------------------------------------------------------------------ */
function CancelConfirmModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Cancel Invoice?</h3>
            <p className="text-sm text-slate-500">The recipient will be notified.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
            Cancel Invoice
          </button>
          <button aria-label="Close" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Keep Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "inv-001"

  const source = MOCK_INVOICES.find(inv => inv.id === id) ?? MOCK_INVOICES[0]

  /* Form state */
  const [invoiceType, setInvoiceType] = useState(
    source.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  )
  const [invoiceNumber, setInvoiceNumber] = useState(source.invoice_number)
  const [status, setStatus] = useState(source.status)
  const [notes, setNotes] = useState("")
  const [recipientName, setRecipientName] = useState(source.recipient)
  const [billingAddress, setBillingAddress] = useState(`${source.property}, London`)
  const [property, setProperty] = useState(source.property)
  const [issueDate, setIssueDate] = useState(source.issue_date)
  const [dueDate, setDueDate] = useState(source.due_date)
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer (BACS)")
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [paymentRef, setPaymentRef] = useState("")
  const [paidAmount, setPaidAmount] = useState("")
  const [paidDate, setPaidDate] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [tags, setTags] = useState("")

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "li-1", description: `${invoiceType} — June 2026`, quantity: 1, unit_price: source.amount, tax_rate: 0 },
  ])

  const [isSaving, setIsSaving] = useState(false)
  const [dangerOpen, setDangerOpen] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  /* totals */
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0)
  const taxTotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price * (li.tax_rate / 100), 0)
  const grandTotal = subtotal + taxTotal

  function updateLineItem(liId: string, updated: LineItem) {
    setLineItems(prev => prev.map(li => li.id === liId ? updated : li))
  }

  function removeLineItem(liId: string) {
    setLineItems(prev => prev.filter(li => li.id !== liId))
  }

  function addLineItem() {
    setLineItems(prev => [...prev, { id: `li-${Date.now()}`, description: "", quantity: 1, unit_price: 0, tax_rate: 0 }])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsSaving(false)
    router.push(`/app/money/invoices/${id}`)
  }

  return (
    <>
      {showCancelModal && (
        <CancelConfirmModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => { setShowCancelModal(false); router.push(`/app/money/invoices/${id}`) }}
        />
      )}
      {showDeleteModal && (
        <DeleteConfirmModal
          invoiceNumber={source.invoice_number}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => { setShowDeleteModal(false); router.push("/app/money/invoices") }}
        />
      )}

      <div className="space-y-0">
        <MobileTopBar
          title="Edit Invoice"
          subtitle={source.invoice_number}
          showBack
          backHref={`/app/money/invoices/${id}`}
        />
        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 mb-6">
          <Link href="/app/money/invoices" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Invoices
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href={`/app/money/invoices/${id}`} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            {source.invoice_number}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-900">Edit</span>
        </div>

        <div className="hidden md:flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Invoice</h1>
            <p className="text-sm text-slate-500 mt-0.5">{source.invoice_number} · {source.recipient}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 pb-28">
          {/* Section 1: Invoice Basics */}
          <SectionCard title="Invoice Basics">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Invoice Type">
                <SelectInput value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
                  {INVOICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </SelectInput>
              </Field>
              <Field label="Invoice Number">
                <TextInput
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                />
              </Field>
              <Field label="Status">
                <SelectInput value={status} onChange={e => setStatus(e.target.value)}>
                  {INVOICE_STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Notes" hint="Visible to recipient on the invoice PDF.">
                <TextareaInput
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Payment terms, special instructions…"
                  className="col-span-full"
                />
              </Field>
            </div>
          </SectionCard>

          {/* Section 2: Recipient */}
          <SectionCard title="Recipient">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact">
                <SelectInput value={recipientName} onChange={e => setRecipientName(e.target.value)}>
                  {MOCK_CONTACTS.map(c => <option key={c}>{c}</option>)}
                </SelectInput>
              </Field>
              <Field label="Property">
                <TextInput value={property} onChange={e => setProperty(e.target.value)} placeholder="Property name or address" />
              </Field>
              <Field label="Billing Address">
                <TextareaInput
                  rows={3}
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  placeholder="Street address, city, postcode…"
                  className="sm:col-span-2"
                />
              </Field>
            </div>
          </SectionCard>

          {/* Section 3: Line Items */}
          <SectionCard title="Line Items">
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
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
                    <EditLineItemRow
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
                    <td colSpan={4} className="px-3 py-3 text-sm font-bold text-slate-900 text-right">Total</td>
                    <td className="px-3 py-3 text-right text-base font-bold text-slate-900">
                      £{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table></div>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </SectionCard>

          {/* Section 4: Dates & Terms */}
          <SectionCard title="Dates & Terms">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Issue Date">
                <TextInput type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </Field>
              <Field label="Due Date">
                <TextInput type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </Field>
              <Field label="Payment Method">
                <SelectInput value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </SelectInput>
              </Field>
            </div>
          </SectionCard>

          {/* Section 5: Stripe & Payment */}
          <SectionCard title="Stripe & Payment">
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-2.5">
                <div style={{ color: "#D97706" }}><AlertTriangle className="w-4 h-4 mt-0.5" /></div>
                <p className="text-xs text-amber-700">
                  Stripe is not connected. Connect at{" "}
                  <Link href="/app/money/stripe" className="underline font-medium">Money › Stripe</Link>{" "}
                  to enable online payment links.
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  disabled
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors border-2 border-transparent opacity-40 cursor-not-allowed",
                    stripeEnabled ? "bg-blue-600" : "bg-slate-200"
                  )}
                  onClick={() => setStripeEnabled(v => !v)}
                >
                  <span className={cn(
                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                    stripeEnabled ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
                <span className="text-sm text-slate-500 opacity-50">
                  <Zap className="w-3.5 h-3.5 inline mr-1" />Create Stripe payment link
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Payment Reference (optional)">
                  <TextInput
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="e.g. BACS-20260602-001"
                  />
                </Field>
                {(status === "part_paid" || status === "paid") && (
                  <>
                    <Field label="Amount Paid (£)">
                      <TextInput
                        type="number"
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </Field>
                    <Field label="Date Paid">
                      <TextInput
                        type="date"
                        value={paidDate}
                        onChange={e => setPaidDate(e.target.value)}
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Section 6: Internal Notes */}
          <SectionCard title="Internal Notes">
            <div className="space-y-4">
              <Field label="Private Notes" hint="Not visible to the recipient. Internal use only.">
                <TextareaInput
                  rows={3}
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Internal comments, reminders, or context…"
                />
              </Field>
              <Field label="Tags (comma-separated)">
                <TextInput
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. urgent, q2-2026, portfolio-a"
                />
              </Field>
            </div>
          </SectionCard>

          {/* Dangerous Actions */}
          <div className="rounded-2xl border border-red-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setDangerOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 bg-red-50 hover:bg-red-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div style={{ color: "#DC2626" }}><AlertTriangle className="w-4 h-4" /></div>
                <span className="text-sm font-semibold text-red-700">Dangerous Actions</span>
                <span className="text-xs text-red-500">Irreversible or disruptive operations</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-red-400 transition-transform", dangerOpen && "rotate-180")} />
            </button>
            {dangerOpen && (
              <div className="p-5 bg-white space-y-4 border-t border-red-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Cancel Invoice</p>
                    <p className="text-xs text-amber-600 mt-0.5">Marks this invoice as cancelled. The recipient will see a cancellation notice.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Cancel Invoice
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
                  <div>
                    <p className="text-sm font-semibold text-red-800">Delete Invoice</p>
                    <p className="text-xs text-red-600 mt-0.5">Permanently deletes this invoice and all associated records. Cannot be undone.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Invoice
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Sticky save bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
          <div className="px-5 md:px-7 lg:px-8 py-3.5 max-w-[1600px] mx-auto flex items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Editing <span className="font-semibold text-slate-800">{source.invoice_number}</span>
              <span className="mx-2 text-slate-300">·</span>
              Total: <span className="font-bold text-slate-900">£{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/app/money/invoices/${id}`}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
