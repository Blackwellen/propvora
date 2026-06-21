"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { SUPPLIER_SOLO_WIDGETS, SUPPLIER_TEAM_WIDGETS, type SupplierQuickWidget } from "@/lib/supplier-quickbar"
import { useSupplierPlan } from "./useSupplierPlan"

export default function SupplierQuickBar() {
  const pathname = usePathname()
  const { isTeam } = useSupplierPlan()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = document.querySelector("[data-shell-content]") as HTMLElement | null
    const target = el ?? window
    const handler = () => {
      const top = el ? el.scrollTop : window.scrollY
      setScrolled(top > 8)
    }
    target.addEventListener("scroll", handler, { passive: true })
    return () => target.removeEventListener("scroll", handler)
  }, [])

  // Render immediately with the default (solo) — updates in place when plan resolves from DB.
  // Do NOT gate on `loading` — workspaceId may be null during server-side render, which keeps
  // loading true forever and hides the bar entirely.
  const widgets: SupplierQuickWidget[] = isTeam ? SUPPLIER_TEAM_WIDGETS : SUPPLIER_SOLO_WIDGETS

  return (
    <div
      className={cn(
        "hidden lg:block border-b border-[#E2EAF6] sticky top-0 z-10 rounded-t-2xl transition-all duration-200",
        scrolled
          ? "bg-white/60 backdrop-blur-md border-white/20"
          : "bg-white/90 backdrop-blur-sm"
      )}
    >
      {/* Plan badge */}
      <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {widgets.map(widget => {
          const Icon = widget.icon
          const isActive =
            widget.href === "/supplier"
              ? pathname === "/supplier"
              : pathname.startsWith(widget.href + "/") || pathname === widget.href

          return (
            <Link
              key={widget.key}
              href={widget.href}
              className={cn(
                "group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold shrink-0 transition-all duration-150 border",
                isActive
                  ? "border-transparent shadow-sm"
                  : "border-transparent hover:border-slate-200/80 hover:shadow-sm"
              )}
              style={
                isActive
                  ? { background: widget.bg, color: widget.colour }
                  : { color: "#64748B" }
              }
            >
              {/* Hover bg */}
              {!isActive && (
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: widget.bg }}
                  aria-hidden="true"
                />
              )}

              {/* Icon chip */}
              <div
                className={cn(
                  "relative z-10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isActive ? "shadow-sm" : "group-hover:shadow-sm"
                )}
                style={{
                  background: isActive ? widget.colour : widget.colour + "1A",
                }}
              >
                <div style={{ color: isActive ? "#fff" : widget.colour }}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Label */}
              <span
                className="relative z-10 transition-colors group-hover:text-[var(--w-colour)]"
                style={
                  isActive
                    ? { color: widget.colour }
                    : ({ "--w-colour": widget.colour } as React.CSSProperties)
                }
              >
                {widget.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
