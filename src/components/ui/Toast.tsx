"use client"

import React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const ToastProvider = ToastPrimitive.Provider
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      // Lift clear of the fixed mobile bottom nav below lg; standard offset on lg+.
      "fixed right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2",
      "bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] lg:bottom-4",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-start gap-3",
    "overflow-hidden rounded-xl border p-4 shadow-lg",
    "transition-all duration-300",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[swipe=end]:animate-out data-[state=closed]:fade-out-80",
    "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full",
  ],
  {
    variants: {
      variant: {
        default:     "bg-white border-[#E2E8F0] text-slate-900",
        success:     "bg-[#ECFDF5] border-[#10B981]/30 text-[#065f46]",
        error:       "bg-[#FEF2F2] border-[#EF4444]/30 text-[#991b1b]",
        warning:     "bg-[#FFFBEB] border-[#F59E0B]/30 text-[#92400e]",
        info:        "bg-[#EFF6FF] border-[#2563EB]/30 text-[#1e40af]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const toastIcons = {
  default: null,
  success: <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />,
  error:   <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />,
  info:    <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />,
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant = "default", children, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  >
    {toastIcons[variant ?? "default"]}
    <div className="flex-1">{children}</div>
    <ToastClose />
  </ToastPrimitive.Root>
))
Toast.displayName = ToastPrimitive.Root.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "shrink-0 rounded-md p-1 text-current/50 hover:text-current transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm opacity-80 mt-0.5", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

export {
  ToastProvider, ToastViewport, Toast, ToastClose, ToastTitle, ToastDescription,
}
