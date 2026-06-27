"use client"

import { Plus, Trash2 } from "lucide-react"
import { moneyPence } from "@/components/supplier-workspace/format"

export interface InvoiceLine {
  id: string
  description: string
  qty: number
  unitPence: number
}

const VAT_RATE = 0.2

export interface InvoiceStep2LineItemsProps {
  lines: InvoiceLine[]
  includeVat: boolean
  onLinesChange: (lines: InvoiceLine[]) => void
  onIncludeVatChange: (include: boolean) => void
}

function poundsToPence(s: string): number {
  const n = Number(s.replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export function InvoiceStep2LineItems({
  lines, includeVat, onLinesChange, onIncludeVatChange,
}: InvoiceStep2LineItemsProps) {
  const netPence = lines.reduce((s, l) => s + l.qty * l.unitPence, 0)

  function updateLine(id: string, patch: Partial<InvoiceLine>) {
    onLinesChange(lines.map((l) => l.id === id ? { ...l, ...patch } : l))
  }

  function removeLine(id: string) {
    onLinesChange(lines.filter((l) => l.id !== id))
  }

  function addLine() {
    onLinesChange([...lines, { id: `l-${Date.now()}`, description: "", qty: 1, unitPence: 0 }])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Line items</h2>
        <p className="text-sm text-slate-500 mt-0.5">Itemise labour, materials and any extras. VAT applies to the total.</p>
      </div>
      <div className="space-y-2">
        {lines.map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5">
            <input
              value={l.description}
              onChange={(e) => updateLine(l.id, { description: e.target.value })}
              placeholder="Description"
              className="flex-1 min-w-0 text-sm outline-none px-1"
            />
            <input
              type="number"
              min={1}
              value={l.qty}
              onChange={(e) => updateLine(l.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
              className="w-14 text-sm text-right outline-none border border-slate-200 rounded-lg px-2 py-1"
              aria-label="Quantity"
            />
            <div className="flex items-center border border-slate-200 rounded-lg px-2 py-1 w-28">
              <span className="text-slate-400 text-sm">£</span>
              <input
                inputMode="decimal"
                defaultValue={(l.unitPence / 100).toFixed(2)}
                onChange={(e) => updateLine(l.id, { unitPence: poundsToPence(e.target.value) })}
                className="w-full text-sm text-right outline-none"
                aria-label="Unit price"
              />
            </div>
            <span className="w-20 text-right text-sm font-semibold text-slate-800 shrink-0">
              {moneyPence(l.qty * l.unitPence)}
            </span>
            <button
              onClick={() => removeLine(l.id)}
              className="p-1.5 text-slate-300 hover:text-red-500 shrink-0"
              aria-label="Remove line"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addLine}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand)] px-1 py-1.5"
        >
          <Plus className="w-4 h-4" /> Add line item
        </button>
      </div>
      <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
        <span>
          <span className="text-sm font-medium text-slate-800">Add VAT at 20%</span>
          <span className="block text-xs text-slate-400">
            Adds {moneyPence(Math.round(netPence * VAT_RATE))} to the total
          </span>
        </span>
        <input
          type="checkbox"
          checked={includeVat}
          onChange={(e) => onIncludeVatChange(e.target.checked)}
          className="w-5 h-5 accent-[var(--brand)]"
        />
      </label>
    </div>
  )
}
