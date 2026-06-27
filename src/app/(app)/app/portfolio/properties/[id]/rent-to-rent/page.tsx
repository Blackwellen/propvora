"use client"

import Link from "next/link"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { useTenancies } from "@/hooks/useTenancies"
import { RentToRentTab } from "@/components/portfolio/property-detail/RentToRentTab"
import { Handshake, ChevronLeft } from "lucide-react"

export default function PropertyRentToRentPage() {
  const { propertyId, prop, save } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  const { data: tenancies = [] } = useTenancies(workspace?.id, propertyId)

  if (!prop) return null

  // Profile gate: the R2R agreement surface only applies to rent-to-rent
  // properties. Block direct-URL access for any other profile.
  if (prop.operation_profile !== "rent_to_rent") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center py-20 px-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Handshake size={26} className="text-slate-300" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-slate-700">Not a rent-to-rent property</p>
          <p className="text-[13px] text-slate-500 mt-1 max-w-sm">
            The R2R Agreement section is only available for properties with a Rent-to-Rent operation profile.
          </p>
        </div>
        <Link
          href={`/property-manager/portfolio/properties/${propertyId}/overview`}
          className="text-[13px] font-semibold text-[var(--brand)] hover:underline flex items-center gap-1"
        >
          <ChevronLeft size={14} /> Back to Overview
        </Link>
      </div>
    )
  }

  return (
    <RentToRentTab
      prop={prop}
      workspaceId={workspace?.id}
      propertyId={propertyId}
      onSave={save}
      tenanciesList={tenancies}
    />
  )
}
