"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* Types                                                                */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export interface SettingsNavItem {
  key: string
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  locked?: boolean
  group?: string
}

interface SettingsShellProps {
  title: string
  subtitle: string
  nav: SettingsNavItem[]
  children: React.ReactNode
  headerAction?: React.ReactNode
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* NavItem                                                              */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function NavItem({ item, pathname }: { item: SettingsNavItem; pathname: string }) {
  const Icon = item.icon
  const active = item.href === pathname

  return (
    <Link
      href={item.locked ? "#" : item.href}
      aria-disabled={item.locked}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
        active
          ? "bg-[#EFF6FF] text-[#2563EB]"
          : item.locked
          ? "text-slate-300 cursor-not-allowed pointer-events-none"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="text-[10px] min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white font-bold flex items-center justify-center">
          {item.badge}
        </span>
      )}
      {item.locked && <Lock className="w-3 h-3 shrink-0 text-slate-300" />}
    </Link>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SettingsSideNav                                                      */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function SettingsSideNav({ nav }: { nav: SettingsNavItem[] }) {
  const pathname = usePathname()

  const ungrouped = nav.filter(n => !n.group)
  const groups = Array.from(
    new Set(nav.filter(n => !!n.group).map(n => n.group as string))
  )

  return (
    <div className="px-3">
      {ungrouped.map(item => (
        <NavItem key={item.key} item={item} pathname={pathname} />
      ))}
      {groups.map(group => (
        <div key={group} className="mt-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">
            {group}
          </p>
          {nav
            .filter(n => n.group === group)
            .map(item => (
              <NavItem key={item.key} item={item} pathname={pathname} />
            ))}
        </div>
      ))}
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* SettingsShell                                                        */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function SettingsShell({
  title,
  subtitle,
  nav,
  children,
  headerAction,
}: SettingsShellProps) {
  return (
    <div className="flex h-full min-h-screen bg-[#F8FAFC]">
      {/* ── Desktop left sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-slate-200 bg-white">
        {/* Sidebar header */}
        <div className="px-5 py-5 border-b border-slate-100">
          <h1 className="text-[15px] font-bold text-slate-900">{title}</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        {/* Sidebar nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <SettingsSideNav nav={nav} />
        </nav>
      </aside>

      {/* ── Mobile top nav ────────────────────────────────────────── */}
      <div className="lg:hidden border-b border-slate-200 bg-white sticky top-0 z-10 px-4 py-2 w-full">
        <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {nav
            .filter(n => !n.locked)
            .map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              )
            })}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Sticky page header */}
        <div className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-slate-200">
          <div className="max-w-[1120px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                {title}
              </p>
            </div>
            {headerAction}
          </div>
        </div>
        {/* Page content */}
        <div className="max-w-[1120px] mx-auto px-4 sm:px-8 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  )
}

export default SettingsShell
