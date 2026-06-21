import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function CalendarMonthRedirect() {
  redirect("/property-manager/calendar/views/month")
}
