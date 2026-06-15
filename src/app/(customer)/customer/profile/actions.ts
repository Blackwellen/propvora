"use server"

import { revalidatePath } from "next/cache"
import { requireCustomerContext, upsertCustomerProfile } from "@/lib/customer"

/* Server action to save the customer profile. The workspace is resolved inside
   requireCustomerContext (redirects a non-customer), so a customer can only
   ever write their OWN profile — RLS enforces the same. */

export interface ProfileFormResult {
  ok: boolean
  error?: string
}

export async function saveCustomerProfileAction(
  _prev: ProfileFormResult,
  formData: FormData
): Promise<ProfileFormResult> {
  const { supabase, workspaceId } = await requireCustomerContext()

  const display_name = (formData.get("display_name") as string)?.trim() || null
  const email = (formData.get("email") as string)?.trim() || null
  const phone = (formData.get("phone") as string)?.trim() || null

  // Preferences (checkboxes → booleans).
  const preferences = {
    email_updates: formData.get("pref_email_updates") === "on",
    booking_reminders: formData.get("pref_booking_reminders") === "on",
    marketing: formData.get("pref_marketing") === "on",
  }

  try {
    const saved = await upsertCustomerProfile(supabase, workspaceId, {
      display_name,
      email,
      phone,
      preferences,
    })
    if (!saved) {
      return { ok: false, error: "We couldn't save your profile right now. Please try again." }
    }
    revalidatePath("/customer/profile")
    return { ok: true }
  } catch {
    return { ok: false, error: "We couldn't save your profile right now. Please try again." }
  }
}
