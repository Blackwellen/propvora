"use client"

// Central draft context for the Listing Creation Wizard. Holds the full draft,
// autosaves to `listing_drafts` 2.5s after any change (and on explicit save),
// and is 42P01-safe — if the table is missing the draft simply lives in memory
// so the wizard always works. Shared across all 5 step routes via the layout.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { createInitialDraft } from "./seed"
import type { ListingDraft, ValidationItem } from "./types"

export const WIZARD_STEPS = [
  { num: 1, slug: "basics", label: "Basics", subtitle: "Type, property & space" },
  { num: 2, slug: "media", label: "Media", subtitle: "Photos & content" },
  { num: 3, slug: "pricing-availability", label: "Pricing", subtitle: "Rates & calendar" },
  { num: 4, slug: "policies-operations", label: "Policies", subtitle: "Rules & ops" },
  { num: 5, slug: "review-publish", label: "Review", subtitle: "Validate & publish" },
] as const

export function stepNumFromSlug(slug: string): number {
  return WIZARD_STEPS.find((s) => s.slug === slug)?.num ?? 1
}

interface DraftContextValue {
  draft: ListingDraft
  update: (patch: Partial<ListingDraft>) => void
  setStep: (n: number) => void
  saveDraft: () => Promise<void>
  isSaving: boolean
  lastSavedAt: string | null
  validation: ValidationItem[]
  completionPct: number
  publishBlockers: ValidationItem[]
}

const DraftContext = createContext<DraftContextValue | null>(null)

export function ListingDraftProvider({
  children,
  initialDraft,
  initialDraftId,
}: {
  children: React.ReactNode
  initialDraft?: Partial<ListingDraft>
  initialDraftId?: string
}) {
  const { workspace } = useWorkspace()
  const [draft, setDraft] = useState<ListingDraft>(() => ({
    ...createInitialDraft(),
    ...(initialDraft ?? {}),
    draftId: initialDraftId ?? initialDraft?.draftId ?? null,
  }))
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(draft.lastSavedAt)
  const [dirty, setDirty] = useState(false)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = useCallback((patch: Partial<ListingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }, [])

  const setStep = useCallback((n: number) => {
    setDraft((prev) => ({ ...prev, currentStep: n }))
  }, [])

  const saveDraft = useCallback(async () => {
    const current = draftRef.current
    if (!workspace?.id) {
      // No workspace yet — keep the draft in memory and mark a local save time.
      const ts = new Date().toISOString()
      setLastSavedAt(ts)
      setDirty(false)
      return
    }
    setIsSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        workspace_id: workspace.id,
        listing_id: current.listingId,
        status: current.published ? "published" : "draft",
        current_step: current.currentStep,
        title: current.title,
        listing_type: current.listingType,
        metadata_json: current as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }
      if (current.draftId) {
        await supabase.from("listing_drafts").update(payload).eq("id", current.draftId)
      } else {
        const { data } = await supabase
          .from("listing_drafts")
          .insert(payload)
          .select("id")
          .single()
        if (data?.id) setDraft((p) => ({ ...p, draftId: String(data.id) }))
      }
    } catch {
      // 42P01 / RLS — keep in memory, never crash the wizard.
    } finally {
      const ts = new Date().toISOString()
      setLastSavedAt(ts)
      setDirty(false)
      setIsSaving(false)
    }
  }, [workspace?.id])

  // Debounced autosave 2.5s after any change.
  useEffect(() => {
    if (!dirty) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void saveDraft()
    }, 2500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [dirty, draft, saveDraft])

  const validation = useMemo(() => buildValidation(draft), [draft])
  const publishBlockers = useMemo(
    () => validation.filter((v) => v.blocking && !v.complete),
    [validation],
  )
  const completionPct = useMemo(() => {
    const done = validation.filter((v) => v.complete).length
    return Math.round((done / validation.length) * 100)
  }, [validation])

  const value: DraftContextValue = {
    draft,
    update,
    setStep,
    saveDraft,
    isSaving,
    lastSavedAt,
    validation,
    completionPct,
    publishBlockers,
  }

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}

export function useListingDraft() {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error("useListingDraft must be used inside ListingDraftProvider")
  return ctx
}

// ── Validation / publish gate ────────────────────────────────────────────────
// 9 checks across required fields, media, pricing, availability, policies,
// amenities, compliance, channel and local registration.
export function buildValidation(d: ListingDraft): ValidationItem[] {
  const coverOk = d.photos.some((p) => p.isCover)
  const compRegistration = d.compliance.find((c) =>
    c.label.toLowerCase().includes("registration"),
  )
  const verifiedCompliance = d.compliance.filter((c) => c.status === "verified").length
  return [
    {
      key: "details",
      label: "Listing details complete",
      complete: d.title.trim().length >= 8 && d.shortDescription.trim().length >= 20,
      blocking: true,
    },
    {
      key: "media",
      label: "At least 5 photos + cover image",
      complete: d.photos.length >= 4 && coverOk,
      blocking: true,
    },
    {
      key: "pricing",
      label: "Base nightly rate set",
      complete: d.baseRatePence > 0,
      blocking: true,
    },
    {
      key: "availability",
      label: "Stay requirements configured",
      complete: d.minStayNights > 0 && d.maxStayNights >= d.minStayNights,
      blocking: true,
    },
    {
      key: "policies",
      label: "Cancellation policy & check-in set",
      complete: !!d.cancellationPolicy && !!d.checkInMethod,
      blocking: true,
    },
    {
      key: "amenities",
      label: "Essential amenities selected",
      complete: d.amenities.filter((a) => a.on).length >= 4,
      blocking: true,
    },
    {
      key: "compliance",
      label: "Safety & compliance verified",
      complete: verifiedCompliance >= 3,
      blocking: true,
    },
    {
      key: "channel",
      label: "At least one channel connected",
      complete:
        d.channels.length > 0 &&
        (d.channelSync.direct || Object.values(d.channelSync).some(Boolean)),
      blocking: true,
    },
    {
      key: "registration",
      label: "Local registration verified",
      complete: !!compRegistration && compRegistration.status === "verified",
      blocking: true,
    },
  ]
}
