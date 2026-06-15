import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Star,
  Edit2,
  Copy,
  Download,
  Share2,
  MoreHorizontal,
  MapPin,
  Clock,
} from "lucide-react"
import { getPlanningSetById } from "@/lib/planning/server-data"
import { PlanningSetTabStrip } from "./PlanningSetTabStrip"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

const STATUS_CONFIG: Record<
  string,
  { label: string; textColor: string; bgColor: string }
> = {
  draft:          { label: "Draft",          textColor: "text-slate-600",   bgColor: "bg-slate-100" },
  assumptions:    { label: "Assumptions",    textColor: "text-amber-700",   bgColor: "bg-amber-100" },
  forecast_ready: { label: "Forecast Ready", textColor: "text-blue-700",    bgColor: "bg-blue-100" },
  risk_review:    { label: "Risk Review",    textColor: "text-orange-700",  bgColor: "bg-orange-100" },
  offer_sent:     { label: "Offer Sent",     textColor: "text-violet-700",  bgColor: "bg-violet-100" },
  accepted:       { label: "Accepted",       textColor: "text-emerald-700", bgColor: "bg-emerald-100" },
  converted:      { label: "Converted",      textColor: "text-teal-700",    bgColor: "bg-teal-100" },
}

const RISK_CONFIG: Record<
  string,
  { label: string; textColor: string; bgColor: string }
> = {
  Low:      { label: "Low Risk",      textColor: "text-emerald-700", bgColor: "bg-emerald-100" },
  Medium:   { label: "Medium Risk",   textColor: "text-amber-700",   bgColor: "bg-amber-100" },
  High:     { label: "High Risk",     textColor: "text-red-700",     bgColor: "bg-red-100" },
  Critical: { label: "Critical Risk", textColor: "text-red-800",     bgColor: "bg-red-200" },
}

// Derive a risk band from the live numeric risk_score (0-100).
function riskLevelFromScore(score: number | null | undefined): keyof typeof RISK_CONFIG {
  const s = score ?? 0
  if (s >= 75) return "Critical"
  if (s >= 50) return "High"
  if (s >= 25) return "Medium"
  return "Low"
}

// ── Profile key → display label ───────────────────────────────────────────────

function profileLabel(key: string): string {
  const MAP: Record<string, string> = {
    hmo:              "HMO",
    long_term_let:    "Long-Term Let",
    rent_to_rent:     "Rent-to-Rent",
    serviced_accom:   "Serviced Accom",
    co_living:        "Co-Living",
    student_let:      "Student Let",
    holiday_let:      "Holiday Let",
    commercial:       "Commercial",
    mixed_use:        "Mixed-Use",
    development:      "Development",
    flip:             "Flip",
    refinance:        "Refinance",
    lease_option:     "Lease Option",
  }
  return MAP[key] ?? key.replace(/_/g, " ")
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default async function PlanningSetDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const planningSet = await getPlanningSetById(id)
  if (!planningSet) notFound()

  // The shared PlanningSet type predates the live schema; read live columns
  // (title/operation_profile/risk_score) defensively via a loose view.
  const live = planningSet as unknown as Record<string, unknown>
  const title = (live.title as string) ?? (live.name as string) ?? "Untitled Plan"
  const address = (live.address as string | null) ?? null
  const status = (live.status as string) ?? "draft"
  const operationProfile = (live.operation_profile as string) ?? (live.profile_key as string) ?? ""
  const riskScore = (live.risk_score as number | null) ?? null
  const updatedAt = (live.updated_at as string) ?? new Date().toISOString()

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  const riskCfg   = RISK_CONFIG[riskLevelFromScore(riskScore)] ?? RISK_CONFIG.Low

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky header block ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">

        {/* Row 1: Back + title + badges + actions */}
        <div className="px-5 md:px-7 lg:px-8 pt-4 pb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">

          {/* Left: back + title + address */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <Link
              href="/app/planning/sets"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors w-fit"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to Planning Sets
            </Link>

            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-[17px] font-bold text-slate-900 truncate leading-tight">
                {title}
              </h1>
              {/* Star / favourite button — client interaction handled inline via form-like approach */}
              <button
                aria-label="Favourite planning set"
                className="flex-shrink-0 p-1 rounded-lg hover:bg-amber-50 text-slate-300 hover:text-amber-400 transition-colors"
              >
                <Star className="w-4 h-4" />
              </button>
            </div>

            {address && (
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{address}</span>
              </p>
            )}
          </div>

          {/* Centre: status pills */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {/* Plan status */}
            <span
              className={[
                "inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full",
                statusCfg.bgColor,
                statusCfg.textColor,
              ].join(" ")}
            >
              {statusCfg.label}
            </span>

            {/* Profile type */}
            {operationProfile && (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                {profileLabel(operationProfile)}
              </span>
            )}

            {/* Risk level */}
            <span
              className={[
                "inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full",
                riskCfg.bgColor,
                riskCfg.textColor,
              ].join(" ")}
            >
              {riskCfg.label}
            </span>

            {/* Last updated */}
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {formatRelativeDate(updatedAt)}
            </span>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Link
              href={`/app/planning/sets/${id}/edit`}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Planning Set
            </Link>

            <button
              aria-label="Duplicate planning set"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>

            <button
              aria-label="Export planning set"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              aria-label="Share planning set"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              aria-label="More actions"
              className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: 17-tab strip */}
        <div className="px-5 md:px-7 lg:px-8 border-t border-slate-100">
          <PlanningSetTabStrip planningSetId={id} />
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="px-5 md:px-7 lg:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
