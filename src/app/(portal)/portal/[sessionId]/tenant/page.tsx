import Link from "next/link"
import { Home, PoundSterling, Calendar, ClipboardList, ChevronRight, FileText, CreditCard } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../_guard"
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

export default async function TenantPortalHome({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`

  // Strictly scoped: only this tenant's own tenancies. Empty => empty portal.
  const tenancies = await getTenantTenancies(session)
  const current = tenancies.find((t) => t.status === "active") ?? tenancies[0] ?? null

  // Resolve the property label for the current tenancy (scoped to workspace).
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome home</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Your tenancy with {session.workspaceName}.
        </p>
      </div>

      {!current ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Home className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No active tenancy</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              When your tenancy is set up, your home details will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl border-slate-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Your home</p>
                <h2 className="text-lg font-bold text-slate-900 truncate">{propertyLabel}</h2>
              </div>
              <Badge variant={tenancyStatusMeta(current.status).variant} dot>
                {tenancyStatusMeta(current.status).label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
              <div className="flex items-start gap-2">
                <PoundSterling className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Rent</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatMoney(current.rent_amount)}
                  </p>
                  <p className="text-[11px] text-slate-400">{rentFrequencyLabel(current.rent_frequency)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Started</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(current.start_date)}</p>
                </div>
              </div>
              {current.deposit_amount != null && (
                <div className="flex items-start gap-2">
                  <PoundSterling className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Deposit</p>
                    <p className="text-sm font-semibold text-slate-900">{formatMoney(current.deposit_amount)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            <Link href={`${base}/tenancy`}>
              <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Tenancy details</p>
                  <p className="text-xs text-slate-400">Dates, rent and deposit</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Card>
            </Link>
            <Link href={`${base}/maintenance`}>
              <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-[#d97706]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Maintenance requests</p>
                  <p className="text-xs text-slate-400">Track your reported issues</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Card>
            </Link>
            <Link href={`${base}/payments`}>
              <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-[#059669]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Payments</p>
                  <p className="text-xs text-slate-400">Rent ledger &amp; payment history</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Card>
            </Link>
            <Link href={`${base}/documents`}>
              <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Documents</p>
                  <p className="text-xs text-slate-400">Tenancy agreement, deposit cert, reports</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
