import Link from "next/link"
import { MessageSquare, ChevronRight } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { CustomerPageHeader, CustomerCard, CustomerEmptyState } from "@/components/customer/ui"
import { timeAgo } from "@/components/customer/format"
import { requireCustomerContext, listCustomerMessageThreads } from "@/lib/customer"

export const metadata = { title: "Messages · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerMessagesPage() {
  const { supabase, workspaceId } = await requireCustomerContext()
  const threads = await listCustomerMessageThreads(supabase, workspaceId)

  return (
    <div className="space-y-5">
      <MobileTopBar title="Messages" subtitle={`${threads.length} conversation${threads.length === 1 ? "" : "s"}`} />

      <CustomerPageHeader
        title="Messages"
        subtitle="Conversations with hosts and property managers about your stays. Open a trip to start one."
      />

      {threads.length === 0 ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="When you message a host from a trip, or they reach out about a booking, your conversations appear here — all in one place."
            action={
              <Link href="/user/bookings" className="inline-flex items-center rounded-xl bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors">
                Go to my bookings
              </Link>
            }
          />
        </CustomerCard>
      ) : (
        <CustomerCard className="p-2">
          <ul className="divide-y divide-slate-100">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/user/messages/${t.id}`} className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="relative w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#2563EB]" />
                    {(t.unread ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.title || "Conversation"}</p>
                      {t.last_at && <span className="text-[11px] text-slate-400 shrink-0 ml-auto">{timeAgo(t.last_at)}</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {t.last_message ? `${t.last_sender ? `${t.last_sender}: ` : ""}${t.last_message}` : "No messages yet"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </CustomerCard>
      )}
    </div>
  )
}
