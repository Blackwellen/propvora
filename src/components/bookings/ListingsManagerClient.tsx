"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  CalendarRange,
  Tag,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MobileTopBar, MobilePageHeader } from "@/components/mobile"
import {
  BookingUpgradePrompt,
  BookingNotReady,
  BookingEmptyState,
  fmtMoney,
} from "./primitives"
import { BlockedDatesEditor } from "./BlockedDatesEditor"
import { saveRatePlan } from "./actions"
import type { BookableListing, RatePlan } from "./server"

interface Props {
  canManage: boolean
  ready: boolean
  planName: string
  upgradeReason: string | null
  listings: BookableListing[]
  ratePlans: RatePlan[]
}

interface RateForm {
  nightly: string // pounds, as typed
  minNights: string
  maxNights: string
  weekendUplift: string
}

const LISTING_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  published: { label: "Published", bg: "bg-emerald-50", text: "text-emerald-700" },
  draft: { label: "Draft", bg: "bg-slate-100", text: "text-slate-600" },
  paused: { label: "Paused", bg: "bg-amber-50", text: "text-amber-700" },
  archived: { label: "Archived", bg: "bg-slate-50", text: "text-slate-400" },
}

export function ListingsManagerClient({
  canManage,
  ready,
  planName,
  upgradeReason,
  listings,
  ratePlans,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<BookableListing | null>(null)
  const [availabilityFor, setAvailabilityFor] = useState<BookableListing | null>(null)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  const planByListing = useMemo(() => {
    const map = new Map<string, RatePlan>()
    for (const p of ratePlans) if (p.listingId) map.set(p.listingId, p)
    return map
  }, [ratePlans])

  function notify(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 4500)
  }

  const header = (
    <SectionHeader
      breadcrumb={[{ label: "Bookings", href: "/property-manager/bookings" }, { label: "Listings" }]}
      title="Bookable listings"
      subtitle="Rates and availability for your direct-booking stay listings."
      actions={
        <Link
          href="/property-manager/marketplace/my-listings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
        >
          <Store className="w-4 h-4" />
          Manage inventory
        </Link>
      }
    />
  )

  if (!canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Listings" subtitle="Booking management" showBack backHref="/property-manager/bookings" />
        <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
          <div className="hidden md:block">{header}</div>
          <BookingUpgradePrompt planName={planName} reason={upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Listings"
        subtitle="Rates & availability"
        showBack
        backHref="/property-manager/bookings"
        primaryAction={{ label: "Inventory", icon: Store, href: "/property-manager/marketplace/my-listings" }}
      />

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm shadow-xl max-w-sm",
            toast.kind === "ok" ? "bg-slate-900" : "bg-red-600"
          )}
        >
          {toast.kind === "ok" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        <div className="hidden md:block">{header}</div>
        <MobilePageHeader hideTitle
          title="Bookable listings"
          count={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}
        />

        {listings.length === 0 ? (
          ready ? (
            <BookingEmptyState
              icon={Building2}
              title="No bookable stay listings yet"
              description="Create a stay-booking listing in your marketplace inventory to set rates and availability here."
              action={
                <Link
                  href="/property-manager/marketplace/my-listings?new=1"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New listing
                </Link>
              }
            />
          ) : (
            <BookingNotReady />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listings.map((listing) => {
              const plan = planByListing.get(listing.id)
              const st = LISTING_STATUS[listing.status] ?? LISTING_STATUS.draft
              const nightly = plan?.nightlyPence ?? listing.baseNightlyPence ?? null
              return (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{listing.title}</p>
                        <p className="text-[12px] text-slate-400 truncate">{listing.location ?? "No location"}</p>
                      </div>
                    </div>
                    <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-semibold", st.bg, st.text)}>
                      {st.label}
                    </span>
                  </div>

                  <div className="px-5 py-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Nightly</p>
                      <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                        {nightly != null ? fmtMoney(nightly, listing.currency) : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Min / Max nights</p>
                      <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                        {plan ? `${plan.minNights} – ${plan.maxNights ?? "∞"}` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Weekend uplift</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">
                        {plan ? `+${plan.weekendUpliftPct}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Currency</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{listing.currency}</p>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <button
                      onClick={() => setEditing(listing)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      Edit rates
                    </button>
                    <button
                      onClick={() => setAvailabilityFor(listing)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <CalendarRange className="w-3.5 h-3.5" />
                      Availability
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-[11px] text-slate-400">
          Rates and availability apply to direct bookings. Channel sync and seasonal pricing arrive in a later release.
        </p>
      </div>

      {/* Rate plan editor */}
      {editing && (
        <RatePlanModal
          listing={editing}
          plan={planByListing.get(editing.id) ?? null}
          pending={pending}
          onClose={() => setEditing(null)}
          onSave={(form) => {
            const nightlyPence = Math.round(parseFloat(form.nightly || "0") * 100)
            startTransition(async () => {
              const res = await saveRatePlan({
                id: planByListing.get(editing.id)?.id ?? null,
                listingId: editing.id,
                nightlyPence,
                minNights: parseInt(form.minNights || "1", 10),
                maxNights: form.maxNights ? parseInt(form.maxNights, 10) : null,
                weekendUpliftPct: parseInt(form.weekendUplift || "0", 10),
                currency: editing.currency,
              })
              if (res.ok) {
                notify("ok", "Rate plan saved.")
                setEditing(null)
                router.refresh()
              } else {
                notify("err", res.error ?? "Could not save rate plan.")
              }
            })
          }}
        />
      )}

      {/* Availability editor (desktop modal / mobile sheet) */}
      {availabilityFor && (
        <BlockedDatesEditor
          listing={availabilityFor}
          open={!!availabilityFor}
          onClose={() => setAvailabilityFor(null)}
          initialBlocked={[]}
          ready={ready}
          onChanged={() => notify("ok", "Availability updated.")}
        />
      )}
    </DashboardContainer>
  )
}

function RatePlanModal({
  listing,
  plan,
  pending,
  onClose,
  onSave,
}: {
  listing: BookableListing
  plan: RatePlan | null
  pending: boolean
  onClose: () => void
  onSave: (form: RateForm) => void
}) {
  const [form, setForm] = useState<RateForm>({
    nightly: plan
      ? String(plan.nightlyPence / 100)
      : listing.baseNightlyPence != null
        ? String(listing.baseNightlyPence / 100)
        : "",
    minNights: plan ? String(plan.minNights) : "1",
    maxNights: plan?.maxNights != null ? String(plan.maxNights) : "",
    weekendUplift: plan ? String(plan.weekendUpliftPct) : "0",
  })
  const [err, setErr] = useState<string | null>(null)

  function change(field: keyof RateForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function submit() {
    const nightly = parseFloat(form.nightly)
    if (Number.isNaN(nightly) || nightly < 0) {
      setErr("Enter a valid nightly rate.")
      return
    }
    setErr(null)
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <Pencil className="w-4 h-4 text-[#2563EB]" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">Edit rate plan</h3>
            <p className="text-[12px] text-slate-500 truncate">{listing.title}</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Nightly rate ({listing.currency})</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.nightly}
              onChange={(e) => change("nightly", e.target.value)}
              placeholder="120"
              className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Min nights</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.minNights}
                onChange={(e) => change("minNights", e.target.value)}
                placeholder="1"
                className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Max nights</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.maxNights}
                onChange={(e) => change("maxNights", e.target.value)}
                placeholder="No limit"
                className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Weekend uplift (%)</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.weekendUplift}
              onChange={(e) => change("weekendUplift", e.target.value)}
              placeholder="0"
              className="w-full h-10 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
            <p className="text-[11px] text-slate-400">Applied to Friday and Saturday nights.</p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 space-y-2">
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={pending}
              className="flex-1 h-10 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save rate plan"}
            </button>
            <button
              onClick={onClose}
              disabled={pending}
              className="h-10 px-4 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingsManagerClient
