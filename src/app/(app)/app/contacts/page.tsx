"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { UserPlus, Upload, Download, CheckCircle2, X, AlertTriangle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MobileTopBar } from "@/components/mobile"
import { downloadCsv, parseCsv } from "@/lib/export/csv"
import { useWorkspace } from "@/providers/AuthProvider"
import { useContacts, useCreateContact } from "@/hooks/useContacts"
import { deriveSupplierCategories, SUPPLIER_CATEGORIES } from "@/lib/constants/supplierCategories"
import type { Contact } from "@/types/database"

import { ContactsStatsStrip } from "@/components/contacts/contacts-list/ContactsStatsStrip"
import { ContactsFilterBar } from "@/components/contacts/contacts-list/ContactsFilterBar"
import { ContactsOverviewPanel } from "@/components/contacts/contacts-list/ContactsOverviewPanel"
import {
  GridContactCard,
  ListContactRow,
  ContactsTable,
  ContactsEmptyState,
  SkeletonCard,
} from "@/components/contacts/contacts-list/ContactsTable"
import type { MappedContact, ViewMode, TypeFilter } from "@/components/contacts/contacts-list/types"
import { TYPE_FILTER_MAP } from "@/components/contacts/contacts-list/types"
import QuickAddContactModal from "@/components/contacts/contact-new/QuickAddContactModal"

function mapContact(c: Contact): MappedContact {
  return {
    id: c.id,
    workspace_id: c.workspace_id,
    is_demo: c.is_demo === true,
    full_name: c.full_name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    contact_type: c.contact_type,
    status: c.status,
    company_name: c.company_name ?? null,
    city: c.city ?? null,
    tags: (c.tags as string[]) ?? [],
    service_categories: deriveSupplierCategories({
      category: c.category,
      subcategory: c.subcategory,
      tags: (c.tags as string[]) ?? [],
    }),
    updated_at: c.updated_at,
  }
}


