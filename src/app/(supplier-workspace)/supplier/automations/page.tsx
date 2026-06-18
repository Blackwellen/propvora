"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MobileTopBar } from "@/components/mobile"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { SupplierLoadingState, SupplierCard } from "@/components/supplier-workspace/ui"
import { TeamAutomations } from "@/features/supplier/team/automations/TeamAutomations"

/* /supplier/automations — team/enterprise plans land on the Team Automations hub
   (manifest image 28: Rules / Templates / Logs / Approvals + review-first
   safety). Solo plans are routed to the dedicated automations builder home. */
export default function SupplierAutomationsIndexPage() {
  const { isTeam, loading } = useSupplierPlan()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isTeam) router.replace("/supplier/automations/home")
  }, [loading, isTeam, router])

  if (loading || !isTeam) {
    return <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
  }

  return (
    <>
      <MobileTopBar title="Automations" subtitle="Team supplier workspace" />
      <TeamAutomations />
    </>
  )
}
