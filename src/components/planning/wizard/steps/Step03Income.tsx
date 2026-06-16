"use client"

import React, { useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import { getProfileByKey } from "@/lib/planning/profiles"
import { cn } from "@/lib/utils"

import RentPerRoomTab from "@/components/planning/wizard/income/tabs/RentPerRoomTab"
import RentPerUnitTab from "@/components/planning/wizard/income/tabs/RentPerUnitTab"
import NightlyRateTab from "@/components/planning/wizard/income/tabs/NightlyRateTab"
import OccupancyTab from "@/components/planning/wizard/income/tabs/OccupancyTab"
import SeasonalAssumptionsTab from "@/components/planning/wizard/income/tabs/SeasonalAssumptionsTab"
import AncillaryIncomeTab from "@/components/planning/wizard/income/tabs/AncillaryIncomeTab"
import ParkingIncomeTab from "@/components/planning/wizard/income/tabs/ParkingIncomeTab"
import LaundryIncomeTab from "@/components/planning/wizard/income/tabs/LaundryIncomeTab"
import MembershipServiceChargesTab from "@/components/planning/wizard/income/tabs/MembershipServiceChargesTab"
import CorporateLetsTab from "@/components/planning/wizard/income/tabs/CorporateLetsTab"
import OtherIncomeLinesTab from "@/components/planning/wizard/income/tabs/OtherIncomeLinesTab"

const INCOME_TABS: { label: string; slug: string; Component: React.ComponentType }[] = [
  { label: "Rent per room", slug: "rent-per-room", Component: RentPerRoomTab },
  { label: "Rent per unit", slug: "rent-per-unit", Component: RentPerUnitTab },
  { label: "Nightly rate", slug: "nightly-rate", Component: NightlyRateTab },
  { label: "Occupancy", slug: "occupancy", Component: OccupancyTab },
  { label: "Seasonal assumptions", slug: "seasonal-assumptions", Component: SeasonalAssumptionsTab },
  { label: "Ancillary income", slug: "ancillary-income", Component: AncillaryIncomeTab },
  { label: "Parking", slug: "parking", Component: ParkingIncomeTab },
  { label: "Laundry", slug: "laundry", Component: LaundryIncomeTab },
  { label: "Membership & service charges", slug: "membership-service-charges", Component: MembershipServiceChargesTab },
  { label: "Corporate lets", slug: "corporate-lets", Component: CorporateLetsTab },
  { label: "Other income lines", slug: "other-income-lines", Component: OtherIncomeLinesTab },
]

export default function Step03Income() {
  const { state, update, setStep } = useWizard()
  const router = useRouter()
  const searchParams = useSearchParams()
  const profile = useMemo(() => getProfileByKey(state.profileKey), [state.profileKey])

  const active =
    INCOME_TABS.find((t) => t.label === state.activeIncomeTab) ?? INCOME_TABS[0]

  // Restore active tab from URL on mount (?tab=slug)
  useEffect(() => {
    const slug = searchParams.get("tab")
    if (slug) {
      const match = INCOME_TABS.find((t) => t.slug === slug)
      if (match && match.label !== state.activeIncomeTab) update({ activeIncomeTab: match.label })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectTab(label: string, slug: string) {
    update({ activeIncomeTab: label })
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", slug)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const ActiveComponent = active.Component

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 mb-1">Revenue Model Builder</h1>
            <p className="text-[13.5px] text-slate-500">
              Configure your revenue streams, occupancy assumptions, and pricing to project gross income.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12.5px] text-slate-500">Profile:</span>
            <span className="text-[13px] font-bold text-slate-800">{profile?.label ?? "—"}</span>
            <button
              onClick={() => setStep(1)}
              className="text-[12.5px] font-semibold text-[#7C3AED] hover:text-violet-700"
            >
              Change Profile
            </button>
          </div>
        </div>
      </div>

      {/* Income type tabs */}
      <div className="border-b border-slate-100 overflow-x-auto">
        <div className="flex items-center px-4 sm:px-6 lg:px-8 gap-0 min-w-max">
          {INCOME_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => selectTab(tab.label, tab.slug)}
              className={cn(
                "px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all",
                active.label === tab.label
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active tab */}
      <ActiveComponent />
    </div>
  )
}
