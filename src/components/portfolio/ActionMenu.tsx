"use client"
import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  label: string
  icon?: React.ElementType
  onClick: () => void
  variant?: "default" | "danger"
  disabled?: boolean
}

interface Props {
  items: MenuItem[]
  align?: "left" | "right"
}

export function ActionMenu({ items, align = "right" }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute top-full mt-1 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 min-w-[180px] max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {items.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={i}
                  onClick={() => {
                    setOpen(false)
                    item.onClick()
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3.5 py-2 text-[12.5px] font-medium transition-colors disabled:opacity-40",
                    item.variant === "danger"
                      ? "text-red-600 hover:bg-red-50"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  {item.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
