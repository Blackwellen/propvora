"use client"

interface ContactStatusDotProps {
  status: string
  className?: string
}

const STATUS_COLOR: Record<string, string> = {
  active:   "bg-emerald-400",
  inactive: "bg-slate-400",
  archived: "bg-slate-300",
}

export default function ContactStatusDot({ status, className = "" }: ContactStatusDotProps) {
  const colorClass = STATUS_COLOR[status] ?? STATUS_COLOR.inactive

  return (
    <span
      className={["inline-block w-2 h-2 rounded-full shrink-0", colorClass, className].join(" ")}
      aria-label={status}
    />
  )
}
