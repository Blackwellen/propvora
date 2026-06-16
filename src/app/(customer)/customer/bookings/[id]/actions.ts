"use server"

import { revalidatePath } from "next/cache"
import {
  requireCustomerContext,
  getCustomerBooking,
  postCustomerMessage,
} from "@/lib/customer"

/* Server actions for the trip detail page. The customer workspace is resolved
   inside requireCustomerContext (which redirects a non-customer), so a guest can
   only ever read/write within their OWN workspace — RLS enforces the same. */

export async function sendTripMessageAction(bookingId: string, body: string): Promise<void> {
  const { supabase, workspaceId, email, displayName, userId } = await requireCustomerContext()
  if (!body.trim()) return

  // Ownership gate: confirm the guest can see this booking before threading on it.
  const booking = await getCustomerBooking(supabase, workspaceId, email, bookingId)
  if (!booking) return

  await postCustomerMessage(supabase, workspaceId, {
    bookingId,
    subject: booking.listing_title ?? booking.booking_ref ?? "Your stay",
    body,
    senderName: displayName,
    senderId: userId,
  })
  revalidatePath(`/customer/bookings/${bookingId}`)
  revalidatePath("/customer/messages")
}
