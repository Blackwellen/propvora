"use client"

/**
 * SupplierCredentialsCard — list + capture the supplier's trade credentials
 * (Gas Safe, NICEIC, RGI, Meister, …). The required credential per work type +
 * jurisdiction is sourced from the trade-certs engine; writes persist to
 * `supplier_credentials` via /api/supplier/credentials (RLS workspace-scoped).
 */

import { useState } from "react"
import { BadgeCheck, Plus, Trash2 } from "lucide-react"
import {
  SupplierCard,
  SupplierCardHeader,
  SupplierButton,
  SupplierField,
  SupplierStatusBadge,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierDrawer,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate } from "@/components/supplier-workspace/format"
import { requiredTradeCredential, type WorkType } from "@/lib/work/trade-certs"
import { credentialStatus, type SupplierCredentialRow } from "@/lib/supplier/credentials"

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20"

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: "gas", label: "Gas work" },
  { value: "electrical", label: "Electrical work" },
  { value: "energy", label: "Energy / EPC" },
  { value: "general", label: "General trade" },
]

const COUNTRIES = [
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "DE", label: "Germany" },
  { code: "ES", label: "Spain" },
  { code: "AU", label: "Australia" },
  { code: "US", label: "United States" },
]

const STATUS_TONE = {
  verified: "emerald",
  expiring: "amber",
  expired: "red",
  unverified: "slate",
} as const

const STATUS_LABEL = {
  verified: "Verified",
  expiring: "Expiring soon",
  expired: "Expired",
  unverified: "Awaiting review",
} as const

export function SupplierCredentialsCard() {
  const { workspaceId } = useSupplierWorkspace()
  const list = useSupplierApi<{ items: SupplierCredentialRow[] }>(
    useSupplierApiUrl("/api/supplier/credentials"),
    { select: (j) => j as { items: SupplierCredentialRow[] } }
  )
  const rows = list.data?.items ?? []

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [country, setCountry] = useState("GB")
  const [workType, setWorkType] = useState<WorkType>("gas")
  const [credentialType, setCredentialType] = useState(
    requiredTradeCredential("GB", "gas")?.credential ?? ""
  )
  const [reference, setReference] = useState("")
  const [expiresAt, setExpiresAt] = useState("")

  // When work type / country changes, suggest the canonical credential label
  // (the operator can still edit it).
  function applySuggestion(nextCountry: string, nextWorkType: WorkType) {
    const suggested = requiredTradeCredential(nextCountry, nextWorkType)?.credential
    if (suggested) setCredentialType(suggested)
  }

  function resetForm() {
    setCountry("GB")
    setWorkType("gas")
    setCredentialType(requiredTradeCredential("GB", "gas")?.credential ?? "")
    setReference("")
    setExpiresAt("")
    setError(null)
  }

  async function handleAdd() {
    if (!workspaceId) {
      setError("Workspace not ready — please retry.")
      return
    }
    if (!credentialType.trim()) {
      setError("Enter the credential name.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/supplier/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          credential: {
            credential_type: credentialType.trim(),
            jurisdiction: country,
            reference: reference.trim() || null,
            expires_at: expiresAt || null,
          },
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(typeof j.error === "string" ? j.error : "Could not add credential.")
        return
      }
      setOpen(false)
      resetForm()
      list.refresh()
    } catch {
      setError("Could not add credential.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!workspaceId) return
    await fetch(
      `/api/supplier/credentials?workspaceId=${encodeURIComponent(workspaceId)}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    )
    list.refresh()
  }

  return (
    <SupplierCard className="p-5">
      <SupplierCardHeader
        title="Trade credentials"
        action={
          <SupplierButton size="sm" variant="outline" onClick={() => { resetForm(); setOpen(true) }}>
            <Plus className="w-4 h-4" /> Add credential
          </SupplierButton>
        }
      />

      {list.loading ? (
        <SupplierLoadingState rows={3} />
      ) : rows.length === 0 ? (
        <SupplierEmptyState
          icon={<BadgeCheck className="w-5 h-5" />}
          title="No credentials yet"
          description="Add your trade competency credentials (Gas Safe, NICEIC, RGI…) so clients can see you're qualified for the work."
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => {
            const st = credentialStatus(r)
            return (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.credential_type}</p>
                    {r.jurisdiction && (
                      <span className="text-[11px] text-slate-400">· {r.jurisdiction}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.reference ? `Ref ${r.reference}` : "No reference"}
                    {r.expires_at ? ` · Expires ${shortDate(r.expires_at)}` : ""}
                  </p>
                </div>
                <SupplierStatusBadge tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</SupplierStatusBadge>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label={`Remove ${r.credential_type}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <SupplierDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Add trade credential"
        footer={
          <div className="flex items-center justify-end gap-2">
            <SupplierButton variant="ghost" onClick={() => setOpen(false)}>Cancel</SupplierButton>
            <SupplierButton onClick={handleAdd} loading={saving}>Save credential</SupplierButton>
          </div>
        }
      >
        <div className="space-y-4">
          <SupplierField label="Jurisdiction" hint="Where the credential is issued — sets the required credential.">
            <select
              className={inputCls}
              value={country}
              onChange={(e) => { setCountry(e.target.value); applySuggestion(e.target.value, workType) }}
            >
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </SupplierField>

          <SupplierField label="Work type">
            <select
              className={inputCls}
              value={workType}
              onChange={(e) => { const wt = e.target.value as WorkType; setWorkType(wt); applySuggestion(country, wt) }}
            >
              {WORK_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
            {requiredTradeCredential(country, workType)?.mandatory && (
              <p className="text-[11px] text-amber-600 mt-1">This credential is legally required for this work type in {country}.</p>
            )}
          </SupplierField>

          <SupplierField label="Credential" required hint="Pre-filled from the jurisdiction — edit if your credential differs.">
            <input className={inputCls} value={credentialType} onChange={(e) => setCredentialType(e.target.value)} placeholder="e.g. Gas Safe Register number" />
          </SupplierField>

          <SupplierField label="Reference / registration number">
            <input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 123456" />
          </SupplierField>

          <SupplierField label="Expires" hint="Leave blank if the credential does not expire.">
            <input type="date" className={inputCls} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </SupplierField>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </SupplierDrawer>
    </SupplierCard>
  )
}
