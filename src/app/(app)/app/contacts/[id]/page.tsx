"use client"

import React, { useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, MessageSquare, FileText, Mail, Phone, Building2, Home, Briefcase,
  Wallet, FolderOpen, MessageCircle, StickyNote, ListChecks, Activity, Shield,
  AlertTriangle, Edit, Plus, ExternalLink, CheckCircle2,
  Check, Star, Clock, Eye, Download, Copy, Trash2, RefreshCw, CalendarDays,
  MapPin, Tag, User, Package, Zap, TrendingUp, Settings, Globe, Link2, Wrench,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useContact, useUpdateContact, useDeleteContact } from "@/hooks/useContacts"
import { useContactMessages } from "@/hooks/useMessages"
import { useWorkspace } from "@/hooks/useWorkspace"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { deriveSupplierCategories } from "@/lib/constants/supplierCategories"

/* ------------------------------------------------------------------ */
/* Inline-edit save context — wired to useUpdateContact (live rows)     */
/* ------------------------------------------------------------------ */
type ContactSaveFn = (field: string, value: string) => Promise<void>
const ContactSaveContext = React.createContext<{ save: ContactSaveFn; editable: boolean }>({
  save: async () => {},
  editable: false,
})
function useContactSave() { return React.useContext(ContactSaveContext) }

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

/* ------------------------------------------------------------------ */
/* Avatar helpers                                                       */
/* ------------------------------------------------------------------ */
const AVATAR_BG = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500"]
function avatarBg(name: string): string { let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h); return AVATAR_BG[Math.abs(h)%AVATAR_BG.length] }
function initials(name: string): string { const p=name.trim().split(/\s+/); return p.length===1?p[0].slice(0,2).toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase() }

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type ContactType = "tenant" | "landlord" | "supplier" | "applicant" | "agent" | "legal" | "other"
type HealthStatus = "healthy" | "risk" | "follow_up" | "needs_data"

interface InvoiceRecord { ref: string; amount: number; status: string; date: string }
interface ActivityRecord { action: string; time: string; type: string }
interface JobRecord { title: string; status: string; date: string; cost: number; property: string }

interface TenancyInfo {
  property: string; unit: string; rent: number; deposit: number
  start: string; end: string; status: string; deposit_scheme: string; guarantor: string | null
}
interface EnquiryInfo {
  source: string; budget_min: number; budget_max: number; move_date: string
  preferred_area: string; preferred_type: string; status: string
}
interface SupplierInfo {
  service_categories: string[]; coverage_postcodes: string[]
  hourly_rate: number; callout_fee: number; emergency_available: boolean
  preferred_supplier: boolean; backup_supplier: boolean; insurance_expiry: string
  compliance_status: string; average_response_time: number; jobs_completed: number
  internal_rating: number
}
interface PlanningSet { name: string; status: string; created: string }
interface LandlordOffer { ref: string; property: string; status: string; amount: number }

interface ContactDetail {
  id: string; full_name: string; email: string; phone: string
  contact_type: ContactType; status: string; company_name: string | null
  city: string; postcode: string; address_line1: string | null
  tags: string[]; arrears: number; linked_properties: number; active_tenancies: number
  last_contacted: string | null; next_follow_up: string | null; health: HealthStatus
  portal_status: string | null; notes: string | null
  /** Live supplier service categories (from category/subcategory/tags). */
  service_categories?: string[]
  tenancy?: TenancyInfo; invoices?: InvoiceRecord[]; activity?: ActivityRecord[]
  properties?: string[]; planning_sets?: PlanningSet[]; landlord_offers?: LandlordOffer[]
  enquiry?: EnquiryInfo; supplier?: SupplierInfo; jobs?: JobRecord[]
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                     */
/* ------------------------------------------------------------------ */
function ContactDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-7 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-100 rounded w-36" />
            <div className="h-4 bg-slate-100 rounded w-52" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-3 h-14 bg-slate-100" />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Helper constants                                                     */
/* ------------------------------------------------------------------ */
const TYPE_BADGE: Record<ContactType, string> = {
  tenant:    "bg-emerald-100 text-emerald-700",
  landlord:  "bg-blue-100 text-blue-700",
  supplier:  "bg-amber-100 text-amber-700",
  applicant: "bg-sky-100 text-sky-700",
  agent:     "bg-violet-100 text-violet-700",
  legal:     "bg-rose-100 text-rose-700",
  other:     "bg-slate-100 text-slate-600",
}

const HEALTH_CONFIG: Record<HealthStatus, { label: string; dot: string; text: string }> = {
  healthy:    { label:"Healthy",    dot:"bg-emerald-500", text:"text-emerald-700" },
  risk:       { label:"At Risk",    dot:"bg-red-500",     text:"text-red-700"     },
  follow_up:  { label:"Follow Up",  dot:"bg-amber-500",   text:"text-amber-700"  },
  needs_data: { label:"Needs Data", dot:"bg-slate-400",   text:"text-slate-600"  },
}

/* ------------------------------------------------------------------ */
/* Next Best Action                                                     */
/* ------------------------------------------------------------------ */
function getNextBestAction(contact: ContactDetail): { label: string; cta: string; href: string } {
  if (contact.contact_type === "tenant" && contact.arrears > 0)
    return { label: "£" + contact.arrears.toLocaleString("en-GB") + " in arrears — send reminder", cta: "Send Reminder", href: "#" }
  if (contact.contact_type === "tenant" && contact.next_follow_up)
    return { label: "Follow-up due " + contact.next_follow_up, cta: "Create Task", href: "#" }
  if (contact.contact_type === "landlord" && (contact.planning_sets?.length ?? 0) > 0)
    return { label: "Planning set ready — review forecast", cta: "View Planning Set", href: "/app/planning" }
  if (contact.contact_type === "applicant" && contact.next_follow_up)
    return { label: "Book a viewing — follow-up due " + contact.next_follow_up, cta: "Book Viewing", href: "#" }
  if (contact.contact_type === "supplier")
    return { label: "Create a new job for this supplier", cta: "Create Job", href: "/app/work/jobs/new" }
  return { label: "No urgent actions", cta: "View Activity", href: "#" }
}

/* ------------------------------------------------------------------ */
/* Shared small components                                             */
/* ------------------------------------------------------------------ */
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      {children}
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  )
}

