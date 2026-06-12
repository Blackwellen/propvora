"use client"

import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold text-sm rounded-xl",
    "transition-all duration-200 ease-out cursor-pointer select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:saturate-50",
    // Reactive press effect — consistent across every variant.
    "active:scale-[0.97]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "text-white bg-gradient-to-b from-[#3b82f6] to-[#2563EB]",
          "shadow-[0_2px_10px_rgba(37,99,235,0.32)]",
          "hover:from-[#2f6bf0] hover:to-[#1d4ed8] hover:shadow-[0_5px_18px_rgba(37,99,235,0.45)]",
          "active:from-[#1d4ed8] active:to-[#1e40af]",
          "focus-visible:ring-[#2563EB]",
        ],
        secondary: [
          "text-white bg-gradient-to-b from-[#1E3A5F] to-[#0D1B2A]",
          "shadow-[0_2px_10px_rgba(13,27,42,0.30)]",
          "hover:shadow-[0_5px_18px_rgba(13,27,42,0.42)] hover:from-[#26456f]",
          "active:from-[#0D1B2A] active:to-[#050d16]",
          "focus-visible:ring-slate-900",
        ],
        soft: [
          "bg-[#EFF6FF] text-[#2563EB]",
          "hover:bg-[#dbeafe] hover:shadow-[0_3px_10px_rgba(37,99,235,0.14)] active:bg-[#bfdbfe]",
          "focus-visible:ring-[#2563EB]",
        ],
        outline: [
          "border border-[#E2E8F0] bg-white text-slate-700 shadow-xs",
          "hover:bg-slate-50 hover:border-[#B9D2F3] hover:shadow-sm active:bg-slate-100",
          "focus-visible:ring-[#2563EB]",
        ],
        ghost: [
          "bg-transparent text-slate-600",
          "hover:bg-slate-100 active:bg-slate-200",
          "focus-visible:ring-[#2563EB]",
        ],
        destructive: [
          "text-white bg-gradient-to-b from-[#f87171] to-[#EF4444]",
          "shadow-[0_2px_10px_rgba(239,68,68,0.32)]",
          "hover:from-[#ef4444] hover:to-[#dc2626] hover:shadow-[0_5px_18px_rgba(239,68,68,0.45)]",
          "active:to-[#b91c1c] focus-visible:ring-[#EF4444]",
        ],
        "destructive-soft": [
          "bg-[#FEF2F2] text-[#EF4444]",
          "hover:bg-[#fecaca] active:bg-[#fca5a5]",
          "focus-visible:ring-[#EF4444]",
        ],
        success: [
          "text-white bg-gradient-to-b from-[#34d399] to-[#10B981]",
          "shadow-[0_2px_10px_rgba(16,185,129,0.30)]",
          "hover:from-[#10b981] hover:to-[#059669] hover:shadow-[0_5px_18px_rgba(16,185,129,0.42)]",
          "active:to-[#047857] focus-visible:ring-[#10B981]",
        ],
        warning: [
          "text-white bg-gradient-to-b from-[#fbbf24] to-[#F59E0B]",
          "shadow-[0_2px_10px_rgba(245,158,11,0.30)]",
          "hover:to-[#d97706] hover:shadow-[0_5px_18px_rgba(245,158,11,0.42)]",
          "active:to-[#b45309] focus-visible:ring-[#F59E0B]",
        ],
        ai: [
          "text-white bg-gradient-to-b from-[#8b5cf6] to-[#7C3AED]",
          "shadow-[0_2px_10px_rgba(124,58,237,0.32)]",
          "hover:from-[#7c3aed] hover:to-[#6d28d9] hover:shadow-[0_5px_18px_rgba(124,58,237,0.45)]",
          "active:to-[#5b21b6] focus-visible:ring-[#7C3AED]",
        ],
        "ai-soft": [
          "bg-[#F5F3FF] text-[#7C3AED]",
          "hover:bg-[#ede9fe] hover:shadow-[0_3px_10px_rgba(124,58,237,0.14)] active:bg-[#ddd6fe]",
          "focus-visible:ring-[#7C3AED]",
        ],
        icon: [
          "bg-transparent text-slate-600",
          "hover:bg-slate-100 active:bg-slate-200",
          "focus-visible:ring-[#2563EB]",
        ],
      },
      size: {
        xs:   "h-7  px-2.5 text-xs gap-1.5",
        sm:   "h-8  px-3   text-sm gap-1.5",
        md:   "h-9  px-4   text-sm",
        lg:   "h-10 px-5   text-base",
        xl:   "h-12 px-6   text-base",
        icon: "h-9  w-9  p-0",
        "icon-sm": "h-8  w-8  p-0",
        "icon-xs": "h-7  w-7  p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
