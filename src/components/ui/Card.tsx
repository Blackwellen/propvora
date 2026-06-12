import React from "react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Card root                                                            */
/* ------------------------------------------------------------------ */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle hover lift effect — good for clickable cards */
  hoverable?: boolean
  /** Remove the default padding */
  noPadding?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, noPadding, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-xl border border-[#E2E8F0]",
        "shadow-sm",
        hoverable &&
          "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        !noPadding && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = "Card"

/* ------------------------------------------------------------------ */
/* CardHeader                                                           */
/* ------------------------------------------------------------------ */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-start justify-between gap-3 mb-4", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

/* ------------------------------------------------------------------ */
/* CardTitle                                                            */
/* ------------------------------------------------------------------ */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-base font-semibold text-slate-900 leading-tight", className)}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = "CardTitle"

/* ------------------------------------------------------------------ */
/* CardDescription                                                      */
/* ------------------------------------------------------------------ */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-slate-500 mt-1", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

/* ------------------------------------------------------------------ */
/* CardContent                                                          */
/* ------------------------------------------------------------------ */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

/* ------------------------------------------------------------------ */
/* CardFooter                                                           */
/* ------------------------------------------------------------------ */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-3 mt-4 pt-4",
        "border-t border-[#E2E8F0]",
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
