"use client"

import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan, useSupplierPermissions } from "@/components/supplier-workspace/useSupplierPlan"
import { SupplierPermissionDenied } from "@/components/supplier-workspace/ui"
import SupplierEarningsPage from "../earnings/page"
import SupplierInvoicesPage from "../invoices/page"
import SupplierPayoutsPage from "../payouts/page"
import { TeamRevenue, TeamStatements, TeamTaxes, TeamAdjustments } from "@/features/supplier/team/finance/TeamFinanceViews"

/* Finance hub ← Earnings + Invoices + Payouts (+ Statements/Taxes/Adjustments
   for Team plan). Gated to owner/admin/finance roles. */
export default function SupplierFinanceHub() {
  const { isTeam } = useSupplierPlan()
  const perms = useSupplierPermissions()

  if (!perms.can("finance")) {
    return (
      <div className="space-y-5">
        <SupplierPermissionDenied
          title="Finance is restricted"
          description="Only owners, admins and finance roles can view earnings, invoices and payouts."
        />
      </div>
    )
  }

  // Team plan: the Earnings tab shows the revenue-by-team/service view (image 17).
  const tabs: SupplierHubTab[] = [
    { key: "earnings", label: "Earnings", render: () => (isTeam ? <TeamRevenue /> : <SupplierEarningsPage />) },
    { key: "invoices", label: "Invoices", render: () => <SupplierInvoicesPage /> },
    { key: "payouts", label: "Payouts", render: () => <SupplierPayoutsPage /> },
    {
      key: "statements", label: "Statements", teamOnly: true,
      upgradeTitle: "Statements", upgradeDescription: "Monthly statements with fee, VAT and payout reconciliation.",
      upgradeFeatures: ["Monthly statements", "Fee & VAT breakdown", "Payout reconciliation"],
      render: () => <TeamStatements />,
    },
    {
      key: "taxes", label: "Taxes", teamOnly: true,
      upgradeTitle: "Tax summaries", upgradeDescription: "VAT summaries and MTD-ready exports for your accountant.",
      upgradeFeatures: ["VAT by category", "MTD-ready exports", "Quarterly summaries"],
      render: () => <TeamTaxes />,
    },
    {
      key: "adjustments", label: "Adjustments", teamOnly: true,
      upgradeTitle: "Adjustments & credits", upgradeDescription: "Manual adjustments, credits and an approval queue — fully audited.",
      upgradeFeatures: ["Credits & debits", "Approval queue", "Audit trail"],
      render: () => <TeamAdjustments />,
    },
  ]

  return (
    <SupplierTabHub
      title="Finance"
      subtitle="Earnings, invoices and payouts"
      tabs={tabs}
      isTeam={isTeam}
    />
  )
}
