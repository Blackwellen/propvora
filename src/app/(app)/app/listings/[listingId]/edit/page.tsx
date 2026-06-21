"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function EditListingIndex() {
  const router = useRouter()
  const params = useParams()
  const listingId = params?.listingId as string
  useEffect(() => {
    if (listingId) router.replace(`/property-manager/listings/${listingId}/edit/basics`)
  }, [router, listingId])
  return (
    <div className="flex items-center justify-center py-20 text-[13px] text-slate-400">
      Opening listing editor…
    </div>
  )
}
