"use client"

import React, { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  CheckCircle2,
  AlertCircle,
  Pencil,
  Eye,
  Rocket,
  Plus,
  Lock,
  PartyPopper,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useListingDraft } from "../data/useListingDraft"
import type { ChannelKey } from "../data/types"
import { Card, SectionTitle, Pill, Select } from "../components/primitives"

function editBase(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean)
  const slug = parts[parts.length - 1] ?? "review-publish"
  return pathname.slice(0, pathname.length - slug.length - 1)
}

export function ReviewPublishStep() {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const { draft, update, validation, publishBlockers, saveDraft, completionPct } = useListingDraft()
  const [previewMode, setPreviewMode] = useState<"card" | "detail">("card")
  const [published, setPublished] = useState(draft.published)

  const base = useMemo(() => editBase(pathname), [pathname])
  const goEdit = (slug: string) => router.push(`${base}/${slug}`)
  const canPublish = publishBlockers.length === 0

  const handlePublish = async () => {
    if (!canPublish) return
    update({ published: true })
    setPublished(true)
    await saveDraft()
  }

  const annualRevenue = draft.forecast.reduce((s, p) => s + p.revenuePence, 0)
  const activeChannels = draft.channelMappings.filter((c) => c.connected)

  const sections: { title: string; slug: string; rows: [string, string][] }[] = [
    {
      title: "Listing summary",
      slug: "basics",
      rows: [
        ["Type", draft.listingType === "short-term" ? "Short-term stay" : "Long-term let"],
        ["Title", draft.title || "—"],
        ["Property", draft.propertyLabel || "Not linked"],
        ["Space", `${draft.guestCapacity} guests · ${draft.bedrooms} bd · ${draft.bathrooms} ba`],
        ["Location", [draft.city, draft.postcode].filter(Boolean).join(", ") || "—"],
        ["Amenities", `${draft.amenities.filter((a) => a.on).length} selected`],
      ],
    },
    {
      title: "Media & content",
      slug: "media",
      rows: [
        ["Photos", `${draft.photos.length}`],
        ["Cover image", draft.photos.some((p) => p.isCover) ? "Set" : "Missing"],
        ["Video tour", draft.videoTourName ?? "None"],
        ["Floorplan", draft.floorplanName ?? "None"],
      ],
    },
    {
      title: "Pricing summary",
      slug: "pricing-availability",
      rows: [
        ["Base rate", formatPence(draft.baseRatePence, draft.currency)],
        ["Cleaning fee", formatPence(draft.cleaningFeePence, draft.currency)],
        ["VAT", `${draft.vatPct}%`],
        ["Est. annual revenue", formatPence(annualRevenue, draft.currency)],
      ],
    },
    {
      title: "Availability",
      slug: "pricing-availability",
      rows: [
        ["Min / max stay", `${draft.minStayNights} – ${draft.maxStayNights} nights`],
        ["Instant book", draft.instantBook ? "Enabled" : "Off"],
        ["Blackout dates", `${draft.blackoutDates.length}`],
        ["Seasonal rules", `${draft.seasonalRules.length}`],
      ],
    },
    {
      title: "Policies",
      slug: "policies-operations",
      rows: [
        ["Cancellation", draft.cancellationPolicy],
        ["Check-in", `${draft.checkInMethod} · ${draft.checkInTime}`],
        ["Deposit", formatPence(draft.damageDepositPence, draft.currency)],
        ["House rules", `${draft.houseRules.filter((r) => r.on).length} active`],
      ],
    },
    {
      title: "Compliance & safety",
      slug: "policies-operations",
      rows: [
        ["Verified items", `${draft.compliance.filter((c) => c.status === "verified").length}/${draft.compliance.length}`],
        ["Licence", draft.licenceVerified ? `${draft.licenceNumber} (verified)` : "Unverified"],
      ],
    },
  ]

  if (published) {
    return (
      <Card className="flex flex-col items-center py-12 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
          <PartyPopper className="h-7 w-7 text-emerald-600" />
        </span>
        <h2 className="text-[18px] font-bold text-slate-900">Listing published</h2>
        <p className="mt-1 max-w-sm text-[13px] text-slate-500">
          &ldquo;{draft.title}&rdquo; is now live and syncing to {activeChannels.length} channel(s).
        </p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => router.push("/property-manager/listings")} className="rounded-xl bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-800">
            Back to listings
          </button>
          <button type="button" onClick={() => setPublished(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
            View summary
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Section summaries */}
      {sections.map((s) => (
        <Card key={s.title}>
          <SectionTitle
            title={s.title}
            action={
              <button type="button" onClick={() => goEdit(s.slug)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                <Pencil className="h-3 w-3" /> Edit
              </button>
            }
          />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {s.rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-slate-50 py-1">
                <dt className="text-[12px] text-slate-500">{k}</dt>
                <dd className="text-[12px] font-semibold text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}

      {/* Channel distribution */}
      <Card>
        <SectionTitle title="Channel distribution" />
        <div className="flex flex-wrap items-center gap-2">
          {draft.channelMappings.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() =>
                update({
                  channelMappings: draft.channelMappings.map((x) =>
                    x.key === c.key ? { ...x, connected: !x.connected } : x,
                  ),
                })
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold",
                c.connected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500",
              )}
            >
              {c.connected && <CheckCircle2 className="h-3 w-3" />}
              {c.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              update({
                channelMappings: [
                  ...draft.channelMappings,
                  { key: ("custom-" + Date.now()) as ChannelKey, label: "New channel", connected: true, externalId: "" },
                ],
              })
            }
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-50"
          >
            <Plus className="h-3 w-3" /> Add channel
          </button>
        </div>
      </Card>

      {/* Visibility */}
      <Card>
        <SectionTitle title="Visibility settings" />
        <div className="max-w-xs">
          <Select
            value={draft.visibility}
            onChange={(v) => update({ visibility: v as typeof draft.visibility })}
            options={["public", "unlisted", "draft"]}
          />
        </div>
      </Card>

      {/* Public preview toggle */}
      <Card>
        <SectionTitle
          title="Public preview"
          action={
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {(["card", "detail"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPreviewMode(m)}
                  className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize", previewMode === m ? "bg-slate-900 text-white" : "text-slate-500")}
                >
                  {m === "card" ? "Stay card" : "Detail"}
                </button>
              ))}
            </div>
          }
        />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          {previewMode === "card" ? (
            <div className="max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex h-28 items-center justify-center bg-slate-100 text-[11px] text-slate-400">Cover image</div>
              <div className="p-3">
                <p className="text-[13px] font-bold text-slate-900">{draft.title}</p>
                <p className="text-[11px] text-slate-500">{draft.city}</p>
                <p className="mt-1 text-[13px] font-bold text-slate-900">
                  {formatPence(draft.baseRatePence, draft.currency)}
                  <span className="text-[11px] font-normal text-slate-500"> / night</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-[12px] text-slate-600">
              <p className="text-[15px] font-bold text-slate-900">{draft.title}</p>
              <p>{draft.shortDescription}</p>
              <p className="text-slate-400">{draft.neighbourhoodSummary}</p>
            </div>
          )}
        </div>
        <button type="button" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline">
          <Eye className="h-3.5 w-3.5" /> View full preview
        </button>
      </Card>

      {/* Validation checklist */}
      <Card>
        <SectionTitle
          title="Validation checklist"
          hint={`${validation.filter((v) => v.complete).length}/${validation.length} complete · ${completionPct}%`}
        />
        <ul className="space-y-1.5">
          {validation.map((v) => (
            <li key={v.key} className="flex items-center gap-2">
              {v.complete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              )}
              <span className={cn("text-[12.5px]", v.complete ? "text-slate-600" : "font-semibold text-slate-800")}>
                {v.label}
              </span>
              {!v.complete && v.blocking && <Pill tone="red">Required</Pill>}
            </li>
          ))}
        </ul>
      </Card>

      {/* Missing items / blocked state */}
      {!canPublish && (
        <Card className="border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <p className="text-[13px] font-bold text-amber-800">Publishing is blocked</p>
          </div>
          <p className="mt-1 text-[12px] text-amber-700">
            Resolve {publishBlockers.length} required item(s) before this listing can go live:
          </p>
          <ul className="mt-2 space-y-1">
            {publishBlockers.map((b) => (
              <li key={b.key} className="flex items-center gap-2 text-[12px] text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {b.label}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Plan & usage */}
      <Card>
        <SectionTitle title="Plan & usage" />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">Listings used</p>
            <p className="text-[16px] font-bold text-slate-900">8 / 25</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">Channel connections</p>
            <p className="text-[16px] font-bold text-slate-900">{activeChannels.length} active</p>
          </div>
        </div>
      </Card>

      {/* Publish actions */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <button type="button" onClick={() => void saveDraft()} className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
          Save draft
        </button>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
          <Eye className="h-4 w-4" /> Preview listing
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-[13px] font-bold text-white",
            canPublish ? "bg-emerald-600 hover:bg-emerald-700" : "cursor-not-allowed bg-slate-300",
          )}
        >
          {canPublish ? <Rocket className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          Publish listing
        </button>
      </div>
    </div>
  )
}
