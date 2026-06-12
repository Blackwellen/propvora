"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CalendarViewsPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/app/calendar/views/week") }, [router])
  return null
}
