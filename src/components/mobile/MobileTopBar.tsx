"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import MobileSheet from "./MobileSheet"

export interface MobileTopBarAction {
  label: string
  icon?: React.ElementType
  /** Either a route (Link) or a click handler. */
  href?: string
  onClick?: () => void
  /** Render as the danger variant in the overflow sheet. */
  destructive?: boolean
}

interface MobileTopBarProps {
  title: string
  /** Optional subtitle under the title (e.g. count, address). */
  subtitle?: string
  /** Show a back chevron. If `backHref` is set it links there, else router.back(). */
  showBack?: boolean
  backHref?: string
  /** The single primary action shown inline (icon button). */
  primaryAction?: MobileTopBarAction
  /** Secondary actions collapsed into the "⋯" overflow sheet. */
  overflowActions?: MobileTopBarAction[]
  /** Slot rendered on the far left before the title (e.g. hamburger). */
  leading?: React.ReactNode
  className?: string
}

/**
 * Compact sticky top bar for mobile. Replaces the dense desktop TopNavigation
 * below `lg`. Holds: optional back chevron, page title (+subtitle), one primary
 * action, and an overflow "⋯" menu (bottom-sheet) for the rest.
 *
 * Rendered only on mobile — callers wrap it in `lg:hidden` or a breakpoint gate.
 * All targets are ≥44px and keyboard/focus accessible.
 */
export default function MobileTopBar({
  title,
  subtitle,
  showBack,
  backHref,
  primaryAction,
  overflowActions,
  leading,
  className,
}: MobileTopBarProps) {
  const router = useRouter()
  const [overflowOpen, setOverflowOpen] = useState(false)
  const hasOverflow = (overflowActions?.length ?? 0) > 0

  const PrimaryIcon = primaryAction?.icon

  return (
    <header
      className={cn(
        "lg:hidden sticky top-0 z-40 flex items-center gap-2 h-14 px-4 sm:px-6",
        "bg-white/95 backdrop-blur-md border-b border-[#E2EAF6]",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      aria-label="Page toolbar"
    >
      {leading}

      {showBack &&
        (backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="w-11 h-11 -ml-1 rounded-xl flex items-center justify-center text-[#071B4D] hover:bg-[#F0F7FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        ) : (
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-11 h-11 -ml-1 rounded-xl flex items-center justify-center text-[#071B4D] hover:bg-[#F0F7FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ))}

      <div className="flex-1 min-w-0">
        <h1 className="text-[16px] font-bold text-[#071B4D] leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11.5px] text-slate-500 leading-tight truncate">{subtitle}</p>}
      </div>

      {/* Primary action — inline icon button */}
      {primaryAction &&
        (primaryAction.href ? (
          <Link
            href={primaryAction.href}
            aria-label={primaryAction.label}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-[0_4px_14px_rgba(37,99,235,0.30)] hover:bg-[var(--brand-strong)] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand)] motion-reduce:active:scale-100 shrink-0"
          >
            {PrimaryIcon && <PrimaryIcon className="w-5 h-5" />}
          </Link>
        ) : (
          <button
            onClick={primaryAction.onClick}
            aria-label={primaryAction.label}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-[0_4px_14px_rgba(37,99,235,0.30)] hover:bg-[var(--brand-strong)] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand)] motion-reduce:active:scale-100 shrink-0"
          >
            {PrimaryIcon && <PrimaryIcon className="w-5 h-5" />}
          </button>
        ))}

      {/* Overflow */}
      {hasOverflow && (
        <button
          onClick={() => setOverflowOpen(true)}
          aria-label="More actions"
          aria-haspopup="dialog"
          aria-expanded={overflowOpen}
          className="w-11 h-11 rounded-xl flex items-center justify-center bg-white border border-[#E2EAF6] text-[#071B4D] hover:bg-[#F0F7FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 shrink-0"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      )}

      {hasOverflow && (
        <MobileSheet open={overflowOpen} onClose={() => setOverflowOpen(false)} title={title} description="Actions">
          <div className="pb-2">
            {overflowActions!.map((a) => {
              const Icon = a.icon
              const content = (
                <>
                  {Icon && (
                    <span
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        a.destructive ? "bg-red-50" : "bg-slate-100"
                      )}
                    >
                      <Icon className={cn("w-[18px] h-[18px]", a.destructive ? "text-red-600" : "text-slate-600")} />
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[14.5px] font-medium",
                      a.destructive ? "text-red-600" : "text-slate-700"
                    )}
                  >
                    {a.label}
                  </span>
                </>
              )
              const cls =
                "w-full flex items-center gap-3 px-2 min-h-[52px] rounded-2xl hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:bg-slate-100"
              return a.href ? (
                <Link key={a.label} href={a.href} onClick={() => setOverflowOpen(false)} className={cls}>
                  {content}
                </Link>
              ) : (
                <button
                  key={a.label}
                  onClick={() => {
                    setOverflowOpen(false)
                    a.onClick?.()
                  }}
                  className={cls}
                >
                  {content}
                </button>
              )
            })}
          </div>
        </MobileSheet>
      )}
    </header>
  )
}
