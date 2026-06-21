"use client"

import React, { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus, ShieldCheck } from "lucide-react"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MobileTopBar } from "@/components/mobile"
import { OrdersTabNav, type OrdersTab } from "@/features/orders/components/OrdersTabNav"
import { ActiveOrdersTab } from "@/features/orders/components/ActiveOrdersTab"
import { QuotesTab } from "@/features/orders/components/QuotesTab"
import { EscrowTab } from "@/features/orders/components/EscrowTab"
import { CompletedTab } from "@/features/orders/components/CompletedTab"

const VALID: OrdersTab[] = ["active", "quotes", "escrow", "completed"]

function OrdersInner() {
  const params = useSearchParams()
  const raw = params.get("tab")
  const tab: OrdersTab = VALID.includes(raw as OrdersTab) ? (raw as OrdersTab) : "active"

  return (
    <div className="flex flex-col gap-5 py-5">
      <MobileTopBar
        title="Orders"
        subtitle="Supplier orders, quotes & escrow"
        primaryAction={{ label: "Create RFQ", icon: Plus, href: "/property-manager/work/orders?tab=quotes" }}
        overflowActions={[{ label: "Escrow management", icon: ShieldCheck, href: "/property-manager/money/escrow" }]}
      />

      <div className="hidden md:block">
        <SectionHeader
          title="Orders"
          subtitle="Manage supplier orders, compare quotes, hold funds in escrow and close out completed work."
          actions={
            <>
              <Link href="/property-manager/work/orders?tab=quotes" className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Create RFQ
              </Link>
              <Link href="/property-manager/money/escrow" className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
                <ShieldCheck className="w-4 h-4" /> Escrow management
              </Link>
            </>
          }
          tabs={<OrdersTabNav active={tab} />}
        />
      </div>
      <div className="md:hidden -mx-4">
        <OrdersTabNav active={tab} />
      </div>

      {tab === "active" && <ActiveOrdersTab />}
      {tab === "quotes" && <QuotesTab />}
      {tab === "escrow" && <EscrowTab />}
      {tab === "completed" && <CompletedTab />}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Loading orders…</div>}>
      <OrdersInner />
    </Suspense>
  )
}
