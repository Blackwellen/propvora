import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function CalendarMonthRedirect() {
  redirect("/app/calendar/views/month")
}
