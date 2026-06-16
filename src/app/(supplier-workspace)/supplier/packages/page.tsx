"use client"

import { useState } from "react"
import { Package, Plus, Pencil, Check, X } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, SupplierButton, SupplierDrawer, SupplierField, SupplierBanner,
  supplierInputClass, supplierTextareaClass,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence } from "@/components/supplier-workspace/format"
import type { SupplierPackageRow } from "@/components/supplier-workspace/types"

const empty = { name: "", description: "", price: "", duration_days: "", inclusions: "", exclusions: "" }

export default function SupplierPackagesPage() {
  const { workspaceId } = useSupplierWorkspace()
  const pkgs = useSupplierApi<SupplierPackageRow[]>(
    useSupplierApiUrl("/api/supplier/packages", { includeInactive: "1" }),
    { select: (j) => (j as { items?: SupplierPackageRow[] }).items ?? [] }
  )
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierPackageRow | null>(null)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  function openCreate() {
    setEditing(null); setForm(empty); setOpen(true); setBanner(null)
  }
  function openEdit(p: SupplierPackageRow) {
    setEditing(p)
    setForm({
      name: p.name, description: p.description ?? "",
      price: p.price_pence != null ? String(p.price_pence / 100) : "",
      duration_days: p.duration_days != null ? String(p.duration_days) : "",
      inclusions: p.inclusions.join("\n"), exclusions: p.exclusions.join("\n"),
    })
    setOpen(true); setBanner(null)
  }

  async function save() {
    if (!workspaceId || !form.name.trim()) { setBanner({ tone: "red", msg: "A name is required." }); return }
    setBusy(true)
    const payload = {
      workspaceId,
      name: form.name.trim(),
      description: form.description || null,
      price_pence: form.price ? Math.round(Number(form.price) * 100) : null,
      duration_days: form.duration_days ? Number(form.duration_days) : null,
      inclusions: form.inclusions.split("\n").map((s) => s.trim()).filter(Boolean),
      exclusions: form.exclusions.split("\n").map((s) => s.trim()).filter(Boolean),
    }
    try {
      const res = editing
        ? await fetch("/api/supplier/packages", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, packageId: editing.id }) })
        : await fetch("/api/supplier/packages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't save the package." }); return }
      setOpen(false); pkgs.refresh()
      setBanner({ tone: "emerald", msg: editing ? "Package updated." : "Package created." })
    } catch { setBanner({ tone: "red", msg: "Network error." }) }
    finally { setBusy(false) }
  }

  async function toggleActive(p: SupplierPackageRow) {
    if (!workspaceId) return
    await fetch("/api/supplier/packages", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, packageId: p.id, active: !p.active }),
    })
    pkgs.refresh()
  }

  const items = pkgs.data ?? []

  return (
    <div className="space-y-5">
      <MobileTopBar title="Packages" subtitle="Productised offerings" />
      <SupplierPageHeader
        title="Packages"
        subtitle="Fixed-scope, fixed-price offerings you can publish alongside your à-la-carte services."
        actions={<SupplierButton onClick={openCreate}><Plus className="w-4 h-4" /> New package</SupplierButton>}
      />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {pkgs.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={3} /></SupplierCard>
      ) : items.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Package}
            title="No packages yet"
            description="Bundle your services into clear, fixed-price packages (e.g. an end-of-tenancy clean) so property managers can buy with confidence."
            action={<SupplierButton onClick={openCreate}><Plus className="w-4 h-4" /> Create your first package</SupplierButton>}
          />
        </SupplierCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => (
            <SupplierCard key={p.id} className={`p-5 ${!p.active ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{p.name}</h3>
                  {p.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{p.description}</p>}
                </div>
                <SupplierStatusBadge tone={p.active ? "emerald" : "slate"}>{p.active ? "Active" : "Inactive"}</SupplierStatusBadge>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-bold text-slate-900">{p.price_pence != null ? moneyPence(p.price_pence, p.currency) : "POA"}</span>
                {p.duration_days != null && <span className="text-xs text-slate-400">· {p.duration_days} day{p.duration_days === 1 ? "" : "s"}</span>}
              </div>
              {(p.inclusions.length > 0 || p.exclusions.length > 0) && (
                <div className="mt-3 space-y-1.5">
                  {p.inclusions.map((inc, i) => (
                    <p key={`in-${i}`} className="flex items-start gap-1.5 text-[13px] text-slate-600"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> {inc}</p>
                  ))}
                  {p.exclusions.map((exc, i) => (
                    <p key={`ex-${i}`} className="flex items-start gap-1.5 text-[13px] text-slate-400"><X className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" /> {exc}</p>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <SupplierButton size="sm" variant="secondary" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /> Edit</SupplierButton>
                <SupplierButton size="sm" variant="ghost" onClick={() => toggleActive(p)}>{p.active ? "Deactivate" : "Activate"}</SupplierButton>
              </div>
            </SupplierCard>
          ))}
        </div>
      )}

      <SupplierDrawer
        open={open} onClose={() => setOpen(false)}
        title={editing ? "Edit package" : "New package"}
        footer={<>
          <SupplierButton variant="secondary" onClick={() => setOpen(false)}>Cancel</SupplierButton>
          <SupplierButton onClick={save} loading={busy}>{editing ? "Save changes" : "Create package"}</SupplierButton>
        </>}
      >
        <SupplierField label="Package name" required>
          <input className={supplierInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. End-of-tenancy clean" />
        </SupplierField>
        <SupplierField label="Description">
          <textarea className={supplierTextareaClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </SupplierField>
        <div className="grid grid-cols-2 gap-3">
          <SupplierField label="Price (GBP)">
            <input className={supplierInputClass} inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          </SupplierField>
          <SupplierField label="Duration (days)">
            <input className={supplierInputClass} inputMode="numeric" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} placeholder="1" />
          </SupplierField>
        </div>
        <SupplierField label="What's included" hint="One item per line.">
          <textarea className={supplierTextareaClass} value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder={"Deep clean all rooms\nOven & appliances"} />
        </SupplierField>
        <SupplierField label="What's not included" hint="One item per line.">
          <textarea className={supplierTextareaClass} value={form.exclusions} onChange={(e) => setForm({ ...form, exclusions: e.target.value })} placeholder={"External windows\nCarpet shampoo"} />
        </SupplierField>
      </SupplierDrawer>
    </div>
  )
}
