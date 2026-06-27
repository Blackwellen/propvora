"use client"

import React, { useState } from "react"
import { X } from "lucide-react"
import { useCreateContact } from "@/hooks/useContacts"
import type { ContactType } from "@/types/database"

interface AddPersonModalProps {
  onClose: () => void
  onSuccess: () => void
  workspaceId?: string
}

export function AddPersonModal({ onClose, onSuccess, workspaceId }: AddPersonModalProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName]   = useState("")
  const [type, setType]           = useState("tenant")
  const [email, setEmail]         = useState("")
  const [phone, setPhone]         = useState("")
  const [city, setCity]           = useState("")
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createContact = useCreateContact()

  async function handleSave() {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!name) { setFormError("Name is required"); return }
    if (!workspaceId) { setFormError("Workspace not loaded"); return }
    setSaving(true)
    setFormError(null)
    try {
      await createContact.mutateAsync({
        workspace_id: workspaceId,
        full_name: name,
        contact_type: type as ContactType,
        email: email.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        status: "active",
        is_demo: false,
      })
      onSuccess()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save contact")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-person-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="add-person-title" className="text-lg font-bold text-slate-900">Add Person</h2>
            <p className="text-xs text-slate-500 mt-0.5">Create a new person contact</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-person-first" className="block text-xs font-medium text-slate-700 mb-1">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                id="add-person-first"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="James"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
              />
            </div>
            <div>
              <label htmlFor="add-person-last" className="block text-xs font-medium text-slate-700 mb-1">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                id="add-person-last"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Okafor"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="add-person-type" className="block text-xs font-medium text-slate-700 mb-1">Contact Type</label>
            <select
              id="add-person-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white transition-all"
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
              <option value="applicant">Applicant</option>
              <option value="guarantor">Guarantor</option>
              <option value="post_tenant">Past Tenant</option>
              <option value="local_authority">Local Authority</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="add-person-email" className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              id="add-person-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="james@example.com"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-person-phone" className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                id="add-person-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07700 900000"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
              />
            </div>
            <div>
              <label htmlFor="add-person-city" className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <input
                id="add-person-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Birmingham"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
              />
            </div>
          </div>
        </div>

        {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}

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
            disabled={saving || !firstName.trim() || !lastName.trim()}
            className="flex-1 h-9 rounded-lg bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Person"}
          </button>
        </div>
      </div>
    </div>
  )
}
