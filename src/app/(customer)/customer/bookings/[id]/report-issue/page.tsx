import { notFound } from "next/navigation"
import ReportIssueWizard from "@/components/customer/ReportIssueWizard"
import { requireCustomerContext, getCustomerBooking } from "@/lib/customer"

export const metadata = { title: "Report an issue · Propvora" }
export const dynamic = "force-dynamic"

export default async function ReportIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const booking = await getCustomerBooking(supabase, workspaceId, email, id)
  if (!booking) notFound()

  const title = booking.listing_title ?? (booking.booking_ref ? booking.booking_ref : "Your stay")
  return <ReportIssueWizard bookingId={booking.id} bookingTitle={title} />
}
