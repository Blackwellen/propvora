"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  CalendarCheck,
  Receipt,
  KeyRound,
  ShieldCheck,
  MessageSquare,
  FileText,
  AlertTriangle,
  Star,
  Info,
  Lock,
  CheckCircle2,
  Send,
  Users,
  BedDouble,
  Bath,
  MapPin,
  Sparkles,
} from "lucide-react"
import {
  CustomerCard,
  CustomerTabs,
  CustomerStatusBadge,
  CustomerEmptyState,
  CustomerButton,
  customerTextareaClass,
  type CustomerTab,
} from "./ui"
import { moneyPence, shortDate, humanise, toneForStatus, timeAgo } from "./format"
import type {
  CustomerBooking,
  CustomerListingDetail,
  CustomerLegalDoc,
  CustomerMessage,
} from "@/lib/customer/types"

type IssueRow = { id: string; category: string; severity: string; subject: string; status: string; created_at: string }
type ReviewRow = { id: string; rating: number; title: string | null; body: string | null } | null

const PAYMENT_LABEL: Record<string, { label: string; tone: "emerald" | "blue" | "amber" | "slate" }> = {
  paid: { label: "Paid", tone: "emerald" },
  deposit_paid: { label: "Deposit paid", tone: "emerald" },
  unpaid: { label: "Payment due", tone: "amber" },
  refunded: { label: "Refunded", tone: "slate" },
  partially_refunded: { label: "Partially refunded", tone: "slate" },
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 text-right">{value}</dd>
    </div>
  )
}

