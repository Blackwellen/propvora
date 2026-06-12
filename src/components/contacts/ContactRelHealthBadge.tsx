"use client"

interface ContactRelHealthBadgeProps {
  health: string
  className?: string
}

interface HealthConfig {
  dot: string
  label: string
  text: string
}

const HEALTH_MAP: Record<string, HealthConfig> = {
  strong:   { dot: "bg-emerald-500", label: "Strong",   text: "text-emerald-700" },
  good:     { dot: "bg-blue-500",    label: "Good",     text: "text-blue-700" },
  neutral:  { dot: "bg-slate-400",   label: "Neutral",  text: "text-slate-600" },
  at_risk:  { dot: "bg-amber-400",   label: "At Risk",  text: "text-amber-700" },
  critical: { dot: "bg-red-500",     label: "Critical", text: "text-red-700" },
}

export default function ContactRelHealthBadge({ health, className = "" }: ContactRelHealthBadgeProps) {
  const config = HEALTH_MAP[health] ?? HEALTH_MAP.neutral

  return (
    <span className={["inline-flex items-center gap-1.5", className].join(" ")}>
      <span className={["w-2 h-2 rounded-full shrink-0", config.dot].join(" ")} />
      <span className={["text-xs font-medium", config.text].join(" ")}>{config.label}</span>
    </span>
  )
}
