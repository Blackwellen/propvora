"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users, Home, Building2, UserPlus, Clock, User, Search, X,
  LayoutGrid, List, Table2, ChevronDown,
  ArrowUpRight, MapPin, MessageSquare,
  AlertTriangle, CheckCircle2,
  Eye, Edit, Archive, Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { MobileTopBar, MobilePageHeader, MobileFilterSheet, type FilterGroup } from "@/components/mobile"
import { useWorkspace } from "@/providers/AuthProvider"
import { useContacts, useUpdateContact, useDeleteContact } from "@/hooks/useContacts"
import QuickAddContactModal from "@/components/contacts/contact-new/QuickAddContactModal"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { InlineEditCell, InlineEditSelect } from "@/components/editing"
import PersonCard from "@/components/contacts/PersonCard"
import type { Contact } from "@/types/database"

// Inline-edit option lists + validators for the contacts table cells.
const CONTACT_TYPE_OPTIONS = [
  { value: "landlord", label: "Landlord" },
  { value: "tenant", label: "Tenant" },
  { value: "post_tenant", label: "Post Tenant" },
  { value: "applicant", label: "Applicant" },
  { value: "guarantor", label: "Guarantor" },
  { value: "supplier", label: "Supplier" },
  { value: "agent", label: "Agent" },
  { value: "local_authority", label: "Local Authority" },
  { value: "housing_association", label: "Housing Association" },
  { value: "legal", label: "Legal" },
  { value: "accountant", label: "Accountant" },
  { value: "other", label: "Other" },
]
const CONTACT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
]
function validatePeopleEmail(v: string): string | null {
  if (!v.trim()) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "Enter a valid email address"
}
function validatePeoplePhone(v: string): string | null {
  if (!v.trim()) return null
  return /^[+]?[\d\s()-]{7,}$/.test(v.trim()) ? null : "Enter a valid phone number"
}

