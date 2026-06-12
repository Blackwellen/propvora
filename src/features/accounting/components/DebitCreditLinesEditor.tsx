"use client"
import React from "react"
import { Plus, Trash2, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DebitCreditLine {
  id: string
  accountCode: string
  accountName: string
  description: string
  taxCode: string
  netAmount: number
  vatAmount: number
  grossAmount: number
  type: "Debit" | "Credit"
}

interface DebitCreditLinesEditorProps {
  lines: DebitCreditLine[]
  onChange: (lines: DebitCreditLine[]) => void
  className?: string
}

function fmt(n: number) {
  return n.toFixed(2)
}

export function DebitCreditLinesEditor({ lines, onChange, className }: DebitCreditLinesEditorProps) {
  const totalDebits = lines.filter((l) => l.type === "Debit").reduce((s, l) => s + l.grossAmount, 0)
  const totalCredits = lines.filter((l) => l.type === "Credit").reduce((s, l) => s + l.grossAmount, 0)
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  function addLine() {
    const newLine: DebitCreditLine = {
      id: crypto.randomUUID(),
      accountCode: "",
      accountName: "",
      description: "",
      taxCode: "20% (SR)",
      netAmount: 0,
      vatAmount: 0,
      grossAmount: 0,
      type: "Debit",
    }
    onChange([...lines, newLine])
  }

  function removeLine(id: string) {
    onChange(lines.filter((l) => l.id !== id))
  }

  function updateLine(id: string, updates: Partial<DebitCreditLine>) {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  }

  return (
    <div className={cn("bg-white rounded-xl border border-[#E2E8F0] shadow-sm", className)}>
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Debit / Credit Lines</h3>
          <p className="text-xs text-slate-500 mt-0.5">Add debit and credit lines to balance this transaction.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addLine}
            className="h-8 px-3 rounded-lg bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#1d4ed8] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line
          </button>
          <button className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Quick Fill ▼
          </button>
          <button
            onClick={() => onChange([])}
            className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F0]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-6">#</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Account</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Description</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Tax Code</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Net (GBP)</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-24">VAT (GBP)</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Gross (GBP)</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-20">Type</th>
              <th className="px-4 py-3 w-12">
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={line.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/50">
                <td className="px-4 py-3 text-xs text-slate-400 font-medium">{idx + 1}</td>
                <td className="px-4 py-3">
                  <input
                    value={line.accountCode ? `${line.accountCode} · ${line.accountName}` : ""}
                    onChange={(e) => updateLine(line.id, { accountName: e.target.value })}
                    placeholder="Select account..."
                    className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563EB] min-w-[160px]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={line.description}
                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                    placeholder="Description..."
                    className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563EB] min-w-[120px]"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={line.taxCode}
                    onChange={(e) => updateLine(line.id, { taxCode: e.target.value })}
                    className="h-8 w-full px-2 rounded-lg border border-[#E2E8F0] text-xs text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option>20% (SR)</option>
                    <option>5% (RR)</option>
                    <option>Exempt</option>
                    <option>Zero</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={line.netAmount || ""}
                    onChange={(e) => {
                      const net = parseFloat(e.target.value) || 0
                      const vat = net * 0.2
                      updateLine(line.id, { netAmount: net, vatAmount: vat, grossAmount: net + vat })
                    }}
                    placeholder="0.00"
                    className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={line.vatAmount || ""}
                    readOnly
                    className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-right text-slate-400 bg-slate-50"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={line.grossAmount || ""}
                    readOnly
                    className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-right text-slate-900 font-medium bg-slate-50"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      onClick={() => updateLine(line.id, { type: line.type === "Debit" ? "Credit" : "Debit" })}
                      className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-semibold transition-colors",
                        line.type === "Debit"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      )}
                    >
                      {line.type}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => removeLine(line.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lines.length === 0 && (
          <div className="flex flex-col items-center py-10 text-slate-400">
            <p className="text-sm">No lines yet.</p>
            <button onClick={addLine} className="mt-2 text-xs text-[#2563EB] font-medium hover:underline">
              + Add first line
            </button>
          </div>
        )}
      </div>

      {/* Balance Status */}
      <div className="px-5 py-4 border-t border-[#E2E8F0] bg-slate-50/50">
        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Debits (GBP)</span>
            <span className="text-base font-bold text-emerald-600">£{fmt(totalDebits)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Credits (GBP)</span>
            <span className="text-base font-bold text-red-600">£{fmt(totalCredits)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Balance</span>
            <span className={cn("text-base font-bold flex items-center gap-1", isBalanced ? "text-emerald-600" : "text-red-500")}>
              {isBalanced ? "✓ Balanced" : `£${fmt(Math.abs(totalDebits - totalCredits))} unbalanced`}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {isBalanced
            ? "Your transaction is balanced. Debits must equal credits before posting."
            : "Debits and credits must be equal before you can post this transaction."}
        </p>
      </div>

      {/* Add line footer */}
      <div className="px-5 py-3 border-t border-[#E2E8F0]">
        <button onClick={addLine} className="text-xs font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors">
          + Add another line
        </button>
      </div>
    </div>
  )
}
