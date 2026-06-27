"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuestStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (n: number) => void
}

/** Accessible +/- guest counter with ≥44px touch targets. */
export default function GuestStepper({
  value,
  min = 1,
  max = 16,
  onChange,
}: GuestStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  const btn =
    "w-11 h-11 rounded-full border border-[#D6E0F0] flex items-center justify-center text-[var(--brand-strong)] transition-colors hover:border-[var(--brand-strong)] hover:bg-[var(--brand-soft)] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#D6E0F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Fewer guests"
        className={btn}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span
        className="min-w-[3.5rem] text-center text-[15px] font-semibold text-[#0B1B3F] tabular-nums"
        aria-live="polite"
      >
        {value} guest{value === 1 ? "" : "s"}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="More guests"
        className={cn(btn)}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
