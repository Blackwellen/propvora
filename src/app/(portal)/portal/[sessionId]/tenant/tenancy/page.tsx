import Link from "next/link"
import { ArrowLeft, Home, Calendar, PoundSterling, FileText } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../../_guard"
import { getTenantTenancies } from "@/lib/portal/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatMoney, formatDate, tenancyStatusMeta } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function rentFrequencyLabel(freq: string | null | undefined): string {
  switch (freq) {
    case "weekly": return "per week"
    case "quarterly": return "per quarter"
    case "annually": return "per year"
    default: return "per month"
  }
}

export default async function TenantTenancyPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`

  const tenancies = await getTenantTenancies(session)
  const current = tenancies.find((t) => t.status === "active") ?? tenancies[0] ?? null

  let propertyLabel = "Your home"
  if (current?.property_id) {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from("properties")
        .select("nickname, address_line1, city, postcode")
        .eq("id", current.property_id)
        .eq("workspace_id", session.workspaceId)
        .maybeSingle()
      if (data) {
        propertyLabel =
          (data.nickname as string) ||
          [data.address_line1, data.city, data.postcode].filter(Boolean).join(", ") ||
          "Your home"
      }
    } catch {
      /* tolerate */
    }
  }

  return (
    <div className="space-y-5">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-xl font-bold text-slate-900">Tenancy details</h1>

      {!current ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Home className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No tenancy on record</h3>
            <p className="text-xs text-slate-400 mt-1">Your tenancy details will appear here once set up.</p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border-slate-200 p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Property</p>
                <p className="text-sm font-semibold text-slate-900">{propertyLabel}</p>
              </div>
            </div>
            <Badge variant={tenancyStatusMeta(current.status).variant} dot>
              {tenancyStatusMeta(current.status).label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Detail icon={<PoundSterling className="w-4 h-4 text-slate-400" />} label="Rent"
              value={`${formatMoney(current.rent_amount)}`} sub={rentFrequencyLabel(current.rent_frequency)} />
            <Detail icon={<Calendar className="w-4 h-4 text-slate-400" />} label="Start date"
              value={formatDate(current.start_date)} />
            <Detail icon={<Calendar className="w-4 h-4 text-slate-400" />} label="End date"
              value={formatDate(current.end_date)} />
            {current.deposit_amount != null && (
              <Detail icon={<PoundSterling className="w-4 h-4 text-slate-400" />} label="Deposit"
                value={formatMoney(current.deposit_amount)} />
            )}
            {current.reference && (
              <Detail icon={<FileText className="w-4 h-4 text-slate-400" />} label="Reference"
                value={current.reference} />
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function Detail({
  icon, label, value, sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}
