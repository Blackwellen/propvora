"use client"

import { MobileTopBar } from "@/components/mobile"
import { SupplierPageHeader } from "@/components/supplier-workspace/ui"
import { OpenQuotesTab } from "@/features/supplier/quotes/components/tabs/QuotesListTab"

/* Supplier → Quotes — quote requests inbox.
   The OpenQuotesTab owns its own filter rail (Open / Submitted / All), so this
   page is a thin shell that provides the mobile top bar and desktop page header. */
export default function SupplierQuotesPage() {
  return (
    <div className="space-y-5">
      <MobileTopBar title="Quotes" subtitle="Quote requests inbox" />
      <SupplierPageHeader
        title="Quotes"
        subtitle="Quote requests from property managers — respond to win the work"
      />
      <OpenQuotesTab />
    </div>
  )
}
