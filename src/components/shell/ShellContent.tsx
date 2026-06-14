"use client"

import ShellTabsRail from "./ShellTabsRail"

interface ShellContentProps {
  children: React.ReactNode
}

export default function ShellContent({ children }: ShellContentProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      aria-label="Main content"
      className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden focus:outline-none"
      style={{ background: "transparent" }}
    >
      <ShellTabsRail />
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        {children}
      </div>
    </main>
  )
}
