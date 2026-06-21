"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

// ─── Shared form primitives reused across invoice wizard steps ────────────────

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export function WizardInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
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

export function WizardSelect({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
    >
      {children}
    </select>
  )
}

export function WizardTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
    />
  )
}

// ─── Line item row ────────────────────────────────────────────────────────────

export interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

interface LineItemRowProps {
  item: LineItem
  onChange: (updated: LineItem) => void
  onRemove: () => void
}

export function LineItemRow({ item, onChange, onRemove }: LineItemRowProps) {
  const lineTotal = item.quantity * item.unit_price * (1 + item.tax_rate / 100)
  return (
    <tr className="border-b border-slate-100 group">
      <td className="px-3 py-2">
        <input
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          placeholder="Description"
          className="w-full text-sm focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2 w-16">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })}
          className="w-full text-sm text-right focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2 w-28">
        <input
          type="number"
          value={item.unit_price}
          onChange={(e) => onChange({ ...item, unit_price: Number(e.target.value) })}
          className="w-full text-sm text-right focus:outline-none bg-transparent border-b border-transparent focus:border-blue-400"
        />
      </td>
      <td className="px-3 py-2 w-24">
        <select
          value={item.tax_rate}
          onChange={(e) => onChange({ ...item, tax_rate: Number(e.target.value) })}
          className="w-full text-sm bg-transparent focus:outline-none border-b border-transparent focus:border-blue-400"
        >
          {[0, 5, 20].map((r) => (
            <option key={r} value={r}>{r}%</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 w-28 text-right font-semibold text-slate-800 text-sm">
        £{lineTotal.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-3 py-2 w-10">
        <button
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
