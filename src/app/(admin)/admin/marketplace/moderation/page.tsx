import React from "react"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import ModerationClient from "./ModerationClient"
import { AdminPageHeader } from "@/components/admin/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Moderation — Propvora admin" }

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
export interface ModerationKpis {
  pending: number
  approvedToday: number
  rejectedToday: number
  flagged: number
}

export default async function MarketplaceModerationPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const adminDb = createAdminClient()

  let listings: ListingRow[] = []
  let schemaGap = false
  const kpis: ModerationKpis = { pending: 0, approvedToday: 0, rejectedToday: 0, flagged: 0 }

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
      kpis.pending = listings.length
      kpis.flagged = listings.filter(
        (l) => (l.metadata as Record<string, unknown> | null)?.flagged === true
      ).length

      // Approved / rejected today — derived from moderation timestamps in
      // metadata (set by the moderate route). Schema-gap-safe & best-effort.
      try {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const { data: decided } = await adminDb
          .from("marketplace_listings")
          .select("status, metadata")
          .in("status", ["published", "draft"])
          .gte("updated_at", startOfDay.toISOString())
          .limit(2000)
        for (const d of decided ?? []) {
          const meta = (d as { metadata?: Record<string, unknown> }).metadata ?? {}
          if (meta.moderation_approved_at) kpis.approvedToday++
          else if (meta.moderation_rejected_at) kpis.rejectedToday++
        }
      } catch {
        /* non-fatal */
      }
    }
  } catch {
    schemaGap = true
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={ShieldCheck}
        title="Marketplace moderation"
        subtitle="Review and approve or reject marketplace listings pending moderation. Every decision is recorded as an explicit, audited admin action."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Marketplace" }, { label: "Moderation" }]}
      />
      <ModerationClient listings={listings} schemaGap={schemaGap} kpis={kpis} />
    </div>
  )
}
