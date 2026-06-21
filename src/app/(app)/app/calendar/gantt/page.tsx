import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function CalendarGanttRedirect() {
  redirect("/property-manager/calendar/views/gantt")
}
