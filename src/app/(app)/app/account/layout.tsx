"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { User, Shield, KeyRound, Bell, Sliders, Monitor, Activity, Link2, Lock, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileSectionNav, type MobileSectionNavItem } from "@/components/mobile"

const ACCOUNT_NAV = [
  { key: "overview",  label: "Overview",           href: "/property-manager/account",                    icon: User },
  { key: "profile",   label: "Profile",            href: "/property-manager/account/profile",            icon: User },
  { key: "security",  label: "Security",           href: "/property-manager/account/security",           icon: Shield },
  { key: "login",     label: "Login Methods",      href: "/property-manager/account/login",              icon: KeyRound },
  { key: "notifs",    label: "Notifications",      href: "/property-manager/account/notifications",      icon: Bell },
  { key: "prefs",     label: "Preferences",        href: "/property-manager/account/preferences",        icon: Sliders },
  { key: "sessions",  label: "Sessions & Devices", href: "/property-manager/account/sessions",           icon: Monitor },
  { key: "activity",  label: "Activity",           href: "/property-manager/account/activity",           icon: Activity },
  { key: "connected", label: "Connected Accounts", href: "/property-manager/account/connected-accounts", icon: Link2 },
  { key: "privacy",   label: "Data & Privacy",     href: "/property-manager/account/data-privacy",       icon: Lock },
]

const MOBILE_NAV: MobileSectionNavItem[] = ACCOUNT_NAV.map(({ key, label, href, icon }) => ({
  key,
  label,
  href,
  icon,
}))

export default function AccountSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] bg-[#F8FAFC]">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-slate-200 bg-white">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link
            href="/property-manager/portfolio"
            className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to app
          </Link>
          <h1 className="text-[15px] font-bold text-slate-900">Account Settings</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Your personal settings</p>
        </div>
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {ACCOUNT_NAV.map(item => {
            const Icon = item.icon
            const active =
              item.href === "/property-manager/account"
                ? pathname === "/property-manager/account"
                : pathname.startsWith(item.href) && item.href !== "/property-manager/account"
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1",
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-[120px] lg:pb-8">
          {/* Mobile section nav — pill strip in place of the desktop side rail */}
          <div className="lg:hidden mb-5">
            <MobileSectionNav
              items={MOBILE_NAV}
              rootHref="/property-manager/account"
              aria-label="Account settings sections"
            />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
