import Link from "next/link"
import { Search, CalendarCheck, MessageSquare, FileText, ChevronRight, type LucideIcon } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { CustomerPageHeader, CustomerCard, CustomerEmptyState } from "@/components/customer/ui"
import WorkspaceSearch from "@/components/customer/WorkspaceSearch"
import { requireCustomerContext, searchCustomerWorkspace } from "@/lib/customer"

export const metadata = { title: "Search · Propvora" }
export const dynamic = "force-dynamic"

function ResultGroup({
  icon: Icon,
  title,
  rows,
}: {
  icon: LucideIcon
  title: string
  rows: { id: string; title: string; sub: string; href: string }[]
}) {
  if (rows.length === 0) return null
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-slate-400" /> {title}
        <span className="text-slate-400 font-normal">({rows.length})</span>
      </h2>
      <CustomerCard className="p-2">
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={`${title}-${r.id}`}>
              <Link href={r.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                  {r.sub && <p className="text-[12.5px] text-slate-500 truncate">{r.sub}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </CustomerCard>
    </section>
  )
}

export default async function CustomerSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const term = (q ?? "").trim()
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const results = term ? await searchCustomerWorkspace(supabase, workspaceId, email, term) : { bookings: [], messages: [], documents: [] }
  const total = results.bookings.length + results.messages.length + results.documents.length

  return (
    <div className="space-y-5">
      <MobileTopBar title="Search" subtitle="Bookings, messages, documents" />

      <CustomerPageHeader
        title="Search"
        subtitle="Find a booking, a conversation or a document across your whole workspace."
      />

      <WorkspaceSearch initial={term} />

      {!term ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={Search}
            title="Search your workspace"
            description="Type a property name, a booking reference, a host's message or a document title to jump straight to it."
          />
        </CustomerCard>
      ) : total === 0 ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={Search}
            title="No results"
            description={`Nothing in your workspace matches "${term}". Try a shorter or different term.`}
          />
        </CustomerCard>
      ) : (
        <div className="space-y-5">
          <ResultGroup icon={CalendarCheck} title="Bookings" rows={results.bookings} />
          <ResultGroup icon={MessageSquare} title="Messages" rows={results.messages} />
          <ResultGroup icon={FileText} title="Documents" rows={results.documents} />
        </div>
      )}
    </div>
  )
}
