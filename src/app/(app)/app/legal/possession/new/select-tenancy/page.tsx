"use client"
import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, X, CheckCircle, AlertTriangle, Users } from "lucide-react"
import { PossessionWizardShell } from "@/components/legal/PossessionWizardShell"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancies } from "@/hooks/useTenancies"
import { useProperties } from "@/hooks/useProperties"
import { useContacts } from "@/hooks/useContacts"
import { useCreatePossessionCase, NIL_UUID } from "../../../legal-data"

function money(n: number | null | undefined): string {
  if (n == null) return "£0"
  return `£${Number(n).toLocaleString("en-GB")}`
}

export default function SelectTenancyPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  const { data: tenancies = [], isLoading } = useTenancies(workspaceId)
  const { data: properties = [] } = useProperties(workspaceId)
  const { data: contacts = [] } = useContacts(workspaceId)
  const createCase = useCreatePossessionCase()

  const [selected, setSelected] = useState<string>("")
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const propName = (id: string | null) => properties.find((p) => p.id === id)?.name ?? "Unknown property"
  const contactName = (id: string | null) =>
    contacts.find((c) => c.id === id)?.full_name ?? "Unnamed tenant"

  const rows = useMemo(
    () =>
      tenancies.map((t) => ({
        id: t.id,
        property_id: t.property_id,
        contact_id: t.tenant_contact_id,
        unit_id: t.unit_id,
        name: contactName(t.tenant_contact_id),
        address: propName(t.property_id),
        type: t.tenancy_type ? t.tenancy_type.toUpperCase() : "—",
        term: t.tenancy_type === "periodic" ? "Periodic" : "Fixed Term",
        rent: t.rent_amount,
        status: t.status,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenancies, properties, contacts]
  )

  const filtered = rows.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase())
  )

  const selectedRow = rows.find((t) => t.id === selected)

  async function handleNext() {
    if (!workspaceId || !selectedRow) return
    setCreating(true)
    setError(null)
    try {
      const created = await createCase.mutateAsync({
        workspace_id: workspaceId,
        tenancy_id: selectedRow.id || NIL_UUID,
        property_id: selectedRow.property_id,
        contact_id: selectedRow.contact_id,
        ground: "Ground 8 (rent arrears)",
        status: "gathering_evidence",
      })
      router.push(`/app/legal/possession/new/select-grounds?case=${created.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create case")
      setCreating(false)
    }
  }

  const rightRail = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-800">Case Summary</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-emerald-600 font-medium">Live preview</span>
        </div>
      </div>
      {selectedRow ? (
        <div className="p-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold bg-slate-100 text-slate-700">
              {selectedRow.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-800">{selectedRow.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{selectedRow.address}</p>
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[12px] text-slate-600">Monthly rent</span>
            <span className="text-xl font-bold text-slate-800">{money(selectedRow.rent)}</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              A draft case will be created against this tenancy. Notices are review-only and never auto-served.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-[12px] text-slate-400">Select a tenancy to see the case summary.</div>
      )}
    </div>
  )

  return (
    <PossessionWizardShell
      currentStep={1}
      title="Start Possession Case"
      subtitle="Follow the wizard to build a compliant, review-only possession case."
      rightRail={rightRail}
      nextDisabled={!selected || creating}
      showSaveDraft={false}
      nextLabel={creating ? "Creating…" : "Next: Choose Grounds"}
      onNext={handleNext}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-0.5">Select Tenancy</h2>
        <p className="text-xs text-slate-500 mb-4">Choose the live tenancy you wish to start possession proceedings for.</p>

        {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants or property…"
            className="w-full pl-10 pr-4 py-2 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="text-[12px] text-slate-400 py-8 text-center">Loading tenancies…</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl">
            <Users className="w-9 h-9 text-slate-300 mb-3" />
            <p className="text-[13px] font-semibold text-slate-600 mb-1">No tenancies yet</p>
            <p className="text-[12px] text-slate-400 max-w-xs mb-4">
              Add a tenancy in Portfolio first, then return here to start a possession case.
            </p>
            <Link href="/app/portfolio/tenancies" className="text-[12px] text-blue-600 hover:text-blue-800 font-medium">
              Go to Tenancies →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => {
              const isSelected = selected === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected ? "border-[#2563EB] bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-[#2563EB]" : "border-slate-300"}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#2563EB]" />}
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-slate-100 text-slate-700">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-slate-800">{t.name}</p>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">{t.type}</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${t.term === "Periodic" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                          {t.term}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.address}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[12px] font-semibold text-slate-800">{money(t.rent)}</span>
                      {t.status === "active" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </PossessionWizardShell>
  )
}
