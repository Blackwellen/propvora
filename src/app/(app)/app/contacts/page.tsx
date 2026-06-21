"use client"

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react"
import { UserPlus, Upload, Download, CheckCircle2, X, AlertTriangle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MobileTopBar } from "@/components/mobile"
import { downloadCsv, parseCsv } from "@/lib/export/csv"
import { useWorkspace } from "@/providers/AuthProvider"
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/useContacts"
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

function AddContactModal({ onClose, onSuccess, workspaceId }: { onClose: () => void; onSuccess: () => void; workspaceId?: string }) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName]   = useState("")
  const [email, setEmail]         = useState("")
  const [phone, setPhone]         = useState("")
  const [type, setType]           = useState("tenant")
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const createContact = useCreateContact()

  async function handleSave() {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!name) { setError("Name is required"); return }
    if (!workspaceId) { setError("Workspace not loaded"); return }
    setSaving(true); setError(null)
    try {
      await createContact.mutateAsync({
        workspace_id: workspaceId,
        full_name: name,
        contact_type: type as import("@/types/database").ContactType,
        email: email.trim() || null,
        phone: phone.trim() || null,
        status: "active",
        is_demo: false,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contact")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="add-contact-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 id="add-contact-title" className="text-lg font-bold text-slate-900">Add Contact</h2>
          <button onClick={onClose} aria-label="Close dialog" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-contact-first" className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
              <input id="add-contact-first" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="James" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" />
            </div>
            <div>
              <label htmlFor="add-contact-last" className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
              <input id="add-contact-last" type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Okafor" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" />
            </div>
          </div>
          <div>
            <label htmlFor="add-contact-type" className="block text-xs font-medium text-slate-700 mb-1">Contact Type</label>
            <select id="add-contact-type" value={type} onChange={e => setType(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all">
              {["tenant","landlord","applicant","supplier","agent","guarantor","legal","accountant","investor","other"].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="add-contact-email" className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input id="add-contact-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="james@example.com" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" />
          </div>
          <div>
            <label htmlFor="add-contact-phone" className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
            <input id="add-contact-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07700 900000" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={onClose} disabled={saving} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 h-9 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70">{saving ? "Saving…" : "Save Contact"}</button>
        </div>
      </div>
    </div>
  )
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

function ContactsPageInner() {
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

  const VALID_CONTACT_TYPES = ["tenant","guarantor","supplier","owner","agent","accountant","other"] as const
  function normaliseContactType(raw: string): string {
    const t = (raw || "").trim().toLowerCase()
    if ((VALID_CONTACT_TYPES as readonly string[]).includes(t)) return t
    const alias: Record<string, string> = { landlord:"owner", applicant:"tenant", post_tenant:"tenant", contractor:"supplier", vendor:"supplier", maintenance:"supplier", solicitor:"other", insurer:"other" }
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
                <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1d4ed8] transition-colors shadow-sm">
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
        <AddContactModal
          workspaceId={workspace?.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); showToast("Contact created successfully") }}
        />
      )}

      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </DashboardContainer>
  )
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-sm text-slate-500">Loading…</div>}>
      <ContactsPageInner />
    </Suspense>
  )
}
