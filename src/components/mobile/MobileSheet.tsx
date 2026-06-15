"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHasMounted } from "./useBreakpoint"

interface MobileSheetProps {
  open: boolean
  onClose: () => void
  /** Accessible title shown in the sheet header. */
  title?: string
  /** Optional descriptive subtitle under the title. */
  description?: string
  children: React.ReactNode
  /** Optional sticky footer (e.g. Apply / Clear actions). */
  footer?: React.ReactNode
  /** Max height of the sheet as a viewport fraction. Default 0.85. */
  maxHeightVh?: number
  /** Extra class for the panel. */
  className?: string
}

/**
 * Bottom-sheet primitive for mobile surfaces. Renders into a portal with a
 * backdrop, slides up from the bottom, and is fully accessible:
 *  - role=dialog + aria-modal + aria-labelledby
 *  - focus moved in on open, restored to the trigger on close
 *  - focus trap (Tab cycles within the sheet)
 *  - Escape to close, backdrop click to close
 *  - body scroll lock
 *  - safe-area-inset-bottom padding for gesture/home-bar devices
 *  - motion-reduce: skips the slide animation
 *
 * Desktop never mounts this — callers gate it behind a breakpoint hook.
 */
export default function MobileSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxHeightVh = 0.85,
  className,
}: MobileSheetProps) {
  const mounted = useHasMounted()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useRef(`sheet-title-${Math.random().toString(36).slice(2, 9)}`).current

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current

    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null)
        : []

    const t = setTimeout(() => {
      const items = focusables()
      ;(items[0] ?? panel)?.focus()
    }, 20)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === "Tab") {
        const items = focusables()
        if (items.length === 0) {
          e.preventDefault()
          return
        }
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKeyDown)
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] lg:hidden" aria-hidden={false}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm motion-safe:animate-[fadeIn_0.15s_ease-out] motion-reduce:transition-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 bg-white rounded-t-3xl border-t border-[#E2EAF6] shadow-[0_-12px_48px_rgba(15,23,42,0.18)] flex flex-col outline-none",
          "motion-safe:animate-[slideUpSheet_0.22s_cubic-bezier(0.32,0.72,0,1)] motion-reduce:animate-none",
          className
        )}
        style={{ maxHeight: `${Math.round(maxHeightVh * 100)}vh` }}
      >
        {/* Grab handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {(title || description) && (
          <div className="px-5 pt-1 pb-3 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-[16px] font-bold text-[#071B4D] leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-[12.5px] text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="px-3 overflow-y-auto overscroll-contain flex-1">{children}</div>

        {/* Sticky footer + safe-area */}
        {footer ? (
          <div
            className="px-4 pt-3 border-t border-slate-100 shrink-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
          >
            {footer}
          </div>
        ) : (
          <div style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }} aria-hidden="true" />
        )}
      </div>
    </div>,
    document.body
  )
}
