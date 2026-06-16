"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Settings, Eye, EyeOff, Pause, UserCircle, ShieldCheck, Users, MapPin, ChevronRight,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierStatusBadge,
  SupplierBanner, SupplierButton,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"

interface ProfileRow { status?: "draft" | "active" | "paused"; display_name?: string | null }

const STATUS_OPTIONS: { value: "active" | "paused" | "draft"; label: string; desc: string; icon: typeof Eye }[] = [
  { value: "active", label: "Published", desc: "Visible to property managers; receiving leads.", icon: Eye },
  { value: "paused", label: "Paused", desc: "Temporarily hidden; existing jobs continue.", icon: Pause },
  { value: "draft", label: "Draft", desc: "Not yet published; finish your profile first.", icon: EyeOff },
]

const LINKS = [
  { href: "/supplier/profile", label: "Business profile", desc: "Name, bio, trades and presentation", icon: UserCircle },
  { href: "/supplier/verification", label: "Verification & badges", desc: "Trust level and evidence", icon: ShieldCheck },
  { href: "/supplier/team", label: "Team & roles", desc: "Who can access this workspace", icon: Users },
  { href: "/supplier/coverage", label: "Coverage areas", desc: "Where you operate", icon: MapPin },
]

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
          <SupplierCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">Marketplace visibility</h2>
              </div>
              <SupplierStatusBadge tone={status === "active" ? "emerald" : status === "paused" ? "amber" : "slate"}>
                {status === "active" ? "Published" : status === "paused" ? "Paused" : "Draft"}
              </SupplierStatusBadge>
            </div>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const current = opt.value === status
                return (
                  <div key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border ${current ? "border-[#2563EB] bg-blue-50/40" : "border-slate-100"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${current ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500"}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                    {current ? (
                      <SupplierStatusBadge tone="blue">Current</SupplierStatusBadge>
                    ) : (
                      <SupplierButton size="sm" variant="secondary" onClick={() => setStatus(opt.value)} disabled={busy}>Set</SupplierButton>
                    )}
                  </div>
                )
              })}
            </div>
          </SupplierCard>

          <SupplierCard className="divide-y divide-slate-100">
            {LINKS.map((l) => {
              const Icon = l.icon
              return (
                <Link key={l.href} href={l.href} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{l.label}</p>
                    <p className="text-xs text-slate-400">{l.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              )
            })}
          </SupplierCard>
        </>
      )}
    </div>
  )
}
