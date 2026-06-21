"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLANNING_PROFILES } from "@/lib/planning/profiles"

interface StepProfileData {
  operationProfile: string
}

interface StepProfileProps {
  data: StepProfileData
  onChange: (d: Partial<StepProfileData>) => void
}

export function StepProfile({ data, onChange }: StepProfileProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">Select how this property will be operated.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PLANNING_PROFILES.map((profile) => (
          <button
            key={profile.key}
            onClick={() => onChange({ operationProfile: profile.key })}
            className={cn(
              "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150",
              data.operationProfile === profile.key
                ? "border-2 bg-white shadow-sm"
                : "border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50"
            )}
            style={data.operationProfile === profile.key ? { borderColor: profile.colour } : {}}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: `${profile.colour}15` }}
            >
              <span className="text-sm font-bold" style={{ color: profile.colour }}>
                {profile.label.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-slate-900">{profile.label}</p>
                {data.operationProfile === profile.key && (
                  <Check className="w-3.5 h-3.5" style={{ color: profile.colour }} />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{profile.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
