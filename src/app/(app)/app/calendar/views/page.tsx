"use client"
import { useEffect } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"

export default function CalendarViewsPage() {
  const router = useSectionRouter()
  useEffect(() => { router.replace("/app/calendar/views/week") }, [router])
  return null
}
