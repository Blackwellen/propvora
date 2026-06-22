"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, RefreshCw, Puzzle, ShieldX, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlanCheckoutTab } from "./PlanCheckoutTab"
import { RenewalsTab } from "./RenewalsTab"
import { AddOnsTab } from "./AddOnsTab"
import { CancellationTab } from "./CancellationTab"
import { BillingHistoryTab } from "./BillingHistoryTab"
import { BillingSummaryRail } from "./BillingSummaryRail"
import { CancellationProvider } from "../data/cancellation-context"

export type BillingTabId = "checkout" | "renewals" | "add-ons" | "cancellation" | "history"

const BASE = "/property-manager/workspace/billing"

const TABS: Array<{ id: BillingTabId; label: string; icon: React.ElementType; href: string }> = [
  { id: "checkout", label: "Plan checkout", icon: CreditCard, href: `${BASE}/checkout` },
  { id: "renewals", label: "Renewals", icon: RefreshCw, href: `${BASE}/renewals` },
  { id: "add-ons", label: "Add-ons", icon: Puzzle, href: `${BASE}/add-ons` },
  { id: "cancellation", label: "Cancellation", icon: ShieldX, href: `${BASE}/cancellation` },
  { id: "history", label: "Billing history", icon: History, href: `${BASE}/history` },
]

export function SubscriptionBillingPage({ tab }: { tab: BillingTabId }) {
  const router = useRouter()
  const activeHref = TABS.find((t) => t.id === tab)?.href ?? TABS[0].href

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription &amp; billing</h1>
        <p className="text-sm text-slate-500">
          Manage your plan, add-ons, renewals, cancellation and billing history for this workspace.
        </p>
      </div>

      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden border-b border-slate-200 pb-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {TABS.map((t) => (
            <option key={t.id} value={t.href}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Route-backed tab nav — hidden below md */}
      <nav className="hidden md:flex flex-wrap gap-1.5 border-b border-slate-200 pb-px -mb-px">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <Link
              key={t.id}
              href={t.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-t-xl px-3.5 py-2 text-[12.5px] font-semibold transition-colors border-b-2",
                active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50",
              )}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </Link>
          )
        })}
      </nav>

      <CancellationProvider>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {tab === "checkout" && <PlanCheckoutTab />}
          {tab === "renewals" && <RenewalsTab />}
          {tab === "add-ons" && <AddOnsTab />}
          {tab === "cancellation" && <CancellationTab />}
          {tab === "history" && <BillingHistoryTab />}
        </div>
        <BillingSummaryRail />
      </div>
      </CancellationProvider>
    </div>
  )
}
