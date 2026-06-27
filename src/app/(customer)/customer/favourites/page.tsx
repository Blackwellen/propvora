import FavouritesClient, { type SavedFavourite } from "@/features/customer/favourites/FavouritesClient"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { listSavedListings } from "@/lib/customer/data"
import { getPublicStayBySlug } from "@/lib/public-marketplace/queries"

export const metadata = { title: "Favourites · Propvora" }
export const dynamic = "force-dynamic"

const PLACEHOLDER = "/property-types/holiday.jpg"

export default async function CustomerFavouritesPage() {
  const { supabase, workspaceId } = await requireCustomerContext()

  // 1) Canonical saved DB listings (uuid listing_id) — pre-existing system.
  const saved = await listSavedListings(supabase, workspaceId)
  const fromListings: SavedFavourite[] = saved
    .filter((s) => s.listing)
    .map((s) => {
      const l = s.listing!
      const isLet = /let|long|tenanc|rent/i.test(`${l.listing_type ?? ""} ${l.category ?? ""}`)
      return {
        id: s.listing_id,
        title: l.title ?? l.company_name ?? "Saved property",
        location: l.location ?? l.location_city ?? "",
        image: l.images?.[0] ?? PLACEHOLDER,
        pricePence: l.base_price_pence ?? l.price ?? 0,
        pricePer: isLet ? "month" : "night",
        href: `/customer/stays/${s.listing_id}`,
        kind: isLet ? "let" : "stay",
        available: l.status === "published" || l.status === "active" ? "Available" : "",
      }
    })

  // 2) Slug-based marketplace favourites (customer_favourites) — saved from the
  //    public stay pages. Hydrate each ref from the marketplace stay data.
  let fromFavourites: SavedFavourite[] = []
  try {
    const { data: favRows } = await supabase
      .from("customer_favourites")
      .select("metadata_json, entity_type")
      .eq("entity_type", "stay")
      .neq("status", "removed")
    const slugs = Array.from(
      new Set(
        ((favRows as { metadata_json?: { ref?: string } | null }[] | null) ?? [])
          .map((r) => r.metadata_json?.ref)
          .filter((r): r is string => Boolean(r))
      )
    )
    const stays = await Promise.all(slugs.map((slug) => getPublicStayBySlug(slug).catch(() => null)))
    fromFavourites = stays
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({
        id: s.slug,
        title: s.title,
        location: s.location,
        image: s.gallery?.[0] ?? PLACEHOLDER,
        pricePence: s.pricePerNight,
        pricePer: "night" as const,
        href: `/customer/stays/${s.slug}`,
        kind: "stay" as const,
        available: "Available",
      }))
  } catch {
    // customer_favourites missing or unreadable → just show listing-based saves
  }

  // Merge + dedupe by id (listing-based wins on collision).
  const seen = new Set(fromListings.map((s) => s.id))
  const savedItems = [...fromListings, ...fromFavourites.filter((s) => !seen.has(s.id))]

  return <FavouritesClient savedItems={savedItems} />
}
