"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  ImageIcon,
  BedDouble,
  Sparkles,
  Tag,
  CalendarRange,
  Receipt,
  ShieldCheck,
  KeyRound,
  FileCheck2,
  Radio,
  BedDouble as Bed,
  MessageSquare,
  Star,
  BarChart3,
  Bot,
  Settings2,
  Activity,
  CheckCircle2,
  CircleDot,
  Pause,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { fmtMoney } from "../primitives"
import type { BookingListing, SavedPricingProfile, PublishReadiness, ListingPhoto } from "@/lib/booking/listings"

/* ──────────────────────────────────────────────────────────────────────────
   19-tab listing detail shell. Renders the sticky left-hand nav and the
   active tab panel. Each tab panel is imported lazily as a named export from
   the same folder; the shell itself is a client component (tab state) but
   each panel can be a server or client component depending on its needs.
─────────────────────────────────────────────────────────────────────────── */

export type DetailTab =
  | "overview"
  | "content"
  | "media"
  | "rooms"
  | "amenities"
  | "pricing"
  | "availability"
  | "fees"
  | "rules"
  | "checkin"
  | "compliance"
  | "channels"
  | "bookings"
  | "messages"
  | "reviews"
  | "performance"
  | "ai"
  | "settings"
  | "activity"

interface TabMeta {
  key: DetailTab
  label: string
  icon: React.ElementType
  badge?: string
}

const TABS: TabMeta[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "content", label: "Content", icon: FileText },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "rooms", label: "Rooms", icon: BedDouble },
  { key: "amenities", label: "Amenities", icon: Sparkles },
  { key: "pricing", label: "Pricing", icon: Tag },
  { key: "availability", label: "Availability", icon: CalendarRange },
  { key: "fees", label: "Fees", icon: Receipt },
  { key: "rules", label: "Rules", icon: ShieldCheck },
  { key: "checkin", label: "Check-in", icon: KeyRound },
  { key: "compliance", label: "Compliance", icon: FileCheck2 },
  { key: "channels", label: "Channels", icon: Radio },
  { key: "bookings", label: "Bookings", icon: Bed },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "performance", label: "Performance", icon: BarChart3 },
  { key: "ai", label: "AI Optimiser", icon: Bot },
  { key: "settings", label: "Settings", icon: Settings2 },
  { key: "activity", label: "Activity", icon: Activity },
]

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600", icon: CircleDot },
  in_review: { label: "In review", cls: "bg-amber-50 text-amber-700", icon: CircleDot },
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  paused: { label: "Paused", cls: "bg-orange-50 text-orange-700", icon: Pause },
  archived: { label: "Archived", cls: "bg-slate-50 text-slate-400", icon: CircleDot },
}

export interface ListingDetailShellProps {
  listing: BookingListing
  photos: ListingPhoto[]
  pricing: SavedPricingProfile | null
  readiness: PublishReadiness | null
  /** Content of each tab panel — keyed by tab key */
  panels: Partial<Record<DetailTab, React.ReactNode>>
  /** Initial tab (default: overview) */
  initialTab?: DetailTab
}

export function ListingDetailShell({
  listing,
  photos,
  pricing,
  readiness,
  panels,
  initialTab = "overview",
}: ListingDetailShellProps) {
  const [active, setActive] = useState<DetailTab>(initialTab)
  const badge = STATUS_BADGE[listing.status] ?? STATUS_BADGE.draft
  const BadgeIcon = badge.icon
  const coverPhoto = photos.find((p) => p.isCover) ?? photos[0] ?? null

  return (
    <DashboardContainer>
      <MobileTopBar
        title={listing.title}
        subtitle="Listing management"
        showBack
        backHref="/app/bookings/listings"
      />

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Link
            href="/app/bookings/listings"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Listings
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium truncate max-w-[280px]">{listing.title}</span>
        </div>

        {/* Hero header */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 relative flex items-center justify-center">
            {coverPhoto?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPhoto.url}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-slate-300" />
            )}
            <span
              className={cn(
                "absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                badge.cls
              )}
            >
              <BadgeIcon className="w-3 h-3" />
              {badge.label}
            </span>
          </div>
          <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{listing.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5 capitalize">
                {listing.listingType.replace(/_/g, " ")} · {listing.maxGuests} guests ·{" "}
                {listing.bedrooms} bd · {listing.beds} beds · {listing.bathrooms} bath
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {pricing && (
                <span className="text-sm font-semibold text-slate-700">
                  {fmtMoney(pricing.baseNightlyPence, listing.currency)} / night
                </span>
              )}
              {readiness && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full",
                    readiness.ready
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  )}
                >
                  {readiness.ready ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <CircleDot className="w-3 h-3" />
                  )}
                  {readiness.ready
                    ? "Publish ready"
                    : `${readiness.blockers.length} item${readiness.blockers.length === 1 ? "" : "s"} outstanding`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 items-start">
          {/* Sticky side nav */}
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 lg:sticky lg:top-20">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = active === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium whitespace-nowrap transition-colors shrink-0 lg:w-full text-left",
                    isActive
                      ? "bg-[#2563EB] text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Panel area */}
          <div className="min-h-[400px]">
            {panels[active] ?? <DefaultPanel tab={active} />}
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}

function DefaultPanel({ tab }: { tab: DetailTab }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm px-6 py-10 flex flex-col items-center text-center">
      <p className="text-sm font-medium text-slate-500 capitalize">{tab.replace(/_/g, " ")} — loading</p>
    </div>
  )
}

export default ListingDetailShell
