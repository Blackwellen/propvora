"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Sparkles, ArrowRight, Star, Clock, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningOffer, PlanningOfferVersion } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function DataCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  )
}

// ── KV pair ───────────────────────────────────────────────────────────────────

function KV({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-[11px] text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-[11px] font-semibold text-slate-800 text-right ${valueClass ?? ""}`}>{value}</span>
    </div>
  )
}

// ── Status chip ───────────────────────────────────────────────────────────────

type ChipVariant = "emerald" | "blue" | "amber" | "slate" | "red"

const CHIP_CLASSES: Record<ChipVariant, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-100 text-red-700",
}

function StatusChip({ label, variant }: { label: string; variant: ChipVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${CHIP_CLASSES[variant]}`}>
      {label}
    </span>
  )
}

// ── Confidence bar ────────────────────────────────────────────────────────────

function ConfBar({ value }: { value: number }) {
  const color = value >= 80 ? "#10B981" : value >= 60 ? "#F59E0B" : "#EF4444"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  )
}

// ── Offer history rows ────────────────────────────────────────────────────────

const OFFER_HISTORY = [
  { version: "v1.0", label: "Landlord initial offer", date: "06 May 2025", highlight: false },
  { version: "v1.1", label: "Our counter", date: "08 May 2025", highlight: false },
  { version: "v1.2", label: "Landlord revised offer", date: "10 May 2025", highlight: true },
  { version: "v1.3", label: "Our latest counter", date: "12 May 2025", highlight: false },
]

// ── Offer comparison ──────────────────────────────────────────────────────────

const OFFER_COMPARISON = [
  { metric: "Rent p.a.", landlord: "£72,000", current: "£72,000", target: "£70,800" },
  { metric: "Incentives", landlord: "None", current: "£11,500", target: "£15,000" },
  { metric: "Break", landlord: "Month 36", current: "Month 24", target: "Month 18" },
  { metric: "Score /100", landlord: "68", current: "74", target: "82" },
]

// ── Expiry dates ──────────────────────────────────────────────────────────────

