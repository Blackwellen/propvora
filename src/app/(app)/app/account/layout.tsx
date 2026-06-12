"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { User, Shield, KeyRound, Bell, Sliders, Monitor, Activity, Link2, Lock, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const ACCOUNT_NAV = [
  { key: "overview",  label: "Overview",           href: "/app/account",                    icon: User },
  { key: "profile",   label: "Profile",            href: "/app/account/profile",            icon: User },
  { key: "security",  label: "Security",           href: "/app/account/security",           icon: Shield },
  { key: "login",     label: "Login Methods",      href: "/app/account/login",              icon: KeyRound },
  { key: "notifs",    label: "Notifications",      href: "/app/account/notifications",      icon: Bell },
  { key: "prefs",     label: "Preferences",        href: "/app/account/preferences",        icon: Sliders },
  { key: "sessions",  label: "Sessions & Devices", href: "/app/account/sessions",           icon: Monitor },
  { key: "activity",  label: "Activity",           href: "/app/account/activity",           icon: Activity },
  { key: "connected", label: "Connected Accounts", href: "/app/account/connected-accounts", icon: Link2 },
  { key: "privacy",   label: "Data & Privacy",     href: "/app/account/data-privacy",       icon: Lock },
]

export default function AccountSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-slate-200 bg-white">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link
            href="/app/portfolio"
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
              item.href === "/app/account"
                ? pathname === "/app/account"
                : pathname.startsWith(item.href) && item.href !== "/app/account"
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5",
                  active
                    ? "bg-[#EFF6FF] text-[#2563EB]"
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

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-20 border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {ACCOUNT_NAV.map(item => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (pathname.startsWith(item.href) && item.href !== "/app/account")
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-colors shrink-0",
                  active
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-8 py-8 lg:pt-8 pt-20">
          {children}
        </div>
      </main>
    </div>
  )
}
