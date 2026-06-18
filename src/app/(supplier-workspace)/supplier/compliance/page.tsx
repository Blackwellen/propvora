"use client"

import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import SupplierVerificationPage from "../verification/page"
import SupplierInsurancePage from "../insurance/page"
import { TeamExpiryTracker, TeamAccreditations, TeamChecks } from "@/features/supplier/team/compliance/TeamComplianceViews"

/* Compliance hub ← Verification + Insurance & licences (+ Accreditations /
   Expiry Tracker / Team Checks for Team plan). */
export default function SupplierComplianceHub() {
  const { isTeam } = useSupplierPlan()

  const tabs: SupplierHubTab[] = [
    { key: "verification", label: "Verification", render: () => <SupplierVerificationPage /> },
    { key: "insurance", label: "Insurance", render: () => <SupplierInsurancePage /> },
    {
      key: "expiry-tracker", label: "Expiry Tracker", teamOnly: true,
      upgradeTitle: "Compliance expiry tracking",
      upgradeDescription: "Track every licence, accreditation and insurance expiry across your team.",
      upgradeFeatures: ["Expiry timeline", "Renewal reminders", "Blocked-service alerts"],
      render: () => <TeamExpiryTracker />,
    },
    {
      key: "accreditations", label: "Accreditations", teamOnly: true,
      upgradeTitle: "Accreditations register",
      upgradeDescription: "Company and trade accreditations with verification status and public badges.",
      upgradeFeatures: ["Accreditation registry", "Linked services", "Public trust badges"],
      render: () => <TeamAccreditations />,
    },
    {
      key: "team-checks", label: "Team Checks", teamOnly: true,
      upgradeTitle: "Per-worker compliance checks",
      upgradeDescription: "Qualifications, DBS, right-to-work and training per worker with job eligibility.",
      upgradeFeatures: ["Qualification matrix", "Job eligibility", "Block / unblock workers"],
      render: () => <TeamChecks />,
    },
  ]

  return (
    <SupplierTabHub
      title="Compliance"
      subtitle="Verification, insurance, licences and documents"
      tabs={tabs}
      isTeam={isTeam}
    />
  )
}
