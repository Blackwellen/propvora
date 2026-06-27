"use client"

import React, { useState } from "react"
import { X } from "lucide-react"
import { useCreateMoneyIncome } from "@/hooks/useMoneyData"
import type { InsertMoneyIncome } from "@/hooks/useMoneyData"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddIncomeForm {
  income_type: string
  amount: string
  date: string
  description: string
}

const INCOME_TYPES: string[] = [
  "Rent",
  "Service Charge",
  "Deposit Received",
  "Deposit Refund",
  "Management Fee",
  "Utility Recharge",
  "Other",
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddIncomeModalProps {
  onClose: () => void
  workspaceId: string | undefined
  onSaved: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddIncomeModal({ onClose, workspaceId, onSaved }: AddIncomeModalProps) {
  const createIncome = useCreateMoneyIncome(workspaceId)
  const [form, setForm] = useState<AddIncomeForm>({
    income_type: "",
    amount: "",
    date: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    if (!form.income_type) { setFormError("Income type is required"); return }
    const amount = parseFloat(form.amount)
    if (!form.amount || isNaN(amount) || amount <= 0) { setFormError("Amount must be greater than 0"); return }
    if (!form.date) { setFormError("Date is required"); return }
    if (!workspaceId) { setFormError("Workspace not loaded"); return }
    setSaving(true)
    setFormError(null)
    try {
      const payload: InsertMoneyIncome = {
        workspace_id: workspaceId,
        income_type: form.income_type,
        amount,
        expected_date: form.date,
        received_date: null,
        status: "expected",
        description: form.description.trim() || null,
        property_id: null,
        tenant_id: null,
        tenancy_id: null,
      }
      await createIncome.mutateAsync(payload)
      onSaved()
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save income")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add Income</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Income Type</label>
            <select
              name="income_type"
              value={form.income_type}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value="">Select type…</option>
              {INCOME_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Amount (£)</label>
            <input
              name="amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Optional note…"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 space-y-2">
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              aria-label="Close"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-strong)] rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Income"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
