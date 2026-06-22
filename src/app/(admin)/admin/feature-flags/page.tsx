import { redirect } from "next/navigation"
import { Flag, ToggleRight, ShieldAlert, Layers, GitBranch } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { getFlagStates } from "@/lib/admin/feature-flags"
import { FLAG_REGISTRY } from "@/lib/flags/registry"
import { groupFlagsByStage, FLAG_META, STAGE_BLURB, type FlagRisk } from "@/lib/flags/meta"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminStatusChip, AdminBanner,
  AdminNotConfigured, type AdminKpi, type AdminTone,
} from "@/components/admin/ui"
import FlagToggle from "./FlagToggle"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const RISK_TONE: Record<FlagRisk, AdminTone> = { low: "slate", medium: "amber", high: "red" }

export default async function FeatureFlagsPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const { states, available, total, enabledCount, overriddenCount } = await getFlagStates()
  const groups = groupFlagsByStage()
  const highRiskOn = Object.values(states).filter((s) => s.enabled && FLAG_META[s.key].risk === "high").length

  const kpis: AdminKpi[] = [
    { label: "Total flags", value: total, icon: Flag, tone: "blue" },
    { label: "Enabled", value: enabledCount, icon: ToggleRight, tone: enabledCount > 0 ? "emerald" : "slate", sub: `${total - enabledCount} off` },
    { label: "Global overrides", value: overriddenCount, icon: Layers, tone: "violet", sub: `${total - overriddenCount} on registry default` },
    { label: "High-risk ON", value: highRiskOn, icon: ShieldAlert, tone: highRiskOn > 0 ? "red" : "emerald" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Flag}
        title="Feature flags"
        subtitle="Stage the platform. Everything defaults OFF — V1 ships as the operator SaaS; marketplace, customer, supplier-SaaS, accounting GL and full automations stay in code behind these flags."
      />

      <AdminKpiStrip kpis={kpis} cols={4} />

      {!available && (
        <AdminBanner tone="amber" icon={ShieldAlert} title="Reading registry defaults.">
          The <code className="font-mono">platform_feature_flags</code> table isn&apos;t provisioned, so every flag shows its registry default (OFF) and toggles will report it on save. Provision the table to persist global overrides.
        </AdminBanner>
      )}

      <AdminBanner tone="slate" icon={GitBranch} title="Dependencies enforced.">
        A child flag can&apos;t be enabled while its parent is off, and effective state always re-applies the dependency rules (marketplace sub-flags need the master; escrow/disputes need payments; full automations need canvas-lite).
      </AdminBanner>

      {groups.map(({ stage, modules }) => (
        <section key={stage} className="space-y-3">
          <div className="flex items-center gap-2.5 pt-1">
            <AdminStatusChip tone={stage === "V2" ? "violet" : stage === "V1.5" ? "blue" : "slate"}>{stage}</AdminStatusChip>
            <p className="text-[12.5px] text-slate-500">{STAGE_BLURB[stage]}</p>
          </div>

          {modules.map(({ module, keys }) => (
            <AdminCard key={module} padded={false}>
              <div className="px-4 py-2.5 border-b border-[#EEF3FB] bg-[#FAFCFF] flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#0B1B3F]">{module}</h3>
                <span className="text-[11px] text-slate-400">{keys.length} flag{keys.length === 1 ? "" : "s"}</span>
              </div>
              <ul className="divide-y divide-[#F1F5FB]">
                {keys.map((key) => {
                  const def = FLAG_REGISTRY[key]
                  const meta = FLAG_META[key]
                  const st = states[key]
                  const parentDef = meta.parent ? FLAG_REGISTRY[meta.parent] : null
                  const parentOn = parentDef ? states[meta.parent!].enabled : true
                  const blocked = !!parentDef && !parentOn
                  return (
                    <li key={key} className="px-4 py-3.5 flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-semibold text-[#0B1B3F]">{def.label}</span>
                          <AdminStatusChip tone={RISK_TONE[meta.risk]}>{meta.risk} risk</AdminStatusChip>
                          {st.hasRow ? (
                            <span className="text-[10.5px] text-slate-400">global override</span>
                          ) : (
                            <span className="text-[10.5px] text-slate-400">registry default</span>
                          )}
                          <code className="text-[10.5px] font-mono text-slate-400">{def.dbKey}</code>
                        </div>
                        <p className="text-[12.5px] text-slate-500 mt-0.5 text-pretty">{def.description}</p>
                        {parentDef && (
                          <p className={`text-[11.5px] mt-1 ${parentOn ? "text-slate-400" : "text-amber-600"}`}>
                            Requires <span className="font-medium">{parentDef.label}</span>{parentOn ? " (on)" : " — currently OFF, enable it first"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 pt-0.5">
                        <AdminStatusChip tone={st.enabled ? "emerald" : "slate"} dot>{st.enabled ? "Enabled" : "Disabled"}</AdminStatusChip>
                        <FlagToggle
                          flagKey={key}
                          label={def.label}
                          enabled={st.enabled}
                          risk={meta.risk}
                          blocked={blocked}
                          blockedReason={parentDef ? `Enable ${parentDef.label} first` : undefined}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </AdminCard>
          ))}
        </section>
      ))}

      {groups.length === 0 && (
        <AdminNotConfigured title="No flags registered" description="The feature-flag registry is empty." />
      )}
    </div>
  )
}
