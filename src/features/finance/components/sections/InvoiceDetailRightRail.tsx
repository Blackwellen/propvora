"use client"

import React from "react"
import Link from "next/link"
import {
  Send, CheckCircle2, Sparkles, Download, Building2, User, Link2,
} from "lucide-react"

interface InvoiceDetailRightRailProps {
  invoiceId: string
  invoiceNumber: string
  invoiceStatus: string
  invoiceAmount: number
  recipient: string
  property: string
  issueDate: string
  updatedAt: string | null
  onSend: () => void
  onMarkPaid: () => void
  onCreateStripeLink: () => void
  onExportPdf: () => void
}

export function InvoiceDetailRightRail({
  invoiceId,
  invoiceNumber,
  invoiceStatus,
  invoiceAmount,
  recipient,
  property,
  issueDate,
  updatedAt,
  onSend,
  onMarkPaid,
  onCreateStripeLink,
  onExportPdf,
}: InvoiceDetailRightRailProps) {
  const isDraft = invoiceStatus === "draft" || invoiceStatus === "planned"
  const canMarkPaid =
    invoiceStatus === "due" || invoiceStatus === "overdue" || invoiceStatus === "sent"

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</p>
        {isDraft && (
          <button
            onClick={onSend}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-strong)] transition-colors"
          >
            <Send className="w-4 h-4" /> Send Invoice
          </button>
        )}
        {canMarkPaid && (
          <button
            onClick={onMarkPaid}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark as Paid
          </button>
        )}
        <button
          onClick={onCreateStripeLink}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors"
        >
          <Sparkles className="w-4 h-4" style={{ color: "#7C3AED" }} /> Create Stripe Link
        </button>
        <button
          onClick={onExportPdf}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4 text-slate-400" /> Export PDF
        </button>
      </div>

      {/* Invoice info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Invoice Info</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 text-xs">Created by</span>
            <span className="text-xs font-medium text-slate-700">Admin</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-xs">Created</span>
            <span className="text-xs font-medium text-slate-700">{issueDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-xs">Last updated</span>
            <span className="text-xs font-medium text-slate-700">
              {updatedAt ? updatedAt.slice(0, 10) : issueDate}
            </span>
          </div>
        </div>
      </div>

      {/* Related */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Related</p>
        <Link href="#" className="flex items-center gap-2 text-sm text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
          <Building2 className="w-3.5 h-3.5" /> {property}
        </Link>
        <Link href="#" className="flex items-center gap-2 text-sm text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
          <User className="w-3.5 h-3.5" /> {recipient}
        </Link>
        <Link href="#" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <Link2 className="w-3.5 h-3.5" /> View Tenancy
        </Link>
      </div>

    </div>
  )
}