/* ================================================================== */
/* Shared person action menu â€” wired to live update/delete             */
/* ================================================================== */
function PersonActionMenu({ contact, align = "right" }: { contact: Contact; align?: "left" | "right" }) {
  const router = useRouter()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const archived = contact.status === "archived"
  const isDemo = contact.is_demo === true

  return (
    <ConfirmDialog
      title="Delete contact?"
      description={`This permanently deletes ${contact.full_name} and cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={async () => { await deleteContact.mutateAsync({ id: contact.id, workspaceId: contact.workspace_id }) }}
    >
      {(openDelete) => (
        <ActionMenu
          align={align}
          items={[
            { label: "View Profile", icon: Eye, onClick: () => router.push(`/property-manager/contacts/${contact.id}`) },
            { label: "Edit", icon: Edit, onClick: () => router.push(`/property-manager/contacts/${contact.id}/edit`) },
            { label: "Message", icon: MessageSquare, onClick: () => router.push(`/property-manager/messages?contact_id=${contact.id}`) },
            { label: archived ? "Restore" : "Archive", icon: Archive, disabled: isDemo, onClick: () => { updateContact.mutate({ id: contact.id, workspaceId: contact.workspace_id, payload: { status: archived ? "active" : "archived" } as Partial<Contact> }) } },
            { label: "Delete", icon: Trash2, variant: "danger", disabled: isDemo, onClick: openDelete },
          ]}
        />
      )}
    </ConfirmDialog>
  )
}

/* ================================================================== */
/* TYPES                                                                */
/* ================================================================== */

type ViewMode = "grid" | "list" | "table"
type ActiveFilter = "all" | "tenants" | "landlords" | "applicants" | "past_tenants" | "other"
type SortKey = "name" | "recent" | "status"

/* ================================================================== */
/* FILTER LOGIC                                                         */
/* ================================================================== */

const FILTER_MAP: Record<ActiveFilter, string[]> = {
  all:         [],
  tenants:     ["tenant"],
  landlords:   ["landlord"],
  applicants:  ["applicant"],
  past_tenants:["post_tenant"],
  other:       ["guarantor","other","local_authority","housing_association","broadband","utility_provider"],
}

const FILTER_TABS: { key: ActiveFilter; label: string }[] = [
  { key: "all",          label: "All People" },
  { key: "tenants",      label: "Tenants" },
  { key: "landlords",    label: "Landlords" },
  { key: "applicants",   label: "Applicants" },
  { key: "past_tenants", label: "Past Tenants" },
  { key: "other",        label: "Other" },
]

/* People-only types â€” exclude orgs */
const PEOPLE_TYPES = new Set([
  "tenant","landlord","applicant","post_tenant","guarantor",
  "other","local_authority","housing_association","broadband","utility_provider",
])

/* ================================================================== */
/* HELPERS                                                              */
/* ================================================================== */

const AVATAR_BG = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500"]

function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}

function getInitials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function relativeTime(iso: string | null): string {
  if (!iso) return "â€”"
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function formatDate(iso: string | null): string {
  if (!iso) return "â€”"
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/* ================================================================== */
/* STATIC BADGE CONFIGS                                                 */
/* ================================================================== */

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  tenant:              { label: "Tenant",       cls: "bg-emerald-100 text-emerald-700" },
  post_tenant:         { label: "Past Tenant",  cls: "bg-slate-100 text-slate-600" },
  applicant:           { label: "Applicant",    cls: "bg-sky-100 text-sky-700" },
  landlord:            { label: "Landlord",     cls: "bg-blue-100 text-blue-700" },
  guarantor:           { label: "Guarantor",    cls: "bg-violet-100 text-violet-700" },
  local_authority:     { label: "Local Auth",   cls: "bg-teal-100 text-teal-700" },
  housing_association: { label: "Housing Assoc",cls: "bg-teal-100 text-teal-700" },
  other:               { label: "Other",        cls: "bg-slate-100 text-slate-600" },
}

/* ================================================================== */
/* SUB-COMPONENTS                                                       */
/* ================================================================== */

function KpiCard({
  icon: Icon, label, value, iconColour, bg, sub,
}: {
  icon: React.ElementType
  label: string
  value: number
  iconColour: string
  bg: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className="w-4 h-4" style={{ color: iconColour }} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_BADGE[type] ?? { label: type, cls: "bg-slate-100 text-slate-600" }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const color = status === "active" ? "bg-emerald-400" : status === "inactive" ? "bg-amber-400" : "bg-slate-300"
  return <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
}

/* --- List Row --- */
function PersonListRow({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0", avatarBg(contact.full_name))}>
        {getInitials(contact.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors">{contact.full_name}</span>
          <TypeBadge type={contact.contact_type} />
          {contact.city && (
            <span className="hidden sm:flex items-center gap-0.5 text-xs text-slate-400">
              <MapPin className="w-3 h-3" />{contact.city}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {contact.email && <span className="text-xs text-slate-500 truncate max-w-[200px]">{contact.email}</span>}
          {contact.phone && <span className="text-xs text-slate-400">{contact.phone}</span>}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-3 shrink-0">
        <StatusDot status={contact.status} />
        <span className="text-xs text-slate-500 capitalize">{contact.status}</span>
      </div>
      <div className="hidden lg:block text-xs text-slate-400 shrink-0 w-24 text-right">
        {relativeTime(contact.updated_at)}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/property-manager/messages?contact_id=${contact.id}`}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Message"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={`/property-manager/contacts/${contact.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          View <ArrowUpRight className="w-3 h-3" />
        </Link>
        <PersonActionMenu contact={contact} />
      </div>
    </div>
  )
}

