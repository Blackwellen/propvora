import Link from "next/link"
import { Heart, ChevronRight } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { CustomerPageHeader, CustomerCard } from "@/components/customer/ui"
import ProfileForm from "@/components/customer/ProfileForm"
import StaysSummaryChart from "@/components/customer/StaysSummaryChart"
import SavedSearchesList from "@/components/customer/SavedSearchesList"
import {
  requireCustomerContext,
  getCustomerProfile,
  getCustomerStaySummary,
  listCustomerSavedSearches,
  listSavedListings,
} from "@/lib/customer"
import type { CustomerProfile } from "@/lib/customer"
import { deleteSavedSearchAction } from "./actions"

export const metadata = { title: "Profile · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerProfilePage() {
  const { supabase, workspaceId, email, displayName } = await requireCustomerContext()
  const [existing, summary, searches, saved] = await Promise.all([
    getCustomerProfile(supabase, workspaceId),
    getCustomerStaySummary(supabase, workspaceId, email),
    listCustomerSavedSearches(supabase, workspaceId),
    listSavedListings(supabase, workspaceId),
  ])

  const profile: CustomerProfile = existing ?? {
    workspace_id: workspaceId,
    display_name: displayName === email ? null : displayName,
    email: email ?? null,
    phone: null,
    preferences: { email_updates: true, booking_reminders: true, marketing: false, sms_updates: false },
    created_at: "",
    updated_at: "",
  }

  async function handleDeleteSearch(id: string) {
    "use server"
    await deleteSavedSearchAction(id)
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Profile" subtitle="Your account details" />

      <CustomerPageHeader
        title="Profile"
        subtitle="Manage your contact details, communication preferences, saved searches and wishlist."
      />

      <ProfileForm profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StaysSummaryChart summary={summary} />
        <SavedSearchesList searches={searches} deleteAction={handleDeleteSearch} />
      </div>

      <CustomerCard className="p-5">
        <Link href="/user/saved" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Wishlist</p>
            <p className="text-[13px] text-slate-500">
              {saved.length > 0 ? `${saved.length} saved listing${saved.length === 1 ? "" : "s"}` : "Save listings you like for later"}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB]" />
        </Link>
      </CustomerCard>
    </div>
  )
}
