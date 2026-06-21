import React from "react"
import { AdminCard, AdminStatusChip } from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"

function postureTone(score: number): { tone: AdminTone; label: string } {
  if (score >= 85) return { tone: "emerald", label: "Strong" }
  if (score >= 65) return { tone: "amber", label: "Fair" }
  return { tone: "red", label: "At risk" }
}

interface PostureData {
  score: number
  controlsEnforced: number
  controlsTotal: number
  totalAdmins: number
  mfaAdmins: number
}

interface Props {
  posture: PostureData
}

export function SecurityPostureBanner({ posture }: Props) {
  const pt = postureTone(posture.score)

  return (
    <AdminCard
      className={
        pt.tone === "emerald"
          ? "border-emerald-200 bg-[#ECFDF5]/60"
          : pt.tone === "amber"
          ? "border-amber-200 bg-[#FFFBEB]"
          : "border-red-200 bg-[#FEF2F2]"
      }
    >
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2EAF6" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={pt.tone === "emerald" ? "#10B981" : pt.tone === "amber" ? "#F59E0B" : "#EF4444"}
              strokeWidth="3"
              strokeDasharray={`${posture.score} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[16px] font-bold text-[#0B1B3F]">
            {posture.score}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-semibold text-[#0B1B3F]">Security posture: {pt.label}</p>
            <AdminStatusChip tone={pt.tone} dot>{posture.score}/100</AdminStatusChip>
          </div>
          <p className="text-[12.5px] text-slate-600 mt-0.5">
            {posture.controlsEnforced} of {posture.controlsTotal} architectural controls enforced
            {posture.totalAdmins > 0
              ? ` · ${posture.mfaAdmins}/${posture.totalAdmins} admins have MFA enrolled`
              : ""}.
            Score is computed from provable facts only.
          </p>
        </div>
      </div>
    </AdminCard>
  )
}
