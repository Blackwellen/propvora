import { cn } from "@/lib/utils"
import { Check, Lock, ShieldCheck, Send, CircleDot } from "lucide-react"
import { normalisePayoutStatus, type PayoutStatus } from "./status"

/* Escrow lifecycle, in order. Funds are HELD until the stay/job completes —
   the timeline makes that explicit and honest. */
const STEPS: { key: string; label: string; sub: string; icon: typeof Lock; reached: (s: PayoutStatus) => boolean; current: (s: PayoutStatus) => boolean }[] = [
  {
    key: "authorised",
    label: "Payment authorised",
    sub: "Guest card charged, funds secured",
    icon: Lock,
    reached: () => true,
    current: () => false,
  },
  {
    key: "in_escrow",
    label: "Held in escrow",
    sub: "Funds held safely until the stay completes",
    icon: ShieldCheck,
    reached: (s) => s !== "reversed",
    current: (s) => s === "in_escrow",
  },
  {
    key: "pending_payout",
    label: "Released for payout",
    sub: "Stay completed — clearing to your account",
    icon: Send,
    reached: (s) => s === "pending_payout" || s === "paid",
    current: (s) => s === "pending_payout",
  },
  {
    key: "paid",
    label: "Paid out",
    sub: "Settled to your connected account",
    icon: Check,
    reached: (s) => s === "paid",
    current: (s) => s === "paid",
  },
]

/** Per-booking escrow timeline. Vertical, premium, honest about holding funds. */
export function EscrowTimeline({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const s = normalisePayoutStatus(status)
  const reversed = s === "reversed"

  return (
    <ol className={cn("space-y-0", className)}>
      {STEPS.map((step, i) => {
        const reached = !reversed && step.reached(s)
        const current = !reversed && step.current(s)
        const Icon = reached ? step.icon : CircleDot
        const last = i === STEPS.length - 1
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 bottom-0 w-px",
                  reached ? "bg-emerald-200" : "bg-slate-200"
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                reached
                  ? current
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-white border-slate-200 text-slate-300"
              )}
            >
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-[13px] font-semibold",
                  reached ? "text-slate-800" : "text-slate-400"
                )}
              >
                {step.label}
                {current && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                    Current
                  </span>
                )}
              </p>
              <p className={cn("text-[11.5px] mt-0.5", reached ? "text-slate-500" : "text-slate-400")}>
                {step.sub}
              </p>
            </div>
          </li>
        )
      })}
      {reversed && (
        <li className="flex gap-3">
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-50 border border-red-200 text-red-600">
            <CircleDot className="w-4 h-4" />
          </span>
          <div className="pt-0.5">
            <p className="text-[13px] font-semibold text-red-700">Payment reversed</p>
            <p className="text-[11.5px] mt-0.5 text-red-500">
              These funds were refunded or reversed — no payout will be made.
            </p>
          </div>
        </li>
      )}
    </ol>
  )
}