function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      {message}
      <button onClick={onDismiss} aria-label="Dismiss notification" className="ml-2 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function ContactsPage() {
  const { workspace } = useWorkspace()
  const { data: liveContacts, isLoading, error } = useContacts(workspace?.id)

  const contacts: MappedContact[] = useMemo(() => {
    if (liveContacts && liveContacts.length > 0) return liveContacts.map(mapContact)
    return []
  }, [liveContacts])

  const [activeView, setActiveView] = useState<ViewMode>("overview")
  const [activeType, setActiveType] = useState<TypeFilter>("all")
  const [serviceCategory, setServiceCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const _searchParams = useSearchParams()
  useEffect(() => {
    if (_searchParams.get("new") === "1") setShowAddModal(true)
  }, [_searchParams])

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const importInputRef = useRef<HTMLInputElement>(null)
  const importContact = useCreateContact()
  const [importing, setImporting] = useState(false)

  // Mirrors the live `contact_type` Postgres enum (kept in sync with
  // src/types/database.ts ContactType). CSV imports are normalised to one of
  // these so a bad value never breaks the insert with an invalid-enum error.
  const VALID_CONTACT_TYPES = ["landlord","tenant","post_tenant","applicant","guarantor","supplier","agent","local_authority","housing_association","legal","accountant","insurer","utility_provider","broadband","cleaning","maintenance","emergency_contractor","investor","affiliate","other"] as const
  function normaliseContactType(raw: string): string {
    const t = (raw || "").trim().toLowerCase().replace(/[\s-]+/g, "_")
    if ((VALID_CONTACT_TYPES as readonly string[]).includes(t)) return t
    const alias: Record<string, string> = {
      owner:"landlord", property_owner:"landlord",
      prospect:"applicant", prospective_tenant:"applicant", enquiry:"applicant",
      past_tenant:"post_tenant", former_tenant:"post_tenant", ex_tenant:"post_tenant",
      contractor:"supplier", vendor:"supplier", tradesperson:"supplier", trade:"supplier",
      solicitor:"legal", lawyer:"legal", barrister:"legal",
      council:"local_authority", local_council:"local_authority",
      bookkeeper:"accountant", tax_adviser:"accountant",
      insurance:"insurer", utility:"utility_provider", cleaner:"cleaning",
      emergency:"emergency_contractor", emergency_contact:"emergency_contractor",
    }
    return alias[t] ?? "other"
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!workspace?.id) { showToast("Workspace not loaded"); return }
    setImporting(true)
    try {
      const rows = parseCsv(await file.text())
      if (rows.length === 0) { showToast("No rows found in that CSV"); return }
      let ok = 0, failed = 0
      for (const r of rows) {
        const name = (r.name || r["full name"] || `${r["first name"] ?? ""} ${r["last name"] ?? ""}`).trim()
        if (!name) { failed++; continue }
        try {
          await importContact.mutateAsync({ workspace_id: workspace.id, full_name: name, contact_type: normaliseContactType(r.type) as import("@/types/database").ContactType, email: r.email?.trim() || null, phone: r.phone?.trim() || null, status: "active", is_demo: false })
          ok++
        } catch { failed++ }
      }
      showToast(failed === 0 ? `Imported ${ok} contacts` : `Imported ${ok} contacts · ${failed} skipped`)
    } catch {
      showToast("Could not read that CSV file")
    } finally {
      setImporting(false)
    }
  }

  const filtered = useMemo(() => {
    let data = [...contacts]
    if (activeType !== "all") {
      const allowed = TYPE_FILTER_MAP[activeType]
      data = data.filter(c => allowed.includes(c.contact_type))
    }
    if (serviceCategory !== "all") data = data.filter(c => c.service_categories.includes(serviceCategory))
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.company_name ?? "").toLowerCase().includes(q) ||
        c.service_categories.some(cat => cat.toLowerCase().includes(q))
      )
    }
    return data
  }, [contacts, activeType, serviceCategory, search])

  const serviceCategoryOptions = useMemo(() => {
    const present = new Set<string>()
    for (const c of contacts) for (const cat of c.service_categories) present.add(cat)
    const ordered = SUPPLIER_CATEGORIES.filter(c => present.has(c))
    const extras = [...present].filter(c => !SUPPLIER_CATEGORIES.includes(c)).sort()
    return [...ordered, ...extras]
  }, [contacts])

  function clearFilters() { setActiveType("all"); setSearch("") }

  return (
    <DashboardContainer>
      <div className="space-y-0">
        <MobileTopBar
          title="Contacts"
          subtitle="Relationship hub"
          primaryAction={{ label: "Add contact", icon: UserPlus, onClick: () => setShowAddModal(true) }}
          overflowActions={[{ label: "Import", icon: Upload, onClick: () => importInputRef.current?.click() }]}
        />
        <div className="md:hidden -mx-4 mb-4"><ContactsTabNav /></div>

        <div className="hidden md:block">
          <SectionHeader
            title="Contacts"
            subtitle="Your relationship hub — tenants, landlords, suppliers and beyond"
            tabs={<ContactsTabNav />}
            actions={
              <>
                <button onClick={() => { if (filtered.length === 0) { showToast("No contacts to export"); return }; downloadCsv("contacts", filtered as unknown as Record<string, unknown>[], [{ key:"full_name",label:"Name" },{ key:"contact_type",label:"Type" },{ key:"email",label:"Email" },{ key:"phone",label:"Phone" },{ key:"company_name",label:"Company" },{ key:"city",label:"City" },{ key:"status",label:"Status" }]); showToast(`Exported ${filtered.length} contacts`) }} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                  <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={() => importInputRef.current?.click()} disabled={importing} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                  <Upload className="w-4 h-4" /> {importing ? "Importing…" : "Import"}
                </button>
<button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] transition-colors shadow-sm">
                  <UserPlus className="w-4 h-4" /> Add Contact
                </button>
              </>
            }
          />
        </div>

        <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportFile} />

        <div className="md:pt-6 space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">Failed to load contacts</p>
              <p className="text-xs text-red-500 mt-1">{error.message}</p>
            </div>
          )}

          <ContactsStatsStrip contacts={contacts} isLoading={isLoading} />

          <ContactsFilterBar
            activeView={activeView} setActiveView={setActiveView}
            activeType={activeType} setActiveType={setActiveType}
            serviceCategory={serviceCategory} setServiceCategory={setServiceCategory}
            serviceCategoryOptions={serviceCategoryOptions}
            search={search} setSearch={setSearch}
          />

          {activeView !== "overview" && (
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of {contacts.length} contacts
            </p>
          )}

          {activeView === "overview" && !isLoading && (
            <ContactsOverviewPanel contacts={contacts} onAddContact={() => setShowAddModal(true)} />
          )}

          {activeView === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : filtered.length === 0
                ? <ContactsEmptyState onAdd={() => setShowAddModal(true)} onClear={clearFilters} hasFilters={activeType !== "all" || search !== ""} />
                : filtered.map(c => <GridContactCard key={c.id} contact={c} />)
              }
            </div>
          )}

          {activeView === "list" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2"><div className="h-3 bg-slate-200 rounded w-1/3" /><div className="h-2 bg-slate-100 rounded w-1/2" /></div>
                  </div>
                ))
                : filtered.length === 0
                ? <ContactsEmptyState onAdd={() => setShowAddModal(true)} onClear={clearFilters} hasFilters={activeType !== "all" || search !== ""} />
                : filtered.map(c => <ListContactRow key={c.id} contact={c} />)
              }
            </div>
          )}

          {activeView === "table" && (
            <ContactsTable contacts={filtered} isLoading={isLoading} onClearFilters={clearFilters} />
          )}
        </div>
      </div>

      {showAddModal && (
        <QuickAddContactModal
          mode="contact"
          workspaceId={workspace?.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); showToast("Contact created successfully") }}
        />
      )}

      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </DashboardContainer>
  )
}
