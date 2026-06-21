"use client"

import { useState } from "react"
import type { TabDef } from "@/lib/i18n/tab-config"

interface CountryTabsProps {
  tabs: TabDef[]
  defaultTab?: string
  children: (activeTab: string) => React.ReactNode
  /** Optional: render tab labels with custom elements */
  renderLabel?: (tab: TabDef) => React.ReactNode
}

/**
 * A generic tab bar that renders only the tabs passed to it (already filtered
 * for the workspace's country), and calls children(activeTab) to render content.
 *
 * Usage:
 *   const tabs = useCountryTabs('compliance')
 *   <CountryTabs tabs={tabs}>
 *     {(active) => active === 'overview' ? <Overview /> : …}
 *   </CountryTabs>
 */
export default function CountryTabs({
  tabs,
  defaultTab,
  children,
  renderLabel,
}: CountryTabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? "")

  if (tabs.length === 0) return null

  // Ensure active tab is always valid (in case tabs change after mount)
  const resolvedActive = tabs.some(t => t.key === active) ? active : (tabs[0]?.key ?? "")

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto border-b border-slate-200 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={[
              "shrink-0 px-4 py-3 text-[13.5px] font-[600] border-b-2 transition-colors whitespace-nowrap",
              resolvedActive === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
            ].join(" ")}
            aria-selected={resolvedActive === tab.key}
            role="tab"
          >
            {renderLabel ? renderLabel(tab) : tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel">{children(resolvedActive)}</div>
    </div>
  )
}
