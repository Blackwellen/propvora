import Link from "next/link"
import { Building2, Home, PoundSterling, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../_guard"
import { getLandlordProperties } from "@/lib/portal/data"
import { formatMoney, propertyStatusMeta } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function propertyLabel(p: { nickname: string | null; address_line1: string | null; city: string | null }) {
  return p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
}

export default async function LandlordPortalHome({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`

  // Strictly scoped: only properties this landlord is linked to. Empty set
  // => empty portal (never all-workspace).
  const properties = await getLandlordProperties(session)

  const total = properties.length
  const occupied = properties.filter((p) => p.status === "active" || p.status === "occupied").length
  const rentRoll = properties.reduce((s, p) => s + (p.target_rent_pcm ?? 0), 0)

  const kpis = [
    { label: "Properties", value: total, colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", icon: Building2 },
    { label: "Occupied", value: occupied, colour: "text-[#059669]", bg: "bg-[#ECFDF5]", icon: Home },
    { label: "Target Rent (pcm)", value: formatMoney(rentRoll), colour: "text-[#0EA5E9]", bg: "bg-[#f0f9ff]", icon: PoundSterling },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your portfolio</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          A read-only view of the properties shared with you by {session.workspaceName}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4 rounded-2xl border-slate-200">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${kpi.bg}`}>
                <Icon className={`w-4 h-4 ${kpi.colour}`} />
              </div>
              <p className={`text-xl font-bold ${kpi.colour}`}>{kpi.value}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">{kpi.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Properties</h2>
          <Link href={`${base}/properties`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {properties.length === 0 ? (
          <Card className="rounded-2xl border-slate-200">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No properties shared yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                When your property manager links a property to you, it will appear here.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {properties.slice(0, 6).map((p) => {
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
    </div>
  )
}
