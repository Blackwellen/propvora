"use client"

import { CheckCircle2, PenLine, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../../../components/toast"
import { StatusPill, type PillTone } from "../../../components/StatusPill"

interface Item {
  id: string
  label: string
  category: string
  status: string
  tone: PillTone
  icon: React.ElementType
  done: boolean
}

interface Props {
  items: Item[]
  done: number
  pct: number
  onToggle: (id: string) => void
}

export default function MoveInChecklist({ items, done, pct, onToggle }: Props) {
  const { toast } = useCustomerToast()
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-slate-900">Move-in checklist</h3>
        <span className="text-[12px] font-semibold text-blue-600">
          {done}/{items.length} complete
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
        <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="divide-y divide-slate-50">
        {items.map((i) => {
          const Icon = i.icon
          return (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <button
                onClick={() => onToggle(i.id)}
                className={cn(
                  "w-6 h-6 rounded-md border flex items-center justify-center shrink-0",
                  i.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                )}
              >
                {i.done && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <span
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  i.done ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                )}
              >
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[13px] font-semibold", i.done ? "text-slate-500" : "text-slate-800")}>
                  {i.label}
                </p>
                <p className="text-[11px] text-slate-400">{i.category}</p>
              </div>
              <StatusPill tone={i.tone}>{i.status}</StatusPill>
              {i.id === "photos" ? (
                <button
                  onClick={() => toast("Upload photos (upload-only) — coming soon", "info")}
                  className="text-[11.5px] font-semibold text-blue-600 inline-flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              ) : i.category === "Meters" && !i.done ? (
                <button
                  onClick={() => toast("Add meter reading — coming soon", "info")}
                  className="text-[11.5px] font-semibold text-blue-600"
                >
                  Add reading
                </button>
              ) : i.id === "inventory" ? (
                <button
                  onClick={() => toast("Signature requested", "info")}
                  className="text-[11.5px] font-semibold text-blue-600 inline-flex items-center gap-1"
                >
                  <PenLine className="w-3.5 h-3.5" /> Sign
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
