"use client"

import React, { useState, useEffect, KeyboardEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Trash2, Archive, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { MobileTopBar } from "@/components/mobile"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useContact, useUpdateContact } from "@/hooks/useContacts"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription } from "@/components/ui/Toast"
import type { ContactType, ContactStatus } from "@/types/database"

import { ContactPersonalSection } from "@/components/contacts/contact-edit/ContactPersonalSection"
import { ContactAddressSection } from "@/components/contacts/contact-edit/ContactAddressSection"
import { ContactTagsSection } from "@/components/contacts/contact-edit/ContactTagsSection"
import { ContactRelationshipsSection } from "@/components/contacts/contact-edit/ContactRelationshipsSection"
import { SupplierDetailsSection, ApplicantDetailsSection } from "@/components/contacts/contact-edit/ContactCustomFieldsSection"
import { TextInput } from "@/components/contacts/contact-edit/shared"

interface EditFormValues {
  contact_type: ContactType; entity_type: "person" | "organisation"; full_name: string; company_name: string; status: ContactStatus
  email: string; phone: string; secondary_phone: string; website: string; preferred_contact_method: string
  address_line1: string; address_line2: string; city: string; postcode: string; country: string; notes: string
  emergency_available: boolean; preferred_supplier: boolean; hourly_rate: string; callout_fee: string; insurance_expiry: string
  enquiry_source: string; budget_min: string; budget_max: string; desired_move_date: string; preferred_area: string; applicant_status: string
}

function DeleteConfirmDialog({ contactName, onCancel, onConfirm, loading }: { contactName: string; onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  const [typed, setTyped] = useState("")
  const matches = typed.trim().toLowerCase() === contactName.trim().toLowerCase()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="delete-contact-title" className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5 text-red-600" /></div>
          <div>
            <h3 id="delete-contact-title" className="text-sm font-semibold text-slate-900">Delete Contact</h3>
            <p className="text-sm text-slate-600 mt-1">This action is permanent and cannot be undone.</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm text-slate-600">Type <span className="font-semibold text-slate-900">{contactName}</span> to confirm.</p>
          <TextInput value={typed} onChange={e => setTyped(e.target.value)} placeholder={contactName} autoFocus />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" size="sm" disabled={!matches || loading} loading={loading} onClick={onConfirm}>Delete permanently</Button>
        </div>
      </div>
    </div>
  )
}

