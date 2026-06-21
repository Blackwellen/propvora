import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function CalendarDayRedirect() {
  redirect("/property-manager/calendar/views/day")
}
