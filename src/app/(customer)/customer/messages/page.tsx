import { MessageSquare, ChevronRight } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { CustomerPageHeader, CustomerCard, CustomerEmptyState } from "@/components/customer/ui"
import { timeAgo, humanise } from "@/components/customer/format"
import { requireCustomerContext, listCustomerThreads } from "@/lib/customer"

export const metadata = { title: "Messages · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerMessagesPage() {
  const { supabase, workspaceId } = await requireCustomerContext()
  const threads = await listCustomerThreads(supabase, workspaceId)

  return (
    <div className="space-y-5">
      <MobileTopBar title="Messages" subtitle={`${threads.length} conversation${threads.length === 1 ? "" : "s"}`} />

      <CustomerPageHeader
        title="Messages"
        subtitle="Conversations with hosts and property managers about your stays and orders."
      />

      {threads.length === 0 ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="When you message a host or they reach out about a booking, your conversations appear here. We'll keep everything in one place."
          />
        </CustomerCard>
      ) : (
        <CustomerCard className="p-2">
          <ul className="divide-y divide-slate-100">
            {threads.map((t) => (
              <li key={t.id}>
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {t.title || (t.type ? humanise(t.type) : "Conversation")}
                      </p>
                      {t.last_at && (
                        <span className="text-[11px] text-slate-400 shrink-0 ml-auto">{timeAgo(t.last_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {t.last_message
                        ? `${t.last_sender ? `${t.last_sender}: ` : ""}${t.last_message}`
                        : "No messages yet"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              </li>
            ))}
          </ul>
        </CustomerCard>
      )}
    </div>
  )
}
