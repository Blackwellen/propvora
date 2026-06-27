import React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium",
  {
    variants: {
      variant: {
        default:   "bg-slate-100 text-slate-700",
        primary:   "bg-[var(--brand-soft)] text-[var(--brand)]",
        success:   "bg-[#ECFDF5] text-[#059669]",
        warning:   "bg-[#FFFBEB] text-[#d97706]",
        danger:    "bg-[#FEF2F2] text-[#dc2626]",
        ai:        "bg-[#F5F3FF] text-[#6d28d9]",
        sky:       "bg-[#f0f9ff] text-[#0284c7]",
        outline:   "border border-[#E2E8F0] text-slate-600 bg-transparent",
      },
      size: {
        sm: "px-2    py-0.5 text-xs",
        md: "px-2.5  py-0.5 text-xs",
        lg: "px-3    py-1   text-sm",
      },
      dot: {
        true:  "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      dot: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  const dotColour: Record<string, string> = {
    default: "bg-slate-400",
    primary: "bg-[var(--brand)]",
    success: "bg-[#10B981]",
    warning: "bg-[#F59E0B]",
    danger:  "bg-[#EF4444]",
    ai:      "bg-[#7C3AED]",
    sky:     "bg-[#0EA5E9]",
    outline: "bg-slate-400",
  }

  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColour[variant ?? "default"] ?? "bg-slate-400"
          )}
        />
      )}
      {children}
    </span>
  )
}
