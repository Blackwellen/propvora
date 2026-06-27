"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Plus,
  Zap,
  Flame,
  Droplets,
  Wifi,
  Building2,
  X,
  FileText,
  ArrowLeft,
} from "lucide-react"
import { use } from "react"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

/* ─── Types ─────────────────────────────────────────────────── */
interface UtilityBill {
  id: string
  utility: string
  period: string
  total: number
  splitMethod: string
  perRoomAvg: number
  status: "split_invoiced" | "unpaid" | "paid"
}

interface RoomSplit {
  room: string
  tenant: string | null
  amount: number
  status: "invoiced" | "na"
}

/* ─── Sub-tab strip ─────────────────────────────────────────── */
function HmoTabStrip({ propertyId }: { propertyId: string }) {
  const pathname = usePathname()
  const base = `/property-manager/portfolio/properties/${propertyId}/hmo`

  const tabs = [
    { label: "Overview", href: base },
    { label: "Rooms", href: `${base}/rooms` },
    { label: "Utilities", href: `${base}/utilities` },
    { label: "Analytics", href: `${base}/analytics` },
  ]

  return (
    <div className="flex gap-1 px-4 md:px-6 border-b border-slate-200 bg-white overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

/* ─── Mock Data ──────────────────────────────────────────────── */
const UTILITY_BILLS: UtilityBill[] = []

const ELECTRICITY_SPLIT: RoomSplit[] = []

const STATUS_CONFIG: Record<
  UtilityBill["status"],
  { label: string; classes: string; action: string }
> = {
  split_invoiced: {
    label: "Invoiced",
    classes: "bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]",
    action: "View splits",
  },
  unpaid: {
    label: "Unpaid",
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
    action: "Generate invoices",
  },
  paid: {
    label: "Paid",
    classes: "bg-green-50 text-green-700 border border-green-200",
    action: "View",
  },
}

/* ─── Add Utility Bill Modal ─────────────────────────────────── */
function AddBillModal({ onClose }: { onClose: () => void }) {
  const [showPreview, setShowPreview] = useState(false)
  const [form, setForm] = useState({
    utilityType: "",
    provider: "",
    period: "",
    totalAmount: "",
    meterStart: "",
    meterEnd: "",
    splitMethod: "equal",
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Add Utility Bill</h2>
          <button aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Utility Type</label>
              <select
                value={form.utilityType}
                onChange={(e) => setForm({ ...form, utilityType: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              >
                <option value="">Select utility</option>
                <option value="electricity">Electricity</option>
                <option value="gas">Gas</option>
                <option value="water">Water</option>
                <option value="broadband">Broadband</option>
                <option value="council_tax">Council Tax</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Provider Name</label>
              <input
                type="text"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                placeholder="e.g. Octopus Energy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Billing Period</label>
              <input
                type="month"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Amount (£)</label>
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                placeholder="284.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Meter Reading Start (optional)
              </label>
              <input
                type="text"
                value={form.meterStart}
                onChange={(e) => setForm({ ...form, meterStart: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                placeholder="12450"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Meter Reading End (optional)
              </label>
              <input
                type="text"
                value={form.meterEnd}
                onChange={(e) => setForm({ ...form, meterEnd: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                placeholder="12734"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Receipt Upload</label>
              <div className="border border-dashed border-slate-300 rounded-lg px-4 py-3 text-center hover:border-[var(--color-brand-400)] transition-colors cursor-pointer">
                <FileText className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Click to upload receipt</p>
                <input type="file" className="hidden" accept=".pdf,.jpg,.png" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Split Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "equal", label: "Equal" },
                  { value: "occupancy_days", label: "Occupancy Days" },
                  { value: "floor_area", label: "Floor Area" },
                  { value: "custom", label: "Custom %" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      form.splitMethod === opt.value
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="splitMethod"
                      value={opt.value}
                      checked={form.splitMethod === opt.value}
                      onChange={(e) => setForm({ ...form, splitMethod: e.target.value })}
                      className="text-[var(--brand)]"
                    />
                    <span className="text-xs font-medium text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Preview split */}
          {showPreview && form.totalAmount && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">Split Preview</p>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-200">
                  {["Room 1", "Room 2", "Room 3", "Room 4", "Room 5"].map((r) => (
                    <tr key={r}>
                      <td className="py-1.5 text-slate-700">{r}</td>
                      <td className="py-1.5 text-right text-slate-800 font-medium">
                        £{(parseFloat(form.totalAmount) / 5).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1.5 text-slate-400">Room 6 (Vacant)</td>
                    <td className="py-1.5 text-right text-slate-400">£0.00</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-slate-500 mt-2">
                Landlord absorbs Room 6 vacant share: £
                {(parseFloat(form.totalAmount) / 6).toFixed(2)}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors w-full"
          >
            {showPreview ? "Hide" : "Preview"} Split Calculation
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button aria-label="Close"
            onClick={onClose}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            Save & Generate Invoices
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function HmoUtilitiesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [showModal, setShowModal] = useState(false)

  /* Row → card mapping for the mobile bills list. */
  const billCardMapping: MobileCardMapping<UtilityBill> = {
    getKey: (b) => b.id,
    title: (b) => b.utility,
    subtitle: (b) => b.period,
    badge: (b) => {
      const cfg = STATUS_CONFIG[b.status]
      return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${cfg.classes}`}>{cfg.label}</span>
    },
    fields: [
      { label: "Total", render: (b) => `£${b.total.toLocaleString()}` },
      { label: "Split Method", render: (b) => b.splitMethod },
      { label: "Per-Room Avg", render: (b) => `£${b.perRoomAvg.toFixed(2)}` },
    ],
  }

  return (
    <>
      {showModal && <AddBillModal onClose={() => setShowModal(false)} />}

      {/* Mobile top bar */}
      <MobileTopBar
        title="Utility Management"
        subtitle="22 Victoria Road, Manchester"
        showBack
        backHref={`/property-manager/portfolio/properties/${id}/hmo`}
        primaryAction={{ label: "Add utility bill", icon: Plus, onClick: () => setShowModal(true) }}
      />

      {/* Page Header — hidden on phones */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
        <div>
          <Link
            href={`/property-manager/portfolio/properties/${id}/hmo`}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to HMO dashboard
          </Link>
          <h1 className="text-base font-bold text-slate-900">Utility Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">22 Victoria Road, Manchester</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            Generate Invoices
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Utility Bill
          </button>
        </div>
      </div>

      {/* Sub-tab strip */}
      <HmoTabStrip propertyId={id} />

      {/* Content */}
      <div className="px-4 md:px-6 pb-6 pt-5 space-y-6">
        {/* Utility Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Electricity", value: "£284", sub: "this month", Icon: Zap, bg: "bg-yellow-50", color: "text-yellow-600" },
            { label: "Gas", value: "£187", sub: "this month", Icon: Flame, bg: "bg-orange-50", color: "text-orange-600" },
            { label: "Water", value: "£68", sub: "this month", Icon: Droplets, bg: "bg-[var(--brand-soft)]", color: "text-[var(--brand)]" },
            { label: "Broadband", value: "£45", sub: "per month", Icon: Wifi, bg: "bg-slate-50", color: "text-slate-600" },
            { label: "Council Tax", value: "£180", sub: "per month", Icon: Building2, bg: "bg-purple-50", color: "text-purple-600" },
          ].map(({ label, value, sub, Icon, bg, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-4 flex items-start gap-3"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium">{label}</p>
                <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
                <p className="text-[10px] text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Bills Table */}
          <div className="col-span-12 lg:col-span-8">
            <ResponsiveTable rows={UTILITY_BILLS} mobile={billCardMapping}>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Recent Bills</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["Utility", "Period", "Total Amount", "Split Method", "Per-Room Avg", "Status", "Actions"].map(
                        (col) => (
                          <th
                            key={col}
                            className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3"
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {UTILITY_BILLS.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-slate-400">
                          No utility bills recorded yet. Add bills to start tracking splits.
                        </td>
                      </tr>
                    )}
                    {UTILITY_BILLS.map((bill) => {
                      const cfg = STATUS_CONFIG[bill.status]
                      return (
                        <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{bill.utility}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{bill.period}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                            £{bill.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{bill.splitMethod}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">£{bill.perRoomAvg.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.classes}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2 py-1 rounded-lg transition-colors">
                              {cfg.action}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </ResponsiveTable>
          </div>

          {/* Room Split Detail */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Electricity Split — May 2026</h3>
                <p className="text-xs text-slate-500 mt-0.5">Total bill: £284.00</p>
              </div>
              <div className="divide-y divide-slate-100">
                {ELECTRICITY_SPLIT.map((row) => (
                  <div key={row.room} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-800">{row.room}</p>
                      {row.tenant ? (
                        <p className="text-[11px] text-slate-500">{row.tenant}</p>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">Vacant</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {row.status === "na" ? "—" : `£${row.amount.toFixed(2)}`}
                      </span>
                      {row.status === "invoiced" ? (
                        <span className="bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)] px-2 py-0.5 rounded-full text-[10px] font-medium">
                          Invoiced
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-medium">
                          N/A
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Tenants total</span>
                  <span className="text-xs font-bold text-slate-900">£236.65 / £284.00</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Landlord absorbs vacant share: £47.35
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
