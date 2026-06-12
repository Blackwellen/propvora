"use client"

import { PLANNING_PROFILES } from "@/lib/planning/profiles"

interface ProfileTagProps {
  profileKey: string
  label?: string
  size?: "sm" | "md"
}

export default function ProfileTag({ profileKey, label, size = "md" }: ProfileTagProps) {
  const profile = PLANNING_PROFILES.find((p) => p.key === profileKey)
  const colour = profile?.colour ?? "#64748B"
  const displayLabel = label ?? profile?.label ?? profileKey

  return (
    <span
      style={{
        background: colour + "22",
        color: colour,
        borderColor: colour + "44",
      }}
      className={
        size === "sm"
          ? "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md border"
          : "inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-lg border"
      }
    >
      {displayLabel}
    </span>
  )
}
