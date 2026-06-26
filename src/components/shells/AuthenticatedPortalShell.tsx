"use client"

import { useCallback, useState } from "react"
import { LogOut } from "lucide-react"
import SideNavigation, { type ShellNavConfig } from "@/components/shell/SideNavigation"
import ShellContent from "@/components/shell/ShellContent"
import SkipLink from "@/components/a11y/SkipLink"
import { createClient } from "@/lib/supabase/client"

export default function AuthenticatedPortalShell({
  children,
  title,
  navConfig,
}: {
  children: React.ReactNode
  title: string
  navConfig: ShellNavConfig
}) {
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("portal-shell-collapsed") === "true"
  )
  const handleToggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      localStorage.setItem("portal-shell-collapsed", String(next))
      return next
    })
  }, [])
  const sideOffset = (collapsed ? 76 : 200) + 32

  async function signOut() {
    await createClient().auth.signOut()
    window.location.assign("/login")
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#F6FAFF]">
      <SkipLink />
      <div className="hidden lg:block">
        <SideNavigation collapsed={collapsed} onToggle={handleToggle} navConfig={navConfig} />
      </div>
      <div
        className="flex h-dvh flex-col overflow-hidden pl-0 transition-[padding-left] duration-[250ms] lg:pl-[var(--side-offset)]"
        style={{ "--side-offset": `${sideOffset}px` } as React.CSSProperties}
      >
        <div className="hidden shrink-0 pt-4 pr-4 lg:block">
          <header className="flex h-[72px] items-center rounded-[24px] border border-[#E2EAF6] bg-white/95 px-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Connected workspace</p>
              <p className="mt-1 text-[15px] font-bold text-[#071B4D]">{title}</p>
            </div>
            <div className="flex-1" />
            <span className="mr-3 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">Secure portal</span>
            <button onClick={signOut} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2EAF6] bg-white px-3 text-[13px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:text-red-600">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </header>
        </div>
        <ShellContent>{children}</ShellContent>
      </div>
    </div>
  )
}
