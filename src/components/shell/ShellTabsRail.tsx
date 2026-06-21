"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ALL_QUICK_WIDGETS,
  loadQuickBarPrefs,
  type QuickBarPrefs,
} from "@/lib/quickbar"

export default function ShellTabsRail() {
  const pathname = usePathname()
  const [prefs, setPrefs] = useState<QuickBarPrefs | null>(null)
  const [scrolled, setScrolled] = useState(false)

  // Load prefs from localStorage on mount
  useEffect(() => {
    setPrefs(loadQuickBarPrefs())
  }, [])

  // Re-read prefs when window gets focus (user saved in settings)
  useEffect(() => {
    const onFocus = () => setPrefs(loadQuickBarPrefs())
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  // Scroll transparency
  useEffect(() => {
    const el = document.querySelector("[data-shell-content]") as HTMLElement | null
    const target = el ?? window
    const handler = () => {
      const scrollTop = el ? el.scrollTop : window.scrollY
      setScrolled(scrollTop > 8)
    }
    target.addEventListener("scroll", handler, { passive: true })
    return () => target.removeEventListener("scroll", handler)
  }, [])

  if (!prefs) return null

  const widgets = prefs.order
    .map(k => ALL_QUICK_WIDGETS.find(w => w.key === k))
    .filter((w): w is NonNullable<typeof w> => !!w && prefs.visible[w.key])

  return (
    /* Desktop-only quick/task rail. Below lg the mobile top bar + MobileTabs own
       the sticky chrome, so this sticky rail is suppressed to avoid a double
       sticky stack fighting the mobile header. It aligns flush to the content
       column (no right-margin mismatch / overflow) and never covers page
       headers or tabs because it sits above them in the scroll flow. */
    <div
      className={cn(
        "hidden lg:block border-b border-[#E2EAF6] sticky top-0 z-10 rounded-t-2xl transition-all duration-200",
        scrolled
          ? "bg-white/60 backdrop-blur-md border-white/20"
          : "bg-white/90 backdrop-blur-sm"
      )}
    >
      <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {widgets.map(widget => {
          const Icon = widget.icon
          const isActive =
            pathname === widget.href || pathname.startsWith(widget.href + "/")

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
                <div style={{ color: isActive ? "var(--text-inverse)" : widget.colour }}>
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
