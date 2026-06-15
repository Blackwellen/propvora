"use client"

import React from "react"
import Link from "next/link"
import { Store, SearchX, PlusCircle, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

/* ──────────────────────────────────────────────────────────────────────────
   MarketplaceEmptyState — a real, premium empty state (never lorem).

   Three flavours:
     "browse"     — marketplace has no published listings at all.
     "no-results" — listings exist but the active filters matched none.
     "own"        — the workspace hasn't published any listings yet.
─────────────────────────────────────────────────────────────────────────── */

interface MarketplaceEmptyStateProps {
  variant: "browse" | "no-results" | "own"
  /** Override the default heading/body for a precise message. */
  title?: string
  description?: string
  /** Primary CTA (e.g. clear filters, create listing). */
  action?: { label: string; href?: string; onClick?: () => void; icon?: LucideIcon }
  /** Secondary, quieter action. */
  secondaryAction?: { label: string; href?: string; onClick?: () => void }
  className?: string
}

const PRESET: Record<MarketplaceEmptyStateProps["variant"], { icon: LucideIcon; title: string; body: string }> = {
  browse: {
    icon: Store,
    title: "The marketplace is just getting started",
    body: "No published listings are available right now. Check back shortly — suppliers and operators are coming online across every category.",
  },
  "no-results": {
    icon: SearchX,
    title: "No listings match your filters",
    body: "Try widening your search — clear a filter, broaden the price range, or pick a different category to see more results.",
  },
  own: {
    icon: PlusCircle,
    title: "You haven't published any listings",
    body: "Publish your first listing to reach operators and customers across the marketplace. Drafts stay private until you publish them.",
  },
}

export function MarketplaceEmptyState({
  variant,
  title,
  description,
  action,
  secondaryAction,
  className,
}: MarketplaceEmptyStateProps) {
  const preset = PRESET[variant]
  const Icon = preset.icon
  const ActionIcon = action?.icon

  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-20 px-6", className)}>
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-base font-bold text-slate-700">{title ?? preset.title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-500 text-pretty">
        {description ?? preset.body}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {action &&
            (action.href ? (
              <Button variant="primary" size="md" asChild>
                <Link href={action.href}>
                  {ActionIcon && <ActionIcon className="w-4 h-4" />}
                  {action.label}
                </Link>
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={action.onClick}>
                {ActionIcon && <ActionIcon className="w-4 h-4" />}
                {action.label}
              </Button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Button variant="outline" size="md" asChild>
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" size="md" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  )
}

export default MarketplaceEmptyState
