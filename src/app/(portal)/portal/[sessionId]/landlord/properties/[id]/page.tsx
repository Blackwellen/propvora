import Link from "next/link"
import { ArrowLeft, Building2, MapPin, PoundSterling, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../../../_guard"
import { getLandlordProperty, getLandlordPropertyTransactions } from "@/lib/portal/data-extra"
import { formatMoney, formatDate, propertyStatusMeta } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function LandlordPropertyDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string; id: string }>
}) {
  const { sessionId, id } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`
  const property = await getLandlordProperty(session, id)

  if (!property) {
    return (
      <div className="space-y-5">
        <Link href={`${base}/properties`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to properties
        </Link>
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4"><Building2 className="w-7 h-7 text-slate-400" /></div>
            <h3 className="text-base font-semibold text-slate-700">Property not available</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">This property either doesn&apos;t exist or isn&apos;t shared with you.</p>
          </div>
        </Card>
      </div>
    )
  }

  const meta = propertyStatusMeta(property.status)
  const label = property.nickname || [property.address_line1, property.city].filter(Boolean).join(", ") || "Property"
  const transactions = await getLandlordPropertyTransactions(session, id)

  return (
    <div className="space-y-5">
      <Link href={`${base}/properties`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to properties
      </Link>

      <Card className="rounded-2xl border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">{label}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {[property.address_line1, property.city, property.postcode].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
          <Badge variant={meta.variant} dot>{meta.label}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="flex items-start gap-2">
            <PoundSterling className="w-4 h-4 text-slate-400 mt-0.5" />
            <div><p className="text-xs text-slate-500">Target rent</p><p className="text-sm font-semibold text-slate-900">{property.target_rent_pcm != null ? `${formatMoney(property.target_rent_pcm)} pcm` : "—"}</p></div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-2">Recent transactions</h2>
        {transactions.length === 0 ? (
          <Card className="rounded-2xl border-slate-200"><div className="py-10 text-center text-sm text-slate-400">No transactions recorded for this property yet.</div></Card>
        ) : (
          <Card className="rounded-2xl border-slate-200 divide-y divide-slate-100 p-0 overflow-hidden">
            {transactions.map((t) => {
              const incoming = t.direction === "in"
              return (
                <div key={t.id} className="flex items-center gap-3 p-3.5">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${incoming ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                    {incoming ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{t.description || t.category || (incoming ? "Income" : "Expense")}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(t.created_at)}</p>
                  </div>
                  <span className={`text-[13px] font-bold shrink-0 ${incoming ? "text-emerald-600" : "text-slate-900"}`}>{incoming ? "+" : "−"}{formatMoney(t.amount, t.currency ?? "GBP")}</span>
                </div>
              )
            })}
          </Card>
        )}
      </div>
    </div>
  )
}
