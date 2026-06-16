"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  requireCustomerContext,
  getCustomerBooking,
  postCustomerMessage,
} from "@/lib/customer"

export interface ChangeRequestResult {
  ok: boolean
  error?: string
}

/**
 * Submit a booking change request. We persist it as a real host message (the
 * customer_message_threads/customer_messages tables) so it lands in the guest's
 * conversation with the host AND drops a notification — no fake "requests" table.
 */
export async function submitChangeRequestAction(
  bookingId: string,
  payload: { type: string; check_in?: string; check_out?: string; guests?: string; note: string }
): Promise<ChangeRequestResult> {
  const { supabase, workspaceId, displayName, userId } = await requireCustomerContext()

  const booking = await getCustomerBooking(supabase, workspaceId, null, bookingId)
  if (!booking) return { ok: false, error: "Booking not found." }

  const lines = [
    `Change request: ${payload.type.replace(/_/g, " ")}`,
    payload.check_in ? `New check-in: ${payload.check_in}` : "",
    payload.check_out ? `New check-out: ${payload.check_out}` : "",
    payload.guests ? `Guests: ${payload.guests}` : "",
    payload.note ? `Note: ${payload.note}` : "",
  ].filter(Boolean)

  try {
    const threadId = await postCustomerMessage(supabase, workspaceId, {
      bookingId,
      subject: `Change request · ${booking.listing_title ?? booking.booking_ref ?? "your stay"}`,
      body: lines.join("\n"),
      senderName: displayName,
      senderId: userId,
    })
    if (!threadId) return { ok: false, error: "Could not send your request. Please try again." }

    // Best-effort notification for the guest's own centre.
    try {
      const writer = createAdminClient()
      await writer.from("customer_notifications").insert({
        customer_workspace_id: workspaceId,
        user_id: userId,
        kind: "change_requested",
        title: "Change request sent",
        body: `We've sent your ${payload.type.replace(/_/g, " ")} request to the host.`,
        href: `/user/bookings/${bookingId}`,
        severity: "info",
        entity_type: "booking",
        entity_id: bookingId,
      })
    } catch {
      // non-fatal
    }

    revalidatePath(`/customer/bookings/${bookingId}`)
    revalidatePath("/customer/messages")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not send your request. Please try again." }
  }
}
