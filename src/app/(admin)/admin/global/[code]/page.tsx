import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/Card"
import {
  listCountryProfiles,
  listReviews,
  getReleaseSummaries,
} from "@/lib/international/control-plane"
import { CountryReleaseControls } from "./CountryReleaseControls"

export const dynamic = "force-dynamic"

export default async function AdminCountryPackPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: raw } = await params
  const code = raw.toUpperCase()

  const [profiles, reviews, summaries] = await Promise.all([
    listCountryProfiles(),
    listReviews(code),
    getReleaseSummaries(),
  ])
  const profile = profiles.find((p) => p.country_code === code)
  if (!profile) notFound()
  const summary = summaries.find((s) => s.countryCode === code) ?? null

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/global"
          className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Global control plane
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {profile.display_name} <span className="text-slate-400 font-medium">({code})</span>
        </h1>
        <p className="text-sm text-slate-500">
          {profile.default_currency} · {profile.default_locale} · offer:{" "}
          <span className="font-medium">{profile.offer_status}</span>
        </p>
      </div>

      {code === "GB" && (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-[13px] font-semibold text-emerald-900">Protected reviewed baseline</p>
          <p className="text-[12px] text-emerald-700 mt-0.5">
            GB is the V1 reviewed baseline. Its statuses and release gate are locked to enabled and
            cannot be edited here.
          </p>
        </Card>
      )}

      <CountryReleaseControls
        countryCode={code}
        displayName={profile.display_name}
        offerStatus={profile.offer_status}
        legalStatus={profile.legal_status}
        taxStatus={profile.tax_status}
        privacyStatus={profile.privacy_status}
        consumerStatus={profile.consumer_status}
        propertyStatus={profile.property_features_status}
        reviews={reviews.map((r) => ({
          domain: r.domain,
          verdict: r.verdict,
          reviewerName: r.reviewer_name,
          reviewedAt: r.reviewed_at,
        }))}
        summary={
          summary
            ? {
                state: summary.state,
                requiredReviews: summary.requiredReviews,
                approvedReviews: summary.approvedReviews,
                releaseReady: summary.releaseReady,
                isSanctioned: summary.isSanctioned,
                blockedReason: summary.blockedReason,
              }
            : null
        }
      />
    </div>
  )
}
