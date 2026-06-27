"use client"

/**
 * QuickAddContactModal — the single, shared "fast capture" surface behind every
 * Add Contact / Add Person / Add Organisation button.
 *
 * This is the default leg of the hybrid create flow:
 *   • Fast: name, type, email, phone, city + an optional photo/logo, saved in
 *     one click straight into the `contacts` table (avatar_url is supported by
 *     the schema + useCreateContact hook).
 *   • Deep: an "Add full details →" link hands the captured fields off to the
 *     8-step wizard at /property-manager/contacts/new via query params, so the
 *     quick-add is never a dead-end when documents / portal access / linked
 *     records are needed.
 *
 * It replaces three near-identical bespoke modals that previously lived inline
 * in the people, organisations and main contacts pages (FIX: de-duplication).
 */

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Camera, Loader2, ArrowRight, CheckCircle2 } from "lucide-react"
import { useCreateContact } from "@/hooks/useContacts"
import { uploadFile, validateUploadFile } from "@/lib/upload"
import { avatarKeyToUrl } from "@/components/settings/AvatarUploader"
import type { ContactType } from "@/types/database"

export type QuickAddMode = "contact" | "person" | "organisation"

interface QuickAddContactModalProps {
  mode: QuickAddMode
  onClose: () => void
  /** Called after a successful save; receives the created contact id. */
  onSuccess: (createdId?: string) => void
  workspaceId?: string
  /** Pre-select the contact type (e.g. when launched from a filtered list). */
  defaultType?: ContactType
}

type TypeOption = { value: ContactType; label: string }

// Person-appropriate types (individuals).
const PERSON_TYPES: TypeOption[] = [
  { value: "tenant", label: "Tenant" },
  { value: "landlord", label: "Landlord" },
  { value: "applicant", label: "Applicant" },
  { value: "guarantor", label: "Guarantor" },
  { value: "post_tenant", label: "Past Tenant" },
  { value: "agent", label: "Agent" },
  { value: "local_authority", label: "Local Authority" },
  { value: "other", label: "Other" },
]

// Organisation-appropriate types (companies / bodies).
const ORG_TYPES: TypeOption[] = [
  { value: "supplier", label: "Supplier / Contractor" },
  { value: "agent", label: "Letting / Estate Agent" },
  { value: "legal", label: "Solicitor / Legal" },
  { value: "accountant", label: "Accountant" },
  { value: "insurer", label: "Insurer" },
  { value: "local_authority", label: "Local Authority" },
  { value: "housing_association", label: "Housing Association" },
  { value: "utility_provider", label: "Utility Provider" },
  { value: "other", label: "Other" },
]

// Generic "Add Contact" entry — full breadth, person-style fields.
const CONTACT_TYPES: TypeOption[] = [
  { value: "tenant", label: "Tenant" },
  { value: "landlord", label: "Landlord" },
  { value: "applicant", label: "Applicant" },
  { value: "guarantor", label: "Guarantor" },
  { value: "post_tenant", label: "Past Tenant" },
  { value: "supplier", label: "Supplier / Contractor" },
  { value: "agent", label: "Agent" },
  { value: "legal", label: "Solicitor / Legal" },
  { value: "accountant", label: "Accountant" },
  { value: "insurer", label: "Insurer" },
  { value: "local_authority", label: "Local Authority" },
  { value: "housing_association", label: "Housing Association" },
  { value: "investor", label: "Investor" },
  { value: "other", label: "Other" },
]

const COPY: Record<QuickAddMode, { title: string; subtitle: string; cta: string; isOrg: boolean }> = {
  contact: { title: "Add Contact", subtitle: "Quickly capture a new contact", cta: "Save Contact", isOrg: false },
  person: { title: "Add Person", subtitle: "Create a new person contact", cta: "Save Person", isOrg: false },
  organisation: { title: "Add Organisation", subtitle: "Create a new organisation contact", cta: "Save Organisation", isOrg: true },
}

const inputCls =
  "w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"

