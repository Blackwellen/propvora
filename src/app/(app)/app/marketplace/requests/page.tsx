import { Inbox, Mail, Phone } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMarketplaceAccess } from "@/components/marketplace/server"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState"

/* Marketplace REQUESTS — incoming quote enquiries (`marketplace_enquiries`) for
   the workspace's own listings. RLS (`marketplace_enquiries_seller_read`) scopes
   to listings this workspace owns. Tolerant of a cold table → empty state. */

export const dynamic = "force-dynamic"

interface EnquiryRow {
  id: string
  message: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  status: string | null
  created_at: string | null
  listing: { title: string | null } | { title: string | null }[] | null
}

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#EFF6FF] text-[#2563EB] border border-blue-100",
  contacted: "bg-violet-50 text-[#7C3AED] border border-violet-100",
  closed: "bg-slate-100 text-slate-500 border border-slate-200",
  spam: "bg-red-50 text-red-600 border border-red-100",
}

export default async function MarketplaceRequestsPage() {
  await getMarketplaceAccess()
  const supabase = await createClient()

  let rows: EnquiryRow[] = []
  try {
    const { data, error } = await supabase
      .from("marketplace_enquiries")
      .select("id, message, buyer_name, buyer_email, buyer_phone, status, created_at, listing:marketplace_listings(title)")
      .order("created_at", { ascending: false })
      .limit(100)
    if (!error && Array.isArray(data)) rows = data as unknown as EnquiryRow[]
  } catch {
    /* tolerate cold DB */
  }

  const titleOf = (r: EnquiryRow): string => {
    const l = r.listing
    const obj = Array.isArray(l) ? l[0] : l
    return obj?.title ?? "Listing enquiry"
  }

  return (
    <DashboardContainer>
      <MobileTopBar title="Requests" subtitle="Incoming enquiries" showBack backHref="/app/marketplace" />
      <div className="hidden md:block">
        <PageHeader title="Quote requests" description="Buyers who have enquired about your marketplace listings" />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <MarketplaceEmptyState
            variant="no-results"
            title="No requests yet"
            description="When a buyer requests a quote on one of your listings, it appears here so you can respond quickly."
            action={{ label: "View my listings", href: "/app/marketplace/my-listings", icon: Inbox }}
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-900 truncate">{titleOf(r)}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {r.buyer_name ?? "A buyer"} · {r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : ""}
                  </p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[r.status ?? "new"] ?? STATUS_STYLE.new}`}>
                  {r.status ?? "new"}
                </span>
              </div>
              {r.message && <p className="mt-2 text-[13px] text-slate-600 line-clamp-3">{r.message}</p>}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px]">
                {r.buyer_email && (
                  <a href={`mailto:${r.buyer_email}`} className="inline-flex items-center gap-1 font-medium text-[#2563EB] hover:underline">
                    <Mail className="w-3.5 h-3.5" /> {r.buyer_email}
                  </a>
                )}
                {r.buyer_phone && (
                  <a href={`tel:${r.buyer_phone}`} className="inline-flex items-center gap-1 font-medium text-slate-600 hover:underline">
                    <Phone className="w-3.5 h-3.5" /> {r.buyer_phone}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardContainer>
  )
}
