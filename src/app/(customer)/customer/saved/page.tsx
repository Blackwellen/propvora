import Link from "next/link"
import { Heart, Store } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { CustomerPageHeader, CustomerCard, CustomerEmptyState } from "@/components/customer/ui"
import SavedListingCard from "@/components/customer/SavedListingCard"
import { requireCustomerContext, listSavedListings } from "@/lib/customer"
import { unsaveListingAction } from "./actions"

export const metadata = { title: "Saved · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerSavedPage() {
  const { supabase, workspaceId } = await requireCustomerContext()
  const saved = await listSavedListings(supabase, workspaceId)

  // Server action bound for the client cards (workspace resolved inside).
  async function handleUnsave(listingId: string) {
    "use server"
    await unsaveListingAction(listingId)
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Saved" subtitle={`${saved.length} listing${saved.length === 1 ? "" : "s"}`} />

      <CustomerPageHeader
        title="Saved listings"
        subtitle="Listings you've favourited from the marketplace. Tap the heart to remove one."
      />

      {saved.length === 0 ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={Heart}
            title="No saved listings"
            description="Tap the heart on any marketplace listing to save it here for later. Your favourites stay private to your account."
            action={
              <Link
                href="/property-manager/marketplace"
                className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
              >
                <Store className="w-4 h-4" /> Browse marketplace
              </Link>
            }
          />
        </CustomerCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((s) => (
            <SavedListingCard key={s.id} saved={s} onUnsave={handleUnsave} />
          ))}
        </div>
      )}
    </div>
  )
}