export default function QuickAddContactModal({
  mode,
  onClose,
  onSuccess,
  workspaceId,
  defaultType,
}: QuickAddContactModalProps) {
  const router = useRouter()
  const copy = COPY[mode]
  const typeOptions = mode === "organisation" ? ORG_TYPES : mode === "person" ? PERSON_TYPES : CONTACT_TYPES

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [orgName, setOrgName] = useState("")
  const [type, setType] = useState<ContactType>(defaultType ?? typeOptions[0].value)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [avatarKey, setAvatarKey] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const createContact = useCreateContact()

  const resolvedName = copy.isOrg
    ? orgName.trim()
    : `${firstName.trim()} ${lastName.trim()}`.trim()
  const canSave = !!resolvedName && !!workspaceId && !saving && !uploadingAvatar

  function validEmail(v: string) {
    return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
  }

  async function handleAvatar(file: File | undefined) {
    if (!file) return
    if (!workspaceId) { setFormError("Workspace not loaded — cannot store the photo yet."); return }
    const invalid = validateUploadFile(file, { imagesOnly: true })
    if (invalid) { setFormError(invalid); return }
    setFormError(null)
    setUploadingAvatar(true)
    try {
      const { key } = await uploadFile(file, workspaceId, "contacts/avatars", { imagesOnly: true })
      setAvatarKey(key)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Photo upload failed")
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave() {
    if (!resolvedName) { setFormError(copy.isOrg ? "Organisation name is required" : "Name is required"); return }
    if (!workspaceId) { setFormError("Workspace not loaded"); return }
    if (!validEmail(email)) { setFormError("Enter a valid email address"); return }
    setSaving(true)
    setFormError(null)
    try {
      const created = await createContact.mutateAsync({
        workspace_id: workspaceId,
        full_name: resolvedName,
        contact_type: type,
        company_name: copy.isOrg ? orgName.trim() || null : null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        avatar_url: avatarKey,
        status: "active",
        is_demo: false,
      })
      onSuccess(created.id)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save contact")
    } finally {
      setSaving(false)
    }
  }

  // Hand the captured fields off to the full 8-step wizard.
  function handleFullDetails() {
    const params = new URLSearchParams()
    params.set("entity", copy.isOrg ? "organisation" : "person")
    if (type) params.set("type", type)
    if (copy.isOrg) {
      if (orgName.trim()) params.set("org", orgName.trim())
    } else {
      if (firstName.trim()) params.set("firstName", firstName.trim())
      if (lastName.trim()) params.set("lastName", lastName.trim())
    }
    if (email.trim()) params.set("email", email.trim())
    if (phone.trim()) params.set("phone", phone.trim())
    if (city.trim()) params.set("city", city.trim())
    if (avatarKey) params.set("avatar", avatarKey)
    router.push(`/property-manager/contacts/new?${params.toString()}`)
  }

  const avatarUrl = avatarKeyToUrl(avatarKey)
  const initials = (resolvedName || copy.title).split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="quick-add-title" className="text-lg font-bold text-slate-900">{copy.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{copy.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo / logo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[var(--brand)] flex items-center justify-center text-white font-bold text-base overflow-hidden">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => !uploadingAvatar && fileRef.current?.click()}
                aria-label={copy.isOrg ? "Upload logo" : "Upload photo"}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-3 h-3 text-[var(--brand)] animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 text-slate-600" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={(e) => handleAvatar(e.target.files?.[0])}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{copy.isOrg ? "Logo" : "Photo"}</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP or HEIC · optional</p>
            </div>
          </div>

          {copy.isOrg ? (
            <div>
              <label htmlFor="qa-org" className="block text-xs font-medium text-slate-700 mb-1">
                Organisation Name <span className="text-red-400">*</span>
              </label>
              <input
                id="qa-org"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Property Services Ltd"
                className={inputCls}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qa-first" className="block text-xs font-medium text-slate-700 mb-1">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input id="qa-first" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="James" className={inputCls} />
              </div>
              <div>
                <label htmlFor="qa-last" className="block text-xs font-medium text-slate-700 mb-1">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input id="qa-last" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Okafor" className={inputCls} />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="qa-type" className="block text-xs font-medium text-slate-700 mb-1">Contact Type</label>
            <select id="qa-type" value={type} onChange={(e) => setType(e.target.value as ContactType)} className={`${inputCls} bg-white`}>
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qa-email" className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input id="qa-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="james@example.com" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="qa-phone" className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input id="qa-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900000" className={inputCls} />
            </div>
            <div>
              <label htmlFor="qa-city" className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <input id="qa-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Birmingham" className={inputCls} />
            </div>
          </div>
        </div>

        {formError && <p className="text-xs text-red-500 mt-3" role="alert">{formError}</p>}

        {/* Add full details → deep-links to the 8-step wizard with these fields */}
        <button
          type="button"
          onClick={handleFullDetails}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 rounded"
        >
          Add full details (documents, portal access &amp; links)
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 h-9 rounded-lg bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Saving…" : copy.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
