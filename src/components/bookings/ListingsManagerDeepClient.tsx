"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Home,
  Plus,
  ImageIcon,
  Tag,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Pause,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { BookingUpgradePrompt, BookingNotReady, BookingEmptyState, fmtMoney } from "./primitives"
import { createListing } from "./actions-deep"
import type { ListingSummary } from "./server-deep"
import type { ListingType } from "@/lib/booking/booking-listings"

/* ──────────────────────────────────────────────────────────────────────────
   Listings manager (deep) — the workspace's booking_listings with status,
   pricing, photo count and publish progress. Create opens a quick-start that
   drops into the listing wizard.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  canManage: boolean
  ready: boolean
  planName: string
  upgradeReason: string | null
  listings: ListingSummary[]
  properties: { id: string; label: string; city: string | null }[]
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
  in_review: { label: "In review", cls: "bg-amber-50 text-amber-700" },
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700" },
  paused: { label: "Paused", cls: "bg-orange-50 text-orange-700" },
  archived: { label: "Archived", cls: "bg-slate-50 text-slate-400" },
}

export function ListingsManagerDeepClient({
  canManage,
  ready,
  planName,
  upgradeReason,
  listings,
  properties,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [listingType, setListingType] = useState<ListingType>("entire_home")
  const [err, setErr] = useState<string | null>(null)

  function create() {
    if (!title.trim()) {
      setErr("Enter a listing title.")
      return
    }
    setErr(null)
    startTransition(async () => {
      const res = await createListing({
        title: title.trim(),
        listingType,
        propertyId: propertyId || null,
      })
      if (res.ok && res.data) {
        router.push(`/app/bookings/listings/${res.data.id}`)
      } else {
        setErr(res.error ?? "Could not create the listing.")
      }
    })
  }

  if (!canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Listings" subtitle="Booking management" showBack backHref="/app/bookings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={planName} reason={upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <MobileTopBar title="Listings" subtitle="Direct booking inventory" showBack backHref="/app/bookings" />

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Listings</h1>
            <p className="text-sm text-slate-500 mt-0.5">{listings.length} booking listing{listings.length === 1 ? "" : "s"}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New listing
          </button>
        </div>

        {!ready ? (
          <BookingNotReady />
        ) : listings.length === 0 ? (
          <BookingEmptyState
            icon={Home}
            title="No booking listings yet"
            description="Booking listings are sellable stay products, separate from your property records. Create one to set pricing, availability and go live."
            action={
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create your first listing
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((l) => {
              const badge = STATUS_BADGE[l.status] ?? STATUS_BADGE.draft
              return (
                <Link
                  key={l.id}
                  href={`/app/bookings/listings/${l.id}`}
                  className="group rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative">
                    {l.coverPhotoId ? (
                      <ImageIcon className="w-7 h-7 text-slate-300" />
                    ) : (
                      <Home className="w-8 h-8 text-slate-300" />
                    )}
                    <span className={cn("absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold", badge.cls)}>
                      {l.status === "published" ? <CheckCircle2 className="w-3 h-3" /> : l.status === "paused" ? <Pause className="w-3 h-3" /> : <CircleDot className="w-3 h-3" />}
                      {badge.label}
                    </span>
                  </div>
                  <div className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-[#2563EB] transition-colors">{l.title}</p>
                    <p className="text-[12px] text-slate-400 capitalize mt-0.5">
                      {l.listingType.replace(/_/g, " ")} · {l.maxGuests} guests · {l.bedrooms} bd
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                        <Tag className="w-3.5 h-3.5" />
                        {l.basePricePence != null ? `${fmtMoney(l.basePricePence, l.currency)}/night` : "No price set"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[12px] text-slate-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {l.photoCount}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">New booking listing</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Garden Studio — Central"
                  className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Property (optional now, required to publish)</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Select later…</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}{p.city ? ` — ${p.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Type</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as ListingType)}
                  className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="entire_home">Entire home</option>
                  <option value="serviced_accommodation">Serviced accommodation</option>
                  <option value="private_room">Private room</option>
                  <option value="student_room">Student room</option>
                  <option value="hmo_room">HMO room</option>
                  <option value="unit">Unit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {err && (
                <p className="text-[13px] text-red-600 inline-flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {err}
                </p>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={create}
                disabled={pending}
                className="flex-1 h-10 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {pending ? "Creating…" : "Create & set up"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="h-10 px-4 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}

export default ListingsManagerDeepClient
