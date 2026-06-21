"use client"

import { useState } from "react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierBanner,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { MarketplaceVisibilitySection } from "@/features/supplier/settings/components/MarketplaceVisibilitySection"
import { SettingsNavigationLinks } from "@/features/supplier/settings/components/SettingsNavigationLinks"

interface ProfileRow { status?: "draft" | "active" | "paused"; display_name?: string | null }

export default function SupplierSettingsPage() {
  const { workspaceId } = useSupplierWorkspace()
  const profile = useSupplierApi<ProfileRow>(useSupplierApiUrl("/api/supplier/profile"), {
    select: (j) => (j as { profile?: ProfileRow }).profile ?? (j as ProfileRow),
  })
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)
  const status = profile.data?.status ?? "draft"

  async function setStatus(value: "active" | "paused" | "draft") {
    if (!workspaceId) return
    setBusy(true); setBanner(null)
    try {
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, status: value }),
      })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't update visibility." }); return }
      profile.refresh(); setBanner({ tone: "emerald", msg: "Visibility updated." })
    } catch { setBanner({ tone: "red", msg: "Network error." }) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Settings" subtitle="Workspace settings" />
      <SupplierPageHeader title="Settings" subtitle="Control your visibility and manage your supplier workspace." />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {profile.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={3} /></SupplierCard>
      ) : (
        <>
          <MarketplaceVisibilitySection
            currentStatus={status}
            busy={busy}
            onSetStatus={setStatus}
          />
          <SettingsNavigationLinks />
        </>
      )}
    </div>
  )
}
