"use client"

import React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   Interactive customer-workspace primitives. These carry event handlers
   (onClick / onChange) so they MUST live in a "use client" module. The
   presentational primitives stay in ./ui (a server module) so server pages can
   pass lucide icons as props without tripping the RSC serialization boundary.
   Re-exported from ./ui so import paths stay stable.
─────────────────────────────────────────────────────────────────────────── */

/* ── Segmented tabs (internal detail tabs / multi-view switchers) ─────────── */

export interface CustomerTab {
  key: string
  label: string
  icon?: LucideIcon
  count?: number
}

export function CustomerTabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: CustomerTab[]
  active: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label="Sections"
      className={cn("flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1", className)}
    >
      {tabs.map((t) => {
        const Icon = t.icon
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
              isActive ? "bg-[#0D1B2A] text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {t.label}
            {t.count != null && t.count > 0 && (
              <span
                className={cn(
                  "ml-0.5 px-1.5 py-px rounded-full text-[10px] font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ── Buttons ────────────────────────────────────────────────────────────── */

export function CustomerButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  loading,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md"
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  const variants: Record<string, string> = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-50",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50",
    ghost: "text-slate-600 hover:bg-slate-100 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  }
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
    md: "h-10 px-4 text-sm rounded-xl gap-2",
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  )
}