/* --- Table Row --- */
function PersonTableRow({ contact }: { contact: Contact }) {
  const updateContact = useUpdateContact()
  const isDemo = contact.is_demo === true
  const lockReason = isDemo ? "Demo records are read-only." : undefined
  const saveField = async (payload: Partial<Contact>) => {
    await updateContact.mutateAsync({ id: contact.id, workspaceId: contact.workspace_id, payload: payload as never })
  }
  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0", avatarBg(contact.full_name))}>
            {getInitials(contact.full_name)}
          </div>
          <div>
            <Link href={`/property-manager/contacts/${contact.id}`} className="text-sm font-semibold text-slate-900 hover:text-[#2563EB] transition-colors whitespace-nowrap">
              {contact.full_name}
            </Link>
            <InlineEditCell
              value={contact.company_name}
              label="company"
              placeholder="Add company"
              readOnly={isDemo}
              readOnlyReason={lockReason}
              displayClassName="text-xs text-slate-400 max-w-[120px]"
              onSave={(v) => saveField({ company_name: v || null })}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <InlineEditSelect
          value={contact.contact_type}
          label="type"
          options={CONTACT_TYPE_OPTIONS}
          readOnly={isDemo}
          readOnlyReason={lockReason}
          dense
          silentToast
          useSheetOnMobile
          displayClassName="text-xs capitalize"
          onSave={(v) => saveField({ contact_type: v as Contact["contact_type"] })}
        />
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        <InlineEditCell
          value={contact.email}
          type="email"
          label="email"
          placeholder="Add email"
          readOnly={isDemo}
          readOnlyReason={lockReason}
          validate={validatePeopleEmail}
          onSave={(v) => saveField({ email: v || null })}
        />
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
        <InlineEditCell
          value={contact.phone}
          type="phone"
          label="phone"
          placeholder="Add phone"
          readOnly={isDemo}
          readOnlyReason={lockReason}
          validate={validatePeoplePhone}
          onSave={(v) => saveField({ phone: v || null })}
        />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{contact.city ?? "â€”"}</td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{relativeTime(contact.updated_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <StatusDot status={contact.status} />
          <InlineEditSelect
            value={contact.status}
            label="status"
            options={CONTACT_STATUS_OPTIONS}
            readOnly={isDemo}
            readOnlyReason={lockReason}
            dense
            silentToast
            useSheetOnMobile
            displayClassName="text-xs capitalize"
            onSave={(v) => saveField({ status: v as Contact["status"] })}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Link href={`/property-manager/contacts/${contact.id}`} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#2563EB] transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <PersonActionMenu contact={contact} />
        </div>
      </td>
    </tr>
  )
}

/* --- Skeleton --- */
function SkeletonPersonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-2 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-2 bg-slate-100 rounded" />
        <div className="h-2 bg-slate-100 rounded w-5/6" />
      </div>
      <div className="h-px bg-slate-100 my-3" />
      <div className="space-y-1.5">
        <div className="h-2 bg-slate-100 rounded w-2/3" />
        <div className="h-2 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  )
}

/* ================================================================== */
/* TOAST                                                                */
/* ================================================================== */

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-sm font-medium">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      {message}
      <button onClick={onDismiss} aria-label="Dismiss notification" className="ml-2 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/* ================================================================== */
/* PAGINATION                                                           */
/* ================================================================== */

const PAGE_SIZE = 24

function Pagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
      <span>
        Showing <span className="font-semibold text-slate-700">{Math.min((page - 1) * PAGE_SIZE + 1, total)}â€“{Math.min(page * PAGE_SIZE, total)}</span> of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(pages, 5) }).map((_, i) => {
          const p = i + 1
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                p === page ? "bg-[#2563EB] text-white" : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              )}
            >
              {p}
            </button>
          )
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

/* ================================================================== */
/* MAIN PAGE                                                            */
/* ================================================================== */

