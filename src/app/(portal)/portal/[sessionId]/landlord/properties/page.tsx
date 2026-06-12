import Link from "next/link"
import { ArrowLeft, Building2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../../_guard"
import { getLandlordProperties } from "@/lib/portal/data"
import { formatMoney, propertyStatusMeta } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function propertyLabel(p: { nickname: string | null; address_line1: string | null; city: string | null }) {
  return p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
}

export default async function LandlordPropertiesPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`
  const properties = await getLandlordProperties(session)

  return (
    <div className="space-y-5">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <div>
        <h1 className="text-xl font-bold text-slate-900">Properties</h1>
        <p className="text-sm text-slate-500">
          {properties.length} propert{properties.length === 1 ? "y" : "ies"} shared with you
        </p>
      </div>

      {properties.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No properties shared yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Properties your manager links to you will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {properties.map((p) => {
            const meta = propertyStatusMeta(p.status)
            return (
              <Card key={p.id} className="p-4 rounded-2xl border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{propertyLabel(p)}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {[p.address_line1, p.city, p.postcode].filter(Boolean).join(", ") || "Address not set"}
                    </p>
                  </div>
                  <Badge variant={meta.variant} dot>{meta.label}</Badge>
                </div>
                {p.target_rent_pcm != null && (
                  <p className="text-xs text-slate-500 mt-2">
                    Target rent: <span className="font-medium text-slate-700">{formatMoney(p.target_rent_pcm)}</span> pcm
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
