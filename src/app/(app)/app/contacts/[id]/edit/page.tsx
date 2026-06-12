"use client"

import React, { useState, useEffect, KeyboardEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import {
  ArrowLeft,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash2,
  Archive,
  Save,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useContact, useUpdateContact } from "@/hooks/useContacts"
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/Toast"
import type { ContactType, ContactStatus } from "@/types/database"

/* ------------------------------------------------------------------ */
/* Contact shape (mirrors live DB + extra fields for edit form)        */
/* ------------------------------------------------------------------ */

interface MockContact {
  id: string
  full_name: string
  email: string
  phone: string
  contact_type: ContactType
  status: ContactStatus
  company_name: string | null
  address_line1: string
  address_line2?: string
  city: string
  postcode: string
  country: string
  notes: string
  tags: string[]
  website?: string
  secondary_phone?: string
  preferred_contact_method?: string
  entity_type?: string
  // supplier extras
  service_categories?: string[]
  emergency_available?: boolean
  preferred_supplier?: boolean
  hourly_rate?: string
  callout_fee?: string
  insurance_expiry?: string
  // applicant extras
  enquiry_source?: string
  budget_min?: string
  budget_max?: string
  desired_move_date?: string
  preferred_area?: string
  applicant_status?: string
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string }[] = [
  { value: "landlord",            label: "Landlord" },
  { value: "tenant",              label: "Tenant" },
  { value: "post_tenant",         label: "Post-Tenant" },
  { value: "applicant",           label: "Applicant" },
  { value: "guarantor",           label: "Guarantor" },
  { value: "supplier",            label: "Supplier" },
  { value: "agent",               label: "Agent" },
  { value: "local_authority",     label: "Local Authority" },
  { value: "housing_association", label: "Housing Association" },
  { value: "legal",               label: "Legal" },
  { value: "accountant",          label: "Accountant" },
  { value: "insurer",             label: "Insurer" },
  { value: "utility_provider",    label: "Utility Provider" },
  { value: "broadband",           label: "Broadband" },
  { value: "cleaning",            label: "Cleaning" },
  { value: "maintenance",         label: "Maintenance" },
  { value: "emergency_contractor","label": "Emergency Contractor" },
  { value: "investor",            label: "Investor" },
  { value: "affiliate",           label: "Affiliate" },
  { value: "other",               label: "Other" },
]

const STATUS_OPTIONS: { value: ContactStatus; label: string; colour: string }[] = [
  { value: "active",   label: "Active",   colour: "bg-emerald-100 text-emerald-700" },
  { value: "inactive", label: "Inactive", colour: "bg-amber-100 text-amber-700" },
  { value: "archived", label: "Archived", colour: "bg-slate-100 text-slate-600" },
]

const PREFERRED_CONTACT_OPTIONS = ["Email", "Phone", "WhatsApp", "Post"]

const SUPPLIER_CATEGORIES = [
  "Plumbing", "Electrical", "Gas/Heating", "Cleaning", "Gardening",
  "Handyman", "Locksmith", "Pest Control", "Waste Removal",
  "Broadband/Telecoms", "Utilities", "Inventory Clerk", "Inspection",
  "Compliance", "Decorator", "Builder", "Emergency Repairs", "Other",
]

const ENQUIRY_SOURCE_OPTIONS = [
  "Website", "Rightmove", "Zoopla", "OpenRent", "Referral",
  "Phone", "Walk-in", "Social", "Other",
]

const APPLICANT_STATUS_OPTIONS: { value: string; label: string; colour: string }[] = [
  { value: "new_enquiry",         label: "New Enquiry",         colour: "bg-sky-100 text-sky-700" },
  { value: "viewing_needed",      label: "Viewing Needed",      colour: "bg-violet-100 text-violet-700" },
  { value: "viewing_booked",      label: "Viewing Booked",      colour: "bg-blue-100 text-blue-700" },
  { value: "application_pending", label: "Application Pending", colour: "bg-amber-100 text-amber-700" },
  { value: "converted",           label: "Converted",           colour: "bg-emerald-100 text-emerald-700" },
  { value: "lost",                label: "Lost",                colour: "bg-red-100 text-red-700" },
  { value: "archived",            label: "Archived",            colour: "bg-slate-100 text-slate-600" },
]

/* ------------------------------------------------------------------ */
/* Form types                                                           */
/* ------------------------------------------------------------------ */

interface EditFormValues {
  contact_type: ContactType
  entity_type: "person" | "organisation"
  full_name: string
  company_name: string
  status: ContactStatus
  email: string
  phone: string
  secondary_phone: string
  website: string
  preferred_contact_method: string
  address_line1: string
  address_line2: string
  city: string
  postcode: string
  country: string
  notes: string
  // supplier
  emergency_available: boolean
  preferred_supplier: boolean
  hourly_rate: string
  callout_fee: string
  insurance_expiry: string
  // applicant
  enquiry_source: string
  budget_min: string
  budget_max: string
  desired_move_date: string
  preferred_area: string
  applicant_status: string
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                        */
/* ------------------------------------------------------------------ */

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {optional && <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>}
    </label>
  )
}

