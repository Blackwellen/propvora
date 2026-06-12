"use client"

interface ContactTypeBadgeProps {
  type: string
  size?: "sm" | "md"
}

const TYPE_STYLES: Record<string, string> = {
  tenant:        "bg-emerald-100 text-emerald-700",
  landlord:      "bg-blue-100 text-blue-700",
  applicant:     "bg-purple-100 text-purple-700",
  post_tenant:   "bg-slate-100 text-slate-600",
  supplier:      "bg-orange-100 text-orange-700",
  agent:         "bg-indigo-100 text-indigo-700",
  legal:         "bg-violet-100 text-violet-700",
  accountant:    "bg-teal-100 text-teal-700",
  investor:      "bg-amber-100 text-amber-700",
  guarantor:     "bg-cyan-100 text-cyan-700",
  maintenance:   "bg-rose-100 text-rose-700",
  other:         "bg-slate-100 text-slate-600",
}

function formatLabel(type: string): string {
  if (type === "post_tenant") return "Past Tenant"
  if (type === "local_authority") return "Local Authority"
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function ContactTypeBadge({ type, size = "md" }: ContactTypeBadgeProps) {
  const colorClass = TYPE_STYLES[type] ?? TYPE_STYLES.other
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium",
        colorClass,
        sizeClass,
      ].join(" ")}
    >
      {formatLabel(type)}
    </span>
  )
}
