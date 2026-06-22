import FavouritesClient, { type SavedFavourite } from "@/features/customer/favourites/FavouritesClient"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { listSavedListings } from "@/lib/customer/data"

export const metadata = { title: "Favourites · Propvora" }
export const dynamic = "force-dynamic"

const PLACEHOLDER = "/property-types/holiday.jpg"

export default async function CustomerFavouritesPage() {
  const { supabase, workspaceId } = await requireCustomerContext()
  const saved = await listSavedListings(supabase, workspaceId)

  const savedItems: SavedFavourite[] = saved
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

  return <FavouritesClient savedItems={savedItems} />
}
