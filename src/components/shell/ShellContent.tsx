"use client"

import ShellTabsRail from "./ShellTabsRail"

interface ShellContentProps {
  children: React.ReactNode
  /** Override the sticky top rail (e.g. SupplierQuickBar). If omitted, ShellTabsRail is used. */
  topRail?: React.ReactNode
}

export default function ShellContent({ children, topRail }: ShellContentProps) {
  return (
    <main
      id="main-content"
      data-shell-content
      tabIndex={-1}
      aria-label="Main content"
      className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden focus:outline-none"
      style={{ background: "transparent" }}
    >
      {topRail !== undefined ? topRail : <ShellTabsRail />}
      {/* Bottom padding below lg keeps content clear of the fixed MobileBottomNav
          (its height + safe-area inset). Desktop (lg+) padding is unchanged. */}
      <div className="px-4 py-5 pb-[calc(env(safe-area-inset-bottom,0px)+72px)] sm:px-6 sm:py-6 sm:pb-[calc(env(safe-area-inset-bottom,0px)+72px)] lg:pb-6">
        {children}
      </div>
    </main>
  )
}
