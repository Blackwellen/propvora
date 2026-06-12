"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users, UserCheck, UserPlus, Home, Wrench, Clock, Globe,
  Search, X, MessageSquare, ChevronDown,
  MapPin, Phone, Mail, ArrowUpRight, LayoutGrid, List,
  Table2, LayoutDashboard, AlertTriangle, CheckCircle2,
  Activity, ShieldCheck, Star, Hammer, Download, Upload,
  Building2, FileText, TrendingUp, TrendingDown,
  Eye, Edit, Archive, Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { useWorkspace } from "@/providers/AuthProvider"
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/useContacts"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import type { Contact } from "@/types/database"

/* ================================================================== */
/* Shared row/card action menu — wired to live update/delete mutations  */
/* ================================================================== */
function ContactRowMenu({ contact, align = "right" }: { contact: MappedContact; align?: "left" | "right" }) {
  const router = useRouter()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const archived = contact.status === "archived"

  async function toggleArchive() {
    await updateContact.mutateAsync({
      id: contact.id,
      workspaceId: contact.workspace_id,
      payload: { status: archived ? "active" : "archived" } as Partial<Contact>,
    })
  }
  async function remove() {
    await deleteContact.mutateAsync({ id: contact.id, workspaceId: contact.workspace_id })
  }

  return (
    <ConfirmDialog
      title="Delete contact?"
      description={`This permanently deletes ${contact.full_name} and cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={remove}
    >
      {(openDelete) => (
        <ActionMenu
          align={align}
          items={[
            { label: "View Profile", icon: Eye, onClick: () => router.push(`/app/contacts/${contact.id}`) },
            { label: "Edit", icon: Edit, onClick: () => router.push(`/app/contacts/${contact.id}/edit`) },
            { label: "Message", icon: MessageSquare, onClick: () => router.push(`/app/contacts/${contact.id}?tab=messages`) },
            { label: archived ? "Restore" : "Archive", icon: Archive, disabled: contact.is_demo, onClick: () => { toggleArchive() } },
            { label: "Delete", icon: Trash2, variant: "danger", disabled: contact.is_demo, onClick: openDelete },
          ]}
        />
      )}
    </ConfirmDialog>
  )
}

/* ================================================================== */
/* TYPES & HELPERS                                                      */
/* ================================================================== */

type ViewMode = "overview" | "grid" | "list" | "table"
type TypeFilter = "all" | "tenants" | "landlords" | "suppliers" | "applicants" | "past_tenants" | "professionals" | "other"

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

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

/* ================================================================== */
/* STATIC CONSTANTS                                                     */
/* ================================================================== */

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  tenant:               { label: "Tenant",         cls: "bg-emerald-100 text-emerald-700" },
  post_tenant:          { label: "Past Tenant",    cls: "bg-slate-100 text-slate-600" },
  applicant:            { label: "Applicant",      cls: "bg-sky-100 text-sky-700" },
  landlord:             { label: "Landlord",       cls: "bg-blue-100 text-blue-700" },
  guarantor:            { label: "Guarantor",      cls: "bg-violet-100 text-violet-700" },
  supplier:             { label: "Supplier",       cls: "bg-amber-100 text-amber-700" },
  maintenance:          { label: "Maintenance",    cls: "bg-amber-100 text-amber-700" },
  cleaning:             { label: "Cleaner",        cls: "bg-amber-100 text-amber-700" },
  emergency_contractor: { label: "Emergency",      cls: "bg-red-100 text-red-700" },
  agent:                { label: "Agent",          cls: "bg-violet-100 text-violet-700" },
  local_authority:      { label: "Local Auth",     cls: "bg-teal-100 text-teal-700" },
  housing_association:  { label: "Housing Assoc",  cls: "bg-teal-100 text-teal-700" },
  legal:                { label: "Solicitor",      cls: "bg-blue-100 text-blue-700" },
  accountant:           { label: "Accountant",     cls: "bg-emerald-100 text-emerald-700" },
  insurer:              { label: "Insurer",        cls: "bg-red-100 text-red-700" },
  utility_provider:     { label: "Utility",        cls: "bg-amber-100 text-amber-700" },
  broadband:            { label: "Broadband",      cls: "bg-indigo-100 text-indigo-700" },
  investor:             { label: "Investor",       cls: "bg-violet-100 text-violet-700" },
  affiliate:            { label: "Affiliate",      cls: "bg-sky-100 text-sky-700" },
  other:                { label: "Other",          cls: "bg-slate-100 text-slate-600" },
}

const PIE_COLOURS: Record<string, string> = {
  tenant:      "#10B981",
  landlord:    "#2563EB",
  supplier:    "#F59E0B",
  applicant:   "#0EA5E9",
  post_tenant: "#64748B",
  agent:       "#7C3AED",
  other:       "#94A3B8",
}

const TYPE_FILTER_MAP: Record<TypeFilter, string[]> = {
  all:          [],
  tenants:      ["tenant"],
  landlords:    ["landlord"],
  suppliers:    ["supplier","maintenance","cleaning","emergency_contractor"],
  applicants:   ["applicant"],
  past_tenants: ["post_tenant"],
  professionals:["legal","accountant","insurer","agent","local_authority","housing_association","investor","affiliate"],
  other:        ["other","guarantor","broadband","utility_provider"],
}

const TYPE_CHIPS: { key: TypeFilter; label: string }[] = [
  { key: "all",           label: "All" },
  { key: "tenants",       label: "Tenants" },
  { key: "landlords",     label: "Landlords" },
  { key: "suppliers",     label: "Suppliers" },
  { key: "applicants",    label: "Applicants" },
  { key: "past_tenants",  label: "Past Tenants" },
  { key: "professionals", label: "Professionals" },
  { key: "other",         label: "Other" },
]

const HEALTH_COLOURS: Record<string, { dot: string; text: string; label: string }> = {
  strong:   { dot: "bg-emerald-500", text: "text-emerald-700", label: "Strong" },
  good:     { dot: "bg-blue-500",    text: "text-blue-700",    label: "Good" },
  neutral:  { dot: "bg-slate-400",   text: "text-slate-500",   label: "Neutral" },
  at_risk:  { dot: "bg-amber-500",   text: "text-amber-700",   label: "At Risk" },
  critical: { dot: "bg-red-500",     text: "text-red-700",     label: "Critical" },
}

/* ================================================================== */
/* DATA MAPPERS                                                         */
/* ================================================================== */

interface MappedContact {
  id: string
  workspace_id: string
  is_demo: boolean
  full_name: string
  email: string | null
  phone: string | null
  contact_type: string
  status: string
  company_name: string | null
  city: string | null
  tags: string[]
  updated_at: string
}

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
    updated_at: c.updated_at,
  }
}

/* ================================================================== */
/* ATTENTION QUEUE (static display items)                               */
/* ================================================================== */

/* ================================================================== */
/* PIE CHART HELPERS                                                    */
/* ================================================================== */

function getPieColour(type: string): string {
  return PIE_COLOURS[type] ?? "#94A3B8"
}

interface PieSegment {
  name: string
  value: number
  colour: string
  pct: number
  startAngle: number
  endAngle: number
}

function buildPieSegments(contacts: MappedContact[]): PieSegment[] {
  const counts: Record<string, number> = {}
  for (const c of contacts) {
    const key = ["tenant","landlord","supplier","applicant","post_tenant","agent"].includes(c.contact_type)
      ? c.contact_type
      : "other"
    counts[key] = (counts[key] ?? 0) + 1
  }
  const total = contacts.length || 1
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  let cumAngle = -90
  return entries.map(([name, value]) => {
    const pct = value / total
    const degrees = pct * 360
    const seg: PieSegment = {
      name: TYPE_BADGE[name]?.label ?? name,
      value,
      colour: getPieColour(name),
      pct,
      startAngle: cumAngle,
      endAngle: cumAngle + degrees,
    }
    cumAngle += degrees
    return seg
  })
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = (startDeg * Math.PI) / 180
  const end   = (endDeg   * Math.PI) / 180
  const x1 = cx + r * Math.cos(start)
  const y1 = cy + r * Math.sin(start)
  const x2 = cx + r * Math.cos(end)
  const y2 = cy + r * Math.sin(end)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

/* ================================================================== */
/* SUB-COMPONENTS                                                       */
/* ================================================================== */

function KpiCard({
  icon: Icon, label, value, subtitle, iconColour, bg,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtitle?: React.ReactNode
  iconColour: string
  bg: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-default">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className="w-4 h-4" style={{ color: iconColour }} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      {subtitle && <div className="mt-1">{subtitle}</div>}
    </div>
  )
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-11 h-11 text-sm" : "w-10 h-10 text-sm"
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-semibold shrink-0", avatarBg(name), sz)}>
      {getInitials(name)}
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

function HealthDot({ health }: { health: string }) {
  const cfg = HEALTH_COLOURS[health] ?? HEALTH_COLOURS.neutral
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
      <span className={cn("text-xs font-medium", cfg.text)}>{cfg.label}</span>
    </span>
  )
}

/* --- SVG Donut Chart --- */
function DonutChart({ segments, total }: { segments: PieSegment[]; total: number }) {
  const cx = 90; const cy = 90; const rOuter = 72; const rInner = 46
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* SVG */}
      <div className="w-[180px] shrink-0 mx-auto sm:mx-0">
        <svg viewBox="0 0 180 180" className="w-full h-auto">
          {segments.length === 0 ? (
            <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#E2E8F0" strokeWidth={rOuter - rInner} />
          ) : (
            segments.map((seg, i) => {
              const gap = 1.5
              const adjustedStart = seg.startAngle + gap / 2
              const adjustedEnd   = seg.endAngle   - gap / 2
              if (adjustedEnd <= adjustedStart) return null
              const outerPath = describeArc(cx, cy, rOuter, adjustedStart, adjustedEnd)
              const innerPath = describeArc(cx, cy, rInner, adjustedEnd, adjustedStart)
              const startOuter = {
                x: cx + rOuter * Math.cos((adjustedStart * Math.PI) / 180),
                y: cy + rOuter * Math.sin((adjustedStart * Math.PI) / 180),
              }
              const startInner = {
                x: cx + rInner * Math.cos((adjustedEnd * Math.PI) / 180),
                y: cy + rInner * Math.sin((adjustedEnd * Math.PI) / 180),
              }
              const endOuter = {
                x: cx + rOuter * Math.cos((adjustedEnd * Math.PI) / 180),
                y: cy + rOuter * Math.sin((adjustedEnd * Math.PI) / 180),
              }
              const endInner = {
                x: cx + rInner * Math.cos((adjustedStart * Math.PI) / 180),
                y: cy + rInner * Math.sin((adjustedStart * Math.PI) / 180),
              }
              const large = (adjustedEnd - adjustedStart) > 180 ? 1 : 0
              const d = [
                `M ${startOuter.x} ${startOuter.y}`,
                `A ${rOuter} ${rOuter} 0 ${large} 1 ${endOuter.x} ${endOuter.y}`,
                `L ${startInner.x} ${startInner.y}`,
                `A ${rInner} ${rInner} 0 ${large} 0 ${endInner.x} ${endInner.y}`,
                "Z",
              ].join(" ")
              return <path key={i} d={d} fill={seg.colour} />
            })
          )}
          <text x={cx} y={cy - 8} textAnchor="middle" className="text-2xl font-bold" style={{ fontSize: 22, fontWeight: 700, fill: "#0F172A" }}>
            {total}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 11, fill: "#94A3B8" }}>
            total
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 self-center w-full">
        {segments.map(seg => (
          <div key={seg.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.colour }} />
              <span className="text-xs text-slate-600 font-medium">{seg.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 tabular-nums">{seg.value}</span>
              <span className="text-[10px] text-slate-400">({Math.round(seg.pct * 100)}%)</span>
            </div>
          </div>
        ))}
        {segments.length === 0 && (
          <div className="col-span-2 text-xs text-slate-400 py-4 text-center">No data yet</div>
        )}
      </div>
    </div>
  )
}

/* --- Grid Contact Card --- */
function GridContactCard({ contact }: { contact: MappedContact }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group">
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={contact.full_name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate pr-5">{contact.full_name}</p>
          {contact.company_name && <p className="text-xs text-slate-500 truncate">{contact.company_name}</p>}
          <div className="mt-1"><TypeBadge type={contact.contact_type} /></div>
        </div>
        <div className="shrink-0">
          <ContactRowMenu contact={contact} />
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {contact.email && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="w-3 h-3 shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.city && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{contact.city}</span>
          </div>
        )}
      </div>

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contact.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">{tag}</span>
          ))}
          {contact.tags.length > 3 && (
            <span className="text-[10px] text-slate-400">+{contact.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-400">
          {relativeTime(contact.updated_at)}
        </span>
        <div className="flex items-center gap-1">
          <Link
            href={`/app/contacts/${contact.id}?tab=messages`}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            title="Message"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/app/contacts/${contact.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#2563EB] text-white hover:bg-[#1d4ed8] transition-colors"
          >
            View
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* --- List Row --- */
function ListContactRow({ contact }: { contact: MappedContact }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
      <Avatar name={contact.full_name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors">{contact.full_name}</span>
          <TypeBadge type={contact.contact_type} />
          {contact.city && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />{contact.city}
            </span>
          )}
        </div>
        {contact.email && <p className="text-xs text-slate-500 mt-0.5">{contact.email}</p>}
      </div>
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 shrink-0">
        <span>{relativeTime(contact.updated_at)}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/app/contacts/${contact.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          View <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

/* --- Table Row --- */
function TableContactRow({ contact }: { contact: MappedContact }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={contact.full_name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{contact.full_name}</p>
            {contact.company_name && <p className="text-xs text-slate-500 truncate max-w-[140px]">{contact.company_name}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><TypeBadge type={contact.contact_type} /></td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {contact.email
          ? <a href={`mailto:${contact.email}`} className="hover:text-[#2563EB] transition-colors truncate block max-w-[180px]">{contact.email}</a>
          : <span className="text-slate-300">—</span>
        }
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{contact.phone ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{contact.city ?? "—"}</td>
      <td className="px-4 py-3">
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
          contact.status === "active" ? "bg-emerald-100 text-emerald-700" :
          contact.status === "inactive" ? "bg-slate-100 text-slate-500" :
          "bg-amber-100 text-amber-700"
        )}>
          {contact.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(contact.updated_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Link href={`/app/contacts/${contact.id}`} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#2563EB] transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <ContactRowMenu contact={contact} />
        </div>
      </td>
    </tr>
  )
}

/* --- Skeleton Row --- */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-2 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-slate-100 rounded" />
        <div className="h-2 bg-slate-100 rounded w-5/6" />
      </div>
    </div>
  )
}

/* ================================================================== */
/* ADD CONTACT MODAL                                                    */
/* ================================================================== */

interface AddContactModalProps {
  onClose: () => void
  onSuccess: () => void
  workspaceId?: string
}

function AddContactModal({ onClose, onSuccess, workspaceId }: AddContactModalProps) {
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
    setSaving(true)
    setError(null)
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
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Add Contact</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="James"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Okafor"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contact Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all"
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
              <option value="applicant">Applicant</option>
              <option value="supplier">Supplier</option>
              <option value="agent">Agent</option>
              <option value="guarantor">Guarantor</option>
              <option value="legal">Legal</option>
              <option value="accountant">Accountant</option>
              <option value="investor">Investor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="james@example.com"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="07700 900000"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-9 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
          >
            {saving ? "Saving…" : "Save Contact"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* TOAST                                                                */
/* ================================================================== */

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      {message}
      <button onClick={onDismiss} className="ml-2 text-slate-400 hover:text-white transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/* ================================================================== */
/* RELATIONSHIP HEALTH SVG RING                                         */
/* ================================================================== */

function RelHealthRing({ contactCount }: { contactCount: number }) {
  const score = contactCount > 0 ? 84 : 0
  const circumference = 2 * Math.PI * 40
  const dash = (score / 100) * circumference

  const strong   = Math.round(contactCount * 0.51)
  const good     = Math.round(contactCount * 0.33)
  const atRisk   = Math.round(contactCount * 0.11)
  const critical = contactCount - strong - good - atRisk

  const breakdown = [
    { label: "Strong",   count: strong,   pct: contactCount > 0 ? 51 : 0, colour: "#10B981" },
    { label: "Good",     count: good,     pct: contactCount > 0 ? 33 : 0, colour: "#2563EB" },
    { label: "At Risk",  count: atRisk,   pct: contactCount > 0 ? 11 : 0, colour: "#F59E0B" },
    { label: "Critical", count: Math.max(0, critical), pct: contactCount > 0 ? 5 : 0, colour: "#EF4444" },
  ]

  return (
    <div>
      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="12" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="#10B981" strokeWidth="12"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{score}</span>
            <span className="text-[9px] text-slate-400 font-medium">/ 100</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2">
          {breakdown.map(b => (
            <div key={b.label} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.colour }} />
                  <span className="text-slate-600">{b.label}</span>
                </div>
                <span className="font-semibold text-slate-900 tabular-nums">{b.count}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{ width: `${b.pct}%`, backgroundColor: b.colour }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* MAIN PAGE                                                            */
/* ================================================================== */

export default function ContactsPage() {
  const { workspace } = useWorkspace()
  const { data: liveContacts, isLoading, error } = useContacts(workspace?.id)

  const contacts: MappedContact[] = useMemo(() => {
    if (liveContacts && liveContacts.length > 0) return liveContacts.map(mapContact)
    return []
  }, [liveContacts])

  const [activeView, setActiveView] = useState<ViewMode>("overview")
  const [activeType, setActiveType] = useState<TypeFilter>("all")
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const filtered = useMemo(() => {
    let data = [...contacts]
    if (activeType !== "all") {
      const allowed = TYPE_FILTER_MAP[activeType]
      data = data.filter(c => allowed.includes(c.contact_type))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.company_name ?? "").toLowerCase().includes(q)
      )
    }
    return data
  }, [contacts, activeType, search])

  const pieSegments = useMemo(() => buildPieSegments(contacts), [contacts])

  /* KPI computations */
  const kpiCards = useMemo(() => {
    const tenantCount   = contacts.filter(c => c.contact_type === "tenant" && c.status === "active").length
    const applicantCount = contacts.filter(c => c.contact_type === "applicant").length
    const supplierCount  = contacts.filter(c => ["supplier","maintenance","cleaning","emergency_contractor"].includes(c.contact_type)).length
    const landlordCount  = contacts.filter(c => c.contact_type === "landlord").length
    const preferredCount = contacts.filter(c => c.tags.includes("preferred")).length
    const followUpCount  = contacts.filter(c => c.tags.includes("follow_up")).length

    return [
      { icon: Users,     label: "Total Contacts",  value: contacts.length,    iconColour: "#2563EB", bg: "bg-blue-50",    subtitle: undefined },
      { icon: UserCheck, label: "Active Tenants",   value: tenantCount,        iconColour: "#10B981", bg: "bg-emerald-50", subtitle: undefined },
      { icon: UserPlus,  label: "Applicants",       value: applicantCount,     iconColour: "#0EA5E9", bg: "bg-sky-50",     subtitle: undefined },
      { icon: Wrench,    label: "Suppliers",        value: supplierCount,      iconColour: "#F59E0B", bg: "bg-amber-50",
        subtitle: preferredCount > 0 ? <span className="text-[10px] font-medium text-amber-600">{preferredCount} preferred</span> : undefined },
      { icon: Home,      label: "Landlords",        value: landlordCount,      iconColour: "#2563EB", bg: "bg-blue-50",    subtitle: undefined },
      { icon: Clock,     label: "Follow-ups",       value: followUpCount,      iconColour: "#EF4444", bg: "bg-red-50",
        subtitle: followUpCount > 0 ? <span className="text-[10px] font-medium text-red-500">needs action</span> : undefined },
      { icon: Globe,     label: "Portal Users",     value: contacts.filter(c => c.tags.includes("portal_access")).length, iconColour: "#8B5CF6", bg: "bg-violet-50",
        subtitle: undefined },
    ]
  }, [contacts])

  /* Key contacts (most recently updated) */
  const keyContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
  }, [contacts])

  /* Live attention queue — contacts flagged via tags (arrears / follow_up) or needing review */
  const attentionContacts = useMemo(() => {
    return contacts
      .filter(c => c.tags.includes("arrears") || c.tags.includes("follow_up") || c.status === "inactive")
      .slice(0, 5)
  }, [contacts])

  /* Live follow-up reminders — contacts tagged follow_up */
  const followUpContacts = useMemo(() => {
    return contacts.filter(c => c.tags.includes("follow_up")).slice(0, 5)
  }, [contacts])

  /* Live recent activity — most recently updated contacts */
  const recentActivity = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6)
  }, [contacts])

  return (
    <DashboardContainer>
      <div className="space-y-0">

        {/* ============================================================ */}
        {/* PAGE HEADER + TAB NAV                                          */}
        {/* ============================================================ */}
        <SectionHeader
          title="Contacts"
          subtitle="Your relationship hub — tenants, landlords, suppliers and beyond"
          tabs={<ContactsTabNav />}
          actions={
            <>
              <button
                onClick={() => showToast("Export feature coming soon")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => showToast("Import feature coming soon")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1d4ed8] transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Contact
              </button>
            </>
          }
        />

        <div className="pt-6 space-y-6">

          {/* ========================================================== */}
          {/* ERROR STATE                                                 */}
          {/* ========================================================== */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">Failed to load contacts</p>
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
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {kpiCards.map(card => (
                <KpiCard key={card.label} {...card} />
              ))}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW SWITCHER + TYPE FILTERS + SEARCH                      */}
          {/* ========================================================== */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {(
                [
                  { key: "overview" as ViewMode, label: "Overview", icon: LayoutDashboard },
                  { key: "grid"     as ViewMode, label: "Grid",     icon: LayoutGrid },
                  { key: "list"     as ViewMode, label: "List",     icon: List },
                  { key: "table"    as ViewMode, label: "Table",    icon: Table2 },
                ]
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    activeView === key ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            {/* Type filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {TYPE_CHIPS.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setActiveType(chip.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    activeType === chip.key ? "bg-[#2563EB] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="ml-auto relative min-w-[200px] max-w-xs w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-8 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results count for non-overview modes */}
          {activeView !== "overview" && (
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of {contacts.length} contacts
            </p>
          )}

          {/* ========================================================== */}
          {/* OVERVIEW MODE                                               */}
          {/* ========================================================== */}
          {activeView === "overview" && !isLoading && (
            <div className="space-y-6">

              {/* Row 1: Type Breakdown + Attention Queue + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Contact Type Breakdown */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Contact Type Breakdown</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Distribution across {contacts.length} contacts</p>
                    </div>
                    <Link href="/app/contacts/people" className="text-xs text-[#2563EB] hover:underline font-medium">View all</Link>
                  </div>
                  {contacts.length === 0 ? (
                    <div className="py-12 text-center">
                      <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No contacts yet</p>
                      <button onClick={() => setShowAddModal(true)} className="mt-2 text-xs text-[#2563EB] hover:underline">Add your first contact</button>
                    </div>
                  ) : (
                    <DonutChart segments={pieSegments} total={contacts.length} />
                  )}
                </div>

                {/* Attention Queue */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Attention Queue</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Contacts needing action</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                      {attentionContacts.length}
                    </span>
                  </div>
                  {attentionContacts.length === 0 ? (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Nothing needs attention</p>
                    </div>
                  ) : (
                    attentionContacts.map(c => (
                      <div key={c.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                        <Avatar name={c.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 truncate">{c.full_name}</span>
                            <TypeBadge type={c.contact_type} />
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-xs font-medium text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {c.tags.includes("arrears") ? "Arrears flagged" : c.tags.includes("follow_up") ? "Follow-up due" : "Inactive — review"}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/app/contacts/${c.id}`}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-[#2563EB] hover:text-white transition-colors"
                        >
                          Act <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Row 2: Key Contacts + Follow-up Reminders + Relationship Health */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Key Contacts */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Key Contacts</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Most recently active</p>
                    </div>
                    <Link href="/app/contacts/people" className="text-xs text-[#2563EB] hover:underline font-medium">View all</Link>
                  </div>
                  {keyContacts.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No contacts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {keyContacts.map((c, i) => (
                        <Link
                          key={c.id}
                          href={`/app/contacts/${c.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                        >
                          <Avatar name={c.full_name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#2563EB]">{c.full_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <TypeBadge type={c.contact_type} />
                              {c.company_name && <span className="text-[10px] text-slate-400 truncate">{c.company_name}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-700">{8 + i * 2}</p>
                            <p className="text-[10px] text-slate-400">interactions</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Follow-up Reminders */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Follow-up Reminders</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Upcoming &amp; overdue</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
                      {followUpContacts.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {followUpContacts.length === 0 ? (
                      <div className="py-8 text-center">
                        <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No follow-ups scheduled</p>
                        <p className="text-[10px] text-slate-400 mt-1">Tag a contact &ldquo;follow_up&rdquo; to track it here</p>
                      </div>
                    ) : followUpContacts.map(f => (
                      <Link key={f.id} href={`/app/contacts/${f.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{f.full_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <TypeBadge type={f.contact_type} />
                            <span className="text-[10px] text-slate-400">Updated {relativeTime(f.updated_at)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Relationship Health */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Relationship Health</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Portfolio health score</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      Good
                    </span>
                  </div>
                  <RelHealthRing contactCount={contacts.length} />
                </div>
              </div>

              {/* Row 3: Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Latest contact events</p>
                    </div>
                    <Link href="/app/contacts/activity" className="text-xs text-[#2563EB] hover:underline font-medium">View all</Link>
                  </div>
                  <div className="space-y-0">
                    {recentActivity.length === 0 ? (
                      <div className="py-8 text-center">
                        <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No recent contact activity</p>
                      </div>
                    ) : recentActivity.map((c, i) => (
                      <Link
                        key={c.id}
                        href={`/app/contacts/${c.id}`}
                        className={cn("flex items-start gap-3 py-2.5 group", i < recentActivity.length - 1 && "border-b border-slate-100")}
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          <UserPlus className="w-3.5 h-3.5" style={{ color: "#10B981" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed group-hover:text-[#2563EB] transition-colors truncate">
                            {c.full_name} <span className="text-slate-400 font-normal">updated</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{relativeTime(c.updated_at)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick stats summary */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Quick Stats</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Portfolio summary</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Portal Users",    value: contacts.filter(c => c.tags.includes("portal_access")).length.toString(), sub: "with access", colour: "#8B5CF6", positive: true },
                      { label: "Active Contacts", value: contacts.filter(c => c.status === "active").length.toString(), sub: "of " + contacts.length, colour: "#10B981", positive: true },
                      { label: "Follow-ups", value: contacts.filter(c => c.tags.includes("follow_up")).length.toString(), sub: "need action", colour: "#EF4444", positive: false },
                      { label: "Organisations",   value: contacts.filter(c => ["supplier","agent","legal","accountant","investor"].includes(c.contact_type)).length.toString(), sub: "linked", colour: "#2563EB", positive: true },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {s.positive
                            ? <TrendingUp className="w-3 h-3" style={{ color: s.colour }} />
                            : <TrendingDown className="w-3 h-3" style={{ color: s.colour }} />
                          }
                          <span className="text-[10px] font-medium" style={{ color: s.colour }}>{s.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================== */}
          {/* GRID MODE                                                   */}
          {/* ========================================================== */}
          {activeView === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : filtered.length === 0
                ? (
                  <div className="col-span-full py-20 text-center">
                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-400">No contacts match your filters</p>
                    <button onClick={() => { setActiveType("all"); setSearch("") }} className="mt-2 text-xs text-[#2563EB] hover:underline">Clear filters</button>
                  </div>
                )
                : filtered.map(c => <GridContactCard key={c.id} contact={c} />)
              }
            </div>
          )}

          {/* ========================================================== */}
          {/* LIST MODE                                                   */}
          {/* ========================================================== */}
          {activeView === "list" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-2 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))
                : filtered.length === 0
                ? (
                  <div className="py-20 text-center">
                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-400">No contacts match your filters</p>
                    <button onClick={() => { setActiveType("all"); setSearch("") }} className="mt-2 text-xs text-[#2563EB] hover:underline">Clear filters</button>
                  </div>
                )
                : filtered.map(c => <ListContactRow key={c.id} contact={c} />)
              }
            </div>
          )}

          {/* ========================================================== */}
          {/* TABLE MODE                                                  */}
          {/* ========================================================== */}
          {activeView === "table" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["Contact","Type","Email","Phone","Location","Status","Last Updated","Actions"].map(col => (
                        <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {col}
                            {["Contact","Type","Last Updated"].includes(col) && (
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
                        <td colSpan={8} className="py-12 text-center">
                          <div className="flex justify-center gap-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center text-sm text-slate-400">
                          No contacts match your filters.{" "}
                          <button onClick={() => { setActiveType("all"); setSearch("") }} className="text-[#2563EB] hover:underline">Clear filters</button>
                        </td>
                      </tr>
                    ) : (
                      filtered.map(c => <TableContactRow key={c.id} contact={c} />)
                    )}
                  </tbody>
                </table>
              </div>
              {!isLoading && filtered.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
                  <span>{filtered.length} contacts shown</span>
                  <div className="flex items-center gap-2">
                    <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40">Previous</button>
                    <span className="px-2">Page 1</span>
                    <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ============================================================ */}
      {/* ADD CONTACT MODAL                                             */}
      {/* ============================================================ */}
      {showAddModal && (
        <AddContactModal
          workspaceId={workspace?.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            showToast("Contact created successfully")
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
