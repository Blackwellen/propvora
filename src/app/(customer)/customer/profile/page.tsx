import { MobileTopBar } from "@/components/mobile"
import { CustomerPageHeader } from "@/components/customer/ui"
import ProfileForm from "@/components/customer/ProfileForm"
import { requireCustomerContext, getCustomerProfile } from "@/lib/customer"
import type { CustomerProfile } from "@/lib/customer"

export const metadata = { title: "Profile · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerProfilePage() {
  const { supabase, workspaceId, email, displayName } = await requireCustomerContext()
  const existing = await getCustomerProfile(supabase, workspaceId)

  // Seed sensible defaults from the account so first-time profiles aren't blank.
  const profile: CustomerProfile = existing ?? {
    workspace_id: workspaceId,
    display_name: displayName === email ? null : displayName,
    email: email ?? null,
    phone: null,
    preferences: { email_updates: true, booking_reminders: true, marketing: false },
    created_at: "",
    updated_at: "",
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Profile" subtitle="Your account details" />

      <CustomerPageHeader
        title="Profile"
        subtitle="Manage your contact details and notification preferences."
      />

      <ProfileForm profile={profile} />
    </div>
  )
}
