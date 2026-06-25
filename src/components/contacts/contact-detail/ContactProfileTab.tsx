"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  Building2, ExternalLink, Plus, TrendingUp, FileText, Settings,
  MapPin, Star, Shield, StickyNote, ListChecks, Check,
  MessageCircle, MessageSquare, Zap, User, CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"
import LocationMap from "@/components/maps/LocationMap"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
  InlineEditField,
  InlineEditSelect,
  InlineEditTextarea,
} from "@/components/editing"
import { useContactMessages } from "@/hooks/useMessages"
import { useCreateTask, useCompleteTask } from "@/hooks/useTasks"
import { createClient } from "@/lib/supabase/client"
import type { ContactDetail } from "./types"
import {
  SectionCard, FieldRow, EmptyState, StatusChip,
  CONTACT_TYPE_OPTIONS, CONTACT_STATUS_OPTIONS,
  validateEmail, validatePhone,
} from "./shared"
import { useContactSave } from "./ContactSaveContext"

// ---- Profile (generic) ----
export function ProfileTab({ contact }: { contact: ContactDetail }) {
  const { save, editable } = useContactSave()
  const lockReason = editable ? undefined : "Demo records are read-only."
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Personal Details</h3>
        {editable && <span className="text-xs text-slate-400">Click any field to edit</span>}
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Full Name</p>
          <InlineEditField value={contact.full_name} type="text" label="full name" readOnly={!editable} readOnlyReason={lockReason} placeholder="—" displayClassName="text-sm text-slate-800" onSave={(v) => save("full_name", v)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</p>
          <InlineEditField value={contact.email} type="email" label="email" readOnly={!editable} readOnlyReason={lockReason} validate={validateEmail} placeholder="—" displayClassName="text-sm text-slate-800" onSave={(v) => save("email", v)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</p>
          <InlineEditField value={contact.phone} type="phone" label="phone" readOnly={!editable} readOnlyReason={lockReason} validate={validatePhone} placeholder="—" displayClassName="text-sm text-slate-800" onSave={(v) => save("phone", v)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Type</p>
          <InlineEditSelect value={contact.contact_type} label="contact type" options={CONTACT_TYPE_OPTIONS} readOnly={!editable} readOnlyReason={lockReason} placeholder="—" displayClassName="text-sm text-slate-800 capitalize" onSave={(v) => save("contact_type", v)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Company</p>
          <InlineEditField value={contact.company_name} type="text" label="company" readOnly={!editable} readOnlyReason={lockReason} placeholder="—" displayClassName="text-sm text-slate-800" onSave={(v) => save("company_name", v)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</p>
          <InlineEditSelect value={contact.status} label="status" options={CONTACT_STATUS_OPTIONS} readOnly={!editable} readOnlyReason={lockReason} placeholder="—" displayClassName="text-sm text-slate-800 capitalize" onSave={(v) => save("status", v)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">City</p>
          <InlineEditField value={contact.city} type="text" label="city" readOnly={!editable} readOnlyReason={lockReason} placeholder="—" displayClassName="text-sm text-slate-800" onSave={(v) => save("city", v)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Postcode</p>
          <InlineEditField value={contact.postcode} type="text" label="postcode" readOnly={!editable} readOnlyReason={lockReason} placeholder="—" displayClassName="text-sm text-slate-800" onSave={(v) => save("postcode", v)} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Address</p>
          <InlineEditField value={contact.address_line1} type="text" label="address" readOnly={!editable} readOnlyReason={lockReason} placeholder="—" displayClassName="text-sm text-slate-800" onSave={(v) => save("address_line1", v)} />
        </div>
      </div>
      {(contact.address_line1 || contact.city || contact.postcode) && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Location</p>
          <LocationMap
            markers={[{
              id: contact.id,
              address: [contact.address_line1, contact.city, contact.postcode].filter(Boolean).join(", ") || null,
              label: contact.company_name || "Contact",
              sublabel: [contact.city, contact.postcode].filter(Boolean).join(" ") || undefined,
            }]}
            height={200}
          />
        </div>
      )}
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
        <InlineEditTextarea value={contact.notes} label="notes" readOnly={!editable} readOnlyReason={lockReason} placeholder="Add an internal note about this contact…" displayClassName="text-sm text-slate-700 leading-relaxed" onSave={(v) => save("notes", v)} />
      </div>
    </div>
  )
}

// ---- Supplier Profile ----
export function SupplierProfileTab({ contact }: { contact: ContactDetail }) {
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
                { label:"Preferred Supplier",  val: sup.preferred_supplier },
                { label:"Emergency Available", val: sup.emergency_available },
                { label:"Backup Supplier",     val: sup.backup_supplier },
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
                <div key={n} style={{ color: n <= sup.internal_rating ? "var(--color-warning-500, #F59E0B)" : "var(--color-border, #E2E8F0)" }}>
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

// ---- Landlord Properties ----
export function LandlordPropertiesTab({ contact }: { contact: ContactDetail }) {
  const router = useRouter()
  const props = contact.properties ?? []
  const linkProperty = () => router.push(`/property-manager/portfolio/properties?link_contact=${contact.id}`)
  if (props.length === 0) return <EmptyState icon={Building2} message="No properties linked to this landlord yet." cta="Link Property" onCta={linkProperty} />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{props.length} properties</p>
        <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={linkProperty}>Link Property</Button>
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
            <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-100">
              <Link href="/property-manager/portfolio/properties" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View in Portfolio <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  )
}

// ---- Planning Sets ----
export function PlanningSetTab({ contact }: { contact: ContactDetail }) {
  const router = useRouter()
  const sets = contact.planning_sets ?? []
  const createSet = () => router.push(`/property-manager/planning/sets?contact=${contact.id}`)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{sets.length} planning sets</p>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={createSet}>Create Planning Set</Button>
      </div>
      {sets.length === 0 ? (
        <EmptyState icon={TrendingUp} message="No planning sets created for this landlord yet." cta="Create Planning Set" onCta={createSet} />
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
                    <Link href="/property-manager/planning" className="text-xs text-blue-600 hover:underline">Open</Link>
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

// ---- Landlord Offers ----
export function LandlordOffersTab({ contact }: { contact: ContactDetail }) {
  const router = useRouter()
  const offers = contact.landlord_offers ?? []
  const createOffer = () => router.push(`/property-manager/planning/landlord-offers?contact=${contact.id}`)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{offers.length} offers</p>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={createOffer}>Create Offer</Button>
      </div>
      {offers.length === 0 ? (
        <EmptyState icon={FileText} message="No landlord offers created yet." cta="Create Offer" onCta={createOffer} />
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
              <Link href="/property-manager/planning/landlord-offers" className="text-xs text-blue-600 hover:underline">View</Link>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Enquiry (Applicant) ----
export function EnquiryTab({ contact }: { contact: ContactDetail }) {
  const router = useRouter()
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
        <div style={{ color: "var(--brand)" }}><Zap className="w-5 h-5 shrink-0" /></div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Ready to convert?</p>
          <p className="text-sm text-blue-700">Convert this applicant to a tenant and create a tenancy record</p>
        </div>
        <Button variant="primary" size="sm" className="shrink-0" onClick={() => router.push(`/property-manager/portfolio/tenancies/new?contact=${contact.id}`)}>Convert to Tenant</Button>
      </div>
    </div>
  )
}

// ---- Property Interest (Applicant) ----
export function PropertyInterestTab({ contactId }: { contactId: string }) {
  const router = useRouter()
  const linkProperty = () => router.push(`/property-manager/portfolio/properties?link_contact=${contactId}`)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Properties of interest</p>
        <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={linkProperty}>Link Property</Button>
      </div>
      <EmptyState icon={Building2} message="No properties of interest linked yet. Link a property to track this applicant's interest." cta="Link Property" onCta={linkProperty} />
    </div>
  )
}

// ---- Viewings ----
export function ViewingsTab({ contactId }: { contactId: string }) {
  const router = useRouter()
  const bookViewing = () => router.push(`/property-manager/calendar/events/new?contact=${contactId}&type=viewing`)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Viewings</p>
        <Button variant="outline" size="sm" leftIcon={<CalendarDays className="w-3.5 h-3.5" />} onClick={bookViewing}>Book Viewing</Button>
      </div>
      <EmptyState icon={CalendarDays} message="No viewings scheduled or completed yet." cta="Book Viewing" onCta={bookViewing} />
    </div>
  )
}

// ---- Notes ----
export function NotesTab({ contact }: { contact: ContactDetail }) {
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
          <label htmlFor="contact-add-note" className="block text-xs font-medium text-slate-600 mb-2">Add note</label>
          <textarea
            id="contact-add-note"
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

// ---- Tasks (real, contact-scoped, persisted) ----
interface ContactTaskRow { id: string; title: string; status: string; due_at: string | null }

function useContactTasks(workspaceId: string | undefined, contactId: string) {
  return useQuery<ContactTaskRow[]>({
    queryKey: ["contact-tasks", workspaceId, contactId],
    enabled: !!workspaceId && !!contactId,
    staleTime: 15 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, due_at")
        .eq("workspace_id", workspaceId!)
        .eq("assignee_contact_id", contactId)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(100)
      if (error) {
        if (error.code === "42P01") return []
        throw error
      }
      return (data ?? []) as ContactTaskRow[]
    },
  })
}

export function TasksTab({ contactId, workspaceId }: { contactId: string; workspaceId: string | undefined }) {
  const { editable } = useContactSave()
  const router = useRouter()
  const { data: tasks = [], isLoading, refetch } = useContactTasks(workspaceId, contactId)
  const createTask = useCreateTask()
  const completeTask = useCompleteTask()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function saveTask() {
    if (!title.trim() || !workspaceId) return
    setError(null)
    try {
      await createTask.mutateAsync({
        workspace_id: workspaceId,
        title: title.trim(),
        status: "todo",
        priority: "medium",
        contact_id: contactId,
        ...(dueDate ? { due_date: dueDate } : {}),
      } as Parameters<typeof createTask.mutateAsync>[0])
      setTitle(""); setDueDate(""); setShowForm(false)
      await refetch()
    } catch {
      setError("Could not save the task. Please try again.")
    }
  }

  async function markDone(id: string) {
    if (!workspaceId) return
    try {
      await completeTask.mutateAsync({ id, workspaceId })
      await refetch()
    } catch { /* surfaced via optimistic rollback in hook */ }
  }

  const isDone = (s: string) => s === "done" || s === "completed" || s === "cancelled"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Tasks ({tasks.length})</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/property-manager/work/tasks/new?contact=${contactId}`)}>Full task form</Button>
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} disabled={!editable} onClick={() => setShowForm(!showForm)}>Add Task</Button>
        </div>
      </div>
      {showForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div>
            <label htmlFor="contact-task-title" className="block text-xs font-medium text-slate-700 mb-1">Task title *</label>
            <input id="contact-task-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Send rental statement"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" autoFocus />
          </div>
          <div>
            <label htmlFor="contact-task-due" className="block text-xs font-medium text-slate-700 mb-1">Due date</label>
            <input id="contact-task-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={createTask.isPending} onClick={saveTask} disabled={!title.trim()}>
              <Check className="w-3.5 h-3.5" /> Save Task
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setTitle(""); setDueDate(""); setError(null) }}>Cancel</Button>
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="py-10 text-center text-sm text-slate-400">Loading tasks…</div>
      ) : tasks.length === 0 && !showForm ? (
        <EmptyState icon={ListChecks} message="No tasks linked to this contact yet." />
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
              <button
                type="button"
                onClick={() => !isDone(task.status) && markDone(task.id)}
                disabled={!editable || isDone(task.status)}
                aria-label={isDone(task.status) ? "Task complete" : "Mark task complete"}
                className={cn("w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-colors",
                  isDone(task.status) ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-500")}
              >
                {isDone(task.status) && <Check className="w-3 h-3 text-white" />}
              </button>
              <Link href={`/property-manager/work/tasks/${task.id}`} className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isDone(task.status) ? "text-slate-400 line-through" : "text-slate-900")}>{task.title}</p>
                {task.due_at && <p className="text-xs text-slate-400 mt-0.5">Due {new Date(task.due_at).toLocaleDateString("en-GB")}</p>}
              </Link>
              <StatusChip status={task.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Messages ----
export function MessagesTab({ contactId, workspaceId }: { contactId: string; workspaceId: string | undefined }) {
  const { data: messages = [], isLoading } = useContactMessages(workspaceId, contactId, 5)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Recent Messages</h3>
        <Link href="/property-manager/messages">
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
          <Link href="/property-manager/messages">
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
          <Link href="/property-manager/messages" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline pt-1">
            View full conversation in Messages <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
