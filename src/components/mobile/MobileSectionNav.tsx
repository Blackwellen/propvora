"use client"

import { useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import MobileTabs, { type MobileTabItem } from "./MobileTabs"

/* ──────────────────────────────────────────────────────────────────────────
   MobileSectionNav

   Drop-in mobile treatment for a settings / account section side rail. On
   phones the desktop side nav is hidden and this renders the same destinations
   as a horizontally-scrollable `MobileTabs` strip, driven by the active route.

   Selecting a tab navigates (router.push) to that section's href — preserving
   the exact same destinations and order the desktop rail uses. No desktop side
   rail is shown on phones (callers gate the rail behind `lg:`/`hidden lg:flex`).

   a11y + ergonomics come from MobileTabs: roving tab focus, ≥40px targets,
   active pill auto-scrolls into view, reduced-motion respected.
─────────────────────────────────────────────────────────────────────────── */

export interface MobileSectionNavItem {
  key: string
  label: string
  href: string
  icon?: React.ElementType
}

interface MobileSectionNavProps {
  items: MobileSectionNavItem[]
  /** Route that is the section root (matched exactly, not by prefix). */
  rootHref?: string
  className?: string
  "aria-label"?: string
}

/**
 * Resolve which item is active for the current pathname. The root href matches
 * exactly; all others match by prefix (so nested routes keep their tab lit).
 */
function activeKeyFor(
  items: MobileSectionNavItem[],
  pathname: string,
  rootHref?: string
): string {
  // Prefer the longest matching prefix so e.g. /security/sso beats /security.
  let best: MobileSectionNavItem | undefined
  for (const item of items) {
    if (item.href === rootHref) {
      if (pathname === item.href) best = item
      continue
    }
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (!best || item.href.length > best.href.length) best = item
    }
  }
  // Fall back to an exact root match, then the first item.
  if (!best && rootHref && pathname === rootHref) {
    best = items.find((i) => i.href === rootHref)
  }
  return (best ?? items[0])?.key ?? ""
}

export default function MobileSectionNav({
  items,
  rootHref,
  className,
  "aria-label": ariaLabel = "Settings sections",
}: MobileSectionNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const tabs: MobileTabItem[] = useMemo(
    () => items.map((i) => ({ id: i.key, label: i.label, icon: i.icon })),
    [items]
  )

  const activeKey = useMemo(
    () => activeKeyFor(items, pathname ?? "", rootHref),
    [items, pathname, rootHref]
  )

  return (
    <MobileTabs
      tabs={tabs}
      value={activeKey}
      onChange={(id) => {
        const item = items.find((i) => i.key === id)
        if (item) router.push(item.href)
      }}
      aria-label={ariaLabel}
      className={className}
    />
  )
}
