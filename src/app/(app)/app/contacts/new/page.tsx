"use client"

import React, { Suspense, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle, ArrowLeft, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react"
import { useCreateContact } from "@/hooks/useContacts"
import { useWorkspace } from "@/providers/AuthProvider"
import type { InsertContact } from "@/types/database"
import { uploadFile } from "@/lib/upload"
import { createClient } from "@/lib/supabase/client"
import { buildTypeDetails } from "@/lib/contacts/metadata"
import { type WizardState, defaultState, getDocumentSlots, stateFromParams, STEP_NAMES } from "@/components/contacts/contact-new/types"
import { CONTACT_TYPE_OPTIONS } from "@/components/contacts/contact-new/constants"
import Step1TypeSelector     from "@/components/contacts/contact-new/Step1TypeSelector"
import Step2Details          from "@/components/contacts/contact-new/Step2Details"
import Step3Communication    from "@/components/contacts/contact-new/Step3Communication"
import Step5TypeSpecific     from "@/components/contacts/contact-new/Step5TypeSpecific"
import Step6Documents        from "@/components/contacts/contact-new/Step6Documents"
import Step7PortalAccess     from "@/components/contacts/contact-new/Step7PortalAccess"
import Step8Review           from "@/components/contacts/contact-new/Step8Review"
import StepperRail           from "@/components/contacts/contact-new/StepperRail"
import SummaryRail           from "@/components/contacts/contact-new/SummaryRail"

// Type-Specific (4), Documents (5) and Portal Access (6) are all optional.
const skippableSteps = new Set([4, 5, 6])
const LAST_STEP = 7

// Default export wraps the wizard in a Suspense boundary: the inner component
// reads quick-add hand-off params via useSearchParams, which requires a Suspense
// boundary for the production prerender to succeed (CSR bailout otherwise fails
// the build). See reference-client-searchparams-suspense.
export default function NewContactPage() {
  return (
    <Suspense fallback={null}>
      <NewContactWizard />
    </Suspense>
  )
}

function NewContactWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { workspace } = useWorkspace()
  const createContact = useCreateContact()

  const [step, setStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<string[]>([])
  // Seed initial state from quick-add hand-off params (entity/type/name/email…).
  const [state, setState] = useState<WizardState>(() => stateFromParams(searchParams))
  const [succeeded, setSucceeded] = useState(false)
  const [createdContact, setCreatedContact] = useState<{ id: string; name: string; type: string } | null>(null)
  const [createWarnings, setCreateWarnings] = useState<string[]>([])

  // Auto-populate document slots when contactType changes
  const handleSetState: React.Dispatch<React.SetStateAction<WizardState>> = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        if (next.contactType !== prev.contactType) {
          next.documents = getDocumentSlots(next.contactType)
        }
        return next
      })
    },
    []
  )

  const validate = (s: number): string[] => {
    const errs: string[] = []
    if (s === 1 && !state.contactType) {
      errs.push("Please select a contact type before continuing")
    }
    if (s === 2) {
      if (state.entityType === "person") {
        if (!state.firstName.trim()) errs.push("First name is required")
        if (!state.lastName.trim()) errs.push("Last name is required")
      } else {
        if (!state.organisationName.trim()) errs.push("Organisation name is required")
      }
    }
    if (s === 3) {
      if (!state.email.trim()) errs.push("Email is required")
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) errs.push("Email address is not valid")
    }
    return errs
  }

  const handleNext = () => {
    const errs = validate(step)
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setCompletedSteps((prev) => new Set(prev).add(step))
    setStep((s) => Math.min(s + 1, LAST_STEP))
  }

  const handleBack = () => {
    setErrors([])
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleSkip = () => {
    setErrors([])
    setCompletedSteps((prev) => new Set(prev).add(step))
    setStep((s) => Math.min(s + 1, LAST_STEP))
  }

  const handleJumpTo = (targetStep: number) => {
    setErrors([])
    setStep(targetStep)
  }

  // Map the wizard's portal-link expiry option to a day count for the grant API.
  const portalExpiryDays = (opt: string): number => {
    switch (opt) {
      case "24h": return 1
      case "7d": return 7
      case "30d": return 30
      case "after_job": return 30
      case "never": return 365
      default: return 30
    }
  }

  const handleCreate = async () => {
    if (!workspace) return

    const fullName =
      state.entityType === "organisation"
        ? state.organisationName.trim()
        : [state.firstName, state.lastName].filter(Boolean).join(" ").trim()

    const typeLabel =
      CONTACT_TYPE_OPTIONS.find((c) => c.value === state.contactType)?.label ?? "Contact"

    // Step 5 → namespaced type-specific details persisted on `contacts.metadata`.
    const typeDetails = buildTypeDetails(state)

    const payload: InsertContact = {
      workspace_id: workspace.id,
      contact_type: state.contactType ?? "other",
      full_name: fullName || "Unnamed Contact",
      email: state.email.trim() || null,
      phone: state.phone.trim() || null,
      company_name:
        state.entityType === "organisation" ? state.organisationName.trim() || null : null,
      address_line1: state.addressLine1.trim() || null,
      city: state.city.trim() || null,
      postcode: state.postcode.trim() || null,
      avatar_url: state.avatarKey,
      notes: state.notes.trim() || null,
      // Persist selected supplier service categories alongside tags so they
      // surface in the supplier service column/filter/detail.
      tags: (() => {
        const merged = [
          ...state.tags.map((t) => t.label),
          ...(state.contactType === "supplier" ? state.supplierServices : []),
        ].filter((v, i, a) => v && a.indexOf(v) === i)
        return merged.length > 0 ? merged : null
      })(),
      metadata: typeDetails ? ({ type_details: typeDetails } as unknown as import("@/types/database").Json) : null,
      status: "active",
      is_demo: false,
    }

    try {
      // 1. Primary record. If this fails, nothing else runs (no orphans).
      const result = await createContact.mutateAsync(payload)
      const contactId = result.id

      // 2. Child writes run AFTER the contact exists. They are best-effort and
      //    individually guarded: a failure here does not undo the created
      //    contact (the user can re-do documents/portal from the detail page),
      //    but we collect warnings to surface honestly on the success screen.
      const warnings: string[] = []

      // Step 6 — upload selected documents to R2 and attach to the contact.
      const docsToUpload = state.documents.filter((d) => d.file)
      if (docsToUpload.length > 0) {
        const supabase = createClient()
        for (const doc of docsToUpload) {
          try {
            const up = await uploadFile(doc.file!, workspace.id, "contacts")
            const { error } = await supabase.from("documents").insert({
              workspace_id: workspace.id,
              name: doc.name || doc.file!.name,
              mime_type: up.type || doc.file!.type || null,
              size_bytes: up.size ?? doc.file!.size,
              r2_key: up.key,
              r2_bucket: "propvora",
              url: up.url,
              status: "uploaded",
              metadata: { contact_id: contactId, expiry: doc.expiry || null },
            })
            if (error) warnings.push(`Could not attach "${doc.name}".`)
          } catch {
            warnings.push(`Could not upload "${doc.name}".`)
          }
        }
      }

      // Step 7 — provision a portal access grant via the secure server route.
      if (state.portalAccessEnabled) {
        try {
          const accessType =
            state.contactType === "landlord" ? "landlord"
            : state.contactType === "tenant" || state.contactType === "post_tenant" ? "tenant"
            : "supplier"
          const res = await fetch("/api/portals/grant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId: workspace.id,
              contactId,
              accessType,
              expiryDays: portalExpiryDays(state.portalExpiry),
            }),
          })
          if (!res.ok) warnings.push("Portal access could not be provisioned — set it up from the contact's Portal tab.")
        } catch {
          warnings.push("Portal access could not be provisioned — set it up from the contact's Portal tab.")
        }
      }

      setCreateWarnings(warnings)
      setCreatedContact({ id: contactId, name: fullName || "New Contact", type: typeLabel })
      setSucceeded(true)
    } catch {
      setErrors(["Failed to create contact. Please check your connection and try again."])
    }
  }

  const handleReset = () => {
    setSucceeded(false)
    setCreatedContact(null)
    setCreateWarnings([])
    setState({ ...defaultState })
    setStep(1)
    setCompletedSteps(new Set())
    setErrors([])
  }

  // ─── Success screen ───────────────────────────────────────────────────────────
  if (succeeded && createdContact) {
    return (
      <div className="space-y-0">
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <div style={{ color: "#22c55e" }}><CheckCircle2 className="w-9 h-9" /></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Contact created!</h1>
              <p className="text-slate-500 mt-1 text-sm">
                {createdContact.name} has been added as a {createdContact.type}.
              </p>
            </div>
            {createWarnings.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">The contact was created, but some extras need attention:</p>
                <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                  {createWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => router.push(`/property-manager/contacts/${createdContact.id}`)}
                className="w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white font-semibold py-2.5 text-sm transition"
              >
                View Contact
              </button>
              <button
                onClick={handleReset}
                className="w-full rounded-xl border border-slate-200 text-slate-700 font-medium py-2.5 text-sm hover:bg-slate-50 transition"
              >
                Add Another
              </button>
              <button
                onClick={() => router.push("/property-manager/contacts")}
                className="w-full rounded-xl border border-slate-200 text-slate-500 font-medium py-2.5 text-sm hover:bg-slate-50 transition"
              >
                Back to Contacts
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Top breadcrumb bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white border-b border-slate-100 px-6 py-3.5">
        <button
          onClick={() => router.push("/property-manager/contacts")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Contacts
        </button>
        <div style={{ color: "#e2e8f0" }}><ChevronRight className="w-4 h-4" /></div>
        <span className="text-sm font-semibold text-slate-800">New Contact</span>
        <span className="ml-auto text-xs text-slate-400">
          Step {step} of {STEP_NAMES.length}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-col xl:flex-row gap-6 px-4 sm:px-6 py-6 max-w-[1200px] mx-auto">
        <StepperRail currentStep={step} completedSteps={completedSteps} />

        {/* Center step card */}
        <div className="flex-1 min-w-0 order-first xl:order-none">
          {!workspace && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <div style={{ color: "#f59e0b" }}><AlertCircle className="w-4 h-4" /></div>
              <p className="text-sm text-amber-700">Connect a workspace to save contacts.</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-6">
              {step === 1 && <Step1TypeSelector state={state} setState={handleSetState} errors={errors} />}
              {step === 2 && <Step2Details state={state} setState={setState} errors={errors} workspaceId={workspace?.id} />}
              {step === 3 && <Step3Communication state={state} setState={setState} errors={errors} />}
              {step === 4 && <Step5TypeSpecific state={state} setState={setState} />}
              {step === 5 && <Step6Documents state={state} setState={setState} />}
              {step === 6 && <Step7PortalAccess state={state} setState={setState} />}
              {step === 7 && <Step8Review state={state} onJumpTo={handleJumpTo} />}
            </div>

            {/* Footer nav */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {skippableSteps.has(step) && step < LAST_STEP && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 transition"
                  >
                    Skip
                  </button>
                )}

                {step < LAST_STEP ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white px-5 py-2 text-sm font-semibold transition"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!workspace || createContact.isPending}
                    className="flex items-center gap-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 text-sm font-semibold transition"
                  >
                    {createContact.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {createContact.isPending ? "Creating…" : "Create Contact"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Inline error banner (steps 2+) */}
          {errors.length > 0 && step !== 1 && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <div style={{ color: "#ef4444" }} className="mt-0.5 flex-shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <ul className="text-sm text-red-600 space-y-0.5 list-disc list-inside">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>

        <SummaryRail state={state} currentStep={step} />
      </div>
    </div>
  )
}