export default function TripDetailTabs({
  booking,
  listing,
  legalDocs,
  issues,
  review,
  messages,
  payHref,
  canPay,
  checkInReleased,
  reviewUnlocked,
  reportIssueHref,
  modifyHref,
  sendMessageAction,
}: {
  booking: CustomerBooking
  listing: CustomerListingDetail | null
  legalDocs: CustomerLegalDoc[]
  issues: IssueRow[]
  review: ReviewRow
  messages: CustomerMessage[]
  payHref: string
  canPay: boolean
  checkInReleased: boolean
  reviewUnlocked: boolean
  reportIssueHref: string
  modifyHref: string
  sendMessageAction: (body: string) => Promise<void>
}) {
  const [active, setActive] = useState("itinerary")
  const [draft, setDraft] = useState("")
  const [thread, setThread] = useState<CustomerMessage[]>(messages)
  const [pending, startTransition] = useTransition()

  const payStatus = booking.payment_status ?? "unpaid"
  const pay = PAYMENT_LABEL[payStatus] ?? PAYMENT_LABEL.unpaid
  const isPaid = ["paid", "deposit_paid"].includes(payStatus)
  const guestName = booking.guest_name ?? "You"

  const tabs: CustomerTab[] = [
    { key: "itinerary", label: "Itinerary", icon: CalendarCheck },
    { key: "payment", label: "Payment", icon: Receipt },
    { key: "checkin", label: "Check-in", icon: KeyRound },
    { key: "rules", label: "House rules & guide", icon: ShieldCheck },
    { key: "messages", label: "Messages", icon: MessageSquare, count: thread.length },
    { key: "documents", label: "Documents", icon: FileText, count: legalDocs.length },
    { key: "issues", label: "Issues", icon: AlertTriangle, count: issues.length },
    { key: "review", label: "Review", icon: Star },
  ]

  function handleSend() {
    const body = draft.trim()
    if (!body || pending) return
    setDraft("")
    // Optimistic append.
    setThread((t) => [
      ...t,
      { id: `tmp-${Date.now()}`, thread_id: "", sender_role: "customer", sender_name: guestName, body, created_at: new Date().toISOString() },
    ])
    startTransition(async () => {
      await sendMessageAction(body)
    })
  }

  return (
    <div className="space-y-4">
      <CustomerTabs tabs={tabs} active={active} onChange={setActive} />

      {/* ── Itinerary ─────────────────────────────────────────────────────── */}
      {active === "itinerary" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Stay details</h2>
            </div>
            <dl className="space-y-3.5">
              <DetailRow label="Check-in" value={shortDate(booking.check_in)} />
              <DetailRow label="Check-out" value={shortDate(booking.check_out)} />
              <DetailRow label="Nights" value={booking.nights != null ? String(booking.nights) : "—"} />
              <DetailRow label="Guests" value={booking.guests_count != null ? String(booking.guests_count) : "—"} />
              <DetailRow label="Guest name" value={booking.guest_name ?? "—"} />
              {booking.arrival_time && <DetailRow label="Arrival time" value={booking.arrival_time} />}
              {booking.source && <DetailRow label="Booked via" value={humanise(booking.source)} />}
              {booking.booking_ref && <DetailRow label="Reference" value={booking.booking_ref} />}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={modifyHref}
                className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
              >
                <CalendarCheck className="w-4 h-4" /> Request a change
              </Link>
            </div>
            <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-400">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              The status shown is the live booking state. We never show a stay as confirmed or paid unless it really is.
            </p>
          </CustomerCard>

          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BedDouble className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Your place</h2>
            </div>
            {listing ? (
              <>
                <p className="text-sm font-semibold text-slate-800">{listing.title}</p>
                {listing.summary && <p className="mt-1 text-[13px] text-slate-500">{listing.summary}</p>}
                <div className="mt-4 grid grid-cols-2 gap-2.5 text-[13px]">
                  {listing.max_guests != null && (
                    <span className="inline-flex items-center gap-1.5 text-slate-600"><Users className="w-3.5 h-3.5 text-slate-400" /> {listing.max_guests} guests</span>
                  )}
                  {listing.bedrooms != null && (
                    <span className="inline-flex items-center gap-1.5 text-slate-600"><BedDouble className="w-3.5 h-3.5 text-slate-400" /> {listing.bedrooms} bedrooms</span>
                  )}
                  {listing.beds != null && (
                    <span className="inline-flex items-center gap-1.5 text-slate-600"><BedDouble className="w-3.5 h-3.5 text-slate-400" /> {listing.beds} beds</span>
                  )}
                  {listing.bathrooms != null && (
                    <span className="inline-flex items-center gap-1.5 text-slate-600"><Bath className="w-3.5 h-3.5 text-slate-400" /> {listing.bathrooms} bath</span>
                  )}
                </div>
                {listing.amenities.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.amenities.slice(0, 12).map((a) => (
                        <span key={a} className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-100 px-2 py-1 text-[12px] text-slate-600">
                          {humanise(a)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Property details will appear here once the host publishes the listing.</p>
            )}
          </CustomerCard>
        </div>
      )}

      {/* ── Payment & receipts ────────────────────────────────────────────── */}
      {active === "payment" && (
        <CustomerCard className="p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Price & payment</h2>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                pay.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : pay.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {pay.label}
            </span>
          </div>
          <dl className="space-y-2.5 max-w-md">
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-slate-700">{moneyPence(booking.subtotal_pence, booking.currency)}</dd>
            </div>
            {booking.fees_pence != null && booking.fees_pence > 0 && (
              <div className="flex items-center justify-between text-sm">
                <dt className="text-slate-500">Fees</dt>
                <dd className="font-medium text-slate-700">{moneyPence(booking.fees_pence, booking.currency)}</dd>
              </div>
            )}
            <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
              <dt className="text-sm font-semibold text-slate-900">Total</dt>
              <dd className="text-base font-bold text-slate-900">{moneyPence(booking.total_pence, booking.currency)}</dd>
            </div>
            {booking.deposit_pence != null && booking.deposit_pence > 0 && (
              <div className="flex items-center justify-between text-[12.5px]">
                <dt className="text-slate-400">Refundable deposit</dt>
                <dd className="text-slate-500">{moneyPence(booking.deposit_pence, booking.currency)}</dd>
              </div>
            )}
          </dl>
          {isPaid && (
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" /> Held in escrow until your stay completes.
            </p>
          )}
          {canPay && (
            <Link
              href={payHref}
              className="mt-4 inline-flex h-10 px-4 rounded-xl bg-[var(--brand-strong)] text-white text-[13.5px] font-semibold items-center justify-center gap-1.5 hover:bg-[#1A45BE]"
            >
              <Lock className="w-4 h-4" /> Pay {moneyPence(booking.total_pence, booking.currency)}
            </Link>
          )}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Receipt</p>
            <Link href="/user/payments" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:underline">
              <Receipt className="w-3.5 h-3.5" /> View all receipts & invoices
            </Link>
          </div>
        </CustomerCard>
      )}

      {/* ── Check-in & access ─────────────────────────────────────────────── */}
      {active === "checkin" && (
        <CustomerCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Check-in & access</h2>
          </div>
          {checkInReleased ? (
            <div className="flex items-start gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <p>You&apos;re cleared to check in. The host will share the exact address and access instructions directly, here and by message.</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <Lock className="w-4.5 h-4.5 shrink-0 mt-0.5 text-slate-400" />
              <p>Arrival instructions unlock once your stay is confirmed, paid and your check-in date is near. We never release access early.</p>
            </div>
          )}
          <dl className="mt-5 space-y-3.5 max-w-md">
            {listing?.check_in_window && <DetailRow label="Check-in window" value={listing.check_in_window} />}
            {listing?.checkout_time && <DetailRow label="Checkout by" value={listing.checkout_time} />}
            {booking.arrival_time && <DetailRow label="Your arrival time" value={booking.arrival_time} />}
            {listing?.timezone && <DetailRow label="Local timezone" value={listing.timezone} />}
          </dl>
        </CustomerCard>
      )}

      {/* ── House rules & local guide ─────────────────────────────────────── */}
      {active === "rules" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">House rules</h2>
            </div>
            {listing && listing.house_rules.length > 0 ? (
              <ul className="space-y-2">
                {listing.house_rules.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {humanise(r)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">The host hasn&apos;t listed specific house rules for this stay. Standard guest terms apply — see Documents.</p>
            )}
            {listing?.cancellation_policy && (
              <p className="mt-4 text-[12.5px] text-slate-500">
                Cancellation: <span className="font-medium text-slate-700">{humanise(listing.cancellation_policy)}</span>
              </p>
            )}
          </CustomerCard>
          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Local guide</h2>
            </div>
            {listing?.description ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
            ) : (
              <p className="text-sm text-slate-500">Local tips from your host appear here. Message them any time for recommendations.</p>
            )}
          </CustomerCard>
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      {active === "messages" && (
        <CustomerCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Messages about this stay</h2>
          </div>
          {thread.length === 0 ? (
            <p className="text-sm text-slate-500 mb-4">No messages yet. Send the host a note about your stay and it will appear here.</p>
          ) : (
            <ul className="space-y-3 mb-4 max-h-[420px] overflow-y-auto">
              {thread.map((m) => {
                const mine = m.sender_role === "customer"
                return (
                  <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-800"}`}>
                      <p className="text-sm whitespace-pre-line">{m.body}</p>
                      <p className={`mt-1 text-[10.5px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                        {m.sender_name || (mine ? "You" : "Host")} · {timeAgo(m.created_at)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message the host about this stay…"
              rows={2}
              className={customerTextareaClass}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend()
              }}
            />
            <CustomerButton onClick={handleSend} loading={pending} disabled={!draft.trim()}>
              <Send className="w-4 h-4" /> Send
            </CustomerButton>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Press Ctrl/Cmd + Enter to send. Messages are private between you and the host.</p>
        </CustomerCard>
      )}

      {/* ── Documents ─────────────────────────────────────────────────────── */}
      {active === "documents" && (
        <CustomerCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Booking documents & policies</h2>
          </div>
          {legalDocs.length === 0 ? (
            <p className="text-sm text-slate-500">No guest documents are attached to this booking yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {legalDocs.map((d) => (
                <li key={d.slug} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{d.title}</p>
                    <p className="text-[12px] text-slate-400">
                      v{d.version}{d.jurisdiction ? ` · ${d.jurisdiction}` : ""}
                    </p>
                  </div>
                  {d.accepted ? (
                    <CustomerStatusBadge tone="emerald">Accepted</CustomerStatusBadge>
                  ) : (
                    <CustomerStatusBadge tone="slate">Not required</CustomerStatusBadge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CustomerCard>
      )}

      {/* ── Issues ────────────────────────────────────────────────────────── */}
      {active === "issues" && (
        <CustomerCard className="p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Issues</h2>
            </div>
            <Link href={reportIssueHref} className="text-[12.5px] font-semibold text-[var(--brand)] hover:underline">
              Report an issue
            </Link>
          </div>
          {issues.length === 0 ? (
            <CustomerEmptyState
              icon={AlertTriangle}
              title="No issues reported"
              description="If something isn't right with your stay, report it and the host or property manager will pick it up."
              action={
                <Link href={reportIssueHref} className="inline-flex items-center gap-1.5 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
                  <AlertTriangle className="w-4 h-4" /> Report an issue
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {issues.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-800 truncate">{it.subject}</span>
                    <span className="text-[12px] text-slate-400">{humanise(it.category)} · {shortDate(it.created_at)}</span>
                  </span>
                  <CustomerStatusBadge tone={toneForStatus(it.status)}>{humanise(it.status)}</CustomerStatusBadge>
                </li>
              ))}
            </ul>
          )}
        </CustomerCard>
      )}

      {/* ── Review ────────────────────────────────────────────────────────── */}
      {active === "review" && (
        <CustomerCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Review</h2>
          </div>
          {review ? (
            <div>
              <div className="flex gap-0.5 mb-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                ))}
              </div>
              {review.title && <p className="text-sm font-semibold text-slate-800">{review.title}</p>}
              {review.body && <p className="text-[12.5px] text-slate-500 mt-0.5">{review.body}</p>}
            </div>
          ) : reviewUnlocked ? (
            <>
              <p className="text-sm text-slate-500 mb-3">How was your stay? Leave a review for the host.</p>
              {booking.booking_ref && (
                <Link
                  href={`/booking/${encodeURIComponent(booking.booking_ref)}`}
                  className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  <Star className="w-4 h-4" /> Write a review
                </Link>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
              <p>Reviews unlock once you&apos;ve checked out. We&apos;ll remind you when it&apos;s time.</p>
            </div>
          )}
        </CustomerCard>
      )}
    </div>
  )
}
