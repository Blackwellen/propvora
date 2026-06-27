"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  X, Search, ChevronLeft, ShieldCheck, Loader2,
  CheckCircle2, Copy, Check, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileSheet, useIsMobile } from "@/components/mobile"
import { useContacts } from "@/hooks/useContacts"
import {
  DEFAULT_PORTAL_PROFILES,
  DEFAULT_PORTAL_PURPOSES,
} from "@/lib/portals/config"
import { isExtendedPortalProfilesEnabled } from "@/lib/portal/flags"

interface Props {
  workspaceId: string | undefined
  onClose: () => void
  onSuccess?: (grantId: string) => void
}

const EXPIRY_OPTIONS = [7, 14, 30, 60, 90]

export function GrantPortalAccessModal({ workspaceId, onClose, onSuccess }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(workspaceId)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [search, setSearch] = useState("")
  const [contactId, setContactId] = useState<string | null>(null)
  const [profileKey, setProfileKey] = useState<string>("supplier")
  const [purposeKey, setPurposeKey] = useState<string>("document_exchange")
  const [expiryDays, setExpiryDays] = useState<number>(30)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Result of a successful grant. The magic link is returned by the API EXACTLY
  // ONCE (the raw token is never persisted) — so the success step is the only
  // chance the operator has to copy it. Losing it here = a dead portal grant.
  const [result, setResult] = useState<{ id: string; magicLink: string | null } | null>(null)
  const [copied, setCopied] = useState(false)
  // Heading focus targets so focus moves correctly on step change (a11y).
  const step2HeadingRef = useRef<HTMLHeadingElement>(null)
  const step3HeadingRef = useRef<HTMLHeadingElement>(null)

  const selectedContact = contacts.find((c) => c.id === contactId) ?? null

  // V1 ships only landlord / supplier / tenant profiles. Extended profiles
  // (applicant / accountant / solicitor / generic) are gated behind a flag —
  // they have no dedicated recipient experience, so hide them by default.
  const availableProfiles = useMemo(
    () =>
      isExtendedPortalProfilesEnabled()
        ? DEFAULT_PORTAL_PROFILES
        : DEFAULT_PORTAL_PROFILES.filter((p) => p.tier === "v1"),
    []
  )

  // Escape closes the dialog (parity with the mobile sheet) — but never while a
  // grant is being provisioned, to avoid orphaning an in-flight request.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, submitting])

  // Move focus to the step heading when advancing, so keyboard / screen-reader
  // users land at the top of the new step rather than retaining stale focus.
  useEffect(() => {
    if (step === 2) step2HeadingRef.current?.focus()
    if (step === 3) step3HeadingRef.current?.focus()
  }, [step])

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
      // Refresh the grants list/KPIs so the new grant appears immediately — the
      // grant was created via fetch (not a react-query mutation), so nothing
      // else invalidates this cache.
      queryClient.invalidateQueries({ queryKey: ["portal-grants", workspaceId] })
      queryClient.invalidateQueries({ queryKey: ["portal-uploads-count", workspaceId] })
      setSubmitting(false)
      // Surface the one-time magic link on a success step. If a caller wants to
      // own the success flow it can pass onSuccess; otherwise we show step 3.
      if (onSuccess) {
        onSuccess(data.id)
        return
      }
      setResult({ id: data.id, magicLink: data.magicLink ?? null })
      setStep(3)
    } catch {
      setError("Network error — please try again.")
      setSubmitting(false)
    }
  }

  async function copyLink() {
    if (!result?.magicLink) return
    try {
      await navigator.clipboard.writeText(result.magicLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — the link remains visible/selectable in the field */
    }
  }

  const stepCaption =
    step === 3
      ? "Access granted"
      : `Step ${step} of 2 — ${step === 1 ? "Select contact" : "Profile, purpose & expiry"}`

  const body = (
    <>
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
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
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
                      contactId === c.id ? "bg-[var(--brand-soft)]" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
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
                      <span className="text-[11px] font-semibold text-[var(--brand)]">Selected</span>
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
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: profile / purpose / expiry */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <h3
              ref={step2HeadingRef}
              tabIndex={-1}
              className="sr-only outline-none"
            >
              Choose portal profile, purpose and link expiry
            </h3>
            {selectedContact && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
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
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
              >
                {availableProfiles.map((p) => (
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
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all"
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
                        ? "bg-[var(--brand-soft)] border-[var(--color-brand-300)] text-[var(--brand)]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--brand-soft)]/60 border border-[var(--color-brand-100)]">
              <ShieldCheck className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[var(--brand-strong)] leading-relaxed">
                The magic-link token is generated securely server-side and stored hashed only.
                The raw token is never stored or shown here. Recipients access the secure portal
                at <span className="font-mono text-[10px]">/portal?token=…</span> — revoke instantly from the grant detail page.
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
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

        {/* Step 3: success — surface the one-time magic link */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center text-center pt-1">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3
                ref={step3HeadingRef}
                tabIndex={-1}
                className="text-[15px] font-bold text-slate-900 outline-none"
              >
                Portal access granted
              </h3>
              <p className="text-[12px] text-slate-500 mt-1 max-w-xs">
                {selectedContact?.full_name ? `${selectedContact.full_name} can now ` : "The recipient can now "}
                access the secure portal with the link below.
              </p>
            </div>

            {result?.magicLink ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Magic link
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    readOnly
                    value={result.magicLink}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 px-3 py-2.5 text-[12px] font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
                    aria-label="Recipient magic link"
                  />
                  <button
                    onClick={copyLink}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 px-3 rounded-xl text-[13px] font-semibold transition-colors",
                      copied
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white"
                    )}
                    aria-label="Copy magic link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Copy this link now — it is shown <strong>once</strong> and cannot be
                    retrieved again (the token is stored hashed only). Share it with the
                    recipient over a secure channel. You can revoke or extend it any time
                    from the grant page.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  The grant was created. The magic link could not be displayed here —
                  open the grant page to manage access, then re-issue the link if needed.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => {
                  if (result) router.push(`/property-manager/portals/access/${result.id}`)
                }}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-strong)] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> View grant
              </button>
            </div>
          </div>
        )}
    </>
  )

  // Mobile: focus-trapped bottom sheet with a compact step header.
  if (isMobile) {
    return (
      <MobileSheet open onClose={onClose} title="Grant Portal Access" description={stepCaption}>
        {/* Back lives in the step footer (body) — no duplicate header Back. */}
        <div className="px-2 pb-2">{body}</div>
      </MobileSheet>
    )
  }

  // Desktop: centered modal (unchanged).
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={() => { if (!submitting) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="grant-portal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
      >
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
              <h2 id="grant-portal-title" className="text-[15px] font-bold text-slate-900">Grant Portal Access</h2>
              <p className="text-[12px] text-slate-500">{stepCaption}</p>
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
        {body}
      </div>
    </div>
  )
}
