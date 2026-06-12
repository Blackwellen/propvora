import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  size?: "sm" | "md" | "lg"
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: { wrapper: "py-8",  icon: "w-10 h-10", iconWrap: "w-14 h-14", title: "text-sm", desc: "text-xs" },
    md: { wrapper: "py-12", icon: "w-12 h-12", iconWrap: "w-16 h-16", title: "text-base", desc: "text-sm" },
    lg: { wrapper: "py-20", icon: "w-14 h-14", iconWrap: "w-20 h-20", title: "text-lg", desc: "text-base" },
  }
  const s = sizeClasses[size]

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", s.wrapper, className)}>
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-slate-100 mb-4",
            s.iconWrap
          )}
        >
          <Icon className={cn("text-slate-400", s.icon)} />
        </div>
      )}

      <h3 className={cn("font-semibold text-slate-900 text-balance", s.title)}>
        {title}
      </h3>

      {description && (
        <p className={cn("mt-1.5 max-w-sm text-slate-500 text-pretty", s.desc)}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <Button
              variant="primary"
              size={size === "sm" ? "sm" : "md"}
              onClick={action.onClick}
              {...(action.href ? { asChild: true } : {})}
            >
              {action.href ? (
                <a href={action.href}>{action.label}</a>
              ) : (
                action.label
              )}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              size={size === "sm" ? "sm" : "md"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
