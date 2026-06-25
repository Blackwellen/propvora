"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ListChecks, ChevronDown, ChevronUp } from "lucide-react"
import type { HomeAiPriority } from "../types"

const STORAGE_KEY = "propvora_action_items_visible"

interface HomeActionItemsCardProps {
  priorities: HomeAiPriority[]
}

export function HomeActionItemsCard({ priorities }: HomeActionItemsCardProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) setVisible(stored === "true")
    } catch {}
  }, [])

  function toggle() {
    const next = !visible
    setVisible(next)
    try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
  }

  return (
    <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-xl p-5 text-white flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <ListChecks className="text-white" style={{ width: 14, height: 14 }} />
          </div>
          <h3 className="text-[13px] font-semibold text-white">Action items</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-violet-200">Live from your workspace</span>
          <button
            onClick={toggle}
            aria-label={visible ? "Collapse action items" : "Expand action items"}
            className="w-6 h-6 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
          >
            {visible
              ? <ChevronUp className="text-white" style={{ width: 12, height: 12 }} />
              : <ChevronDown className="text-white" style={{ width: 12, height: 12 }} />
            }
          </button>
        </div>
      </div>

      {visible && (
        <div className="flex flex-col gap-2 flex-1">
          {priorities.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <CheckCircle2 className="text-white" style={{ width: 20, height: 20 }} />
              </div>
              <p className="text-[13px] font-medium text-white">Nothing needs attention</p>
              <p className="text-[11px] text-violet-200">No outstanding invoices, overdue tasks or compliance deadlines.</p>
            </div>
          ) : (
            priorities.map((priority) => (
              <Link
                key={priority.id}
                href={priority.href ?? "/property-manager"}
                className="bg-white/10 hover:bg-white/20 rounded-xl p-3 flex items-start gap-3 transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {priority.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white font-medium leading-tight">{priority.title}</p>
                  <p className="text-[11px] text-violet-200 mt-0.5 leading-snug">{priority.subtitle}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="bg-white/20 group-hover:bg-white/30 text-white text-[11px] px-2 py-1 rounded-lg font-medium transition-colors">
                    {priority.action}
                  </span>
                  <ArrowRight className="text-violet-300 group-hover:text-white transition-colors" style={{ width: 12, height: 12 }} />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {!visible && (
        <p className="text-[11px] text-violet-300">
          {priorities.length === 0 ? "All clear" : `${priorities.length} item${priorities.length === 1 ? "" : "s"} need attention`}
        </p>
      )}
    </div>
  )
}
