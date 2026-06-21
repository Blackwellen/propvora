"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function Redirector() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const profile      = searchParams.get("profile")

  useEffect(() => {
    const url = profile
      ? `/property-manager/planning/wizard?profile=${encodeURIComponent(profile)}`
      : "/property-manager/planning/wizard"
    router.replace(url)
  }, [router, profile])

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="text-slate-400 text-sm">Opening wizard…</div>
    </div>
  )
}

export default function NewPlanningSetPage() {
  return (
    <Suspense fallback={null}>
      <Redirector />
    </Suspense>
  )
}