function EmptyState({ icon: Icon, message, cta, onCta }: {
  icon: React.ElementType; message: string; cta?: string; onCta?: () => void
}) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 mb-3">{message}</p>
      {cta && (
        <Button variant="outline" size="sm" onClick={onCta} leftIcon={<Plus className="w-3.5 h-3.5" />}>{cta}</Button>
      )}
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, "success" | "danger" | "warning" | "default" | "sky"> = {
    paid: "success", active: "success", completed: "success", valid: "success",
    overdue: "danger", expired: "danger", risk: "danger",
    scheduled: "warning", pending: "warning", expiring: "warning",
    offer_drafted: "sky", viewing_needed: "sky",
  }
  return <Badge variant={map[status] ?? "default"} size="sm" dot>{status.replace(/_/g," ")}</Badge>
}

function InvoiceTable({ invoices, emptyLabel }: { invoices: InvoiceRecord[]; emptyLabel?: string }) {
  if (invoices.length === 0) return <EmptyState icon={Wallet} message={emptyLabel ?? "No invoices yet."} cta="Record Invoice" />
  const total = invoices.reduce((s, i) => s + i.amount, 0)
  const paid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const outstanding = total - paid
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Invoiced", value: `£${total.toLocaleString("en-GB")}`, colour: "text-slate-900" },
          { label: "Total Paid",     value: `£${paid.toLocaleString("en-GB")}`,  colour: "text-emerald-600" },
          { label: "Outstanding",    value: `£${outstanding.toLocaleString("en-GB")}`, colour: outstanding > 0 ? "text-red-600" : "text-slate-400" },
        ].map(k => (
          <SectionCard key={k.label} className="p-3">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={cn("text-xl font-bold", k.colour)}>{k.value}</p>
          </SectionCard>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Invoice #","Date","Amount","Status",""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.ref} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700">{inv.ref}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{inv.date}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">£{inv.amount.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3"><StatusChip status={inv.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ActivityTimeline({ items }: { items: ActivityRecord[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    payment:  <div style={{ color: "#10B981" }}><CheckCircle2 className="w-4 h-4" /></div>,
    document: <div style={{ color: "#2563EB" }}><FileText className="w-4 h-4" /></div>,
    task:     <div style={{ color: "#F59E0B" }}><ListChecks className="w-4 h-4" /></div>,
    alert:    <div style={{ color: "#EF4444" }}><AlertTriangle className="w-4 h-4" /></div>,
    system:   <div style={{ color: "#94a3b8" }}><Activity className="w-4 h-4" /></div>,
    note:     <div style={{ color: "#8B5CF6" }}><StickyNote className="w-4 h-4" /></div>,
    portal:   <div style={{ color: "#0EA5E9" }}><Globe className="w-4 h-4" /></div>,
  }
  if (items.length === 0) return <EmptyState icon={Activity} message="No activity recorded yet." />
  return (
    <div className="relative space-y-4 pl-4">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
      {items.map((a, i) => (
        <div key={i} className="flex items-start gap-3 relative">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 z-10 -ml-4">
            {iconMap[a.type] ?? <div style={{ color: "#94a3b8" }}><Activity className="w-4 h-4" /></div>}
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm text-slate-800">{a.action}</p>
            <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditTab() {
  const rows = [
    { who: "System", action: "Contact created", field: "—", when: "2026-01-15 09:23" },
    { who: "admin@propvora.com", action: "Email updated", field: "email", when: "2026-02-01 14:12" },
    { who: "admin@propvora.com", action: "Tag added: reliable", field: "tags", when: "2026-02-01 14:13" },
    { who: "System", action: "Tenancy linked", field: "tenancy_id", when: "2026-02-01 14:15" },
  ]
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Full change log — admin visible only</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Who","Action","Field","When"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-700 font-medium">{r.who}</td>
                <td className="px-4 py-3 text-slate-700">{r.action}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.field}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MessagesTab({ contactId, workspaceId }: { contactId: string; workspaceId: string | undefined }) {
  const { data: messages = [], isLoading } = useContactMessages(workspaceId, contactId, 5)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Recent Messages</h3>
        <Link href="/app/messages">
          <Button variant="primary" size="sm" leftIcon={<MessageSquare className="w-3.5 h-3.5" />}>Open in Messages</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-slate-500 mb-3">No messages with this contact yet.</p>
          <Link href="/app/messages">
            <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>Go to Messages</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => {
            const isUser = m.sender_type === "user"
            return (
              <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    isUser ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {isUser ? "You" : "Contact"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(m.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-3">{m.body}</p>
              </div>
            )
          })}
          <Link href="/app/messages" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline pt-1">
            View full conversation in Messages <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
}

function DocumentsTab({ contactId, workspaceId }: { contactId: string; workspaceId: string | undefined }) {
  const { editable } = useContactSave()
  const [docs, setDocs] = React.useState<Array<{ id: string; name: string; status: string; created_at: string; url: string | null }>>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const load = React.useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    // Contact documents are filed in `documents` with metadata.contact_id (no FK column).
    const { data, error } = await supabase
      .from("documents")
      .select("id, name, status, created_at, url, metadata")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) { setDocs([]); setLoading(false); return }
    const mine = (data ?? []).filter((d) => (d.metadata as { contact_id?: string } | null)?.contact_id === contactId)
    setDocs(mine.map((d) => ({ id: d.id as string, name: d.name as string, status: (d.status as string) ?? "uploaded", created_at: d.created_at as string, url: (d.url as string | null) ?? null })))
    setLoading(false)
  }, [workspaceId, contactId])

  React.useEffect(() => { void load() }, [load])

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !workspaceId) return
    setUploading(true)
    try {
      const { uploadFile } = await import("@/lib/upload")
      const { createClient } = await import("@/lib/supabase/client")
      const up = await uploadFile(file, workspaceId, "contacts")
      const supabase = createClient()
      await supabase.from("documents").insert({
        workspace_id: workspaceId,
        name: file.name,
        mime_type: up.type || file.type || null,
        size_bytes: up.size ?? file.size,
        r2_key: up.key,
        r2_bucket: "propvora",
        url: up.url,
        status: "uploaded",
        metadata: { contact_id: contactId },
      })
      await load()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" className="hidden" onChange={onPick} />
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{docs.length} document{docs.length === 1 ? "" : "s"}</p>
        <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} disabled={!editable || uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading…" : "Upload Document"}
        </Button>
      </div>
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading documents…</div>
      ) : docs.length === 0 ? (
        <EmptyState icon={FolderOpen} message="No documents yet. Upload one to get started." />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <StatusChip status={doc.status} />
              <div className="flex gap-1">
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-colors"><Download className="w-3.5 h-3.5" /></a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NotesTab({ contact }: { contact: ContactDetail }) {
  const { save, editable } = useContactSave()
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const existing = contact.notes ?? ""

  async function appendNote() {
    if (!note.trim()) return
    setSaving(true)
    try {
      const stamp = new Date().toLocaleString("en-GB")
      const combined = existing ? `${note.trim()}\n— ${stamp}\n\n${existing}` : `${note.trim()}\n— ${stamp}`
      await save("notes", combined)
      setNote("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {editable ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600 mb-2">Add note</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Add an internal note about this contact…"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
          <div className="flex justify-end mt-2">
            <Button variant="primary" size="sm" loading={saving} disabled={!note.trim()} onClick={appendNote}>
              Save Note
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          Notes are read-only in demo mode.
        </div>
      )}
      {!existing ? (
        <EmptyState icon={StickyNote} message="No notes yet." />
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-amber-50 text-sm text-slate-700 whitespace-pre-wrap">{existing}</div>
        </div>
      )}
    </div>
  )
}

function TasksTab() {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [tasks, setTasks] = useState<{ id: string; title: string; dueDate: string; status: string }[]>([])

  function saveTask() {
    if (!title.trim()) return
    setSaving(true)
    const newTask = { id: Date.now().toString(), title: title.trim(), dueDate, status: "to_do" }
    setTasks(prev => [newTask, ...prev])
    setTitle(""); setDueDate(""); setShowForm(false); setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Tasks ({tasks.length})</h3>
        <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowForm(!showForm)}>Add Task</Button>
      </div>
      {showForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Task title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Send rental statement"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={saving} onClick={saveTask} disabled={!title.trim()}>
              <Check className="w-3.5 h-3.5" /> Save Task
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setTitle(""); setDueDate("") }}>Cancel</Button>
          </div>
        </div>
      )}
      {tasks.length === 0 && !showForm ? (
        <EmptyState icon={ListChecks} message="No tasks linked to this contact yet." />
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                {task.dueDate && <p className="text-xs text-slate-400 mt-0.5">Due {new Date(task.dueDate).toLocaleDateString("en-GB")}</p>}
              </div>
              <Badge variant="default" size="sm">To Do</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileTab({ contact }: { contact: ContactDetail }) {
  const { save, editable } = useContactSave()
  const fields: { label: string; field: string; value: string | null; type?: "text" | "select" | "textarea"; options?: { value: string; label: string }[] }[] = [
    { label: "Full Name",    field: "full_name",     value: contact.full_name },
    { label: "Email",        field: "email",         value: contact.email },
    { label: "Phone",        field: "phone",         value: contact.phone },
    { label: "Contact Type", field: "contact_type",  value: contact.contact_type, type: "select", options: CONTACT_TYPE_OPTIONS },
    { label: "Company",      field: "company_name",  value: contact.company_name },
    { label: "Status",       field: "status",        value: contact.status, type: "select", options: CONTACT_STATUS_OPTIONS },
    { label: "City",         field: "city",          value: contact.city },
    { label: "Postcode",     field: "postcode",      value: contact.postcode },
    { label: "Address",      field: "address_line1", value: contact.address_line1 },
  ]
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Personal Details</h3>
        {editable && <span className="text-xs text-slate-400">Click any field to edit</span>}
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {fields.map(f => (
          <div key={f.label}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{f.label}</p>
            <InlineEditField
              value={f.value}
              type={f.type ?? "text"}
              options={f.options}
              disabled={!editable}
              placeholder="—"
              displayClassName="text-sm text-slate-800 capitalize"
              onSave={(v) => save(f.field, v)}
            />
          </div>
        ))}
      </div>
      {contact.tags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map(t => (
              <span key={t} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs capitalize">{t}</span>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</p>
        <InlineEditField
          value={contact.notes}
          type="textarea"
          disabled={!editable}
          placeholder="Add an internal note about this contact…"
          displayClassName="text-sm text-slate-700 leading-relaxed"
          onSave={(v) => save("notes", v)}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tenant-specific tabs                                                 */
/* ------------------------------------------------------------------ */
function TenantOverviewTab({ contact }: { contact: ContactDetail }) {
  const invoices = contact.invoices ?? []
  const recent = invoices.slice(0, 3)
  return (
    <div className="space-y-5">
      {contact.arrears > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <div style={{ color: "#dc2626" }}><AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Arrears Outstanding</p>
            <p className="text-sm text-red-700">£{contact.arrears.toLocaleString("en-GB")} overdue — action required</p>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0">Create Task</Button>
        </div>
      )}
      <div className="grid sm:grid-cols-3 gap-4">
        <SectionCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Monthly Rent</p>
          <p className="text-2xl font-bold text-slate-900">£{(contact.tenancy?.rent ?? 0).toLocaleString("en-GB")}</p>
        </SectionCard>
        <SectionCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Arrears</p>
          <p className={cn("text-2xl font-bold", contact.arrears > 0 ? "text-red-600" : "text-emerald-600")}>
            {contact.arrears > 0 ? `£${contact.arrears.toLocaleString("en-GB")}` : "None"}
          </p>
        </SectionCard>
        <SectionCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Tenancy Status</p>
          <div className="mt-1"><StatusChip status={contact.tenancy?.status ?? "inactive"} /></div>
        </SectionCard>
      </div>
      {recent.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Recent Payments</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Invoice","Date","Amount","Status"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(inv => (
                  <tr key={inv.ref} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{inv.ref}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{inv.date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">£{inv.amount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3"><StatusChip status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function TenancyTab({ contact }: { contact: ContactDetail }) {
  const t = contact.tenancy
  const rentHistory = [
    { month:"Dec", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"Jan", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"Feb", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"Mar", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"Apr", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"May", received: contact.arrears > 0 ? 0 : (t?.rent ?? 0), expected:t?.rent ?? 0 },
  ]
  if (!t) return <EmptyState icon={Home} message="No tenancy linked to this contact." cta="Link Tenancy" />
  return (
    <div className="space-y-5">
      {contact.arrears > 0 ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <div style={{ color: "#dc2626" }}><AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Arrears Outstanding — £{contact.arrears.toLocaleString("en-GB")}</p>
            <p className="text-sm text-red-700">Payment overdue — send notice or create a follow-up task</p>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0">Create Task</Button>
        </div>
      ) : (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
          <div style={{ color: "#059669" }}><CheckCircle2 className="w-4 h-4" /></div>
          <p className="text-sm text-emerald-700 font-medium">No arrears — all payments up to date</p>
        </div>
      )}
      <SectionCard className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Current Tenancy</h4>
          <StatusChip status={t.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <FieldRow label="Property" value={t.property} />
          <FieldRow label="Unit" value={t.unit} />
          <FieldRow label="Start Date" value={t.start} />
          <FieldRow label="End Date" value={t.end} />
          <FieldRow label="Monthly Rent" value={<span className="text-lg font-bold text-slate-900">£{t.rent.toLocaleString("en-GB")}</span>} />
          <FieldRow label="Deposit" value={`£${t.deposit.toLocaleString("en-GB")}`} />
          <FieldRow label="Deposit Scheme" value={t.deposit_scheme} />
          <FieldRow label="Guarantor" value={t.guarantor ?? "None"} />
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Link href="/app/portfolio/tenancies/t1" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> Open Full Tenancy Record
          </Link>
        </div>
      </SectionCard>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Rent History — 6 Months</p>
        <div className="h-44 rounded-xl border border-slate-200 bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rentHistory}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => [`£${Number(v ?? 0).toLocaleString("en-GB")}`, "Amount"]} />
              <Area type="monotone" dataKey="expected" stroke="#E2E8F0" fill="#F8FAFC" strokeWidth={1} />
              <Area type="monotone" dataKey="received" stroke="#10B981" fill="#ECFDF5" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Landlord-specific tabs                                               */
/* ------------------------------------------------------------------ */
function LandlordOverviewTab({ contact }: { contact: ContactDetail }) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { label:"Properties",   value: contact.linked_properties,                colour:"text-slate-900" },
          { label:"Tenancies",    value: contact.active_tenancies,                  colour:"text-emerald-600" },
          { label:"Planning Sets",value: contact.planning_sets?.length ?? 0,        colour:"text-blue-600" },
          { label:"Offers",       value: contact.landlord_offers?.length ?? 0,      colour:"text-violet-600" },
        ].map(k => (
          <SectionCard key={k.label} className="p-4">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={cn("text-2xl font-bold", k.colour)}>{k.value}</p>
          </SectionCard>
        ))}
      </div>
      {(contact.properties?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Linked Properties</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {contact.properties?.map((prop, i) => (
              <SectionCard key={i} className="p-3 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{prop}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </SectionCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LandlordPropertiesTab({ contact }: { contact: ContactDetail }) {
  const props = contact.properties ?? []
  if (props.length === 0) return <EmptyState icon={Building2} message="No properties linked to this landlord yet." cta="Link Property" />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{props.length} properties</p>
        <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>Link Property</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {props.map((prop, i) => (
          <SectionCard key={i} className="p-4 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{prop}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="success" size="sm" dot>Active</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">1 tenant</span>
              <Link href="/app/portfolio/properties/p1" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  )
}

function PlanningSetTab({ contact }: { contact: ContactDetail }) {
  const sets = contact.planning_sets ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{sets.length} planning sets</p>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>Create Planning Set</Button>
      </div>
      {sets.length === 0 ? (
        <EmptyState icon={TrendingUp} message="No planning sets created for this landlord yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Name","Status","Created",""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sets.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3"><StatusChip status={s.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.created}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/app/planning" className="text-xs text-blue-600 hover:underline">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LandlordOffersTab({ contact }: { contact: ContactDetail }) {
  const offers = contact.landlord_offers ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{offers.length} offers</p>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>Create Offer</Button>
      </div>
      {offers.length === 0 ? (
        <EmptyState icon={FileText} message="No landlord offers created yet." />
      ) : (
        <div className="space-y-3">
          {offers.map((o, i) => (
            <SectionCard key={i} className="p-4 flex items-center gap-4 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-sky-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{o.ref} — {o.property}</p>
                <p className="text-xs text-slate-500 mt-0.5">£{o.amount.toLocaleString("en-GB")}/mo</p>
              </div>
              <StatusChip status={o.status} />
              <button className="text-xs text-blue-600 hover:underline">View</button>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Supplier-specific tabs                                               */
/* ------------------------------------------------------------------ */
function SupplierOverviewTab({ contact }: { contact: ContactDetail }) {
  const sup = contact.supplier
  const jobs = contact.jobs ?? []
  return (
    <div className="space-y-5">
      {sup && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Jobs Completed",     value: sup.jobs_completed,         colour:"text-emerald-600" },
            { label:"Avg Response",        value: `${sup.average_response_time}h`,colour:"text-blue-600" },
            { label:"Invoices Paid",       value: (contact.invoices ?? []).filter(i => i.status === "paid").length, colour:"text-slate-900" },
            { label:"Internal Rating",     value: `${sup.internal_rating}/5`,  colour:"text-amber-600" },
          ].map(k => (
            <SectionCard key={k.label} className="p-4">
              <p className="text-xs text-slate-500 mb-1">{k.label}</p>
              <p className={cn("text-2xl font-bold", k.colour)}>{k.value}</p>
            </SectionCard>
          ))}
        </div>
      )}
      {sup && (
        <div className={cn("rounded-xl border p-3 flex items-center gap-3",
          sup.compliance_status === "valid" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
        )}>
          <div style={{ color: sup.compliance_status === "valid" ? "#059669" : "#dc2626" }}>
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className={cn("text-sm font-medium", sup.compliance_status === "valid" ? "text-emerald-700" : "text-red-700")}>
              Insurance {sup.compliance_status === "valid" ? "valid" : "expired"} — expires {sup.insurance_expiry}
            </p>
          </div>
          <Badge variant={sup.compliance_status === "valid" ? "success" : "danger"} size="sm" dot>{sup.compliance_status}</Badge>
        </div>
      )}
      {jobs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Recent Work</p>
          <div className="space-y-2">
            {jobs.slice(0, 3).map((job, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
                <div className={cn("w-2 h-2 rounded-full shrink-0", job.status === "completed" ? "bg-emerald-500" : "bg-amber-500")} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-400">{job.property} · {job.date}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">£{job.cost}</span>
                <StatusChip status={job.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SupplierProfileTab({ contact }: { contact: ContactDetail }) {
  const sup = contact.supplier
  const serviceCategories = contact.service_categories ?? []
  if (!sup && serviceCategories.length === 0) {
    return <EmptyState icon={Settings} message="No supplier profile data." />
  }
  return (
    <div className="space-y-6">
      <SectionCard className="p-4 space-y-4">
        <h4 className="text-sm font-semibold text-slate-900">Service Categories</h4>
        {serviceCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {serviceCategories.map(cat => (
              <span key={cat} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{cat}</span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No service categories recorded for this supplier.</p>
        )}
      </SectionCard>
      {sup && (
      <>
      <SectionCard className="p-4 space-y-4">
        <h4 className="text-sm font-semibold text-slate-900">Coverage Postcodes</h4>
        <div className="flex flex-wrap gap-2">
          {sup.coverage_postcodes.map(pc => (
            <span key={pc} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
              <MapPin className="w-3 h-3" /> {pc}
            </span>
          ))}
        </div>
      </SectionCard>
      <div className="grid sm:grid-cols-2 gap-4">
        <SectionCard className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">Rates</h4>
          <FieldRow label="Hourly Rate" value={`£${sup.hourly_rate}/hr`} />
          <FieldRow label="Callout Fee" value={`£${sup.callout_fee}`} />
        </SectionCard>
        <SectionCard className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">Flags</h4>
          {[
            { label:"Preferred Supplier", val: sup.preferred_supplier },
            { label:"Emergency Available", val: sup.emergency_available },
            { label:"Backup Supplier", val: sup.backup_supplier },
          ].map(f => (
            <div key={f.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{f.label}</span>
              <Badge variant={f.val ? "success" : "default"} size="sm" dot>{f.val ? "Yes" : "No"}</Badge>
            </div>
          ))}
        </SectionCard>
      </div>
      <SectionCard className="p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Compliance</h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow label="Insurance Expiry" value={sup.insurance_expiry} />
          <FieldRow label="Status" value={<StatusChip status={sup.compliance_status} />} />
        </div>
      </SectionCard>
      <SectionCard className="p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Internal Rating</h4>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{ color: n <= sup.internal_rating ? "#F59E0B" : "#E2E8F0" }}>
              <Star className="w-5 h-5 fill-current" />
            </div>
          ))}
          <span className="text-sm text-slate-600 ml-2">{sup.internal_rating}/5</span>
        </div>
      </SectionCard>
      </>
      )}
    </div>
  )
}

function WorkHistoryTab({ contact }: { contact: ContactDetail }) {
  const jobs = contact.jobs ?? []
  const totalCost = jobs.reduce((s, j) => s + j.cost, 0)
  if (jobs.length === 0) return <EmptyState icon={Briefcase} message="No jobs linked to this supplier yet." cta="Create Job" />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{jobs.length} jobs · Total spend: <span className="font-semibold text-slate-900">£{totalCost.toLocaleString("en-GB")}</span></p>
        </div>
        <Link href="/app/work/jobs/new">
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>Create Job</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Job","Property","Date","Cost","Status",""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{job.title}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{job.property}</td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{job.date}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">£{job.cost}</td>
                <td className="px-4 py-3"><StatusChip status={job.status} /></td>
                <td className="px-4 py-3 text-right"><button className="text-xs text-blue-600 hover:underline">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PortalAccessTab({ contact }: { contact: ContactDetail }) {
  const linkHistory = [
    { created:"2026-03-01", expires:"2026-04-01", status:"expired", opened:true },
    { created:"2026-01-10", expires:"2026-02-10", status:"expired", opened:false },
  ]
  return (
    <div className="space-y-5">
      <SectionCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-900">Current Portal Status</h4>
          <StatusChip status={contact.portal_status ?? "not_created"} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <FieldRow label="Portal Status" value={contact.portal_status ?? "Not created"} />
          <FieldRow label="Last Accessed" value="2026-03-05" />
          <FieldRow label="Link Created" value="2026-03-01" />
          <FieldRow label="Link Expires" value="2026-04-01" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>Create New Link</Button>
          <Button variant="outline" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />}>Copy Link</Button>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Extend</Button>
          <Button variant="destructive-soft" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Revoke</Button>
        </div>
      </SectionCard>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Link History</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Created","Expires","Status","Opened"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linkHistory.map((l, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-500 text-xs">{l.created}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{l.expires}</td>
                  <td className="px-4 py-3"><StatusChip status={l.status} /></td>
                  <td className="px-4 py-3">
                    {l.opened ? <Badge variant="success" size="sm" dot>Yes</Badge> : <Badge variant="default" size="sm">No</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Applicant-specific tabs                                             */
/* ------------------------------------------------------------------ */
function ApplicantOverviewTab({ contact }: { contact: ContactDetail }) {
  const eq = contact.enquiry
  return (
    <div className="space-y-5">
      {contact.next_follow_up && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <div style={{ color: "#d97706" }}><Clock className="w-5 h-5 mt-0.5 shrink-0" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Follow-up due {contact.next_follow_up}</p>
            <p className="text-sm text-amber-700">Book a viewing or send a follow-up message</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0">Create Task</Button>
        </div>
      )}
      {eq && (
        <div className="grid sm:grid-cols-3 gap-3">
          <SectionCard className="p-4">
            <p className="text-xs text-slate-500 mb-1">Budget Range</p>
            <p className="text-lg font-bold text-slate-900">£{eq.budget_min}–£{eq.budget_max}/mo</p>
          </SectionCard>
          <SectionCard className="p-4">
            <p className="text-xs text-slate-500 mb-1">Move-in Date</p>
            <p className="text-lg font-bold text-slate-900">{eq.move_date}</p>
          </SectionCard>
          <SectionCard className="p-4">
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <div className="mt-1"><StatusChip status={eq.status} /></div>
          </SectionCard>
        </div>
      )}
      {eq && (
        <SectionCard className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">Enquiry Summary</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldRow label="Source" value={eq.source} />
            <FieldRow label="Preferred Area" value={eq.preferred_area} />
            <FieldRow label="Property Type" value={eq.preferred_type} />
            <FieldRow label="Preferred Move Date" value={eq.move_date} />
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function EnquiryTab({ contact }: { contact: ContactDetail }) {
  const eq = contact.enquiry
  if (!eq) return <EmptyState icon={User} message="No enquiry details recorded." />
  return (
    <div className="space-y-5">
      <SectionCard className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Enquiry Details</h4>
          <StatusChip status={eq.status} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow label="Source" value={eq.source} />
          <FieldRow label="Budget" value={`£${eq.budget_min}–£${eq.budget_max}/month`} />
          <FieldRow label="Preferred Move Date" value={eq.move_date} />
          <FieldRow label="Preferred Area" value={eq.preferred_area} />
          <FieldRow label="Property Type" value={eq.preferred_type} />
          <FieldRow label="Status" value={<StatusChip status={eq.status} />} />
        </div>
      </SectionCard>
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
        <div style={{ color: "#2563EB" }}><Zap className="w-5 h-5 shrink-0" /></div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Ready to convert?</p>
          <p className="text-sm text-blue-700">Convert this applicant to a tenant and create a tenancy record</p>
        </div>
        <Button variant="primary" size="sm" className="shrink-0">Convert to Tenant</Button>
      </div>
    </div>
  )
}

function PropertyInterestTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">0 properties of interest</p>
        <Button variant="outline" size="sm" leftIcon={<Link2 className="w-3.5 h-3.5" />}>Link Property</Button>
      </div>
      <EmptyState icon={Home} message="No properties of interest linked yet. Link a property to track this applicant's interest." cta="Link Property" />
    </div>
  )
}

function ViewingsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">0 viewings</p>
        <Button variant="outline" size="sm" leftIcon={<CalendarDays className="w-3.5 h-3.5" />}>Book Viewing</Button>
      </div>
      <EmptyState icon={CalendarDays} message="No viewings scheduled or completed yet." cta="Book Viewing Task" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* KPI Strip                                                            */
/* ------------------------------------------------------------------ */
function KpiStrip({ contact }: { contact: ContactDetail }) {
  type KpiItem = { label: string; value: string; colour?: string }
  let kpis: KpiItem[] = []

  if (contact.contact_type === "tenant") {
    kpis = [
      { label:"Monthly Rent",  value: contact.tenancy ? `£${contact.tenancy.rent.toLocaleString("en-GB")}` : "—" },
      { label:"Arrears",       value: contact.arrears > 0 ? `£${contact.arrears.toLocaleString("en-GB")}` : "None", colour: contact.arrears > 0 ? "text-red-600" : "text-emerald-600" },
      { label:"Tenancy Ends",  value: contact.tenancy?.end ?? "Ongoing" },
      { label:"Last Contacted",value: contact.last_contacted ?? "—" },
    ]
  } else if (contact.contact_type === "landlord") {
    kpis = [
      { label:"Properties",    value: String(contact.linked_properties) },
      { label:"Planning Sets", value: String(contact.planning_sets?.length ?? 0) },
      { label:"Offers",        value: String(contact.landlord_offers?.length ?? 0) },
      { label:"Last Contacted",value: contact.last_contacted ?? "—" },
    ]
  } else if (contact.contact_type === "supplier") {
    const sup = contact.supplier
    kpis = [
      { label:"Jobs Done",     value: String(sup?.jobs_completed ?? 0) },
      { label:"Open Jobs",     value: String((contact.jobs ?? []).filter(j => j.status !== "completed").length) },
      { label:"Avg Response",  value: sup ? `${sup.average_response_time}h` : "—" },
      { label:"Rating",        value: sup ? `${sup.internal_rating}/5` : "—" },
    ]
  } else if (contact.contact_type === "applicant") {
    const eq = contact.enquiry
    kpis = [
      { label:"Budget",        value: eq ? `£${eq.budget_min}–£${eq.budget_max}` : "—" },
      { label:"Move Date",     value: eq?.move_date ?? "—" },
      { label:"Viewings",      value: "0" },
      { label:"Follow-up",     value: contact.next_follow_up ?? "Not set", colour: contact.next_follow_up ? "text-amber-600" : undefined },
    ]
  } else {
    kpis = [
      { label:"Properties",    value: String(contact.linked_properties) },
      { label:"Tenancies",     value: String(contact.active_tenancies) },
      { label:"Last Contacted",value: contact.last_contacted ?? "—" },
      { label:"Next Follow-up",value: contact.next_follow_up ?? "—" },
    ]
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500 mb-0.5">{k.label}</p>
          <p className={cn("text-base font-bold text-slate-900 truncate", k.colour)}>{k.value}</p>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab definitions                                                      */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Primary actions by type                                             */
/* ------------------------------------------------------------------ */
function PrimaryActions({ contact, onToast, onArchive, onDelete, editable }: {
  contact: ContactDetail
  onToast: (msg: string) => void
  onArchive: () => Promise<void>
  onDelete: () => Promise<void>
  editable: boolean
}) {
  const router = useRouter()
  const type = contact.contact_type

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Link href={`/app/contacts/${contact.id}?tab=messages`}>
        <Button variant="primary" size="sm" leftIcon={<MessageSquare className="w-3.5 h-3.5" />}>Message</Button>
      </Link>
      {type === "tenant" && <>
        <Button variant="outline" size="sm" leftIcon={<Home className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/portfolio/tenancies/new?contact=${contact.id}`)}>Open Tenancy</Button>
        <Button variant="outline" size="sm" leftIcon={<ListChecks className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/work/tasks/new?contact=${contact.id}`)}>Create Task</Button>
        <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/contacts/${contact.id}?tab=documents`)}>Upload Document</Button>
      </>}
      {type === "landlord" && <>
        <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/planning/landlord-offers/new?contact=${contact.id}`)}>Create Offer</Button>
        <Button variant="outline" size="sm" leftIcon={<Link2 className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/portfolio/properties?link_contact=${contact.id}`)}>Link Property</Button>
        <Button variant="outline" size="sm" leftIcon={<ListChecks className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/work/tasks/new?contact=${contact.id}`)}>Create Task</Button>
      </>}
      {type === "supplier" && <>
        <Button variant="outline" size="sm" leftIcon={<Briefcase className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/work/jobs/new?contact=${contact.id}`)}>Create Job</Button>
        <Button variant="outline" size="sm" leftIcon={<Package className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/contacts/${contact.id}?tab=documents`)}>Request Docs</Button>
        <Button variant="outline" size="sm" leftIcon={<Globe className="w-3.5 h-3.5" />} onClick={() => onToast("Portal invite requires email configuration")}>Portal Link</Button>
      </>}
      {type === "applicant" && <>
        <Button variant="outline" size="sm" leftIcon={<CalendarDays className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/calendar/events/new?contact=${contact.id}`)}>Book Viewing</Button>
        <Button variant="outline" size="sm" leftIcon={<Zap className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/portfolio/tenancies/new?contact=${contact.id}`)}>Convert to Tenant</Button>
        <Button variant="outline" size="sm" leftIcon={<ListChecks className="w-3.5 h-3.5" />} onClick={() => router.push(`/app/work/tasks/new?contact=${contact.id}`)}>Create Follow-up</Button>
      </>}
      <Link href={`/app/contacts/${contact.id}/edit`}>
        <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>Edit</Button>
      </Link>
      <ConfirmDialog
        title="Delete contact?"
        description={`This permanently deletes ${contact.full_name} and cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={onDelete}
      >
        {(openDelete) => (
          <ActionMenu
            items={[
              { label: "View Profile", icon: Eye, onClick: () => router.push(`/app/contacts/${contact.id}`) },
              { label: "Edit Contact", icon: Edit, onClick: () => router.push(`/app/contacts/${contact.id}/edit`) },
              { label: "Send Message", icon: MessageSquare, onClick: () => router.push(`/app/contacts/${contact.id}?tab=messages`) },
              {
                label: contact.status === "archived" ? "Restore Contact" : "Archive Contact",
                icon: Package,
                disabled: !editable,
                onClick: () => { onArchive().then(() => onToast(contact.status === "archived" ? "Contact restored" : "Contact archived")) },
              },
              { label: "Export Data", icon: Download, onClick: () => onToast("Export queued — you'll receive a download link by email") },
              { label: "Delete Contact", icon: Trash2, variant: "danger", disabled: !editable, onClick: openDelete },
            ]}
          />
        )}
      </ConfirmDialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Right Rail                                                           */
/* ------------------------------------------------------------------ */
function RightRail({ contact }: { contact: ContactDetail }) {
  const nba = getNextBestAction(contact)

  const quickLinks: { label: string; href: string; icon: React.ElementType }[] = contact.contact_type === "tenant"
    ? [
        { label:"Open Tenancy",   href:"/app/portfolio/tenancies/t1", icon:Home },
        { label:"View Invoices",  href:"#",                            icon:Wallet },
        { label:"View Tasks",     href:"#",                            icon:ListChecks },
      ]
    : contact.contact_type === "landlord"
    ? [
        { label:"View Properties",href:"/app/portfolio/properties",    icon:Building2 },
        { label:"Planning Sets",  href:"/app/planning",                icon:TrendingUp },
        { label:"View Offers",    href:"#",                            icon:FileText },
      ]
    : contact.contact_type === "supplier"
    ? [
        { label:"Create Job",     href:"/app/work/jobs/new",           icon:Briefcase },
        { label:"View Portal",    href:"#",                            icon:Globe },
        { label:"Job History",    href:"#",                            icon:Activity },
      ]
    : [
        { label:"Book Viewing",   href:"#",                            icon:CalendarDays },
        { label:"Convert to Tenant",href:"#",                          icon:Zap },
        { label:"View Messages",  href:"#",                            icon:MessageCircle },
      ]

  const relatedContacts = contact.contact_type === "tenant"
    ? [{ name:"David Thornton", role:"Landlord" }, { name:"Michael Mitchell", role:"Guarantor" }]
    : contact.contact_type === "landlord"
    ? [{ name:"Sarah Mitchell", role:"Tenant" }, { name:"James Okafor", role:"Tenant" }]
    : [{ name:"David Thornton", role:"Landlord" }, { name:"Sarah Mitchell", role:"Tenant" }]

  return (
    <div className="space-y-4">
      {/* Next Best Action */}
      <SectionCard className="p-4 border-l-4 border-l-blue-500">
        <div className="flex items-start gap-2 mb-3">
          <div style={{ color: "#2563EB" }}><Zap className="w-4 h-4 mt-0.5" /></div>
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Next Best Action</p>
        </div>
        <p className="text-sm text-slate-700 mb-3">{nba.label}</p>
        <Link href={nba.href}>
          <Button variant="soft" size="sm" className="w-full justify-center">{nba.cta}</Button>
        </Link>
      </SectionCard>

      {/* Quick Links */}
      <SectionCard className="p-4">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Quick Links</p>
        <div className="space-y-1">
          {quickLinks.map(l => {
            const Icon = l.icon
            return (
              <Link key={l.label} href={l.href}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 hover:text-blue-600 transition-colors group">
                <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                {l.label}
              </Link>
            )
          })}
        </div>
      </SectionCard>

      {/* Related Contacts */}
      <SectionCard className="p-4">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Related Contacts</p>
        <div className="space-y-2">
          {relatedContacts.map(rc => (
            <div key={rc.name} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarBg(rc.name))}>
                {initials(rc.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{rc.name}</p>
                <p className="text-xs text-slate-400 capitalize">{rc.role}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-300" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */
export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const { data: workspace } = useWorkspace()
  const { data: liveContact, isLoading, isError } = useContact(workspace?.id, id)
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") ?? "overview")
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Keep the active tab in sync with the ?tab= deep link (e.g. Message buttons).
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
        <Link href="/app/contacts" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
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
    arrears: 0,
    linked_properties: 0,
    active_tenancies: 0,
    last_contacted: null,
    next_follow_up: null,
    health: "healthy",
    portal_status: null,
    notes: liveContact.notes ?? null,
    service_categories: deriveSupplierCategories({
      category: liveContact.category,
      subcategory: liveContact.subcategory,
      tags: liveContact.tags,
    }),
    activity: [],
  }

  // Live contacts persist; seed/demo rows (is_demo) are read-only inline.
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
    router.push("/app/contacts")
  }

  const tabs = getTabsForType(contact.contact_type)
  const health = HEALTH_CONFIG[contact.health]

  function renderTabContent() {
    const type = contact.contact_type
    switch (activeTab) {
      case "overview":
        if (type === "tenant")   return <TenantOverviewTab contact={contact} />
        if (type === "landlord") return <LandlordOverviewTab contact={contact} />
        if (type === "supplier") return <SupplierOverviewTab contact={contact} />
        if (type === "applicant")return <ApplicantOverviewTab contact={contact} />
        return <ProfileTab contact={contact} />
      case "profile":
        if (type === "supplier") return <SupplierProfileTab contact={contact} />
        return <ProfileTab contact={contact} />
      case "tenancy":    return <TenancyTab contact={contact} />
      case "payments":   return <InvoiceTable invoices={contact.invoices ?? []} emptyLabel="No payment records yet." />
      case "properties": return <LandlordPropertiesTab contact={contact} />
      case "planning":   return <PlanningSetTab contact={contact} />
      case "offers":     return <LandlordOffersTab contact={contact} />
      case "work":       return <WorkHistoryTab contact={contact} />
      case "invoices":   return <InvoiceTable invoices={contact.invoices ?? []} />
      case "portal":     return <PortalAccessTab contact={contact} />
      case "enquiry":    return <EnquiryTab contact={contact} />
      case "interest":   return <PropertyInterestTab />
      case "viewings":   return <ViewingsTab />
      case "documents":  return <DocumentsTab contactId={contact.id} workspaceId={wsId} />
      case "messages":   return <MessagesTab contactId={contact.id} workspaceId={wsId} />
      case "notes":      return <NotesTab contact={contact} />
      case "tasks":      return <TasksTab />
      case "activity":   return <ActivityTimeline items={contact.activity ?? []} />
      case "audit":      return <AuditTab />
      default:           return <EmptyState icon={Activity} message="Nothing here yet." />
    }
  }

  return (
    <ContactSaveContext.Provider value={{ save: saveField, editable }}>
    <div className="space-y-0">
      {/* Back + breadcrumb */}
      <div className="mb-4">
        <Link href="/app/contacts" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
        </Link>
        <p className="text-xs text-slate-400">
          <Link href="/app/contacts" className="hover:text-slate-600">Contacts</Link>
          <span className="mx-1">/</span>
          <span className="text-slate-600 font-medium">{contact.full_name}</span>
        </p>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-4">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0", avatarBg(contact.full_name))}>
            {initials(contact.full_name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{contact.full_name}</h1>
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", TYPE_BADGE[contact.contact_type])}>
                {contact.contact_type}
              </span>
              <Badge variant={contact.status === "active" ? "success" : contact.status === "inactive" ? "default" : "danger"} dot>
                {contact.status}
              </Badge>
              {/* Health indicator */}
              <div className="flex items-center gap-1.5 ml-1">
                <span className={cn("w-2 h-2 rounded-full", health.dot)} />
                <span className={cn("text-xs font-medium", health.text)}>{health.label}</span>
              </div>
            </div>
            {contact.company_name && (
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {contact.company_name}
              </p>
            )}
            {contact.contact_type === "supplier" && (contact.service_categories?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Wrench className="w-3 h-3 text-slate-400" />
                {contact.service_categories!.map(cat => (
                  <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{cat}</span>
                ))}
              </div>
            )}
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {contact.city}{contact.postcode ? `, ${contact.postcode}` : ""}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-slate-600">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                <Mail className="w-3.5 h-3.5" /> {contact.email}
              </a>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> {contact.phone}
                </a>
              )}
            </div>
            {contact.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Tag className="w-3 h-3 text-slate-400" />
                {contact.tags.map(t => (
                  <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs capitalize">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0">
            <PrimaryActions contact={contact} onToast={showToast} onArchive={handleArchive} onDelete={handleDelete} editable={editable} />
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="mb-4">
        <KpiStrip contact={contact} />
      </div>

      {/* Main content + right rail */}
      <div className="flex gap-6 items-start">
        {/* Left: tabs + content */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="overflow-x-auto -mx-1 px-1 mb-0">
            <div className="flex items-center gap-1 min-w-max border-b border-slate-200">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px",
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
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

          {/* Tab content */}
          <div className="rounded-b-2xl rounded-tr-2xl border border-t-0 border-slate-200 bg-white p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Right rail — desktop only */}
        <div className="hidden xl:block w-[280px] shrink-0 sticky top-6">
          <RightRail contact={contact} />
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toastMsg}
          <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-400 hover:text-white transition-colors">
            <span aria-label="dismiss">×</span>
          </button>
        </div>
      )}
    </div>
    </ContactSaveContext.Provider>
  )
}
