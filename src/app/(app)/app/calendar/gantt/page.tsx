import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function CalendarGanttRedirect() {
  redirect("/app/calendar/views/gantt")
}
