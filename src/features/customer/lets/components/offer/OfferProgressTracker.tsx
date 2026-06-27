import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OfferStatus } from "../../../data/lets"

const PROGRESS = ["Offer submitted", "Under review", "Negotiation", "Accepted", "Holding deposit", "Tenancy"]

interface Props {
  status: OfferStatus
}

export default function OfferProgressTracker({ status }: Props) {
  const stageIndex = status === "Accepted" ? 3 : status === "Counter offer" ? 2 : 1

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <ol className="flex items-start justify-between gap-2">
        {PROGRESS.map((s, i) => {
          const done = i < stageIndex
          const current = i === stageIndex
          return (
            <li key={s} className="flex-1 flex flex-col items-center text-center relative">
              {i < PROGRESS.length - 1 && (
                <span className={cn("absolute top-[14px] left-1/2 w-full h-0.5", done ? "bg-emerald-400" : "bg-slate-200")} />
              )}
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold z-10",
                  done ? "bg-emerald-500 text-white" : current ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-400"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <p className={cn("text-[11px] font-semibold mt-2", current ? "text-[var(--brand)]" : done ? "text-slate-700" : "text-slate-400")}>
                {s}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
