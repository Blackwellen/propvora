"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Search, ChevronLeft, ShieldCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useContacts } from "@/hooks/useContacts"
import {
  DEFAULT_PORTAL_PROFILES,
  DEFAULT_PORTAL_PURPOSES,
} from "@/lib/portals/config"

interface Props {
  workspaceId: string | undefined
  onClose: () => void
  onSuccess?: (grantId: string) => void
}

const EXPIRY_OPTIONS = [7, 14, 30, 60, 90]

export function GrantPortalAccessModal({ workspaceId, onClose, onSuccess }: Props) {
  const router = useRouter()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(workspaceId)

  const [step, setStep] = useState<1 | 2>(1)
  const [search, setSearch] = useState("")
  const [contactId, setContactId] = useState<string | null>(null)
  const [profileKey, setProfileKey] = useState<string>("supplier")
  const [purposeKey, setPurposeKey] = useState<string>("document_exchange")
  const [expiryDays, setExpiryDays] = useState<number>(30)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedContact = contacts.find((c) => c.id === contactId) ?? null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts.slice(0, 50)
    return contacts
      .filter(
        (c) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q)
      )
      .slice(0, 50)
  }, [contacts, search])

  async function handleSubmit() {
    if (!workspaceId || !contactId) return
    setSubmitting(true)
    setError(null)
    try {
      const profile = DEFAULT_PORTAL_PROFILES.find((p) => p.key === profileKey)
      const res = await fetch("/api/portals/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          contactId,
          profile: profileKey,
          accessType: profile?.accessType ?? "supplier",
          purpose: purposeKey,
          expiryDays,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.id) {
        setError(data?.error ?? "Failed to grant portal access.")
        setSubmitting(false)
        return
      }
      if (onSuccess) onSuccess(data.id)
      else router.push(`/app/portals/access/${data.id}`)
    } catch {
      setError("Network error — please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Grant Portal Access</h2>
              <p className="text-[12px] text-slate-500">
                Step {step} of 2 — {step === 1 ? "Select contact" : "Profile, purpose & expiry"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: contact selection */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search contacts by name, email or company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
              {contactsLoading ? (
                <div className="py-12 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading contacts…
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    {contacts.length === 0 ? "No contacts yet" : "No contacts match your search"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {contacts.length === 0
                      ? "Add a contact first, then grant portal access."
                      : "Try a different search term."}
                  </p>
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setContactId(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
                      contactId === c.id ? "bg-blue-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {(c.full_name ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {c.full_name || "Unnamed contact"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {c.company_name || c.email || c.contact_type}
                      </p>
                    </div>
                    {contactId === c.id && (
                      <span className="text-[11px] font-semibold text-blue-600">Selected</span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!contactId}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: profile / purpose / expiry */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            {selectedContact && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                  {(selectedContact.full_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {selectedContact.full_name || "Unnamed contact"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {selectedContact.email || selectedContact.company_name || selectedContact.contact_type}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Portal profile</label>
              <select
                value={profileKey}
                onChange={(e) => setProfileKey(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {DEFAULT_PORTAL_PROFILES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purpose</label>
              <select
                value={purposeKey}
                onChange={(e) => {
                  setPurposeKey(e.target.value)
                  const p = DEFAULT_PORTAL_PURPOSES.find((x) => x.key === e.target.value)
                  if (p) setExpiryDays(p.defaultExpiryDays)
                }}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {DEFAULT_PORTAL_PURPOSES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Link expiry</label>
              <div className="flex flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setExpiryDays(d)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      expiryDays === d
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-800 leading-relaxed">
                The magic-link token is generated securely server-side and stored hashed.
                The raw token is never shown here. Delivering the link to the recipient
                requires the public portal route (not yet built).
              </p>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !contactId}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Provisioning…
                  </>
                ) : (
                  "Grant access"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
