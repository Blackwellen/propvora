"use client"

import { useTenancyDetailCtx } from "../layout"
import { DepositTab } from "@/components/portfolio/tenancy-detail/DepositTab"

export default function TenancyDepositPage() {
  const { t, save } = useTenancyDetailCtx()
  if (!t) return null
  return <DepositTab t={t} onSave={save} />
}
