"use server"

import { revalidatePath } from "next/cache"
import { requireCustomerContext, saveListing, unsaveListing } from "@/lib/customer"

/* Server actions for the customer Saved (favourites) list. Each resolves the
   caller's customer workspace via requireCustomerContext (which redirects a
   non-customer), so a customer can only ever (un)save within their OWN
   workspace — RLS enforces the same server-side. */

export async function unsaveListingAction(listingId: string): Promise<void> {
  const { supabase, workspaceId } = await requireCustomerContext()
  await unsaveListing(supabase, workspaceId, listingId)
  revalidatePath("/customer/saved")
  revalidatePath("/customer")
}

export async function saveListingAction(listingId: string): Promise<void> {
  const { supabase, workspaceId } = await requireCustomerContext()
  await saveListing(supabase, workspaceId, listingId)
  revalidatePath("/customer/saved")
  revalidatePath("/customer")
}
