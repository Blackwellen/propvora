import ReviewsClient, { type AwaitingReview, type SubmittedReview } from "@/features/customer/reviews/ReviewsClient"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { listCustomerBookings, listCustomerReviews } from "@/lib/customer/data"

export const metadata = { title: "Reviews · Propvora" }
export const dynamic = "force-dynamic"

const PLACEHOLDER = "/property-types/holiday.jpg"
const fmt = (iso: string | null) => {
  if (!iso) return ""
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) } catch { return "" }
}
const isCompleted = (status: string, checkOut: string | null) => {
  const s = (status ?? "").toLowerCase()
  if (s === "completed" || s === "checked_out") return true
  if (checkOut) { try { return new Date(checkOut) < new Date() } catch { return false } }
  return false
}

export default async function CustomerReviewsPage() {
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const bookings = await listCustomerBookings(supabase, workspaceId, email)
  const reviews = await listCustomerReviews(supabase, bookings.map((b) => b.id))
  const reviewedIds = new Set(reviews.map((r) => r.booking_id))

  const awaiting: AwaitingReview[] = bookings
    .filter((b) => isCompleted(b.status, b.check_out) && !reviewedIds.has(b.id))
    .map((b) => ({
      id: b.id,
      title: b.listing_title ?? "Your stay",
      location: "",
      image: PLACEHOLDER,
      dates: b.check_in && b.check_out ? `${fmt(b.check_in)} – ${fmt(b.check_out)}` : fmt(b.check_in),
      guests: b.guests_count ?? 1,
      completed: fmt(b.check_out),
    }))

  const byBooking = new Map(bookings.map((b) => [b.id, b]))
  const submitted: SubmittedReview[] = reviews.map((r) => {
    const b = byBooking.get(r.booking_id)
    return {
      id: r.id,
      stay: b?.listing_title ?? r.title ?? "Your stay",
      loc: "",
      image: PLACEHOLDER,
      rating: r.rating ?? 0,
      when: fmt(r.created_at),
      responded: false,
    }
  })

  return <ReviewsClient awaiting={awaiting} submitted={submitted} />
}
