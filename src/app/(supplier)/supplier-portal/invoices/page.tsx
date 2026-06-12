"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, FileText, ChevronRight, Briefcase } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveSupplierContext, formatMoney, formatDate, invoiceStatusMeta,
} from "../_lib/supplier-context"

interface InvoiceRow {
  id: string
  invoice_number: string | null
  amount: number
  currency: string | null
  status: string
  submitted_at: string
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  supplier_job_id: string | null
}

const STATUS_FILTERS = ["All", "Submitted", "Reviewing", "Approved", "Paid", "Rejected"] as const

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function SupplierInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const supplier = await resolveSupplierContext()
        if (!supplier) { setNoContext(true); setLoading(false); return }

        const { data, error: fetchErr } = await supabase
          .from("supplier_invoices")
          .select("id, invoice_number, amount, currency, status, submitted_at, approved_at, paid_at, notes, supplier_job_id")
          .eq("contact_id", supplier.contactId)
          .order("submitted_at", { ascending: false })

        if (fetchErr) {
          if (code(fetchErr) === "42P01") { setInvoices([]) }
          else { setError("Could not load invoices.") }
          setLoading(false)
          return
        }
        if (data) setInvoices(data as InvoiceRow[])
      } catch (err) {
        console.error(err)
        setError("Unexpected error loading invoices.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => invoices.filter((inv) => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      (inv.invoice_number ?? "").toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q)
    const matchStatus = statusFilter === "All" || inv.status === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  }), [invoices, search, statusFilter])

  const totalPending = invoices.filter((i) => ["submitted", "reviewing"].includes(i.status)).reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalApproved = invoices.filter((i) => i.status === "approved").reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount ?? 0), 0)

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No supplier account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Ask your operator to grant you portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">{invoices.length} invoice{invoices.length === 1 ? "" : "s"} total</p>
        </div>
        <Link href="/supplier-portal/jobs">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Submit Invoice
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 rounded-2xl border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Pending Payment</p>
          <p className="text-xl font-bold text-[#F59E0B]">{formatMoney(totalPending)}</p>
          <p className="text-xs text-slate-400">Submitted &amp; reviewing</p>
        </Card>
        <Card className="p-4 rounded-2xl border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Approved</p>
          <p className="text-xl font-bold text-[#2563EB]">{formatMoney(totalApproved)}</p>
          <p className="text-xs text-slate-400">Ready for payout</p>
        </Card>
        <Card className="p-4 rounded-2xl border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Total Paid Out</p>
          <p className="text-xl font-bold text-[#059669]">{formatMoney(totalPaid)}</p>
          <p className="text-xs text-slate-400">Paid out</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by invoice number..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-[#2563EB] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card noPadding className="rounded-2xl border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Invoice #", "Amount", "Submitted", "Status", "Approved / Paid", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const meta = invoiceStatusMeta(inv.status)
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/supplier-portal/invoices/${inv.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 font-medium">
                      {inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(inv.amount, inv.currency ?? "GBP")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(inv.submitted_at)}</td>
                    <td className="px-4 py-3"><Badge variant={meta.variant} dot>{meta.label}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {inv.paid_at ? formatDate(inv.paid_at) : inv.approved_at ? formatDate(inv.approved_at) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/supplier-portal/invoices/${inv.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="w-3 h-3" />}>View</Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {invoices.length === 0 ? "No invoices submitted yet." : "No invoices match your filter."}
              </p>
              {invoices.length === 0 && (
                <Link href="/supplier-portal/jobs">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Briefcase className="w-4 h-4" /> Submit from a Job
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </Card>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {invoices.length} invoices</span>
        </div>
      )}
    </div>
  )
}
