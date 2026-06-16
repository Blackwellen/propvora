import React from "react"
import { redirect } from "next/navigation"
import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import ModerationClient from "./ModerationClient"

export const dynamic = "force-dynamic"

interface ListingRow {
  id: string
  workspace_id: string | null
  company_name: string
  title: string | null
  listing_type: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
  trades: string[] | null
  location_city: string | null
  location_postcode: string | null
  contact_email: string | null
}

/**
 * Platform-admin Marketplace Moderation queue.
 *
 * Lists all marketplace_listings with status='pending_review' for admin
 * approve/reject action. Uses the service-role admin client (cross-workspace
 * read) behind a server-side admin identity gate.
 */
export default async function MarketplaceModerationPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const adminDb = createAdminClient()

  let listings: ListingRow[] = []
  let schemaGap = false

  try {
    const { data, error } = await adminDb
      .from("marketplace_listings")
      .select(
        "id, workspace_id, company_name, title, listing_type, description, status, created_at, updated_at, metadata, trades, location_city, location_postcode, contact_email"
      )
      .eq("status", "pending_review")
      .order("updated_at", { ascending: true })

    if (error) {
      const code = (error as { code?: string }).code
      if (code === "42P01" || code === "PGRST205") {
        schemaGap = true
      } else {
        throw error
      }
    } else {
      listings = (data ?? []) as ListingRow[]
    }
  } catch {
    schemaGap = true
  }

  return <ModerationClient listings={listings} schemaGap={schemaGap} />
}
