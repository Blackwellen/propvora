"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus, Search, X, SlidersHorizontal, LayoutGrid, Tag,
  MapPin, Home, Clock, ChevronDown,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { cn } from "@/lib/utils"
import { useContacts, useUpdateContact } from "@/hooks/useContacts"
import { useWorkspace } from "@/providers/AuthProvider"
import type { Contact } from "@/types/database"

// ─── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_BG = [
  "bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500",
  "bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500",
]
function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type BoardMode = "status" | "type"
type TypeFilterKey = "all" | "tenants" | "landlords" | "suppliers" | "professionals" | "applicants"

interface ColumnDef {
  id: string
  title: string
  borderClass: string
  dotClass: string
  badgeClass: string
  headerBg: string
}

// ─── Column definitions ────────────────────────────────────────────────────────
const STATUS_COLUMNS: ColumnDef[] = [
  { id: "new",           title: "New / Enquiry",    borderClass: "border-t-slate-400",   dotClass: "bg-slate-400",   badgeClass: "bg-slate-100 text-slate-600",   headerBg: "bg-slate-50" },
  { id: "active_tenant", title: "Active Tenants",   borderClass: "border-t-emerald-500", dotClass: "bg-emerald-500", badgeClass: "bg-emerald-100 text-emerald-700", headerBg: "bg-emerald-50/40" },
  { id: "landlord",      title: "Landlords",        borderClass: "border-t-blue-500",    dotClass: "bg-blue-500",    badgeClass: "bg-blue-100 text-blue-700",     headerBg: "bg-blue-50/40" },
  { id: "supplier",      title: "Suppliers",        borderClass: "border-t-orange-500",  dotClass: "bg-orange-500",  badgeClass: "bg-orange-100 text-orange-700", headerBg: "bg-orange-50/40" },
  { id: "professional",  title: "Professionals",    borderClass: "border-t-violet-500",  dotClass: "bg-violet-500",  badgeClass: "bg-violet-100 text-violet-700", headerBg: "bg-violet-50/40" },
  { id: "follow_up",     title: "Follow-up Needed", borderClass: "border-t-red-500",     dotClass: "bg-red-500",     badgeClass: "bg-red-100 text-red-700",       headerBg: "bg-red-50/40" },
  { id: "archived",      title: "Archived",         borderClass: "border-t-slate-300",   dotClass: "bg-slate-300",   badgeClass: "bg-slate-100 text-slate-400",   headerBg: "bg-slate-50" },
]

const TYPE_COLUMNS: ColumnDef[] = [
  { id: "tenant",   title: "Tenants",      borderClass: "border-t-emerald-500", dotClass: "bg-emerald-500", badgeClass: "bg-emerald-100 text-emerald-700", headerBg: "bg-emerald-50/40" },
  { id: "landlord", title: "Landlords",    borderClass: "border-t-blue-500",    dotClass: "bg-blue-500",    badgeClass: "bg-blue-100 text-blue-700",     headerBg: "bg-blue-50/40" },
  { id: "supplier", title: "Suppliers",    borderClass: "border-t-orange-500",  dotClass: "bg-orange-500",  badgeClass: "bg-orange-100 text-orange-700", headerBg: "bg-orange-50/40" },
  { id: "agent",    title: "Agents",       borderClass: "border-t-indigo-500",  dotClass: "bg-indigo-500",  badgeClass: "bg-indigo-100 text-indigo-700", headerBg: "bg-indigo-50/40" },
  { id: "legal",    title: "Professionals",borderClass: "border-t-violet-500",  dotClass: "bg-violet-500",  badgeClass: "bg-violet-100 text-violet-700", headerBg: "bg-violet-50/40" },
  { id: "investor", title: "Investors",    borderClass: "border-t-amber-500",   dotClass: "bg-amber-500",   badgeClass: "bg-amber-100 text-amber-700",   headerBg: "bg-amber-50/40" },
  { id: "other",    title: "Other",        borderClass: "border-t-slate-300",   dotClass: "bg-slate-300",   badgeClass: "bg-slate-100 text-slate-400",   headerBg: "bg-slate-50" },
]

