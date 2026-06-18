"use client"

// Loads an existing draft/listing by id into the shared wizard. 42P01-safe:
// if `listing_drafts` is missing or the row isn't found, it starts a fresh
// wizard seeded with the listingId so the editor always renders.

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ListingDraftProvider } from "../data/useListingDraft"
import { ListingWizardLayout } from "./ListingWizardLayout"
import type { ListingDraft } from "../data/types"

export function EditWizardLoader({
  listingId,
  children,
}: {
  listingId: string
  children: React.ReactNode
}) {
  const [initial, setInitial] = useState<Partial<ListingDraft> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("listing_drafts")
          .select("id, current_step, metadata_json, listing_id")
          .or(`listing_id.eq.${listingId},id.eq.${listingId}`)
          .limit(1)
          .maybeSingle()
        if (!error && data?.metadata_json) {
          const meta = data.metadata_json as Partial<ListingDraft>
          if (active)
            setInitial({
              ...meta,
              draftId: String(data.id),
              listingId: listingId,
              currentStep: (data.current_step as number) ?? meta.currentStep ?? 1,
            })
        } else if (active) {
          setInitial({ listingId })
        }
      } catch {
        if (active) setInitial({ listingId })
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [listingId])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 text-[13px] text-slate-400">
        Loading listing…
      </div>
    )
  }

  return (
    <ListingDraftProvider initialDraft={initial ?? { listingId }} initialDraftId={initial?.draftId ?? undefined}>
      <ListingWizardLayout>{children}</ListingWizardLayout>
    </ListingDraftProvider>
  )
}
