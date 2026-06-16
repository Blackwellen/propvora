"use server"

import { revalidatePath } from "next/cache"
import {
  requireCustomerContext,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from "@/lib/customer"

export async function markAllReadAction(): Promise<void> {
  const { supabase, workspaceId } = await requireCustomerContext()
  await markAllCustomerNotificationsRead(supabase, workspaceId)
  revalidatePath("/customer/notifications")
  revalidatePath("/customer")
}

export async function markOneReadAction(id: string): Promise<void> {
  const { supabase, workspaceId } = await requireCustomerContext()
  await markCustomerNotificationRead(supabase, workspaceId, id)
  revalidatePath("/customer/notifications")
  revalidatePath("/customer")
}
