"use client"

import { useState } from "react"
import Link from "next/link"
import { Hammer, Plus, Pencil, Eye } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, SupplierButton, SupplierDrawer, SupplierField, SupplierBanner,
  supplierInputClass, supplierTextareaClass, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence } from "@/components/supplier-workspace/format"
import { ServiceWizard } from "@/components/supplier-workspace/wizard/ServiceWizard"
import { Sparkles } from "lucide-react"

interface ServiceRow {
  id: string
  name: string
  category: string | null
  description: string | null
  pricing_model: "hourly" | "fixed" | "quote_required"
  rate_pence: number | null
  callout_fee_pence: number | null
  active: boolean
}

const empty = { name: "", category: "", description: "", pricing_model: "quote_required", rate: "", callout: "" }

const PRICING_LABEL: Record<string, string> = { hourly: "Per hour", fixed: "Fixed price", quote_required: "Quote required" }

export default function SupplierServicesCatalogue() {
  const { workspaceId } = useSupplierWorkspace()
  const svc = useSupplierApi<ServiceRow[]>(
    useSupplierApiUrl("/api/supplier/services", { includeInactive: "1" }),
    { select: (j) => (j as { items?: ServiceRow[] }).items ?? [] }
  )
  const [open, setOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceRow | null>(null)
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  function openCreate() { setEditing(null); setForm(empty); setOpen(true); setBanner(null) }
  function openEdit(s: ServiceRow) {
    setEditing(s)
    setForm({
      name: s.name, category: s.category ?? "", description: s.description ?? "",
      pricing_model: s.pricing_model,
      rate: s.rate_pence != null ? String(s.rate_pence / 100) : "",
      callout: s.callout_fee_pence != null ? String(s.callout_fee_pence / 100) : "",
    })
    setOpen(true); setBanner(null)
  }

  async function save() {
    if (!workspaceId || !form.name.trim()) { setBanner({ tone: "red", msg: "A name is required." }); return }
    setBusy(true)
    const body = {
      workspaceId,
      name: form.name.trim(),
      category: form.category || null,
      description: form.description || null,
      pricing_model: form.pricing_model,
      rate_pence: form.rate ? Math.round(Number(form.rate) * 100) : null,
      callout_fee_pence: form.callout ? Math.round(Number(form.callout) * 100) : null,
    }
    try {
      const res = editing
        ? await fetch("/api/supplier/services", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, serviceId: editing.id }) })
        : await fetch("/api/supplier/services", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't save the service." }); return }
      setOpen(false); svc.refresh(); setBanner({ tone: "emerald", msg: editing ? "Service updated." : "Service created." })
    } catch { setBanner({ tone: "red", msg: "Network error." }) }
    finally { setBusy(false) }
  }

  async function toggle(s: ServiceRow) {
    if (!workspaceId) return
    await fetch("/api/supplier/services", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, serviceId: s.id, active: !s.active }),
    })
    svc.refresh()
  }

  const items = svc.data ?? []

  return (
    <div className="space-y-5">
      <MobileTopBar title="Services" subtitle="Your catalogue" />
      <SupplierPageHeader
        title="Services"
        subtitle="The à-la-carte services you offer, with pricing model and rates."
        actions={
          <div className="flex items-center gap-2">
            <SupplierButton variant="secondary" onClick={() => setWizardOpen(true)}><Sparkles className="w-4 h-4" /> Guided setup</SupplierButton>
            <SupplierButton onClick={openCreate}><Plus className="w-4 h-4" /> New service</SupplierButton>
          </div>
        }
      />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {svc.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={3} /></SupplierCard>
      ) : items.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Hammer}
            title="No services yet"
            description="List the services you offer so property managers know what to invite you to quote for."
            action={<SupplierButton onClick={openCreate}><Plus className="w-4 h-4" /> Add your first service</SupplierButton>}
          />
        </SupplierCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <SupplierCard key={s.id} className={`p-5 ${!s.active ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{s.name}</h3>
                  {s.category && <p className="text-xs text-slate-400 mt-0.5">{humaniseStatus(s.category)}</p>}
                </div>
                <SupplierStatusBadge tone={s.active ? "emerald" : "slate"}>{s.active ? "Active" : "Inactive"}</SupplierStatusBadge>
              </div>
              {s.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{s.description}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <SupplierStatusBadge tone="blue">{PRICING_LABEL[s.pricing_model]}</SupplierStatusBadge>
                {s.rate_pence != null && <span className="text-sm font-semibold text-slate-800">{moneyPence(s.rate_pence)}{s.pricing_model === "hourly" ? "/hr" : ""}</span>}
                {s.callout_fee_pence != null && <span className="text-xs text-slate-400">+ {moneyPence(s.callout_fee_pence)} call-out</span>}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/supplier/services/${s.id}`} className="inline-flex items-center justify-center h-8 px-3 text-[13px] font-semibold rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Open
                </Link>
                <SupplierButton size="sm" variant="secondary" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /> Edit</SupplierButton>
                <SupplierButton size="sm" variant="ghost" onClick={() => toggle(s)}>{s.active ? "Deactivate" : "Activate"}</SupplierButton>
              </div>
            </SupplierCard>
          ))}
        </div>
      )}

      <SupplierDrawer
        open={open} onClose={() => setOpen(false)}
        title={editing ? "Edit service" : "New service"}
        footer={<>
          <SupplierButton variant="secondary" onClick={() => setOpen(false)}>Cancel</SupplierButton>
          <SupplierButton onClick={save} loading={busy}>{editing ? "Save changes" : "Create service"}</SupplierButton>
        </>}
      >
        <SupplierField label="Service name" required>
          <input className={supplierInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency boiler repair" />
        </SupplierField>
        <SupplierField label="Category">
          <input className={supplierInputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. plumbing" />
        </SupplierField>
        <SupplierField label="Description">
          <textarea className={supplierTextareaClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </SupplierField>
        <SupplierField label="Pricing model">
          <select className={supplierInputClass} value={form.pricing_model} onChange={(e) => setForm({ ...form, pricing_model: e.target.value })}>
            <option value="quote_required">Quote required</option>
            <option value="hourly">Per hour</option>
            <option value="fixed">Fixed price</option>
          </select>
        </SupplierField>
        {form.pricing_model !== "quote_required" && (
          <div className="grid grid-cols-2 gap-3">
            <SupplierField label="Rate (GBP)">
              <input className={supplierInputClass} inputMode="decimal" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="0.00" />
            </SupplierField>
            <SupplierField label="Call-out fee (GBP)">
              <input className={supplierInputClass} inputMode="decimal" value={form.callout} onChange={(e) => setForm({ ...form, callout: e.target.value })} placeholder="0.00" />
            </SupplierField>
          </div>
        )}
      </SupplierDrawer>

      {wizardOpen && (
        <ServiceWizard
          workspaceId={workspaceId}
          onClose={() => setWizardOpen(false)}
          onCreated={() => { svc.refresh(); setBanner({ tone: "emerald", msg: "Service created via guided setup." }) }}
        />
      )}
    </div>
  )
}
