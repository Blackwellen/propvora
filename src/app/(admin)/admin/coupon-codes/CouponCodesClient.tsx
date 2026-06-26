"use client"

import { useState, useTransition } from "react"
import { Tag, Plus, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, X, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CouponRow {
  id: string
  code: string
  description: string | null
  discount_type: "percent" | "fixed_pence" | "free_months"
  discount_value: number
  plan_restriction: string | null
  max_uses: number | null
  uses_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function discountLabel(row: CouponRow): string {
  if (row.discount_type === "percent") return `${row.discount_value}% off`
  if (row.discount_type === "fixed_pence") return `£${(row.discount_value / 100).toFixed(2)} off`
  return `${row.discount_value} month${row.discount_value !== 1 ? "s" : ""} free`
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// ── Create coupon form ─────────────────────────────────────────────────────────

interface FormState {
  code: string
  description: string
  discount_type: "percent" | "fixed_pence" | "free_months"
  discount_value: string
  plan_restriction: string
  max_uses: string
  valid_until: string
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  plan_restriction: "",
  max_uses: "",
  valid_until: "",
  is_active: true,
}

function CreateCouponModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: CouponRow) => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const code = form.code.trim().toUpperCase()
    if (!code) { setError("Code is required"); return }
    const value = Number(form.discount_value)
    if (!value || value <= 0) { setError("Discount value must be greater than 0"); return }
    if (form.discount_type === "percent" && value > 100) { setError("Percent discount cannot exceed 100"); return }

    setBusy(true)
    try {
      const supabase = createClient()
      const payload: Record<string, unknown> = {
        code,
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: value,
        plan_restriction: form.plan_restriction.trim() || null,
        max_uses: form.max_uses.trim() ? Number(form.max_uses) : null,
        valid_until: form.valid_until || null,
        is_active: form.is_active,
      }
      const { data, error: err } = await supabase
        .from("coupon_codes")
        .insert(payload)
        .select()
        .single()
      if (err) {
        // 42P01 guard — table not yet migrated
        if ((err as { code?: string }).code === "42P01") {
          setError("coupon_codes table not yet available — apply migration 20260621200000.")
        } else {
          setError(err.message)
        }
        return
      }
      onCreated(data as CouponRow)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setBusy(false)
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
  const labelCls = "block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Tag className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-900">Create coupon code</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-red-700 text-[12.5px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Code</label>
              <input
                className={inputCls}
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. EARLY50"
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">Auto-uppercased. Must be unique.</p>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <input
                className={inputCls}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Short internal note"
              />
            </div>

            <div>
              <label className={labelCls}>Discount type</label>
              <select
                className={inputCls}
                value={form.discount_type}
                onChange={(e) => set("discount_type", e.target.value as FormState["discount_type"])}
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed_pence">Fixed (£)</option>
                <option value="free_months">Free months</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>
                {form.discount_type === "percent" ? "Percent (0–100)" : form.discount_type === "fixed_pence" ? "Amount (pence)" : "Months"}
              </label>
              <input
                className={inputCls}
                type="number"
                min={1}
                max={form.discount_type === "percent" ? 100 : undefined}
                value={form.discount_value}
                onChange={(e) => set("discount_value", e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Plan restriction</label>
              <select className={inputCls} value={form.plan_restriction} onChange={(e) => set("plan_restriction", e.target.value)}>
                <option value="">Any plan</option>
                <option value="starter">Starter</option>
                <option value="operator">Operator</option>
                <option value="scale">Scale</option>
                <option value="pro_agency">Pro / Agency</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Max uses</label>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={form.max_uses}
                onChange={(e) => set("max_uses", e.target.value)}
                placeholder="Unlimited"
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Valid until</label>
              <input
                className={inputCls}
                type="date"
                value={form.valid_until}
                onChange={(e) => set("valid_until", e.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-400">Leave blank for no expiry.</p>
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  role="switch"
                  aria-checked={form.is_active}
                  onClick={() => set("is_active", !form.is_active)}
                  className={cn(
                    "relative w-10 h-5 rounded-full transition-colors cursor-pointer",
                    form.is_active ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    form.is_active ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </div>
                <span className="text-[13px] text-slate-700 font-medium">Active (can be redeemed)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
            >
              {busy ? "Creating…" : "Create coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main client component ──────────────────────────────────────────────────────

export default function CouponCodesClient({ initialRows }: { initialRows: CouponRow[] }) {
  const [rows, setRows] = useState<CouponRow[]>(initialRows)
  const [showCreate, setShowCreate] = useState(false)
  const [sortField, setSortField] = useState<keyof CouponRow>("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [, startTransition] = useTransition()

  function handleSort(field: keyof CouponRow) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortField] ?? ""
    const bv = b[sortField] ?? ""
    const cmp = String(av).localeCompare(String(bv))
    return sortDir === "asc" ? cmp : -cmp
  })

  async function toggleActive(id: string, next: boolean) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, is_active: next } : r))
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("coupon_codes")
          .update({ is_active: next })
          .eq("id", id)
        if (error) {
          // Rollback on error
          setRows((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !next } : r))
        }
      } catch {
        setRows((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !next } : r))
      }
    })
  }

  function SortIcon({ field }: { field: keyof CouponRow }) {
    if (sortField !== field) return null
    return sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-slate-400" />
  }

  const thCls = "px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 whitespace-nowrap"

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">{rows.length} code{rows.length !== 1 ? "s" : ""} total</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Create coupon
        </button>
      </div>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total codes", value: rows.length },
          { label: "Active", value: rows.filter((r) => r.is_active).length },
          { label: "Total redemptions", value: rows.reduce((s, r) => s + r.uses_count, 0) },
          { label: "Expiring this month", value: rows.filter((r) => r.valid_until && new Date(r.valid_until) <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)).length },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-slate-500">No coupon codes yet.</p>
            <p className="text-[12.5px] text-slate-400 mt-1">Create your first code using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className={thCls} onClick={() => handleSort("code")}>Code <SortIcon field="code" /></th>
                  <th className={thCls} onClick={() => handleSort("description")}>Description <SortIcon field="description" /></th>
                  <th className={thCls} onClick={() => handleSort("discount_type")}>Discount <SortIcon field="discount_type" /></th>
                  <th className={thCls} onClick={() => handleSort("plan_restriction")}>Plan <SortIcon field="plan_restriction" /></th>
                  <th className={thCls}>Uses</th>
                  <th className={thCls} onClick={() => handleSort("valid_until")}>Expires <SortIcon field="valid_until" /></th>
                  <th className={thCls} onClick={() => handleSort("is_active")}>Active <SortIcon field="is_active" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((row) => {
                  const pct = row.max_uses ? Math.min((row.uses_count / row.max_uses) * 100, 100) : null
                  const expired = row.valid_until ? new Date(row.valid_until) < new Date() : false
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 tracking-wide">
                        {row.code}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={row.description ?? undefined}>
                        {row.description ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                          {discountLabel(row)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">
                        {row.plan_restriction ?? <span className="text-slate-400 text-[12px]">Any plan</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <span className="text-slate-700 font-medium tabular-nums">
                            {row.uses_count}{row.max_uses != null ? `/${row.max_uses}` : ""}
                          </span>
                          {pct !== null && (
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full min-w-[40px]">
                              <div
                                className={cn("h-1.5 rounded-full transition-all", pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500")}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <AlertCircle className="w-3 h-3" /> Expired
                          </span>
                        ) : (
                          <span className="text-[12.5px]">{formatDate(row.valid_until)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          role="switch"
                          aria-checked={row.is_active}
                          aria-label={row.is_active ? "Deactivate coupon" : "Activate coupon"}
                          onClick={() => toggleActive(row.id, !row.is_active)}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold transition-all border",
                            row.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {row.is_active ? (
                            <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                          ) : (
                            <><ToggleLeft className="w-3.5 h-3.5" /> Off</>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateCouponModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => setRows((prev) => [c, ...prev])}
        />
      )}
    </div>
  )
}