// ─── Badge map ─────────────────────────────────────────────────────────────────
const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  tenant:      { label: "Tenant",      cls: "bg-emerald-100 text-emerald-700" },
  post_tenant: { label: "Past Tenant", cls: "bg-slate-100 text-slate-600" },
  applicant:   { label: "Applicant",   cls: "bg-sky-100 text-sky-700" },
  landlord:    { label: "Landlord",    cls: "bg-blue-100 text-blue-700" },
  supplier:    { label: "Supplier",    cls: "bg-orange-100 text-orange-700" },
  agent:       { label: "Agent",       cls: "bg-indigo-100 text-indigo-700" },
  legal:       { label: "Legal",       cls: "bg-violet-100 text-violet-700" },
  accountant:  { label: "Accountant",  cls: "bg-teal-100 text-teal-700" },
  investor:    { label: "Investor",    cls: "bg-amber-100 text-amber-700" },
  maintenance: { label: "Maintenance", cls: "bg-rose-100 text-rose-700" },
  other:       { label: "Other",       cls: "bg-slate-100 text-slate-600" },
}

// ─── Column assignment functions ───────────────────────────────────────────────
function assignStatus(c: Contact): string {
  if (c.status === "archived") return "archived"
  const tags = (c.tags as string[] | null) ?? []
  if (tags.includes("follow_up") || tags.includes("arrears")) return "follow_up"
  if (c.contact_type === "tenant" && c.status === "active") return "active_tenant"
  if (c.contact_type === "landlord") return "landlord"
  if (["supplier", "maintenance", "cleaning", "emergency_contractor"].includes(c.contact_type)) return "supplier"
  if (["legal", "accountant", "insurer", "agent", "affiliate"].includes(c.contact_type)) return "professional"
  if (c.contact_type === "applicant" || c.status === "inactive") return "new"
  return "new"
}

function assignType(c: Contact): string {
  if (["tenant", "post_tenant"].includes(c.contact_type)) return "tenant"
  if (c.contact_type === "landlord") return "landlord"
  if (["supplier", "maintenance", "cleaning", "emergency_contractor"].includes(c.contact_type)) return "supplier"
  if (c.contact_type === "agent") return "agent"
  if (["legal", "accountant", "insurer"].includes(c.contact_type)) return "legal"
  if (c.contact_type === "investor") return "investor"
  return "other"
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

// ─── TYPE FILTER options ────────────────────────────────────────────────────────
const TYPE_FILTERS: { key: TypeFilterKey; label: string }[] = [
  { key: "all",           label: "All" },
  { key: "tenants",       label: "Tenants" },
  { key: "landlords",     label: "Landlords" },
  { key: "suppliers",     label: "Suppliers" },
  { key: "professionals", label: "Professionals" },
  { key: "applicants",    label: "Applicants" },
]

const TYPE_FILTER_TYPES: Record<TypeFilterKey, string[]> = {
  all:           [],
  tenants:       ["tenant", "post_tenant"],
  landlords:     ["landlord"],
  suppliers:     ["supplier", "maintenance", "cleaning"],
  professionals: ["legal", "accountant", "insurer", "agent"],
  applicants:    ["applicant"],
}

// ─── BoardCard sub-component ───────────────────────────────────────────────────
function BoardCard({
  contact,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  contact: Contact
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const router = useRouter()
  const badge = TYPE_BADGE[contact.contact_type] ?? TYPE_BADGE.other
  const tags = (contact.tags as string[] | null) ?? []
  const hasArrears = tags.includes("arrears")

  return (
    <div
      draggable
      role="button"
      tabIndex={0}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => router.push(`/app/contacts/${contact.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/app/contacts/${contact.id}`) }}
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-3.5 cursor-pointer active:cursor-grabbing select-none transition-all duration-150",
        isDragging ? "ring-2 ring-blue-400 shadow-lg rotate-1 opacity-80" : "hover:shadow-md hover:border-slate-300"
      )}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarBg(contact.full_name))}>
          {initials(contact.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{contact.full_name}</p>
          {contact.company_name && (
            <p className="text-[10px] text-slate-400 truncate">{contact.company_name}</p>
          )}
        </div>
        <span className={cn("w-2 h-2 rounded-full shrink-0", contact.status === "active" ? "bg-emerald-400" : contact.status === "archived" ? "bg-slate-300" : "bg-amber-400")} />
      </div>

      {/* Type badge + arrears */}
      <div className="flex flex-wrap items-center gap-1 mb-2">
        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium", badge.cls)}>
          {badge.label}
        </span>
        {hasArrears && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">
            Arrears
          </span>
        )}
      </div>

      {/* Tags (first 2) */}
      {tags.filter(t => t !== "arrears" && t !== "follow_up").slice(0, 2).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.filter(t => t !== "arrears" && t !== "follow_up").slice(0, 2).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">{tag}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-100">
        {contact.city && (
          <span className="flex items-center gap-0.5 truncate">
            <MapPin className="w-2.5 h-2.5 shrink-0" />{contact.city}
          </span>
        )}
        <span className="flex items-center gap-0.5 ml-auto shrink-0">
          <Clock className="w-2.5 h-2.5" />{formatDate(contact.updated_at ?? null)}
        </span>
      </div>
    </div>
  )
}