export default function PeoplePage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: allContacts, isLoading, error } = useContacts(workspace?.id)

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("name")
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  /* People only (exclude org-type contacts) */
  const peopleContacts = useMemo(() => {
    if (!allContacts) return []
    return allContacts.filter(c => PEOPLE_TYPES.has(c.contact_type))
  }, [allContacts])

  /* KPI counts */
  const kpiData = useMemo(() => ({
    total:       peopleContacts.length,
    tenants:     peopleContacts.filter(c => c.contact_type === "tenant").length,
    landlords:   peopleContacts.filter(c => c.contact_type === "landlord").length,
    applicants:  peopleContacts.filter(c => c.contact_type === "applicant").length,
    past_tenants:peopleContacts.filter(c => c.contact_type === "post_tenant").length,
    other:       peopleContacts.filter(c => FILTER_MAP.other.includes(c.contact_type)).length,
  }), [peopleContacts])

  /* Filtered + sorted */
  const filtered = useMemo(() => {
    let data = [...peopleContacts]

    // Type filter
    if (activeFilter !== "all") {
      const allowed = FILTER_MAP[activeFilter]
      data = data.filter(c => allowed.includes(c.contact_type))
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      data = data.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.city ?? "").toLowerCase().includes(q)
      )
    }

    // Sort
    data.sort((a, b) => {
      if (sortBy === "name")   return a.full_name.localeCompare(b.full_name)
      if (sortBy === "recent") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      if (sortBy === "status") return a.status.localeCompare(b.status)
      return 0
    })

    return data
  }, [peopleContacts, activeFilter, searchQuery, sortBy])

  /* Paginated slice */
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  /* Reset page when filter changes */
  function handleFilterChange(f: ActiveFilter) {
    setActiveFilter(f)
    setPage(1)
  }

  function handleSearch(v: string) {
    setSearchQuery(v)
    setPage(1)
  }

  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "type", label: "Type", value: activeFilter, onChange: (v) => handleFilterChange(v as ActiveFilter),
      options: FILTER_TABS.map((t) => ({ value: t.key, label: t.label })),
    },
    {
      key: "sort", label: "Sort by", value: sortBy, onChange: (v) => setSortBy(v as SortKey),
      options: [
        { value: "name", label: "Name" },
        { value: "recent", label: "Recent" },
        { value: "status", label: "Status" },
      ],
    },
  ]
  const activeFilterCount = activeFilter !== "all" ? 1 : 0

  return (
    <DashboardContainer>
      <div className="space-y-0">

        {/* Mobile top bar + header */}
        <MobileTopBar
          title="People"
          subtitle="Contacts"
          primaryAction={{ label: "Add person", icon: UserPlus, onClick: () => setShowAddModal(true) }}
        />
        <div className="md:hidden -mx-4 mb-4">
          <ContactsTabNav />
        </div>
        <MobilePageHeader hideTitle
          title="People"
          count={`${filtered.length} ${filtered.length === 1 ? "person" : "people"}`}
          search={searchQuery}
          onSearchChange={handleSearch}
          searchPlaceholder="Search peopleâ€¦"
          onOpenFilters={() => setMobileFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />
        <MobileFilterSheet
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          groups={mobileFilterGroups}
          onClear={() => { setActiveFilter("all"); setSortBy("name") }}
          activeCount={activeFilterCount}
        />

        {/* ============================================================ */}
        {/* HEADER                                                        */}
        {/* ============================================================ */}
        <div className="hidden md:flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Contacts</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">People</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tenants, landlords, applicants and individual contacts
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1d4ed8] transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Person
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB NAV                                                       */}
        {/* ============================================================ */}
        <div className="hidden md:block">
          <ContactsTabNav />
        </div>

        <div className="md:pt-6 space-y-6">

          {/* ========================================================== */}
          {/* ERROR STATE                                                 */}
          {/* ========================================================== */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">Failed to load people</p>
              <p className="text-xs text-red-500 mt-1">{error.message}</p>
            </div>
          )}

          {/* ========================================================== */}
          {/* KPI CARDS                                                   */}
          {/* ========================================================== */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 h-24 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              <KpiCard icon={Users}    label="Total People"  value={kpiData.total}        iconColour="#2563EB" bg="bg-blue-50"    sub={`${kpiData.total} contacts`} />
              <KpiCard icon={Home}     label="Tenants"       value={kpiData.tenants}      iconColour="#10B981" bg="bg-emerald-50" />
              <KpiCard icon={Building2}label="Landlords"     value={kpiData.landlords}    iconColour="#2563EB" bg="bg-blue-50"    />
              <KpiCard icon={UserPlus} label="Applicants"    value={kpiData.applicants}   iconColour="#0EA5E9" bg="bg-sky-50"     />
              <KpiCard icon={Clock}    label="Past Tenants"  value={kpiData.past_tenants} iconColour="#64748B" bg="bg-slate-50"   />
              <KpiCard icon={User}     label="Other"         value={kpiData.other}        iconColour="#8B5CF6" bg="bg-violet-50"  />
            </div>
          )}

          {/* ========================================================== */}
          {/* FILTER / SEARCH / VIEW CONTROLS                            */}
          {/* ========================================================== */}
          <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                aria-label="Search people"
                placeholder="Search peopleâ€¦"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-8 rounded-lg text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
              {searchQuery && (
                <button onClick={() => handleSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    activeFilter === tab.key
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Sort */}
              <div className="relative">
                <select
                  aria-label="Sort people"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortKey)}
                  className="h-9 pl-3 pr-7 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer appearance-none"
                >
                  <option value="name">Sort: Name</option>
                  <option value="recent">Sort: Recent</option>
                  <option value="status">Sort: Status</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>

              {/* View switcher */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                {([
                  { mode: "grid" as ViewMode,  Icon: LayoutGrid },
                  { mode: "list" as ViewMode,  Icon: List },
                  { mode: "table" as ViewMode, Icon: Table2 },
                ]).map(({ mode, Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-label={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                    aria-pressed={viewMode === mode}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      viewMode === mode ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Count bar */}
          {!isLoading && (
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length === 0 ? "0" : `${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}â€“${Math.min(page * PAGE_SIZE, filtered.length)}`}
              </span>{" "}
              of <span className="font-semibold text-slate-600">{filtered.length}</span> people
            </p>
          )}

          {/* ========================================================== */}
          {/* GRID VIEW                                                   */}
          {/* ========================================================== */}
          {viewMode === "grid" && (
            <>
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonPersonCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-base font-semibold text-slate-400">No people found</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                  <button
                    onClick={() => { setActiveFilter("all"); setSearchQuery("") }}
                    className="mt-3 text-sm text-[#2563EB] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {paginated.map(c => (
                    <PersonCard
                      key={c.id}
                      contact={{
                        id: c.id,
                        full_name: c.full_name,
                        email: c.email,
                        phone: c.phone,
                        contact_type: c.contact_type,
                        status: c.status,
                        city: c.city,
                        avatar_url: c.avatar_url,
                        company_name: c.company_name,
                        tags: c.tags as string[] | null,
                        last_interaction_at: c.updated_at,
                        relationship_health: null,
                        preferred: null,
                        property_count: 0,
                        arrears_amount: null,
                        follow_up: false,
                      }}
                      onClick={() => router.push(`/property-manager/contacts/${c.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ========================================================== */}
          {/* LIST VIEW                                                   */}
          {/* ========================================================== */}
          {viewMode === "list" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-2 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400">No people match your filters</p>
                  <button onClick={() => { setActiveFilter("all"); setSearchQuery("") }} className="mt-2 text-xs text-[#2563EB] hover:underline">Clear filters</button>
                </div>
              ) : (
                paginated.map(c => <PersonListRow key={c.id} contact={c} />)
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TABLE VIEW                                                  */}
          {/* ========================================================== */}
          {viewMode === "table" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["Name","Type","Contact","Location","Last Interaction","Status","Actions"].map(col => (
                        <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {col}
                            {["Name","Type","Last Interaction"].includes(col) && (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="flex justify-center gap-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-sm text-slate-400">
                          No people match your filters.{" "}
                          <button onClick={() => { setActiveFilter("all"); setSearchQuery("") }} className="text-[#2563EB] hover:underline">Clear filters</button>
                        </td>
                      </tr>
                    ) : (
                      paginated.map(c => <PersonTableRow key={c.id} contact={c} />)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* PAGINATION                                                  */}
          {/* ========================================================== */}
          {!isLoading && filtered.length > PAGE_SIZE && (
            <Pagination total={filtered.length} page={page} onPage={setPage} />
          )}

        </div>
      </div>

      {/* ============================================================ */}
      {/* ADD PERSON MODAL                                              */}
      {/* ============================================================ */}
      {showAddModal && (
        <QuickAddContactModal
          mode="person"
          workspaceId={workspace?.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            showToast("Person created successfully")
          }}
        />
      )}

      {/* ============================================================ */}
      {/* TOAST                                                          */}
      {/* ============================================================ */}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </DashboardContainer>
  )
}
