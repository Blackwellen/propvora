import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, CalendarCheck } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import MessageThreadView from "@/components/customer/MessageThreadView"
import {
  requireCustomerContext,
  getCustomerMessageThread,
  listCustomerThreadMessages,
} from "@/lib/customer"
import { sendThreadMessageAction } from "./actions"

export const metadata = { title: "Conversation · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, workspaceId, displayName } = await requireCustomerContext()
  const thread = await getCustomerMessageThread(supabase, workspaceId, id)
  if (!thread) notFound()
  const messages = await listCustomerThreadMessages(supabase, workspaceId, id)

  async function handleSend(body: string) {
    "use server"
    await sendThreadMessageAction(id, body)
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title={thread.title || "Conversation"} showBack backHref="/user/messages" />

      <div className="hidden md:block">
        <Link href="/user/messages" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to messages
        </Link>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">{thread.title || "Conversation"}</h1>
          {thread.booking_id && (
            <Link
              href={`/user/bookings/${thread.booking_id}`}
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors shrink-0"
            >
              <CalendarCheck className="w-4 h-4" /> View trip
            </Link>
          )}
        </div>
      </div>

      <MessageThreadView initial={messages} guestName={displayName.split(/[\s@]/)[0]} sendAction={handleSend} />
    </div>
  )
}
