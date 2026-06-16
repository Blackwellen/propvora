"use server"

import { createClient } from "@/lib/supabase/server"
import { resolveWorkspaceContext } from "@/lib/context/workspace-context"
import { gateBookingPages } from "@/lib/billing/gates"
import {
  setListingAccommodation,
  setListingAmenities,
  type TypeDetails,
} from "@/lib/booking/accommodation"
import { upsertKeylessLock, type KeylessProvider } from "@/lib/booking/keyless"

/* ──────────────────────────────────────────────────────────────────────────
   Type-aware listing-wizard server actions — accommodation typing, amenity
   selection and keyless-lock config. Self-contained (does not touch the deep
   bookings actions). Each action re-resolves the active workspace + re-checks
   the booking entitlement server-side and confirms the target listing belongs
   to that workspace before any write. Results are { ok, error }.
─────────────────────────────────────────────────────────────────────────── */

type SB = Awaited<ReturnType<typeof createClient>>

export interface WizardResult {
  ok: boolean
  error?: string
}

async function resolveWorkspaceId(supabase: SB, userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", userId)
      .maybeSingle()
    const fromProfile = (profile?.current_workspace_id as string | undefined) ?? null
    if (fromProfile) return fromProfile
    const { data: m } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    return (m?.workspace_id as string | undefined) ?? null
  } catch {
    return null
  }
}

async function authoriseListing(
  listingId: string
): Promise<
  | { ok: true; supabase: SB; workspaceId: string; userId: string }
  | { ok: false; error: string }
> {
  if (!listingId) return { ok: false, error: "A listing is required." }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "You need to be signed in." }
  const workspaceId = await resolveWorkspaceId(supabase, user.id)
  if (!workspaceId) return { ok: false, error: "No active workspace found." }
  await resolveWorkspaceContext(supabase, workspaceId)
  const gate = await gateBookingPages(supabase, workspaceId)
  if (!gate.allowed) return { ok: false, error: gate.reason ?? "Booking management isn't on your plan." }

  // Confirm the listing belongs to this workspace (RLS-bound read).
  const { data: listing, error } = await supabase
    .from("booking_listings")
    .select("id, workspace_id")
    .eq("id", listingId)
    .maybeSingle()
  if (error || !listing || (listing as { workspace_id: string }).workspace_id !== workspaceId) {
    return { ok: false, error: "Listing not found in your workspace." }
  }
  return { ok: true, supabase, workspaceId, userId: user.id }
}

// ── Accommodation typing ──────────────────────────────────────────────────────

export interface SaveAccommodationInput {
  listingId: string
  accommodationCategory: string
  letType?: string | null
  typeDetails?: Partial<TypeDetails>
}

export async function saveAccommodation(input: SaveAccommodationInput): Promise<WizardResult> {
  const auth = await authoriseListing(input.listingId)
  if (!auth.ok) return { ok: false, error: auth.error }
  const ok = await setListingAccommodation(auth.supabase, input.listingId, {
    accommodationCategory: input.accommodationCategory,
    letType: input.letType ?? null,
    typeDetailsPatch: input.typeDetails,
  })
  return ok ? { ok: true } : { ok: false, error: "Could not save accommodation details." }
}

// ── Amenities (catalogue-driven) ──────────────────────────────────────────────

export async function saveAmenitySelection(
  listingId: string,
  slugs: string[]
): Promise<WizardResult> {
  const auth = await authoriseListing(listingId)
  if (!auth.ok) return { ok: false, error: auth.error }
  const ok = await setListingAmenities(auth.supabase, listingId, slugs)
  return ok ? { ok: true } : { ok: false, error: "Could not save amenities." }
}

// ── Keyless lock config ───────────────────────────────────────────────────────

export interface SaveKeylessInput {
  listingId: string
  provider: KeylessProvider
  deviceRef?: string | null
  instructions?: string | null
  staticCode?: string | null
  active?: boolean
}

export async function saveKeylessLock(input: SaveKeylessInput): Promise<WizardResult> {
  const auth = await authoriseListing(input.listingId)
  if (!auth.ok) return { ok: false, error: auth.error }
  const saved = await upsertKeylessLock(auth.supabase, {
    listingId: input.listingId,
    workspaceId: auth.workspaceId,
    provider: input.provider,
    deviceRef: input.deviceRef ?? null,
    instructions: input.instructions ?? null,
    staticCode: input.staticCode,
    active: input.active ?? true,
  })
  return saved ? { ok: true } : { ok: false, error: "Could not save the keyless lock." }
}
