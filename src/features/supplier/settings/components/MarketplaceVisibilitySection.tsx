"use client"

import { Settings, Eye, EyeOff, Pause } from "lucide-react"
import {
  SupplierCard, SupplierStatusBadge, SupplierButton,
} from "@/components/supplier-workspace/ui"

type VisibilityStatus = "active" | "paused" | "draft"

const STATUS_OPTIONS: { value: VisibilityStatus; label: string; desc: string; icon: typeof Eye }[] = [
  { value: "active", label: "Published", desc: "Visible to property managers; receiving leads.", icon: Eye },
  { value: "paused", label: "Paused", desc: "Temporarily hidden; existing jobs continue.", icon: Pause },
  { value: "draft", label: "Draft", desc: "Not yet published; finish your profile first.", icon: EyeOff },
]

export interface MarketplaceVisibilitySectionProps {
  currentStatus: VisibilityStatus
  busy: boolean
  onSetStatus: (value: VisibilityStatus) => void
}

export function MarketplaceVisibilitySection({
  currentStatus, busy, onSetStatus,
}: MarketplaceVisibilitySectionProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">Marketplace visibility</h2>
        </div>
        <SupplierStatusBadge
          tone={
            currentStatus === "active" ? "emerald" : currentStatus === "paused" ? "amber" : "slate"
          }
        >
          {currentStatus === "active" ? "Published" : currentStatus === "paused" ? "Paused" : "Draft"}
        </SupplierStatusBadge>
      </div>
      <div className="space-y-2">
        {STATUS_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const current = opt.value === currentStatus
          return (
            <div
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                current ? "border-[var(--brand)] bg-[var(--brand-soft)]/40" : "border-slate-100"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  current ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-500">{opt.desc}</p>
              </div>
              {current ? (
                <SupplierStatusBadge tone="blue">Current</SupplierStatusBadge>
              ) : (
                <SupplierButton
                  size="sm"
                  variant="secondary"
                  onClick={() => onSetStatus(opt.value)}
                  disabled={busy}
                >
                  Set
                </SupplierButton>
              )}
            </div>
          )
        })}
      </div>
    </SupplierCard>
  )
}
