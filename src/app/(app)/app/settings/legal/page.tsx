"use client"

import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { LegalModulesEditor } from "@/components/legal/LegalModulesEditor"

export const dynamic = "force-dynamic"

/**
 * Legal settings — workspace custom legal jurisdiction modules. Parity with the
 * Compliance settings page (workspace_compliance_requirements editor). Lets an
 * owner/admin/manager override built-in legal module guidance, disable modules,
 * and add bespoke local legal notes that flow into the Legal section.
 */
export default function LegalSettingsPage() {
  return (
    <DashboardContainer>
      <PageHeader
        title="Legal Settings"
        description="Customise the legal jurisdiction modules and guidance shown across the Legal section for your workspace."
      />
      <div className="grid grid-cols-1 gap-6 px-6 pb-6 mt-6">
        <LegalModulesEditor />
      </div>
    </DashboardContainer>
  )
}
