"use client"

import { IdCard, Info, CheckCircle2 } from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { PortalsTabNav } from "@/components/portals/PortalsTabNav"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePortalProfiles } from "@/hooks/usePortals"

export default function PortalProfilesPage() {
  const { workspace } = useWorkspace()
  const { data: profiles = [], isLoading } = usePortalProfiles(workspace?.id)
  const usingDefaults = profiles.some((p) => p.source === "default")

  return (
    <DashboardContainer>
      <SectionHeader
        title="Portal Profiles"
        subtitle="Default access profile templates used when granting portal access."
        tabs={<PortalsTabNav />}
      />

      <div className="px-6 pt-6 pb-10 space-y-6">

        {usingDefaults && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-[12px] text-blue-800 leading-relaxed">
              Showing built-in default profiles. Custom profiles are stored in the
              <span className="font-mono"> portal_profiles </span> table
              (migration 20260621120000 — apply to enable workspace customisation). The grant wizard already uses these templates.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">Loading profiles…</div>
          ) : (
            profiles.map((p) => (
              <div key={p.key} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <IdCard className="w-5 h-5 text-blue-600" />
                  </div>
                  {p.is_enabled && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" /> Enabled
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{p.label}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Access type</span>
                  <span className="text-[11px] font-semibold text-slate-600 capitalize">{p.access_type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardContainer>
  )
}