function TextInput({
  type = "text",
  placeholder,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={cn(
        "w-full h-10 px-3 rounded-lg text-sm border border-slate-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
        "transition-all placeholder:text-slate-400",
        className,
      )}
      {...rest}
    />
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
      <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Delete confirmation dialog                                           */
/* ------------------------------------------------------------------ */

function DeleteConfirmDialog({
  contactName,
  onCancel,
  onConfirm,
  loading,
}: {
  contactName: string
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const [typed, setTyped] = useState("")
  const matches = typed.trim().toLowerCase() === contactName.trim().toLowerCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Delete Contact</h3>
            <p className="text-sm text-slate-600 mt-1">This action is permanent and cannot be undone.</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm text-slate-600">
            Type <span className="font-semibold text-slate-900">{contactName}</span> to confirm.
          </p>
          <TextInput
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder={contactName}
            autoFocus
          />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!matches || loading}
            loading={loading}
            onClick={onConfirm}
          >
            Delete permanently
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toggle component                                                     */
/* ------------------------------------------------------------------ */

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors duration-200",
          checked ? "bg-[#2563EB]" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ContactEditPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const { data: workspace } = useWorkspace()
  const { data: liveContact, isLoading } = useContact(workspace?.id, id)
  const updateMutation = useUpdateContact()

  // Toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success")
  const [toastMsg, setToastMsg] = useState("")

  // Dangerous actions
  const [dangerOpen, setDangerOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingContact, setDeletingContact] = useState(false)

  // Tag state
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // Supplier categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Show secondary phone / website toggles
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(false)
  const [showWebsite, setShowWebsite] = useState(false)

  // Resolve data: live Supabase data only — no mock fallback
  const rawContact: MockContact | null = (liveContact as MockContact | null) ?? null

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditFormValues>({
    defaultValues: {
      contact_type: "supplier",
      entity_type: "person",
      full_name: "",
      company_name: "",
      status: "active",
      email: "",
      phone: "",
      secondary_phone: "",
      website: "",
      preferred_contact_method: "Email",
      address_line1: "",
      address_line2: "",
      city: "",
      postcode: "",
      country: "United Kingdom",
      notes: "",
      emergency_available: false,
      preferred_supplier: false,
      hourly_rate: "",
      callout_fee: "",
      insurance_expiry: "",
      enquiry_source: "",
      budget_min: "",
      budget_max: "",
      desired_move_date: "",
      preferred_area: "",
      applicant_status: "new_enquiry",
    },
  })

  // Populate form when data resolves
  useEffect(() => {
    if (!rawContact) return
    reset({
      contact_type: rawContact.contact_type,
      entity_type: (rawContact.entity_type as "person" | "organisation") ?? (rawContact.company_name ? "organisation" : "person"),
      full_name: rawContact.full_name,
      company_name: rawContact.company_name ?? "",
      status: rawContact.status,
      email: rawContact.email,
      phone: rawContact.phone,
      secondary_phone: rawContact.secondary_phone ?? "",
      website: rawContact.website ?? "",
      preferred_contact_method: rawContact.preferred_contact_method ?? "Email",
      address_line1: rawContact.address_line1,
      address_line2: rawContact.address_line2 ?? "",
      city: rawContact.city,
      postcode: rawContact.postcode,
      country: rawContact.country,
      notes: rawContact.notes,
      emergency_available: rawContact.emergency_available ?? false,
      preferred_supplier: rawContact.preferred_supplier ?? false,
      hourly_rate: rawContact.hourly_rate ?? "",
      callout_fee: rawContact.callout_fee ?? "",
      insurance_expiry: rawContact.insurance_expiry ?? "",
      enquiry_source: rawContact.enquiry_source ?? "",
      budget_min: rawContact.budget_min ?? "",
      budget_max: rawContact.budget_max ?? "",
      desired_move_date: rawContact.desired_move_date ?? "",
      preferred_area: rawContact.preferred_area ?? "",
      applicant_status: rawContact.applicant_status ?? "new_enquiry",
    })
    setTags(rawContact.tags ?? [])
    setSelectedCategories(rawContact.service_categories ?? [])
    if (rawContact.secondary_phone) setShowSecondaryPhone(true)
    if (rawContact.website) setShowWebsite(true)
  }, [rawContact, reset])

  const watchedType = watch("contact_type")
  const watchedEntity = watch("entity_type")
  const watchedStatus = watch("status")
  const watchedPreferred = watch("preferred_contact_method")
  const watchedEmergency = watch("emergency_available")
  const watchedPreferredSupplier = watch("preferred_supplier")
  const watchedApplicantStatus = watch("applicant_status")

  const isSupplier = watchedType === "supplier"
  const isApplicant = watchedType === "applicant"
  const showOrgFields =
    watchedEntity === "organisation" ||
    ["supplier", "agent", "local_authority", "housing_association", "legal", "accountant", "insurer", "utility_provider", "broadband", "cleaning", "maintenance", "emergency_contractor", "investor"].includes(watchedType)

  function addTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase()
      if (t && !tags.includes(t)) setTags(prev => [...prev, t])
      setTagInput("")
    }
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  function toggleCategory(cat: string) {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  async function onSubmit(data: EditFormValues) {
    if (!workspace) return

    const payload = {
      contact_type: data.contact_type,
      full_name: data.full_name,
      company_name: data.company_name || null,
      status: data.status,
      email: data.email || null,
      phone: data.phone || null,
      address_line1: data.address_line1 || null,
      city: data.city || null,
      postcode: data.postcode || null,
      notes: data.notes || null,
      tags: tags.length > 0 ? tags : null,
    }

    try {
      await updateMutation.mutateAsync({ id, workspaceId: workspace.id, payload })
      setToastVariant("success")
      setToastMsg("Contact saved successfully.")
      setToastOpen(true)
      setTimeout(() => router.push(`/app/contacts/${id}`), 1200)
    } catch {
      setToastVariant("error")
      setToastMsg("Failed to save contact. Please try again.")
      setToastOpen(true)
    }
  }

  async function handleArchive() {
    if (!workspace) return
    try {
      await updateMutation.mutateAsync({ id, workspaceId: workspace.id, payload: { status: "archived" } })
      setToastVariant("success")
      setToastMsg("Contact archived.")
      setToastOpen(true)
      setTimeout(() => router.push(`/app/contacts/${id}`), 1200)
    } catch {
      setToastVariant("error")
      setToastMsg("Failed to archive contact.")
      setToastOpen(true)
    }
  }

  async function handleDelete() {
    setDeletingContact(true)
    try {
      // In a real implementation, call useDeleteContact mutation here
      await new Promise(r => setTimeout(r, 800))
      router.push("/app/contacts")
    } finally {
      setDeletingContact(false)
      setShowDeleteDialog(false)
    }
  }

  const isSaving = updateMutation.isPending

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

  if (!rawContact) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-slate-700 font-semibold text-lg">Contact not found</p>
        <p className="text-slate-400 text-sm">This contact may have been deleted or you may not have permission to view it.</p>
        <Link
          href="/app/contacts"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
      </div>
    )
  }

  const displayName = rawContact?.full_name ?? "Contact"

  return (
    <ToastProvider swipeDirection="right">
      <div className="space-y-0">
        {/* Back */}
        <div className="mb-6">
          <Link
            href={`/app/contacts/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contact
          </Link>
        </div>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Edit Contact</h1>
          <p className="text-sm text-slate-500 mt-1">{displayName}</p>
        </div>

        {/* Workspace warning */}
        {!workspace && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              No workspace connected. You can view and edit the form but changes cannot be saved.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Section 1: Contact Details ── */}
          <SectionCard title="Contact Details">
            <div className="grid sm:grid-cols-2 gap-5">

              {/* Contact Type */}
              <div>
                <FieldLabel>Contact Type</FieldLabel>
                <div className="relative">
                  <select
                    {...register("contact_type")}
                    className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  >
                    {CONTACT_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status */}
              <div>
                <FieldLabel>Status</FieldLabel>
                <div className="relative">
                  <select
                    {...register("status")}
                    className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {watchedStatus && (
                  <div className="mt-2">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                      STATUS_OPTIONS.find(o => o.value === watchedStatus)?.colour ?? "bg-slate-100 text-slate-600",
                    )}>
                      {STATUS_OPTIONS.find(o => o.value === watchedStatus)?.label ?? watchedStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* Entity Type */}
              <div className="sm:col-span-2">
                <FieldLabel>Entity Type</FieldLabel>
                <Controller
                  control={control}
                  name="entity_type"
                  render={({ field }) => (
                    <div className="flex gap-2">
                      {(["person", "organisation"] as const).map(et => (
                        <button
                          key={et}
                          type="button"
                          onClick={() => field.onChange(et)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                            field.value === et
                              ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                          )}
                        >
                          {et.charAt(0).toUpperCase() + et.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Full Name */}
              <div className="sm:col-span-2">
                <FieldLabel>Full Name</FieldLabel>
                <TextInput
                  {...register("full_name", { required: "Full name is required" })}
                  placeholder="e.g. Kevin Walsh"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              {/* Company Name */}
              {showOrgFields && (
                <div className="sm:col-span-2">
                  <FieldLabel optional>Company / Organisation Name</FieldLabel>
                  <TextInput
                    {...register("company_name")}
                    placeholder="Add organisation name"
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Section 2: Communication ── */}
          <SectionCard title="Communication">
            <div className="grid sm:grid-cols-2 gap-5">

              {/* Email */}
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput
                  {...register("email")}
                  type="email"
                  placeholder="email@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <FieldLabel>Phone</FieldLabel>
                <TextInput
                  {...register("phone")}
                  type="tel"
                  placeholder="07700 900123"
                />
              </div>

              {/* Secondary phone */}
              {showSecondaryPhone ? (
                <div>
                  <FieldLabel optional>Secondary Phone</FieldLabel>
                  <TextInput
                    {...register("secondary_phone")}
                    type="tel"
                    placeholder="07700 900456"
                  />
                </div>
              ) : (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setShowSecondaryPhone(true)}
                    className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-blue-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add secondary phone
                  </button>
                </div>
              )}

              {/* Website — shown for supplier/org types or if previously set */}
              {(showWebsite || isSupplier || watchedEntity === "organisation") ? (
                <div>
                  <FieldLabel optional>Website</FieldLabel>
                  <TextInput
                    {...register("website")}
                    type="url"
                    placeholder="https://example.com"
                  />
                </div>
              ) : (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setShowWebsite(true)}
                    className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-blue-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add website
                  </button>
                </div>
              )}

              {/* Preferred contact method */}
              <div className="sm:col-span-2">
                <FieldLabel>Preferred Contact Method</FieldLabel>
                <Controller
                  control={control}
                  name="preferred_contact_method"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {PREFERRED_CONTACT_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => field.onChange(opt)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                            field.value === opt
                              ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section 3: Address ── */}
          <SectionCard title="Address">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <FieldLabel>Address Line 1</FieldLabel>
                <TextInput {...register("address_line1")} placeholder="123 Oak Street" />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel optional>Address Line 2</FieldLabel>
                <TextInput {...register("address_line2")} placeholder="Flat 2 (optional)" />
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <TextInput {...register("city")} placeholder="Birmingham" />
              </div>
              <div>
                <FieldLabel>Postcode</FieldLabel>
                <TextInput {...register("postcode")} placeholder="B1 1AA" />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Country</FieldLabel>
                <TextInput {...register("country")} placeholder="United Kingdom" />
              </div>
            </div>
          </SectionCard>

          {/* ── Section 4: Tags & Notes ── */}
          <SectionCard title="Tags & Notes">
            <div className="space-y-5">
              {/* Tags */}
              <div>
                <FieldLabel optional>Tags</FieldLabel>
                <div
                  className={cn(
                    "flex flex-wrap gap-2 min-h-[42px] p-2 rounded-lg border border-slate-200 bg-slate-50",
                    "focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all",
                  )}
                >
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-[#2563EB] text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <FieldLabel optional>Notes</FieldLabel>
                <textarea
                  {...register("notes")}
                  rows={4}
                  placeholder="Any notes about this contact…"
                  className="w-full px-3 py-2.5 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section 5: Supplier Details ── */}
          {isSupplier && (
            <SectionCard title="Supplier Details">
              <div className="space-y-5">

                {/* Service categories */}
                <div>
                  <FieldLabel>Service Categories</FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SUPPLIER_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          selectedCategories.includes(cat)
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-col gap-3">
                  <Controller
                    control={control}
                    name="emergency_available"
                    render={({ field }) => (
                      <Toggle
                        checked={field.value}
                        onChange={field.onChange}
                        label="Available for emergency call-outs"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="preferred_supplier"
                    render={({ field }) => (
                      <Toggle
                        checked={field.value}
                        onChange={field.onChange}
                        label="Preferred supplier"
                      />
                    )}
                  />
                </div>

                {/* Rates */}
                <div className="grid sm:grid-cols-3 gap-5">
                  <div>
                    <FieldLabel optional>Hourly Rate</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
                      <TextInput
                        {...register("hourly_rate")}
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel optional>Call-out Fee</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
                      <TextInput
                        {...register("callout_fee")}
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel optional>Insurance Expiry</FieldLabel>
                    <TextInput {...register("insurance_expiry")} type="date" />
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── Section 6: Applicant Details ── */}
          {isApplicant && (
            <SectionCard title="Applicant Details">
              <div className="grid sm:grid-cols-2 gap-5">

                {/* Enquiry source */}
                <div>
                  <FieldLabel>Enquiry Source</FieldLabel>
                  <div className="relative">
                    <select
                      {...register("enquiry_source")}
                      className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select source</option>
                      {ENQUIRY_SOURCE_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Applicant status */}
                <div>
                  <FieldLabel>Applicant Status</FieldLabel>
                  <div className="relative">
                    <select
                      {...register("applicant_status")}
                      className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    >
                      {APPLICANT_STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {watchedApplicantStatus && (
                    <div className="mt-2">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        APPLICANT_STATUS_OPTIONS.find(o => o.value === watchedApplicantStatus)?.colour ?? "bg-slate-100 text-slate-600",
                      )}>
                        {APPLICANT_STATUS_OPTIONS.find(o => o.value === watchedApplicantStatus)?.label ?? watchedApplicantStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* Budget */}
                <div>
                  <FieldLabel optional>Budget Min</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
                    <TextInput {...register("budget_min")} type="number" placeholder="500" className="pl-7" />
                  </div>
                </div>
                <div>
                  <FieldLabel optional>Budget Max</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
                    <TextInput {...register("budget_max")} type="number" placeholder="1500" className="pl-7" />
                  </div>
                </div>

                {/* Move date & area */}
                <div>
                  <FieldLabel optional>Desired Move Date</FieldLabel>
                  <TextInput {...register("desired_move_date")} type="date" />
                </div>
                <div>
                  <FieldLabel optional>Preferred Area</FieldLabel>
                  <TextInput {...register("preferred_area")} placeholder="e.g. Birmingham City Centre" />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── Sticky save bar ── */}
          <div className="sticky bottom-0 z-20 -mx-4 px-4 py-4 bg-white/90 backdrop-blur border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => router.push(`/app/contacts/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSaving}
              disabled={!workspace}
              leftIcon={!isSaving ? <Save className="w-4 h-4" /> : undefined}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* ── Dangerous Actions ── */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setDangerOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            <span>Dangerous Actions</span>
            {dangerOpen
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />
            }
          </button>
          {dangerOpen && (
            <div className="mt-3 rounded-xl border border-red-200 bg-white p-5 space-y-4">
              <p className="text-xs text-slate-500">These actions cannot easily be undone. Proceed with caution.</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="warning"
                  size="sm"
                  leftIcon={<Archive className="w-4 h-4" />}
                  onClick={handleArchive}
                  loading={isSaving}
                >
                  Archive Contact
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Contact
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete dialog */}
      {showDeleteDialog && (
        <DeleteConfirmDialog
          contactName={displayName}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          loading={deletingContact}
        />
      )}

      {/* Toast */}
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant={toastVariant}
        duration={4000}
      >
        <ToastTitle>{toastVariant === "success" ? "Saved" : "Error"}</ToastTitle>
        <ToastDescription>{toastMsg}</ToastDescription>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  )
}
