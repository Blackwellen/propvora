"use client"

import Link from "next/link"
import {
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  ExternalLink,
  FileText,
  Plus,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MobileTopBar } from "@/components/mobile"
import { BookingEmptyState, BookingNotReady, BookingUpgradePrompt } from "./primitives"
import { BookingManagementCanvas } from "./BookingManagementCanvas"
import { BOOKING_MODULES, SECTION_WORKFLOWS, type BookingSectionKey } from "./module"
import type { BookingRow, BookableListing } from "./server"

interface Props {
  section: BookingSectionKey
  canManage: boolean
  ready: boolean
  planName: string
  upgradeReason: string | null
  bookings: BookingRow[]
  listings: BookableListing[]
}

const ACTION_COPY: Record<BookingSectionKey, { title: string; primary: string; secondary: string }> = {
  dashboard: { title: "Booking command center", primary: "Open dashboard", secondary: "Review live arrivals and blockers." },
  calendar: { title: "Calendar operations", primary: "Block dates", secondary: "Manage stays, holds, maintenance and channel conflicts." },
  listings: { title: "Listing setup", primary: "New listing", secondary: "Build booking listings separate from property records." },
  availability: { title: "Availability controls", primary: "Open availability", secondary: "Define blocks, buffers, cut-off rules and conflict handling." },
  pricing: { title: "Pricing controls", primary: "Create rule", secondary: "Manage nightly, seasonal, fee, tax and deposit rules." },
  reservations: { title: "Reservations register", primary: "Review requests", secondary: "Approve, reject, modify, cancel and refund stays." },
  guests: { title: "Guest CRM", primary: "Add guest note", secondary: "Track identity, risk, preferences, history and consent." },
  payments: { title: "Payments and deposits", primary: "Review balances", secondary: "Monitor intents, holds, refunds, payouts and ledger rows." },
  messages: { title: "Stay messages", primary: "Create template", secondary: "Centralize guest, automated and internal conversations." },
  "check-in": { title: "Check-in and checkout", primary: "Build instructions", secondary: "Gate sensitive access details until booking conditions are safe." },
  rules: { title: "House rules and policies", primary: "Edit policy", secondary: "Version rules, legal terms, cancellation and damage policies." },
  cleaning: { title: "Cleaning and turnover", primary: "Assign cleaner", secondary: "Create turnover, linen, inspection and proof workflows." },
  maintenance: { title: "In-stay maintenance", primary: "Dispatch job", secondary: "Manage urgent requests, supplier updates and evidence." },
  issues: { title: "Issues and claims", primary: "Open issue", secondary: "Triage evidence, refunds, damage charges and disputes." },
  reviews: { title: "Reviews", primary: "Request review", secondary: "Unlock post-checkout reviews and track quality trends." },
  "channel-sync": { title: "Channel sync", primary: "Add iCal feed", secondary: "Import/export iCal, detect conflicts and log sync events." },
  "direct-pages": { title: "Direct booking pages", primary: "Preview page", secondary: "Operate public search, listing, checkout and guest portal flows." },
  reports: { title: "Booking reports", primary: "Export report", secondary: "Analyze occupancy, ADR, RevPAR, channel mix and margin." },
  settings: { title: "Booking settings", primary: "Update defaults", secondary: "Control booking modes, flags, legal and automation defaults." },
}

export function BookingSectionClient({
  section,
  canManage,
  ready,
  planName,
  upgradeReason,
  bookings,
  listings,
}: Props) {
  const module = BOOKING_MODULES.find((m) => m.key === section) ?? BOOKING_MODULES[0]
  const Icon = module.icon
  const copy = ACTION_COPY[section]
  const workflows = SECTION_WORKFLOWS[section]

  if (!canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title={module.label} subtitle="Booking management" showBack backHref="/property-manager/bookings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={planName} reason={upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <MobileTopBar title={module.label} subtitle="Booking management" showBack backHref="/property-manager/bookings" />
      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        <SectionHeader
          breadcrumb={[{ label: "Bookings", href: "/property-manager/bookings" }, { label: module.label }]}
          title={module.label}
          subtitle={module.summary}
          actions={
            <Link
              href={section === "listings" ? "/property-manager/bookings/listings" : "/property-manager/bookings"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to command center
            </Link>
          }
        />

        {!ready && <BookingNotReady />}

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-5 md:px-6 md:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-blue-600" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{copy.title}</h2>
                <p className="mt-1 text-sm text-slate-500 max-w-2xl">{copy.secondary}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                {copy.primary}
              </button>
              <Link
                href="/stay/search"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Public flow
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100">
            {workflows.map((item) => (
              <div key={item} className="bg-white px-5 py-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="mt-2 text-sm font-medium leading-snug text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <BookingManagementCanvas bookings={bookings} listings={listings} activeSection={section} compact />

        <BookingEmptyState
          icon={section === "channel-sync" ? CalendarRange : FileText}
          title={`${module.label} workspace foundation`}
          description="This route is wired into the full booking management canvas. Live CRUD panels can now be attached behind the same workspace entitlement, audit and schema-tolerant data layer."
        />
      </div>
    </DashboardContainer>
  )
}

export default BookingSectionClient
