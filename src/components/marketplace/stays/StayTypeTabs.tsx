'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface StayTypeTabsProps {
  basePath?: string
}

export default function StayTypeTabs({ basePath = '/stays' }: StayTypeTabsProps) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Short stays', href: basePath },
    { label: 'Long-term rentals', href: `${basePath}/long-term` },
    { label: 'Map view', href: `${basePath}/long-term/map` },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
      {tabs.map((tab) => {
        // Exact match for short stays, prefix match for others
        const isActive =
          tab.href === basePath
            ? pathname === basePath || pathname === basePath + '/map'
              ? !pathname.includes('/long-term')
              : false
            : tab.href === `${basePath}/long-term/map`
            ? pathname === `${basePath}/long-term/map`
            : pathname.startsWith(`${basePath}/long-term`) && pathname !== `${basePath}/long-term/map`

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
