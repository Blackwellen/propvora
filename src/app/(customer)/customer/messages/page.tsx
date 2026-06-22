import MessagesClient from "@/features/customer/messages/MessagesClient"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { listCustomerMessageThreads } from "@/lib/customer/data"

export const metadata = { title: "Messages · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerMessagesPage() {
  const { supabase, workspaceId } = await requireCustomerContext()
  const threads = await listCustomerMessageThreads(supabase, workspaceId)
  return <MessagesClient threads={threads} />
}
