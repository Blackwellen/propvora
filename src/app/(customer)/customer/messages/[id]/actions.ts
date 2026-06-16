"use server"

import { revalidatePath } from "next/cache"
import {
  requireCustomerContext,
  getCustomerMessageThread,
  postCustomerMessage,
} from "@/lib/customer"

/* Reply to an existing customer thread. The thread is re-fetched under the
   guest's RLS-scoped client first, so a guest can only ever post to their own
   thread (a foreign thread id resolves to null and the action no-ops). */

export async function sendThreadMessageAction(threadId: string, body: string): Promise<void> {
  const { supabase, workspaceId, displayName, userId } = await requireCustomerContext()
  if (!body.trim()) return

  const thread = await getCustomerMessageThread(supabase, workspaceId, threadId)
  if (!thread) return

  await postCustomerMessage(supabase, workspaceId, {
    threadId,
    bookingId: thread.booking_id ?? null,
    body,
    senderName: displayName,
    senderId: userId,
  })
  revalidatePath(`/customer/messages/${threadId}`)
  revalidatePath("/customer/messages")
}
