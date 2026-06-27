"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import type { FeeRule, FeeRuleInput } from "@/lib/money/fee-rules"

const BLANK: FeeRuleInput = {
  country_code: "",
  transaction_type: "",
  plan_tier: "",
  category: "",
  fee_percent: 5,
  minimum_fee_pence: null,
  maximum_fee_pence: null,
  provider_fee_pass_through: false,
  tax_inclusive: false,
  active: true,
  priority: 100,
}

function fmtPence(p: number | null): string {
  if (p == null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p / 100)
}

export default function FeeRulesEditor({ initialRules }: { initialRules: FeeRule[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FeeRuleInput>(BLANK)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/money/fee-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to create rule.")
      setAdding(false)
      setForm(BLANK)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.")
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(rule: FeeRule) {
    setBusy(true)
    try {
      await fetch("/api/money/fee-rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, active: !rule.active }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{initialRules.length} rule(s)</span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white rounded-xl px-3.5 py-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New rule
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="Country" value={form.country_code ?? ""} onChange={(v) => setForm((f) => ({ ...f, country_code: v }))} placeholder="GB (blank=any)" />
          <Input label="Txn type" value={form.transaction_type ?? ""} onChange={(v) => setForm((f) => ({ ...f, transaction_type: v }))} placeholder="stay_booking" />
          <Input label="Plan" value={form.plan_tier ?? ""} onChange={(v) => setForm((f) => ({ ...f, plan_tier: v }))} placeholder="scale" />
          <Input label="Category" value={form.category ?? ""} onChange={(v) => setForm((f) => ({ ...f, category: v }))} placeholder="plumbing" />
          <Input label="Fee %" type="number" value={String(form.fee_percent)} onChange={(v) => setForm((f) => ({ ...f, fee_percent: Number(v) }))} />
          <Input label="Min (£)" type="number" value={form.minimum_fee_pence == null ? "" : String(form.minimum_fee_pence / 100)} onChange={(v) => setForm((f) => ({ ...f, minimum_fee_pence: v === "" ? null : Math.round(Number(v) * 100) }))} />
          <Input label="Max (£)" type="number" value={form.maximum_fee_pence == null ? "" : String(form.maximum_fee_pence / 100)} onChange={(v) => setForm((f) => ({ ...f, maximum_fee_pence: v === "" ? null : Math.round(Number(v) * 100) }))} />
          <Input label="Priority" type="number" value={String(form.priority ?? 100)} onChange={(v) => setForm((f) => ({ ...f, priority: Number(v) }))} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.provider_fee_pass_through ?? false} onChange={(e) => setForm((f) => ({ ...f, provider_fee_pass_through: e.target.checked }))} />
            Provider fee pass-through
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.tax_inclusive ?? false} onChange={(e) => setForm((f) => ({ ...f, tax_inclusive: e.target.checked }))} />
            Tax inclusive
          </label>
          <div className="col-span-2 sm:col-span-4 flex items-center justify-end gap-2 pt-2">
            {error && <span className="text-xs text-red-600 mr-auto">{error}</span>}
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={create} disabled={busy} className="px-4 py-2 text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-strong)] rounded-lg disabled:opacity-60">
              {busy ? "Saving…" : "Create rule"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Txn type</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Fee %</th>
              <th className="px-4 py-3 text-right">Min</th>
              <th className="px-4 py-3 text-right">Max</th>
              <th className="px-4 py-3 text-right">Priority</th>
              <th className="px-4 py-3">Pass-thru</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {initialRules.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">No fee rules — add the first rule above.</td></tr>
            ) : (
              initialRules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-700">{r.country_code ?? "Any"}</td>
                  <td className="px-4 py-3 text-slate-700">{r.transaction_type ?? "Any"}</td>
                  <td className="px-4 py-3 text-slate-700">{r.plan_tier ?? "Any"}</td>
                  <td className="px-4 py-3 text-slate-700">{r.category ?? "Any"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{Number(r.fee_percent)}%</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPence(r.minimum_fee_pence)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPence(r.maximum_fee_pence)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.priority}</td>
                  <td className="px-4 py-3">{r.provider_fee_pass_through ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(r)} disabled={busy} className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.active ? "Active" : "Archived"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
      />
    </div>
  )
}
