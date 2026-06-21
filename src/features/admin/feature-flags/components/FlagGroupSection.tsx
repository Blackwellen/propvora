import React from "react"
import { AdminCard, AdminStatusChip } from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"
import type { FlagRisk } from "@/lib/flags/meta"

type FlagState = {
  key: string
  enabled: boolean
  hasRow: boolean
}

type FlagDef = {
  label: string
  description: string
  dbKey: string
}

type FlagMeta = {
  risk: FlagRisk
  parent?: string
}

type FlagItem = {
  key: string
  def: FlagDef
  meta: FlagMeta
  state: FlagState
  parentDef: FlagDef | null
  parentOn: boolean
  blocked: boolean
}

type Module = {
  module: string
  items: FlagItem[]
}

type Group = {
  stage: string
  modules: Module[]
}

const RISK_TONE: Record<FlagRisk, AdminTone> = { low: "slate", medium: "amber", high: "red" }

interface Props {
  groups: Group[]
  renderToggle: (item: FlagItem) => React.ReactNode
}

export function FlagGroupSection({ groups, renderToggle }: Props) {
  return (
    <>
      {groups.map(({ stage, modules }) => (
        <section key={stage} className="space-y-3">
          <div className="flex items-center gap-2.5 pt-1">
            <AdminStatusChip tone={stage === "V2" ? "violet" : stage === "V1.5" ? "blue" : "slate"}>
              {stage}
            </AdminStatusChip>
          </div>

          {modules.map(({ module, items }) => (
            <AdminCard key={module} padded={false}>
              <div className="px-4 py-2.5 border-b border-[#EEF3FB] bg-[#FAFCFF] flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#0B1B3F]">{module}</h3>
                <span className="text-[11px] text-slate-400">{items.length} flag{items.length === 1 ? "" : "s"}</span>
              </div>
              <ul className="divide-y divide-[#F1F5FB]">
                {items.map((item) => (
                  <li key={item.key} className="px-4 py-3.5 flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-[#0B1B3F]">{item.def.label}</span>
                        <AdminStatusChip tone={RISK_TONE[item.meta.risk]}>{item.meta.risk} risk</AdminStatusChip>
                        {item.state.hasRow ? (
                          <span className="text-[10.5px] text-slate-400">global override</span>
                        ) : (
                          <span className="text-[10.5px] text-slate-400">registry default</span>
                        )}
                        <code className="text-[10.5px] font-mono text-slate-400">{item.def.dbKey}</code>
                      </div>
                      <p className="text-[12.5px] text-slate-500 mt-0.5 text-pretty">{item.def.description}</p>
                      {item.parentDef && (
                        <p className={`text-[11.5px] mt-1 ${item.parentOn ? "text-slate-400" : "text-amber-600"}`}>
                          Requires <span className="font-medium">{item.parentDef.label}</span>
                          {item.parentOn ? " (on)" : " — currently OFF, enable it first"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 pt-0.5">
                      <AdminStatusChip tone={item.state.enabled ? "emerald" : "slate"} dot>
                        {item.state.enabled ? "Enabled" : "Disabled"}
                      </AdminStatusChip>
                      {renderToggle(item)}
                    </div>
                  </li>
                ))}
              </ul>
            </AdminCard>
          ))}
        </section>
      ))}
    </>
  )
}
