import React from "react"
import { AdminCard, AdminStatusChip } from "@/components/admin/ui"

type Integration = {
  key: string
  label: string
  configured: boolean
}

interface Props {
  integrations: Integration[]
}

export function ConfigurationStatusSection({ integrations }: Props) {
  return (
    <AdminCard>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-[#0B1B3F]">Configuration status</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {integrations.map((i) => (
          <div
            key={i.key}
            className={`rounded-xl border p-3 ${i.configured ? "border-emerald-100 bg-[#ECFDF5]/40" : "border-[#E2EAF6] bg-[#FAFCFF]"}`}
          >
            <p className="text-[12.5px] font-medium text-[#0B1B3F]">{i.label}</p>
            <div className="mt-2">
              {i.configured
                ? <AdminStatusChip tone="emerald" dot>Configured</AdminStatusChip>
                : <AdminStatusChip tone="slate" dot>Not set</AdminStatusChip>}
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  )
}
