import React from "react"
import { cn } from "@/lib/utils"

interface TenancySectionCardProps {
  children: React.ReactNode
  className?: string
}

export function TenancySectionCard({ children, className }: TenancySectionCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm", className)}>
      {children}
    </div>
  )
}
