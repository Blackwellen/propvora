import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMarketplaceAccess } from "@/components/marketplace/server"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState"
import { normaliseListing } from "@/components/marketplace/types"
import { ListingCard } from "@/components/marketplace/ListingCard"

/* Marketplace SAVED — wishlist over `marketplace_saved_items` joined to the
   listing. Workspace-scoped via RLS. Tolerant of a cold table → empty state. */

export const dynamic = "force-dynamic"

const NOT_PROVISIONED = new Set(["42P01", "42703", "PGRST205"])

export default async function MarketplaceSavedPage() {
  const access = await getMarketplaceAccess()
  const supabase = await createClient()

  let listings: ReturnType<typeof normaliseListing>[] = []
  if (access.workspaceId) {
    try {
      const { data, error } = await supabase
        .from("marketplace_saved_items")
        .select(
          "listing_id, created_at, listing:marketplace_listings(id, title, description, transaction_type, category, country_code, currency, base_price_pence, pricing_model, location, location_city, images, status, published_at)"
        )
        .eq("workspace_id", access.workspaceId)
        .order("created_at", { ascending: false })
        .limit(60)
      if (!error && Array.isArray(data)) {
        listings = data
          .map((row) => {
            const l = (row as { listing?: Record<string, unknown> | Record<string, unknown>[] }).listing
            const obj = Array.isArray(l) ? l[0] : l
            return obj ? normaliseListing(obj) : null
          })
          .filter((x): x is ReturnType<typeof normaliseListing> => x !== null && x.id !== "")
      } else if (error && !NOT_PROVISIONED.has(error.code ?? "")) {
        // Real error other than missing table — still degrade to empty.
      }
    } catch {
      /* tolerate cold DB */
    }
  }

  return (
    <DashboardContainer>
      <MobileTopBar title="Saved" subtitle="Your wishlist" showBack backHref="/app/marketplace" />
      <div className="hidden md:block">
        <PageHeader title="Saved listings" description="Listings you've shortlisted across the marketplace" />
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <MarketplaceEmptyState
            variant="no-results"
            title="Nothing saved yet"
            description="Save stays, suppliers and services you're interested in to compare them here later."
            action={{ label: "Browse the marketplace", href: "/app/marketplace", icon: Heart }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </DashboardContainer>
  )
}
