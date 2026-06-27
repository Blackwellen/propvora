"use client"

import { Target, Info, CheckCircle2, Clock } from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { PortalsTabNav } from "@/components/portals/PortalsTabNav"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePortalPurposes } from "@/hooks/usePortals"

export default function PortalPurposesPage() {
  const { workspace } = useWorkspace()
  const { data: purposes = [], isLoading } = usePortalPurposes(workspace?.id)
  const usingDefaults = purposes.some((p) => p.source === "default")

  return (
    <DashboardContainer>
      <SectionHeader
        title="Portal Purposes"
        subtitle="Purpose templates that scope what a portal grant is for, with default link expiry."
        tabs={<PortalsTabNav />}
      />

      <div className="px-6 pt-6 pb-10 space-y-6">

        {usingDefaults && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[var(--brand-soft)]/60 border border-[var(--color-brand-100)]">
            <Info className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[var(--brand-strong)] leading-relaxed">
              These are Propvora&apos;s built-in purpose templates — active across every workspace and
              used by the grant wizard to scope access and set default link expiry. Per-workspace
              customisation is on the roadmap.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Purpose</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Description</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">Default expiry</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">Loading purposes…</td></tr>
              ) : (
                purposes.map((p) => (
                  <tr key={p.key} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4 text-[var(--brand)]" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">{p.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-500">{p.description}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {p.default_expiry_days} days
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p.is_enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardContainer>
  )
}
