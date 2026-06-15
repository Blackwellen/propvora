"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  type?: "generic" | "network" | "not-found" | "permission"
  className?: string
  size?: "sm" | "md" | "lg"
}

const errorTypes = {
  generic:     { Icon: AlertCircle, title: "Something went wrong",     desc: "An unexpected error occurred. Please try again." },
  network:     { Icon: WifiOff,     title: "Network error",            desc: "Unable to connect. Check your internet connection." },
  "not-found": { Icon: AlertCircle, title: "Not found",                desc: "The requested resource could not be found." },
  permission:  { Icon: AlertCircle, title: "Access denied",            desc: "You don't have permission to view this content." },
}

export function ErrorState({
  title,
  description,
  onRetry,
  type = "generic",
  className,
  size = "md",
}: ErrorStateProps) {
  const { Icon, title: defaultTitle, desc: defaultDesc } = errorTypes[type]
  const sizeClasses = {
    sm: { wrapper: "py-8",  iconWrap: "w-12 h-12", icon: "w-6 h-6",  title: "text-sm", desc: "text-xs" },
    md: { wrapper: "py-12", iconWrap: "w-14 h-14", icon: "w-7 h-7",  title: "text-base", desc: "text-sm" },
    lg: { wrapper: "py-20", iconWrap: "w-16 h-16", icon: "w-8 h-8",  title: "text-lg", desc: "text-base" },
  }
  const s = sizeClasses[size]

  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center text-center", s.wrapper, className)}>
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-2xl bg-[#FEF2F2] mb-4",
          s.iconWrap
        )}
      >
        <Icon className={cn("text-[#EF4444]", s.icon)} />
      </div>

      <h3 className={cn("font-semibold text-slate-900", s.title)}>
        {title ?? defaultTitle}
      </h3>
      <p className={cn("mt-1.5 max-w-sm text-slate-500", s.desc)}>
        {description ?? defaultDesc}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Try again
        </Button>
      )}
    </div>
  )
}
