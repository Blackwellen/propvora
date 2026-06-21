"use client"

import { Check, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LineItem } from "./InvoiceWizardFormPrimitives"

interface HealthItem {
  label: string
  done: boolean
}

interface InvoiceWizardRightRailProps {
  invoiceNumber: string
  recipientName: string
  issueDate: string
  dueDate: string
  lineItems: LineItem[]
  subtotal: number
  taxTotal: number
  grandTotal: number
  healthItems: HealthItem[]
}

export function InvoiceWizardRightRail({
  invoiceNumber,
  recipientName,
  issueDate,
  dueDate,
  lineItems,
  subtotal,
  taxTotal,
  grandTotal,
  healthItems,
}: InvoiceWizardRightRailProps) {
  return (
    <aside className="w-full lg:w-[260px] shrink-0 lg:sticky lg:top-6 space-y-4">
      {/* Live preview card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-xs text-slate-500">Invoice #</span>
            <span className="font-mono text-xs font-semibold text-blue-600">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-slate-500">Recipient</span>
            <span className="text-xs font-medium text-slate-800 text-right max-w-[130px] truncate">
              {recipientName || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-slate-500">Issue Date</span>
            <span className="text-xs text-slate-700">{issueDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-slate-500">Due Date</span>
            <span className="text-xs text-slate-700">{dueDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-slate-500">Lines</span>
            <span className="text-xs text-slate-700">{lineItems.length}</span>
          </div>
          <div className="border-t border-slate-100 pt-2 mt-1 space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Subtotal</span>
              <span className="text-xs text-slate-700">
                £{subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Tax</span>
              <span className="text-xs text-slate-700">
                £{taxTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-bold text-slate-900">Total</span>
              <span className="text-sm font-bold text-slate-900">
                £{grandTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice health */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice Health</p>
        <div className="space-y-2">
          {healthItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                  item.done ? "bg-emerald-100" : "bg-slate-100"
                )}
              >
                {item.done ? (
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                ) : (
                  <X className="w-2.5 h-2.5 text-slate-400" />
                )}
              </span>
              <span className={cn("text-xs", item.done ? "text-emerald-700" : "text-slate-400")}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI suggestion card */}
      <div className="bg-violet-50 rounded-2xl border border-violet-200 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#7C3AED" }} />
          <p className="text-xs font-bold text-violet-700">AI Assistant</p>
        </div>
        <p className="text-xs text-violet-600">
          Tip: Set a due date within 30 days for faster payment. Invoices with clear descriptions are paid 2× faster.
        </p>
      </div>
    </aside>
  )
}
