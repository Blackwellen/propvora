import Link from "next/link"
import { requireCustomerContext } from "@/lib/customer"
import { PlusCircle, Wrench, Clock, CheckCircle2, AlertCircle } from "lucide-react"

export const metadata = { title: "Maintenance · Propvora" }
export const dynamic = "force-dynamic"

interface MaintenanceRequest {
  id: string
  subject: string
  category: string | null
  severity: string | null
  status: string | null
  created_at: string | null
  resolved_at: string | null
}

const STATUS_MAP: Record<string, { label: string; colour: string; icon: typeof Clock }> = {
  open:        { label: "Open",        colour: "text-amber-600 bg-amber-50 border-amber-200",  icon: Clock },
  in_progress: { label: "In progress", colour: "text-[var(--brand)]  bg-[var(--brand-soft)]  border-[var(--color-brand-100)]",   icon: Wrench },
  resolved:    { label: "Resolved",    colour: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",  colour: "text-slate-500 bg-slate-50 border-slate-200",  icon: AlertCircle },
}

function badge(status: string | null) {
  const s = STATUS_MAP[status ?? "open"] ?? STATUS_MAP.open
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.colour}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  )
}

export default async function MaintenancePage() {
  const { supabase, workspaceId } = await requireCustomerContext()

  let requests: MaintenanceRequest[] = []
  try {
    const { data } = await supabase
      .from("customer_maintenance_requests")
      .select("id, subject, category, severity, status, created_at, resolved_at")
      .eq("customer_workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50)
    requests = (data ?? []) as MaintenanceRequest[]
  } catch {
    // Table may not exist yet — show empty state gracefully.
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">Maintenance</h1>
            <p className="mt-0.5 text-sm text-slate-500">Report repairs or track existing requests</p>
          </div>
          <Link
            href="/user/maintenance/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <Wrench className="w-10 h-10 text-slate-300 mb-4" />
            <p className="text-base font-semibold text-slate-700">No maintenance requests yet</p>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              Use the button above to report a repair or issue with your property.
            </p>
            <Link
              href="/user/maintenance/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Report an issue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 px-5 py-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0D1B2A] truncate">{r.subject}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {r.category && (
                        <span className="text-xs text-slate-500 capitalize">{r.category.replace(/_/g, " ")}</span>
                      )}
                      {r.severity && r.severity !== "normal" && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500 capitalize">{r.severity}</span>
                        </>
                      )}
                      {r.created_at && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400">
                            {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {badge(r.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
