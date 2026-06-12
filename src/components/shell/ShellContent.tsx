"use client"

import ShellTabsRail from "./ShellTabsRail"

interface ShellContentProps {
  children: React.ReactNode
}

export default function ShellContent({ children }: ShellContentProps) {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: "transparent" }}>
      <ShellTabsRail />
      <div className="px-6 py-6">
        {children}
      </div>
    </main>
  )
}
