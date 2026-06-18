"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewListingIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/app/listings/new/basics")
  }, [router])
  return (
    <div className="flex items-center justify-center py-20 text-[13px] text-slate-400">
      Opening listing wizard…
    </div>
  )
}
