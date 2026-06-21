"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { LetProperty } from "../data/lets"
import { propertyImages as IMG } from "../data/mock"
import LetGallerySection from "./components/detail/LetGallerySection"
import LetInfoSection from "./components/detail/LetInfoSection"
import LetDescriptionSection from "./components/detail/LetDescriptionSection"
import LetDetailsSection from "./components/detail/LetDetailsSection"
import LetAmenitiesSection from "./components/detail/LetAmenitiesSection"
import LetLocalSection from "./components/detail/LetLocalSection"
import LetDocumentsSection from "./components/detail/LetDocumentsSection"
import LetBookingPanel from "./components/detail/LetBookingPanel"

export default function LetDetail({ p }: { p: LetProperty }) {
  const gallery = [p.image, IMG.cityLoft, IMG.riverside, IMG.greenQuarter, IMG.dockside]

  return (
    <div className="space-y-5">
      <Link href="/customer/lets/search" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <LetGallerySection gallery={gallery} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5">
          <LetInfoSection p={p} />
          <LetDescriptionSection p={p} />
          <LetDetailsSection />
          <LetAmenitiesSection />
          <LetLocalSection />
          <LetDocumentsSection />
        </div>
        <LetBookingPanel p={p} />
      </div>
    </div>
  )
}
