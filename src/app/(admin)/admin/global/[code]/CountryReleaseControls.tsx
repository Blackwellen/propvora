"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Clock, Loader2, ShieldAlert, Rocket } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PackStatusBadge } from "@/components/intl"
import { cn } from "@/lib/utils"

const REVIEW_DOMAINS = ["legal", "tax", "privacy", "sanctions", "commercial"] as const
const PACK_STATUSES = ["disabled", "generic_only", "research_only", "beta", "reviewed", "enabled"] as const

interface ReviewView {
  domain: string
  verdict: string
  reviewerName: string | null
  reviewedAt: string | null
}

interface SummaryView {
  state: string
  requiredReviews: string[]
  approvedReviews: string[]
  releaseReady: boolean
  isSanctioned: boolean
  blockedReason: string | null
}

export function CountryReleaseControls(props: {
  countryCode: string
  displayName: string
  offerStatus: string
  legalStatus: string
  taxStatus: string
  privacyStatus: string
  consumerStatus: string
  propertyStatus: string
  reviews: ReviewView[]
  summary: SummaryView | null
}) {
  const router = useRouter()
  const locked = props.countryCode === "GB" || (props.summary?.isSanctioned ?? false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const reviewByDomain = new Map(props.reviews.map((r) => [r.domain, r]))

  async function call(url: string, method: string, body: unknown, tag: string) {
    setBusy(tag)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Request failed.")
        return false
      }
      setNotice("Saved.")
      router.refresh()
      return true
    } catch {
      setError("Network error.")
      return false
    } finally {
      setBusy(null)
    }
  }

  function recordReview(domain: string, verdict: "approved" | "rejected" | "pending") {
    void call("/api/admin/global/reviews", "POST", { countryCode: props.countryCode, domain, verdict }, `rev-${domain}`)
  }

  function setGate(state: string) {
    void call("/api/admin/global/release-gate", "PATCH", { countryCode: props.countryCode, state }, `gate-${state}`)
  }

  function setStatus(field: string, value: string) {
    void call("/api/admin/global/country-profile", "PATCH", { countryCode: props.countryCode, [field]: value }, `st-${field}`)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] text-red-700">
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[12.5px] text-emerald-700">
          {notice}
        </div>
      )}

      {/* Reviews */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900">Pack reviews</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Every required domain must be <span className="font-medium">approved</span> before this
            country can be enabled. {props.summary?.isSanctioned && "Sanctioned — can never be enabled."}
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {REVIEW_DOMAINS.map((domain) => {
            const r = reviewByDomain.get(domain)
            const verdict = r?.verdict ?? "pending"
            return (
              <div key={domain} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2.5">
                  {verdict === "approved" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : verdict === "rejected" ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                  )}
                  <div>
                    <p className="text-[13px] font-medium text-slate-800 capitalize">{domain}</p>
                    <p className="text-[11px] text-slate-400">
                      {r?.reviewerName ? `${r.reviewerName}` : "No reviewer"}
                      {r?.reviewedAt ? ` · ${new Date(r.reviewedAt).toLocaleDateString("en-GB")}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={verdict === "approved" ? "primary" : "outline"}
                    disabled={locked || busy === `rev-${domain}`}
                    onClick={() => recordReview(domain, "approved")}
                  >
                    {busy === `rev-${domain}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={locked || busy === `rev-${domain}`}
                    onClick={() => recordReview(domain, "pending")}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Per-domain statuses */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900">Pack statuses</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Promote a domain from research_only → beta → reviewed as work completes. Reviewed unlocks
            jurisdiction-specific UI for that domain.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100">
          {(
            [
              ["offerStatus", "Offer", props.offerStatus, ["offer", "restricted", "banned", "unknown"]],
              ["propertyFeaturesStatus", "Property features", props.propertyStatus, PACK_STATUSES],
              ["legalStatus", "Legal", props.legalStatus, PACK_STATUSES],
              ["taxStatus", "Tax", props.taxStatus, PACK_STATUSES],
              ["privacyStatus", "Privacy", props.privacyStatus, PACK_STATUSES],
              ["consumerStatus", "Consumer", props.consumerStatus, PACK_STATUSES],
            ] as Array<[string, string, string, readonly string[]]>
          ).map(([field, label, value, options]) => (
            <div key={field} className="bg-white px-5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-slate-700 w-32">{label}</span>
                <PackStatusBadge status={value} />
              </div>
              <select
                disabled={locked || busy === `st-${field}`}
                value={value}
                onChange={(e) => setStatus(field, e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>

      {/* Release gate */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-blue-500" /> Release gate
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Current state: <span className="font-semibold">{props.summary?.state ?? "locked"}</span>
            </p>
            {props.summary?.blockedReason && (
              <p className="text-[12px] text-amber-600 mt-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> {props.summary.blockedReason}
              </p>
            )}
            {props.summary?.releaseReady && props.summary.state !== "enabled" && (
              <p className="text-[12px] text-emerald-600 mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> All reviews approved — ready to enable.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={
                locked ||
                busy === "gate-enabled" ||
                !(props.summary?.releaseReady ?? false) ||
                props.summary?.state === "enabled"
              }
              onClick={() => setGate("enabled")}
              className={cn(!(props.summary?.releaseReady ?? false) && "opacity-60")}
            >
              {busy === "gate-enabled" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enable"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={locked || busy === "gate-staged"}
              onClick={() => setGate("staged")}
            >
              Stage
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={locked || busy === "gate-suspended"}
              onClick={() => setGate("suspended")}
            >
              Suspend
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
