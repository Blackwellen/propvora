"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2, Wrench, Home, Users, Briefcase, TrendingUp,
  Search, X, LayoutGrid, List, ChevronDown,
  ArrowUpRight, MapPin, MessageSquare,
  AlertTriangle, CheckCircle2, UserPlus, Eye, Edit, Archive, Trash2,
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
import OrganisationCard from "@/components/contacts/OrganisationCard"
import type { Contact } from "@/types/database"

/* ================================================================== */
/* Shared organisation action menu — wired to live update/delete       */
/* ================================================================== */
function OrgActionMenu({ contact, align = "right" }: { contact: Contact; align?: "left" | "right" }) {
  const router = useRouter()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const archived = contact.status === "archived"
  const isDemo = contact.is_demo === true

  return (
    <ConfirmDialog
      title="Delete organisation?"
      description={`This permanently deletes ${contact.company_name ?? contact.full_name} and cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={async () => { await deleteContact.mutateAsync({ id: contact.id, workspaceId: contact.workspace_id }) }}
    >
      {(openDelete) => (
        <ActionMenu
          align={align}
          items={[
            { label: "View Profile", icon: Eye, onClick: () => router.push(`/property-manager/contacts/${contact.id}`) },
            { label: "Edit", icon: Edit, onClick: () => router.push(`/property-manager/contacts/${contact.id}/edit`) },
            { label: "Create Job", icon: Wrench, onClick: () => router.push(`/property-manager/work/jobs/new?supplier=${contact.id}`) },
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

type ViewMode = "cards" | "list"
type OrgFilter = "all" | "suppliers" | "landlords" | "agents" | "professionals" | "investors" | "other"
type SortKey = "name" | "recent" | "type"

/* ================================================================== */
/* CONSTANTS                                                            */
/* ================================================================== */

/* Contact types considered "organisations" */
const ORG_TYPES = new Set([
  "supplier","agent","legal","accountant","insurer",
  "utility_provider","broadband","cleaning","maintenance",
  "emergency_contractor","investor","affiliate","landlord",
  "local_authority","housing_association",
])

const ORG_FILTER_MAP: Record<OrgFilter, string[]> = {
  all:          [],
  suppliers:    ["supplier","maintenance","cleaning","emergency_contractor"],
  landlords:    ["landlord"],
  agents:       ["agent"],
  professionals:["legal","accountant","insurer"],
  investors:    ["investor","affiliate"],
  other:        ["utility_provider","broadband","local_authority","housing_association"],
}

const FILTER_TABS: { key: OrgFilter; label: string }[] = [
  { key: "all",           label: "All" },
  { key: "suppliers",     label: "Suppliers" },
  { key: "landlords",     label: "Landlords" },
  { key: "agents",        label: "Agents" },
  { key: "professionals", label: "Professionals" },
  { key: "investors",     label: "Investors" },
  { key: "other",         label: "Other" },
]

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  supplier:             { label: "Supplier",        cls: "bg-amber-100 text-amber-700" },
  maintenance:          { label: "Maintenance",     cls: "bg-amber-100 text-amber-700" },
  cleaning:             { label: "Cleaning",        cls: "bg-amber-100 text-amber-700" },
  emergency_contractor: { label: "Emergency",       cls: "bg-red-100 text-red-700" },
  landlord:             { label: "Landlord",        cls: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
  agent:                { label: "Agent",           cls: "bg-violet-100 text-violet-700" },
  legal:                { label: "Legal",           cls: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
  accountant:           { label: "Accountant",      cls: "bg-emerald-100 text-emerald-700" },
  insurer:              { label: "Insurer",         cls: "bg-red-100 text-red-700" },
  investor:             { label: "Investor",        cls: "bg-violet-100 text-violet-700" },
  affiliate:            { label: "Affiliate",       cls: "bg-sky-100 text-sky-700" },
  utility_provider:     { label: "Utility",         cls: "bg-slate-100 text-slate-600" },
  broadband:            { label: "Broadband",       cls: "bg-indigo-100 text-indigo-700" },
  local_authority:      { label: "Local Authority", cls: "bg-teal-100 text-teal-700" },
  housing_association:  { label: "Housing Assoc",   cls: "bg-teal-100 text-teal-700" },
  other:                { label: "Other",           cls: "bg-slate-100 text-slate-600" },
}

/* ================================================================== */
/* HELPERS                                                              */
/* ================================================================== */

const AVATAR_BG = ["bg-[var(--brand)]","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500"]

function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}

function getInitials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[1][0]).toUpperCase()
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

/* ================================================================== */
/* SUB-COMPONENTS                                                       */
/* ================================================================== */

function KpiCard({
  icon: Icon, label, value, iconColour, bg,
}: {
  icon: React.ElementType
  label: string
  value: number
  iconColour: string
  bg: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className="w-4 h-4" style={{ color: iconColour }} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
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

/* --- List Row --- */
function OrgListRow({ contact }: { contact: Contact }) {
  const displayName = contact.company_name ?? contact.full_name

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0", avatarBg(displayName))}>
        {getInitials(displayName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 group-hover:text-[var(--brand)] transition-colors">{displayName}</span>
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
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-400">{relativeTime(contact.updated_at)}</span>
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
        <OrgActionMenu contact={contact} />
      </div>
    </div>
  )
}

/* --- Skeleton --- */
function SkeletonOrgCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
        <div className="w-6 h-6 bg-slate-100 rounded" />
      </div>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-2 bg-slate-100 rounded w-2/3" />
        <div className="h-2 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="h-px bg-slate-100 mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-2 bg-slate-100 rounded w-1/3" />
        <div className="h-2 bg-slate-100 rounded w-1/4" />
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
        Showing <span className="font-semibold text-slate-700">{Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}</span> of {total}
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
                p === page ? "bg-[var(--brand)] text-white" : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
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

export default function OrganisationsPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: allContacts, isLoading, error } = useContacts(workspace?.id)

  const [viewMode, setViewMode] = useState<ViewMode>("cards")
  const [activeFilter, setActiveFilter] = useState<OrgFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("recent")
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  /* Org-only contacts */
  const orgContacts = useMemo(() => {
    if (!allContacts) return []
    return allContacts.filter(c =>
      ORG_TYPES.has(c.contact_type) || c.company_name != null
    )
  }, [allContacts])

  /* KPI counts */
  const kpiData = useMemo(() => ({
    total:         orgContacts.length,
    suppliers:     orgContacts.filter(c => ORG_FILTER_MAP.suppliers.includes(c.contact_type)).length,
    landlords:     orgContacts.filter(c => c.contact_type === "landlord").length,
    agents:        orgContacts.filter(c => c.contact_type === "agent").length,
    professionals: orgContacts.filter(c => ORG_FILTER_MAP.professionals.includes(c.contact_type)).length,
    investors:     orgContacts.filter(c => ORG_FILTER_MAP.investors.includes(c.contact_type)).length,
    other:         orgContacts.filter(c => ORG_FILTER_MAP.other.includes(c.contact_type)).length,
  }), [orgContacts])

  /* Filtered + sorted */
  const filtered = useMemo(() => {
    let data = [...orgContacts]

    if (activeFilter !== "all") {
      const allowed = ORG_FILTER_MAP[activeFilter]
      data = data.filter(c => allowed.includes(c.contact_type))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      data = data.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        (c.company_name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q)
      )
    }

    data.sort((a, b) => {
      if (sortBy === "name")   return (a.company_name ?? a.full_name).localeCompare(b.company_name ?? b.full_name)
      if (sortBy === "recent") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      if (sortBy === "type")   return a.contact_type.localeCompare(b.contact_type)
      return 0
    })

    return data
  }, [orgContacts, activeFilter, searchQuery, sortBy])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  function handleFilterChange(f: OrgFilter) {
    setActiveFilter(f)
    setPage(1)
  }

  function handleSearch(v: string) {
    setSearchQuery(v)
    setPage(1)
  }

  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "type", label: "Type", value: activeFilter, onChange: (v) => handleFilterChange(v as OrgFilter),
      options: FILTER_TABS.map((t) => ({ value: t.key, label: t.label })),
    },
    {
      key: "sort", label: "Sort by", value: sortBy, onChange: (v) => setSortBy(v as SortKey),
      options: [
        { value: "name", label: "Name" },
        { value: "recent", label: "Recent" },
        { value: "type", label: "Type" },
      ],
    },
  ]
  const activeFilterCount = activeFilter !== "all" ? 1 : 0

  return (
    <DashboardContainer>
      <div className="space-y-0">

        {/* Mobile top bar + header */}
        <MobileTopBar
          title="Organisations"
          subtitle="Contacts"
          primaryAction={{ label: "Add organisation", icon: UserPlus, onClick: () => setShowAddModal(true) }}
        />
        <div className="md:hidden -mx-4 mb-4">
          <ContactsTabNav />
        </div>
        <MobilePageHeader hideTitle
          title="Organisations"
          count={`${filtered.length} ${filtered.length === 1 ? "organisation" : "organisations"}`}
          search={searchQuery}
          onSearchChange={handleSearch}
          searchPlaceholder="Search organisations…"
          onOpenFilters={() => setMobileFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />
        <MobileFilterSheet
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          groups={mobileFilterGroups}
          onClear={() => { setActiveFilter("all"); setSortBy("recent") }}
          activeCount={activeFilterCount}
        />

        {/* ============================================================ */}
        {/* HEADER                                                        */}
        {/* ============================================================ */}
        <div className="hidden md:flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Contacts</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organisations</h1>
            <p className="mt-1 text-sm text-slate-500">
              Suppliers, agents, landlords, professionals and company contacts
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Organisation
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
              <p className="text-sm font-medium text-red-700">Failed to load organisations</p>
              <p className="text-xs text-red-500 mt-1">{error.message}</p>
            </div>
          )}

          {/* ========================================================== */}
          {/* KPI CARDS                                                   */}
          {/* ========================================================== */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 h-24 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <KpiCard icon={Building2}   label="Total Orgs"      value={kpiData.total}         iconColour="#2563EB" bg="bg-[var(--brand-soft)]"    />
              <KpiCard icon={Wrench}      label="Suppliers"       value={kpiData.suppliers}     iconColour="#F59E0B" bg="bg-amber-50"   />
              <KpiCard icon={Home}        label="Landlords"       value={kpiData.landlords}     iconColour="#2563EB" bg="bg-[var(--brand-soft)]"    />
              <KpiCard icon={Users}       label="Agents"          value={kpiData.agents}        iconColour="#7C3AED" bg="bg-violet-50"  />
              <KpiCard icon={Briefcase}   label="Professionals"   value={kpiData.professionals} iconColour="#0EA5E9" bg="bg-sky-50"     />
              <KpiCard icon={TrendingUp}  label="Investors"       value={kpiData.investors}     iconColour="#10B981" bg="bg-emerald-50" />
              <KpiCard icon={Building2}   label="Other"           value={kpiData.other}         iconColour="#64748B" bg="bg-slate-50"   />
            </div>
          )}

          {/* ========================================================== */}
          {/* CONTROLS: Search | Filters | Cards/List | Sort              */}
          {/* ========================================================== */}
          <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                aria-label="Search organisations"
                placeholder="Search organisations…"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-8 rounded-lg text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
              />
              {searchQuery && (
                <button onClick={() => handleSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 rounded">
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
                      ? "bg-[var(--brand)] text-white shadow-sm"
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
                  aria-label="Sort organisations"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortKey)}
                  className="h-9 pl-3 pr-7 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] cursor-pointer appearance-none"
                >
                  <option value="recent">Recently updated</option>
                  <option value="name">Name A–Z</option>
                  <option value="type">Type</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>

              {/* View switcher */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                <button
                  onClick={() => setViewMode("cards")}
                  aria-label="Card view"
                  aria-pressed={viewMode === "cards"}
                  className={cn("p-1.5 rounded-md transition-colors", viewMode === "cards" ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Count row */}
          {!isLoading && (
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length === 0 ? "0" : `${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(page * PAGE_SIZE, filtered.length)}`}
              </span>{" "}
              of <span className="font-semibold text-slate-600">{filtered.length}</span> organisations
            </p>
          )}

          {/* ========================================================== */}
          {/* CARDS VIEW                                                  */}
          {/* ========================================================== */}
          {viewMode === "cards" && (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonOrgCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-base font-semibold text-slate-400">No organisations found</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                  <button
                    onClick={() => { setActiveFilter("all"); setSearchQuery("") }}
                    className="mt-3 text-sm text-[var(--brand)] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {paginated.map(c => (
                    <OrganisationCard
                      key={c.id}
                      contact={{
                        id: c.id,
                        full_name: c.full_name,
                        company_name: c.company_name,
                        contact_type: c.contact_type,
                        city: c.city,
                        logo_url: null,
                        tags: c.tags as string[] | null,
                        preferred: (c.tags as string[] | null)?.includes("preferred") ?? null,
                        relationship_health: null,
                        last_interaction_at: c.updated_at,
                        primary_contact_name: null,
                        primary_contact_role: null,
                        property_count: 0,
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
              {/* List header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center">
                <span className="text-xs font-semibold text-slate-500">Organisation</span>
                <span className="hidden md:block text-xs font-semibold text-slate-500 w-32 text-right">Last Updated</span>
                <span className="text-xs font-semibold text-slate-500 w-20 text-right">Actions</span>
              </div>

              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-2 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400">No organisations match your filters</p>
                  <button onClick={() => { setActiveFilter("all"); setSearchQuery("") }} className="mt-2 text-xs text-[var(--brand)] hover:underline">Clear filters</button>
                </div>
              ) : (
                paginated.map(c => <OrgListRow key={c.id} contact={c} />)
              )}
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
      {/* ADD ORGANISATION MODAL                                        */}
      {/* ============================================================ */}
      {showAddModal && (
        <QuickAddContactModal
          mode="organisation"
          workspaceId={workspace?.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            showToast("Organisation created successfully")
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
