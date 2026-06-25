"use client"

import { useTenancyDetailCtx } from "../layout"
import { PaymentsTab } from "@/components/portfolio/tenancy-detail/PaymentsTab"

export default function TenancyPaymentsPage() {
  const { t } = useTenancyDetailCtx()
  if (!t) return null
  return <PaymentsTab t={t} />
}
