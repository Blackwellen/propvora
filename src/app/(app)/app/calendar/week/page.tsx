import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function CalendarWeekRedirect() {
  redirect("/property-manager/calendar/views/week")
}
