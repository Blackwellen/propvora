"use client"

import { ShieldCheck, ShieldAlert, ShieldQuestion, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { type VerificationPhase, phaseMeta } from "./status"

/* ──────────────────────────────────────────────────────────────────────────
   TrustBadge — an honest, status-driven badge. The "Identity verified" emerald
   badge appears ONLY when the real phase is `verified`. Every other phase shows
   a neutral/in-progress badge so we never over-claim.
─────────────────────────────────────────────────────────────────────────── */

const TONE: Record<string, { wrap: string; icon: string }> = {
  emerald: { wrap: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: "text-emerald-600" },
  blue: { wrap: "bg-blue-50 text-blue-700 border-blue-100", icon: "text-blue-600" },
  amber: { wrap: "bg-amber-50 text-amber-700 border-amber-100", icon: "text-amber-600" },
  slate: { wrap: "bg-slate-100 text-slate-600 border-slate-200", icon: "text-slate-500" },
  red: { wrap: "bg-red-50 text-red-700 border-red-100", icon: "text-red-600" },
}

export function TrustBadge({ phase, className }: { phase: VerificationPhase; className?: string }) {
  const meta = phaseMeta(phase)
  const tone = TONE[meta.tone] ?? TONE.slate
  const Icon =
    phase === "verified"
      ? ShieldCheck
      : phase === "requires_input"
        ? ShieldAlert
        : phase === "processing" || phase === "pending"
          ? Clock
          : ShieldQuestion

  const label = phase === "verified" ? "Identity verified" : meta.label

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border whitespace-nowrap",
        tone.wrap,
        className
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", tone.icon)} />
      {label}
    </span>
  )
}