// ─── BoardColumn sub-component ─────────────────────────────────────────────────
function BoardColumn({
  def,
  contacts,
  draggingId,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  def: ColumnDef
  contacts: Contact[]
  draggingId: string | null
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDrop: (columnId: string) => void
}) {
  return (
    <div className="w-[250px] shrink-0 flex flex-col">
      {/* Header */}
      <div className={cn("rounded-t-xl border-t-2 border-x border-slate-200 px-3 pt-3 pb-2.5", def.borderClass, def.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-2.5 h-2.5 rounded-full", def.dotClass)} />
            <span className="text-xs font-semibold text-slate-700">{def.title}</span>
          </div>
          <span className={cn("inline-flex items-center justify-center rounded-full text-[10px] font-bold px-2 py-0.5 min-w-[22px]", def.badgeClass)}>
            {contacts.length}
          </span>
        </div>
      </div>

      {/* Cards area */}
      <div
        className="flex-1 bg-slate-50 border-x border-slate-200 p-2 space-y-2 min-h-[200px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(def.id)}
      >
        {contacts.length === 0 ? (
          <div className="flex items-center justify-center h-16 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-[10px] text-slate-300">Drop contacts here</p>
          </div>
        ) : (
          contacts.map((c) => (
            <BoardCard
              key={c.id}
              contact={c}
              isDragging={draggingId === c.id}
              onDragStart={() => onDragStart(c.id)}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <Link
        href="/app/contacts/new"
        className="bg-white border-x border-b border-slate-200 rounded-b-xl px-3 py-2 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 w-full"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Contact
      </Link>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function BoardSkeleton() {
  return (
    <div className="flex gap-4 px-6 pb-8 overflow-x-auto">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-[250px] shrink-0 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-t-xl" />
          <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-xl p-2 space-y-2 min-h-[200px]">
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="h-[88px] bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function ContactsBoardPage() {
  const { workspace } = useWorkspace()
  const { data: contacts = [], isLoading } = useContacts(workspace?.id)
  const updateContact = useUpdateContact()

  const [boardMode, setBoardMode] = useState<BoardMode>("status")
  const [typeFilter, setTypeFilter] = useState<TypeFilterKey>("all")
  const [search, setSearch] = useState("")
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false })

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast({ msg: "", visible: false }), 2500)
  }, [])

  const handleDrop = useCallback(async (columnId: string) => {
    const id = draggingId
    setDraggingId(null)
    if (!id || !workspace?.id) return
    const c = contacts.find((x) => x.id === id)
    if (!c) return
    if (c.is_demo) { showToast("Demo contacts are read-only"); return }

    // Only persist the columns that map to a real, single field. Status-mode
    // columns derived purely from contact_type are not movable (toast instead of
    // pretending to persist). Archived ⇄ status; Follow-up ⇄ tag.
    const tags = (c.tags as string[] | null) ?? []
    try {
      if (boardMode === "status" && columnId === "archived") {
        await updateContact.mutateAsync({ id, workspaceId: workspace.id, payload: { status: "archived" } as Partial<Contact> })
        showToast("Contact archived")
      } else if (boardMode === "status" && columnId === "follow_up") {
        if (!tags.includes("follow_up")) {
          await updateContact.mutateAsync({ id, workspaceId: workspace.id, payload: { tags: [...tags, "follow_up"] } as Partial<Contact> })
        }
        showToast("Flagged for follow-up")
      } else if (boardMode === "status" && (columnId === "active_tenant" || columnId === "new") && c.status === "archived") {
        // Dragging out of Archived back into an active column restores the contact.
        const cleaned = tags.filter((t) => t !== "follow_up")
        await updateContact.mutateAsync({ id, workspaceId: workspace.id, payload: { status: "active", tags: cleaned } as Partial<Contact> })
        showToast("Contact restored")
      } else {
        showToast("This column is derived from contact type — edit the contact to change it")
      }
    } catch {
      showToast("Could not move contact")
    }
  }, [draggingId, workspace?.id, contacts, boardMode, updateContact, showToast])

  const filtered = useMemo(() => {
    let data = [...contacts]
    if (typeFilter !== "all") {
      const allowed = TYPE_FILTER_TYPES[typeFilter]
      data = data.filter((c) => allowed.includes(c.contact_type))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.company_name?.toLowerCase().includes(q) ?? false)
      )
    }
    return data
  }, [contacts, typeFilter, search])

  const defs = boardMode === "status" ? STATUS_COLUMNS : TYPE_COLUMNS
  const assign = boardMode === "status" ? assignStatus : assignType

  const columns = defs.map((def) => ({
    def,
    contacts: filtered.filter((c) => assign(c) === def.id),
  }))

  // Full-data counts for pills (not affected by search/filter)
  const pillCounts = STATUS_COLUMNS.map((def) => ({
    ...def,
    count: contacts.filter((c) => assignStatus(c) === def.id).length,
  }))

  return (
    <DashboardContainer>
      <ContactsTabNav />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Contacts</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contact Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visualise contacts by relationship stage or type</p>
        </div>
        <Link
          href="/app/contacts/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </Link>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-6 pb-3 flex-wrap">
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => setBoardMode("status")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
              boardMode === "status" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Board by Status
          </button>
          <button
            onClick={() => setBoardMode("type")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-l border-slate-200 transition-colors",
              boardMode === "type" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Tag className="w-3.5 h-3.5" />
            Board by Type
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200" />

        {/* Type filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                typeFilter === f.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
            More Filters <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-52 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </button>
      </div>

      {/* Column count pills */}
      <div className="flex items-center gap-2 px-6 pb-5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {pillCounts.map((col) => (
          <div key={col.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm shrink-0">
            <span className={cn("w-2 h-2 rounded-full", col.dotClass)} />
            <span className="text-xs text-slate-600 font-medium">{col.title}</span>
            <span className={cn("inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 min-w-[20px]", col.badgeClass)}>
              {col.count}
            </span>
          </div>
        ))}
      </div>

      {/* Board */}
      {isLoading ? (
        <BoardSkeleton />
      ) : (
        <div className="overflow-x-auto pb-8">
          <div className="flex gap-3 px-6 min-w-max">
            {columns.map(({ def, contacts: colContacts }) => (
              <BoardColumn
                key={def.id}
                def={def}
                contacts={colContacts}
                draggingId={draggingId}
                onDragStart={(id) => setDraggingId(id)}
                onDragEnd={() => setDraggingId(null)}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-xl">
          {toast.msg}
        </div>
      )}
    </DashboardContainer>
  )
}