export default function ContactEditPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: workspace } = useWorkspace()
  const { data: liveContact, isLoading } = useContact(workspace?.id, id)
  const updateMutation = useUpdateContact()

  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success")
  const [toastMsg, setToastMsg] = useState("")
  const [dangerOpen, setDangerOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingContact, setDeletingContact] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(false)
  const [showWebsite, setShowWebsite] = useState(false)

  const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm<EditFormValues>({
    defaultValues: {
      contact_type: "supplier", entity_type: "person", full_name: "", company_name: "", status: "active",
      email: "", phone: "", secondary_phone: "", website: "", preferred_contact_method: "Email",
      address_line1: "", address_line2: "", city: "", postcode: "", country: "United Kingdom", notes: "",
      emergency_available: false, preferred_supplier: false, hourly_rate: "", callout_fee: "", insurance_expiry: "",
      enquiry_source: "", budget_min: "", budget_max: "", desired_move_date: "", preferred_area: "", applicant_status: "new_enquiry",
    },
  })

  useEffect(() => {
    if (!liveContact) return
    const raw = liveContact as unknown as Record<string, unknown>
    reset({
      contact_type: (raw.contact_type as ContactType) ?? "other",
      entity_type: ((raw.entity_type as "person" | "organisation") ?? (raw.company_name ? "organisation" : "person")),
      full_name: (raw.full_name as string) ?? "",
      company_name: (raw.company_name as string) ?? "",
      status: (raw.status as ContactStatus) ?? "active",
      email: (raw.email as string) ?? "",
      phone: (raw.phone as string) ?? "",
      secondary_phone: (raw.secondary_phone as string) ?? "",
      website: (raw.website as string) ?? "",
      preferred_contact_method: (raw.preferred_contact_method as string) ?? "Email",
      address_line1: (raw.address_line1 as string) ?? "",
      address_line2: (raw.address_line2 as string) ?? "",
      city: (raw.city as string) ?? "",
      postcode: (raw.postcode as string) ?? "",
      country: (raw.country as string) ?? "United Kingdom",
      notes: (raw.notes as string) ?? "",
      emergency_available: (raw.emergency_available as boolean) ?? false,
      preferred_supplier: (raw.preferred_supplier as boolean) ?? false,
      hourly_rate: (raw.hourly_rate as string) ?? "",
      callout_fee: (raw.callout_fee as string) ?? "",
      insurance_expiry: (raw.insurance_expiry as string) ?? "",
      enquiry_source: (raw.enquiry_source as string) ?? "",
      budget_min: (raw.budget_min as string) ?? "",
      budget_max: (raw.budget_max as string) ?? "",
      desired_move_date: (raw.desired_move_date as string) ?? "",
      preferred_area: (raw.preferred_area as string) ?? "",
      applicant_status: (raw.applicant_status as string) ?? "new_enquiry",
    })
    setTags((raw.tags as string[]) ?? [])
    setSelectedCategories((raw.service_categories as string[]) ?? [])
    if (raw.secondary_phone) setShowSecondaryPhone(true)
    if (raw.website) setShowWebsite(true)
  }, [liveContact, reset])

  const watchedType = watch("contact_type")
  const watchedEntity = watch("entity_type")
  const isSupplier = watchedType === "supplier"
  const isApplicant = watchedType === "applicant"
  const showOrgFields = watchedEntity === "organisation" || ["supplier","agent","local_authority","housing_association","legal","accountant","insurer","utility_provider","broadband","cleaning","maintenance","emergency_contractor","investor"].includes(watchedType)

  function addTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase()
      if (t && !tags.includes(t)) setTags(prev => [...prev, t])
      setTagInput("")
    }
  }

  async function onSubmit(data: EditFormValues) {
    if (!workspace) return
    try {
      await updateMutation.mutateAsync({ id, workspaceId: workspace.id, payload: { contact_type: data.contact_type, full_name: data.full_name, company_name: data.company_name || null, status: data.status, email: data.email || null, phone: data.phone || null, address_line1: data.address_line1 || null, city: data.city || null, postcode: data.postcode || null, notes: data.notes || null, tags: tags.length > 0 ? tags : null } })
      setToastVariant("success"); setToastMsg("Contact saved successfully."); setToastOpen(true)
      setTimeout(() => router.push(`/app/contacts/${id}`), 1200)
    } catch {
      setToastVariant("error"); setToastMsg("Failed to save contact. Please try again."); setToastOpen(true)
    }
  }

  async function handleArchive() {
    if (!workspace) return
    try {
      await updateMutation.mutateAsync({ id, workspaceId: workspace.id, payload: { status: "archived" } })
      setToastVariant("success"); setToastMsg("Contact archived."); setToastOpen(true)
      setTimeout(() => router.push(`/app/contacts/${id}`), 1200)
    } catch {
      setToastVariant("error"); setToastMsg("Failed to archive contact."); setToastOpen(true)
    }
  }

  async function handleDelete() {
    setDeletingContact(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      router.push("/app/contacts")
    } finally {
      setDeletingContact(false); setShowDeleteDialog(false)
    }
  }

  const isSaving = updateMutation.isPending
  const displayName = ((liveContact as unknown as Record<string, unknown>)?.full_name as string) ?? "Contact"

  if (isLoading) {
    return (
      <div className="space-y-0">
        <div className="animate-pulse space-y-4 max-w-3xl">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!liveContact) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-slate-700 font-semibold text-lg">Contact not found</p>
        <Link href="/app/contacts" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
        </Link>
      </div>
    )
  }

  const reg = register as unknown as import("react-hook-form").UseFormRegister<Record<string, unknown>>
  const ctrl = control as unknown as import("react-hook-form").Control<Record<string, unknown>>
  const wch = watch as unknown as import("react-hook-form").UseFormWatch<Record<string, unknown>>

  return (
    <ToastProvider swipeDirection="right">
      <div className="space-y-0">
        <MobileTopBar title="Edit Contact" subtitle={displayName} showBack backHref={`/app/contacts/${id}`} />
        <div className="hidden md:block mb-6">
          <Link href={`/app/contacts/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Contact
          </Link>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Edit Contact</h1>
          <p className="text-sm text-slate-500 mt-1">{displayName}</p>
        </div>
        {!workspace && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">No workspace connected. You can view and edit the form but changes cannot be saved.</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <ContactPersonalSection register={reg} control={ctrl} watch={wch} errors={errors as import("react-hook-form").FieldErrors} showOrgFields={showOrgFields} />
          <ContactRelationshipsSection register={reg} control={ctrl} showSecondaryPhone={showSecondaryPhone} setShowSecondaryPhone={setShowSecondaryPhone} showWebsite={showWebsite} setShowWebsite={setShowWebsite} isSupplier={isSupplier} isOrg={watchedEntity === "organisation"} />
          <ContactAddressSection register={reg} />
          <ContactTagsSection register={reg} tags={tags} tagInput={tagInput} setTagInput={setTagInput} addTag={addTag} removeTag={(tag) => setTags(prev => prev.filter(t => t !== tag))} />
          {isSupplier && <SupplierDetailsSection register={reg} control={ctrl} watch={wch} selectedCategories={selectedCategories} toggleCategory={(cat) => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} />}
          {isApplicant && <ApplicantDetailsSection register={reg} watch={wch} />}

          <div className="sticky bottom-0 z-20 -mx-4 px-4 py-4 bg-white/90 backdrop-blur border-t border-slate-200 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={() => router.push(`/app/contacts/${id}`)}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" loading={isSaving} disabled={!workspace} leftIcon={!isSaving ? <Save className="w-4 h-4" /> : undefined}>
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <button type="button" onClick={() => setDangerOpen(v => !v)} aria-expanded={dangerOpen} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors">
            <span>Dangerous Actions</span>
            {dangerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {dangerOpen && (
            <div className="mt-3 rounded-xl border border-red-200 bg-white p-5 space-y-4">
              <p className="text-xs text-slate-500">These actions cannot easily be undone. Proceed with caution.</p>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="warning" size="sm" leftIcon={<Archive className="w-4 h-4" />} onClick={handleArchive} loading={isSaving}>Archive Contact</Button>
                <Button type="button" variant="destructive" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteDialog(true)}>Delete Contact</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteDialog && <DeleteConfirmDialog contactName={displayName} onCancel={() => setShowDeleteDialog(false)} onConfirm={handleDelete} loading={deletingContact} />}

      <Toast open={toastOpen} onOpenChange={setToastOpen} variant={toastVariant} duration={4000}>
        <ToastTitle>{toastVariant === "success" ? "Saved" : "Error"}</ToastTitle>
        <ToastDescription>{toastMsg}</ToastDescription>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  )
}