const EXPIRY_DATES = [
  { label: "Counter-offer expiry", date: "15 May 2025", daysLeft: 3, variant: "red" as ChipVariant },
  { label: "Target agreement", date: "15 May 2025", daysLeft: 3, variant: "amber" as ChipVariant },
  { label: "Solicitor instruction", date: "20 May 2025", daysLeft: 8, variant: "blue" as ChipVariant },
  { label: "Exchange deadline", date: "30 Jun 2025", daysLeft: 49, variant: "slate" as ChipVariant },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandlordOfferPage() {
  const params = useParams()
  const id = params.id as string

  const [offers, setOffers] = useState<PlanningOffer[]>([])
  const [versions, setVersions] = useState<PlanningOfferVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [{ data: o }, { data: v }] = await Promise.all([
          supabase.from("planning_offers").select("*").eq("planning_set_id", id).order("created_at", { ascending: false }),
          supabase.from("planning_offer_versions").select("*").eq("planning_set_id", id).order("version_num", { ascending: false }),
        ])
        setOffers((o ?? []) as PlanningOffer[])
        setVersions((v ?? []) as PlanningOfferVersion[])
      } catch {
        setError("Failed to load data.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-slate-700 font-semibold">{error}</div>
        <Link href="/app/planning/sets" className="text-sm text-[#7C3AED] hover:underline">Back to planning sets</Link>
      </div>
    )
  }

  void offers
  void versions

  return (
    <div className="flex gap-5 items-start">

      {/* ── Left / centre ── */}
      <div className="flex-1 min-w-0 grid grid-cols-1 xl:grid-cols-2 gap-4">

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48" />)
        ) : (
          <>
            {/* A. Proposed Rent or Deal Terms */}
            <DataCard title="A. Proposed Rent or Deal Terms">
              <div className="flex flex-col gap-1.5">
                <KV label="Rent (per annum)" value="£72,000" />
                <KV label="Rent (per calendar month)" value="£6,000" />
                <KV label="Rent review" value="Annually (RPI)" />
                <KV label="Market rent (est.)" value="£77,800" />
                <KV label="Discount to market" value="7.7%" valueClass="text-amber-600" />
                <KV label="Deposit / bond" value="£6,000 (1 month)" />
                <KV label="Payment terms" value="Monthly in advance" />
              </div>
            </DataCard>

            {/* B. Lease Structure */}
            <DataCard title="B. Lease Structure">
              <div className="flex flex-col gap-1.5">
                <KV label="Lease type" value="Full Repairing & Insuring" />
                <KV label="Lease term" value="5 years" />
                <KV label="Break option" value="Tenant" />
                <KV label="Break earliest" value="Month 24" />
                <KV label="Break notice" value="3 months" />
                <KV label="Rent review cap" value="3.0% per annum" />
                <KV label="Assignability" value="Landlord consent" />
              </div>
            </DataCard>

            {/* C. Incentives */}
            <DataCard title="C. Incentives">
              <div className="flex flex-col gap-1.5">
                <KV label="Rent-free period" value="1 month" />
                <KV label="Fit-out contribution" value="£10,000" />
                <KV label="Legal contribution" value="£1,500" />
                <KV label="Other incentives" value="N/A" />
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700">Total incentives</span>
                  <StatusChip label="£11,500" variant="emerald" />
                </div>
              </div>
            </DataCard>

            {/* D. Break Clauses */}
            <DataCard title="D. Break Clauses">
              <div className="flex flex-col gap-1.5">
                <KV label="Tenant break" value="Month 24" />
                <KV label="Landlord break" value="None" />
                <KV label="Notice period" value="3 months" />
                <KV label="Penalty" value="None" />
              </div>
            </DataCard>

            {/* E. Caps & Limits */}
            <DataCard title="E. Caps & Limits">
              <div className="flex flex-col gap-1.5">
                <KV label="Rent cap" value="3.0% p.a." />
                <KV label="Service charge cap" value="2.5% p.a." />
                <KV label="Insurance cap" value="£1,200 p.a." />
                <KV label="Cap review" value="Annually" />
              </div>
            </DataCard>

            {/* F. Guarantor / Guarantee Assumptions */}
            <DataCard title="F. Guarantor / Guarantee Assumptions">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Guarantee required</span>
                  <StatusChip label="Yes" variant="emerald" />
                </div>
                <KV label="Guarantee type" value="Corporate" />
                <KV label="Guarantee duration" value="12 months" />
                <KV label="Net worth (min.)" value="£250,000" />
                <KV label="Credit rating (min.)" value="A-" />
                <KV label="Comments" value="Propvora Estates Ltd" />
              </div>
            </DataCard>

            {/* G. Negotiation Status */}
            <DataCard title="G. Negotiation Status">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Overall status</span>
                  <StatusChip label="In Negotiation" variant="amber" />
                </div>
                <KV label="Landlord position" value="Firm" />
                <KV label="Our position" value="Flexible on break" />
                <KV label="Key open points" value="2" />
                <KV label="Target agreement" value="15 May 2025" />
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-slate-500">Confidence</span>
                  </div>
                  <ConfBar value={72} />
                </div>
              </div>
            </DataCard>

            {/* H. Offer History */}
            <DataCard title="H. Offer History">
              <div className="flex flex-col gap-2">
                {OFFER_HISTORY.map((row) => (
                  <div
                    key={row.version}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                      row.highlight ? "bg-amber-50 border border-amber-100" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${row.highlight ? "text-amber-700" : "text-slate-400"}`}>{row.version}</span>
                      <span className="text-[11px] text-slate-700">{row.label}</span>
                      {row.highlight && <StatusChip label="Latest" variant="amber" />}
                    </div>
                    <span className="text-[10px] text-slate-400">{row.date}</span>
                  </div>
                ))}
                <button className="text-[11px] text-[#7C3AED] hover:underline font-medium text-left flex items-center gap-0.5 mt-1">
                  View full history <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </DataCard>

            {/* I. Landlord Profile Summary */}
            <DataCard title="I. Landlord Profile Summary">
              <div className="flex flex-col gap-1.5">
                <div className="text-sm font-bold text-slate-900 mb-1">NGS Property Group</div>
                <KV label="Portfolio size" value="£125m+" />
                <KV label="Property type focus" value="Residential / PBSA" />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Reputation score</span>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[1, 2, 3, 4].map((s) => (
                        <div key={s} style={{ color: "#F59E0B" }}><Star className="w-3 h-3" fill="#F59E0B" /></div>
                      ))}
                      <div style={{ color: "#F59E0B" }}><Star className="w-3 h-3" strokeWidth={2} /></div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700">4.6/5</span>
                  </div>
                </div>
                <KV label="Typical lease term" value="3–7 years" />
                <KV label="Payment history" value="Excellent" valueClass="text-emerald-600" />
              </div>
            </DataCard>

            {/* J. Offer Comparison */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 xl:col-span-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">J. Offer Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Metric</th>
                      <th className="py-2 px-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Landlord Initial v1.0</th>
                      <th className="py-2 px-3 text-center text-[10px] font-semibold text-amber-600 uppercase tracking-wide bg-amber-50 rounded-t-lg">Current Offer v1.2</th>
                      <th className="py-2 px-3 text-center text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Our Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OFFER_COMPARISON.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-medium text-slate-700">{row.metric}</td>
                        <td className="py-2 px-3 text-center text-slate-600 tabular-nums">{row.landlord}</td>
                        <td className="py-2 px-3 text-center font-semibold text-amber-700 bg-amber-50 tabular-nums">{row.current}</td>
                        <td className="py-2 px-3 text-center font-semibold text-emerald-700 tabular-nums">{row.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Right panel ── */}
      <div className="w-[260px] flex-shrink-0 flex flex-col gap-4">

        {/* AI Drafting */}
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 60%, #EFF6FF 100%)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-violet-900">AI Drafting</span>
            </div>
            <p className="text-xs text-violet-800 leading-relaxed mb-3">
              Let AI help you draft or refine counter terms.
            </p>
            <div className="flex flex-col gap-1.5 mb-4">
              {[
                "Push break clause earlier to Month 18",
                "Increase fit-out contribution to £15k",
                "Request rent-free extension to 2 months",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-violet-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-violet-900">{item}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
              Draft counter offer
            </button>
          </div>
        )}

        {/* AI Review */}
        {loading ? (
          <Skeleton className="h-44 w-full" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-2">AI Review</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-500">Overall assessment:</span>
              <StatusChip label="Good deal" variant="emerald" />
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              {[
                "Rent above market average for area",
                "Break clause exposes you to early exit",
                "FRI lease increases maintenance liability",
              ].map((risk, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span className="text-[11px] text-slate-600">{risk}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
              View full AI analysis
            </button>
          </div>
        )}

        {/* AI Insights */}
        {loading ? (
          <Skeleton className="h-44 w-full" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">What this means</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
              At £6,000 pcm with a 5-year term, this deal delivers strong cashflow visibility with limited downside if the break is triggered early.
            </p>
            <div className="mb-2">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5">Top Opportunities</div>
              {[
                "Negotiate break to Month 18 for more flexibility",
                "Seek higher fit-out contribution",
                "Explore stepped rent review capped at 2%",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-600">{item}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1.5">Top Risks</div>
              {[
                "FRI lease may increase cost exposure",
                "Landlord position firm — limited room to move",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span className="text-[11px] text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiry / Due Dates */}
        {loading ? (
          <Skeleton className="h-44 w-full" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: "#F59E0B" }}><Clock className="w-4 h-4" /></div>
              <h3 className="text-sm font-bold text-slate-900">Expiry / Due Dates</h3>
            </div>
            <div className="flex flex-col gap-2">
              {EXPIRY_DATES.map(({ label, date, daysLeft, variant }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-medium text-slate-700">{label}</div>
                    <div className="text-[10px] text-slate-400">{date}</div>
                  </div>
                  <StatusChip label={`${daysLeft}d`} variant={variant} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
