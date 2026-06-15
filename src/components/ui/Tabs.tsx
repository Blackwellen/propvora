"use client"

import React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "underline" | "pills" | "boxed"
  }
>(({ className, variant = "underline", ...props }, ref) => {
  const variantClasses = {
    underline: "border-b border-[#E2E8F0] gap-0",
    pills:     "gap-1 bg-slate-100 p-1 rounded-xl",
    boxed:     "gap-1 border border-[#E2E8F0] p-1 rounded-lg bg-white",
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        // Horizontal scroll on narrow viewports so tab bars never overflow.
        "flex items-center max-w-full overflow-x-auto overscroll-x-contain",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        variantClasses[variant],
        className
      )}
      data-variant={variant}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
      "text-sm font-medium transition-all duration-150 motion-reduce:transition-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
      "disabled:pointer-events-none disabled:opacity-50",
      // Underline variant
      "[data-variant=underline]_&:px-3 [data-variant=underline]_&:py-2.5",
      "[data-variant=underline]_&:text-slate-500 [data-variant=underline]_&:border-b-2 [data-variant=underline]_&:border-transparent",
      "[data-variant=underline]_&:data-[state=active]:text-[#2563EB] [data-variant=underline]_&:data-[state=active]:border-[#2563EB]",
      "[data-variant=underline]_&:hover:text-slate-700",
      // Pills variant
      "[data-variant=pills]_&:px-3 [data-variant=pills]_&:py-1.5 [data-variant=pills]_&:rounded-lg",
      "[data-variant=pills]_&:text-slate-600 [data-variant=pills]_&:data-[state=active]:bg-white [data-variant=pills]_&:data-[state=active]:text-slate-900 [data-variant=pills]_&:data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 rounded-lg",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
