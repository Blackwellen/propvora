"use client"

import { useTenancyDetailCtx } from "../layout"
import { CommunicationsTab } from "@/components/portfolio/tenancy-detail/CommunicationsTab"

export default function TenancyCommunicationsPage() {
  const { tenancyId, t } = useTenancyDetailCtx()
  if (!t) return null
  return <CommunicationsTab t={t} tenancyId={tenancyId} />
}
