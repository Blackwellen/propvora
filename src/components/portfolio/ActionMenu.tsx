"use client"
import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile, MobileSheet } from "@/components/mobile"

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
  /** Accessible title shown in the mobile bottom sheet. */
  sheetTitle?: string
}

export function ActionMenu({ items, align = "right", sheetTitle = "Actions" }: Props) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const trigger = (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={sheetTitle}
      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
    >
      <MoreHorizontal className="w-4 h-4" />
    </button>
  )

  // Mobile: render the menu as a focus-trapped bottom sheet so it is never
  // clipped by card edges or pushed off-screen near the viewport bottom.
  if (isMobile) {
    return (
      <div className="inline-block">
        {trigger}
        <MobileSheet open={open} onClose={() => setOpen(false)} title={sheetTitle}>
          <div className="py-1" role="menu" aria-label={sheetTitle}>
            {items.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={i}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    item.onClick()
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 min-h-[48px] text-[15px] font-medium rounded-xl transition-colors disabled:opacity-40",
                    item.variant === "danger"
                      ? "text-red-600 hover:bg-red-50 active:bg-red-50"
                      : "text-slate-700 hover:bg-slate-50 active:bg-slate-50"
                  )}
                >
                  {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
                  {item.label}
                </button>
              )
            })}
          </div>
        </MobileSheet>
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      {trigger}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
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
                  role="menuitem"
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
