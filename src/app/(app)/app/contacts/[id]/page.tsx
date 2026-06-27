"use client"

import React, { useState, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, User, Activity, Home, Wallet, FolderOpen, MessageCircle, StickyNote, ListChecks, Shield, Building2, TrendingUp, FileText, Settings, Globe, Briefcase, CalendarDays } from "lucide-react"
import { useRouter } from "next/navigation"
import { MobileTabs } from "@/components/mobile"
import { cn } from "@/lib/utils"
import { useContact, useUpdateContact, useDeleteContact } from "@/hooks/useContacts"
import { useContactRelations } from "@/hooks/useContactRelations"
import { useWorkspace } from "@/hooks/useWorkspace"
import { deriveSupplierCategories } from "@/lib/constants/supplierCategories"
import { metadataToSupplierInfo, metadataToEnquiryInfo, typeDetailRows } from "@/lib/contacts/metadata"

import { ContactSaveContext } from "@/components/contacts/contact-detail/ContactSaveContext"
import { ContactDetailHeader } from "@/components/contacts/contact-detail/ContactDetailHeader"
import { KpiStrip } from "@/components/contacts/contact-detail/ContactKpiStrip"
import { RightRail } from "@/components/contacts/contact-detail/ContactRightRail"
import { ContactDetailSkeleton, SectionCard, FieldRow } from "@/components/contacts/contact-detail/shared"
import {
  TenantOverviewTab,
  LandlordOverviewTab,
  SupplierOverviewTab,
  ApplicantOverviewTab,
} from "@/components/contacts/contact-detail/ContactOverviewTab"
import { ProfileTab, SupplierProfileTab, LandlordPropertiesTab, PlanningSetTab, LandlordOffersTab, EnquiryTab, PropertyInterestTab, ViewingsTab, NotesTab, TasksTab, MessagesTab } from "@/components/contacts/contact-detail/ContactProfileTab"
import { TenancyTab } from "@/components/contacts/contact-detail/ContactTenanciesTab"
import { WorkHistoryTab } from "@/components/contacts/contact-detail/ContactJobsTab"
import { InvoiceTable } from "@/components/contacts/contact-detail/ContactInvoicesTab"
import { ContactDocumentsTab } from "@/components/contacts/contact-detail/ContactDocumentsTab"
import { PortalAccessTab } from "@/components/contacts/contact-detail/ContactPortalTab"
import { ActivityTimeline, AuditTab } from "@/components/contacts/contact-detail/ContactActivityTab"
import type { ContactDetail, ContactType, ContactSaveFn } from "@/components/contacts/contact-detail/types"

interface TabDef { id: string; label: string; icon: React.ElementType }

function getTabsForType(type: ContactType): TabDef[] {
  if (type === "tenant") return [
    { id:"overview",   label:"Overview",   icon:Home },
    { id:"profile",    label:"Profile",    icon:User },
    { id:"tenancy",    label:"Tenancy",    icon:Home },
    { id:"payments",   label:"Payments",   icon:Wallet },
    { id:"documents",  label:"Documents",  icon:FolderOpen },
    { id:"messages",   label:"Messages",   icon:MessageCircle },
    { id:"tasks",      label:"Tasks",      icon:ListChecks },
    { id:"activity",   label:"Activity",   icon:Activity },
    { id:"audit",      label:"Audit",      icon:Shield },
  ]
  if (type === "landlord") return [
    { id:"overview",   label:"Overview",      icon:Home },
    { id:"profile",    label:"Profile",       icon:User },
    { id:"properties", label:"Properties",    icon:Building2 },
    { id:"planning",   label:"Planning Sets", icon:TrendingUp },
    { id:"offers",     label:"Offers",        icon:FileText },
    { id:"documents",  label:"Documents",     icon:FolderOpen },
    { id:"messages",   label:"Messages",      icon:MessageCircle },
    { id:"tasks",      label:"Tasks",         icon:ListChecks },
    { id:"activity",   label:"Activity",      icon:Activity },
    { id:"audit",      label:"Audit",         icon:Shield },
  ]
  if (type === "supplier") return [
    { id:"overview",   label:"Overview",         icon:Home },
    { id:"profile",    label:"Supplier Profile", icon:Settings },
    { id:"work",       label:"Work History",      icon:Briefcase },
    { id:"invoices",   label:"Invoices",          icon:Wallet },
    { id:"documents",  label:"Documents",         icon:FolderOpen },
    { id:"portal",     label:"Portal Access",     icon:Globe },
    { id:"messages",   label:"Messages",          icon:MessageCircle },
    { id:"notes",      label:"Notes",             icon:StickyNote },
    { id:"activity",   label:"Activity",          icon:Activity },
    { id:"audit",      label:"Audit",             icon:Shield },
  ]
  if (type === "applicant") return [
    { id:"overview",   label:"Overview",          icon:Home },
    { id:"enquiry",    label:"Enquiry",           icon:User },
    { id:"interest",   label:"Property Interest", icon:Building2 },
    { id:"viewings",   label:"Viewings",          icon:CalendarDays },
    { id:"messages",   label:"Messages",          icon:MessageCircle },
    { id:"tasks",      label:"Tasks",             icon:ListChecks },
    { id:"activity",   label:"Activity",          icon:Activity },
    { id:"audit",      label:"Audit",             icon:Shield },
  ]
  return [
    { id:"overview",   label:"Overview",   icon:Home },
    { id:"profile",    label:"Profile",    icon:User },
    { id:"documents",  label:"Documents",  icon:FolderOpen },
    { id:"messages",   label:"Messages",   icon:MessageCircle },
    { id:"notes",      label:"Notes",      icon:StickyNote },
    { id:"tasks",      label:"Tasks",      icon:ListChecks },
    { id:"activity",   label:"Activity",   icon:Activity },
    { id:"audit",      label:"Audit",      icon:Shield },
  ]
}

function ContactDetailPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const { data: workspace } = useWorkspace()
  const { data: liveContact, isLoading, isError } = useContact(workspace?.id, id)
  const { data: relations } = useContactRelations(
    workspace?.id,
    id,
    liveContact?.contact_type as ContactType | undefined,
  )
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") ?? "overview")
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  React.useEffect(() => {
    const t = searchParams.get("tab")
    if (t) setActiveTab(t)
  }, [searchParams])

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  if (!workspace || isLoading) return <ContactDetailSkeleton />

  if (isError || liveContact === null || liveContact === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6 text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Contact not found</h2>
        <p className="text-sm text-slate-500 mb-4">This contact may have been deleted or you may not have access.</p>
        <Link href="/property-manager/contacts" className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:underline">
          Back to Contacts
        </Link>
      </div>
    )
  }

  const contact: ContactDetail = {
    id: liveContact.id,
    full_name: liveContact.full_name,
    email: liveContact.email ?? "",
    phone: liveContact.phone ?? "",
    contact_type: (liveContact.contact_type as ContactType) ?? "other",
    status: liveContact.status ?? "active",
    company_name: liveContact.company_name ?? null,
    city: liveContact.city ?? "",
    postcode: liveContact.postcode ?? "",
    address_line1: liveContact.address_line1 ?? null,
    tags: Array.isArray(liveContact.tags) ? (liveContact.tags as string[]) : [],
    arrears: relations?.arrears ?? 0,
    linked_properties: relations?.linked_properties ?? 0,
    active_tenancies: relations?.active_tenancies ?? 0,
    last_contacted: null,
    next_follow_up: null,
    health: (relations?.arrears ?? 0) > 0 ? "risk" : "healthy",
    portal_status: null,
    notes: liveContact.notes ?? null,
    service_categories: deriveSupplierCategories({
      category: liveContact.category,
      subcategory: liveContact.subcategory,
      tags: liveContact.tags,
    }),
    // Type-specific detail captured by the New Contact wizard (Step 4) is stored
    // on contacts.metadata and hydrated here into the typed sub-objects the
    // Supplier/Enquiry tabs render, plus generic rows for the other types.
    supplier: metadataToSupplierInfo(liveContact.metadata),
    enquiry: metadataToEnquiryInfo(liveContact.metadata),
    type_detail_rows: typeDetailRows(liveContact.metadata),
    tenancy: relations?.tenancy,
    invoices: relations?.invoices ?? [],
    jobs: relations?.jobs ?? [],
    activity: relations?.activity ?? [],
  }

  const editable = liveContact.is_demo !== true
  const wsId = workspace.id

  const saveField: ContactSaveFn = async (field, value) => {
    const v = value.trim()
    await updateContact.mutateAsync({
      id: contact.id,
      workspaceId: wsId,
      payload: { [field]: v === "" ? null : v } as import("@/types/database").UpdateContact,
    })
  }

  async function handleArchive() {
    const next = contact.status === "archived" ? "active" : "archived"
    await updateContact.mutateAsync({
      id: contact.id,
      workspaceId: wsId,
      payload: { status: next } as import("@/types/database").UpdateContact,
    })
  }

  async function handleDelete() {
    await deleteContact.mutateAsync({ id: contact.id, workspaceId: wsId })
    router.push("/property-manager/contacts")
  }

  const tabs = getTabsForType(contact.contact_type)

  function renderTabContent() {
    const type = contact.contact_type
    switch (activeTab) {
      case "overview": {
        const base =
          type === "tenant" ? <TenantOverviewTab contact={contact} />
          : type === "landlord" ? <LandlordOverviewTab contact={contact} />
          : type === "supplier" ? <SupplierOverviewTab contact={contact} />
          : type === "applicant" ? <ApplicantOverviewTab contact={contact} />
          : <ProfileTab contact={contact} />
        const rows = contact.type_detail_rows ?? []
        if (rows.length === 0) return base
        return (
          <div className="space-y-5">
            {base}
            <SectionCard className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Details</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {rows.map((r) => <FieldRow key={r.label} label={r.label} value={r.value} />)}
              </div>
            </SectionCard>
          </div>
        )
      }
      case "profile":
        if (type === "supplier")  return <SupplierProfileTab contact={contact} />
        return <ProfileTab contact={contact} />
      case "tenancy":    return <TenancyTab contact={contact} />
      case "payments":   return <InvoiceTable invoices={contact.invoices ?? []} emptyLabel="No payment records yet." />
      case "properties": return <LandlordPropertiesTab contact={contact} />
      case "planning":   return <PlanningSetTab contact={contact} />
      case "offers":     return <LandlordOffersTab contact={contact} />
      case "work":       return <WorkHistoryTab contact={contact} />
      case "invoices":   return <InvoiceTable invoices={contact.invoices ?? []} />
      case "portal":     return <PortalAccessTab contact={contact} workspaceId={wsId} />
      case "enquiry":    return <EnquiryTab contact={contact} />
      case "interest":   return <PropertyInterestTab contactId={contact.id} />
      case "viewings":   return <ViewingsTab contactId={contact.id} />
      case "documents":  return <ContactDocumentsTab contactId={contact.id} workspaceId={wsId} />
      case "messages":   return <MessagesTab contactId={contact.id} workspaceId={wsId} />
      case "notes":      return <NotesTab contact={contact} />
      case "tasks":      return <TasksTab contactId={contact.id} workspaceId={wsId} />
      case "activity":   return <ActivityTimeline items={contact.activity ?? []} />
      case "audit":      return <AuditTab contactId={contact.id} workspaceId={wsId} />
      default:           return <ActivityTimeline items={[]} />
    }
  }

  return (
    <ContactSaveContext.Provider value={{ save: saveField, editable }}>
      <div className="space-y-0">
        <ContactDetailHeader
          contact={contact}
          editable={editable}
          onToast={showToast}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onTabChange={setActiveTab}
        />

        <div className="mb-4">
          <KpiStrip contact={contact} />
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {/* Mobile tabs */}
            <div className="md:hidden mb-3">
              <MobileTabs
                tabs={tabs.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
                value={activeTab}
                onChange={setActiveTab}
                aria-label="Contact detail sections"
              />
            </div>
            {/* Desktop tab bar */}
            <div className="hidden md:block overflow-x-auto -mx-1 px-1 mb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex items-center gap-1 min-w-max border-b border-slate-200" role="tablist" aria-label="Contact detail sections">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 rounded-t",
                        activeTab === tab.id
                          ? "border-[var(--brand)] text-[var(--brand)]"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl md:rounded-b-2xl md:rounded-tr-2xl border md:border-t-0 border-slate-200 bg-white p-4 md:p-6">
              {renderTabContent()}
            </div>

            <div className="xl:hidden mt-4">
              <RightRail contact={contact} />
            </div>
          </div>

          <div className="hidden xl:block w-[280px] shrink-0 sticky top-6">
            <RightRail contact={contact} />
          </div>
        </div>

        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {toastMsg}
            <button onClick={() => setToastMsg(null)} aria-label="Dismiss notification" className="ml-2 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </div>
    </ContactSaveContext.Provider>
  )
}

export default function ContactDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-sm text-slate-500">Loading…</div>}>
      <ContactDetailPageInner />
    </Suspense>
  )
}
