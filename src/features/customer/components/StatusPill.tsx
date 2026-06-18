import { cn } from "@/lib/utils"

export type PillTone = "blue" | "violet" | "emerald" | "amber" | "red" | "slate"

const TONE: Record<PillTone, string> = {
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
}

/** Status pill matching the design tokens used across the customer workspace. */
export function StatusPill({ tone, children, className }: { tone: PillTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap", TONE[tone], className)}>
      {children}
    </span>
  )
}

export function bookingStatusTone(s: string): PillTone {
  switch (s) {
    case "Upcoming": return "violet"
    case "Confirmed": return "emerald"
    case "Completed": return "slate"
    case "Cancelled": return "slate"
    case "Open dispute": return "amber"
    default: return "slate"
  }
}
export function paymentTone(s: string): PillTone {
  switch (s) {
    case "Paid": return "emerald"
    case "Partially paid": return "amber"
    case "Unpaid": return "red"
    case "Refunded": return "blue"
    default: return "slate"
  }
}
export function disputeTone(s: string): PillTone {
  switch (s) {
    case "Awaiting host response": return "amber"
    case "Awaiting Propvora": return "violet"
    case "Evidence submitted": return "blue"
    case "Refund in progress": return "emerald"
    case "Resolved": return "emerald"
    case "Closed": return "slate"
    default: return "slate"
  }
}
