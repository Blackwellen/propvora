import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function CalendarAgendaRedirect() {
  redirect("/property-manager/calendar/views/agenda")
}
