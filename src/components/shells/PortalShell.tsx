"use client"

import { useCallback, useState } from "react"
import { X } from "lucide-react"
import SkipLink from "@/components/a11y/SkipLink"
import PortalSideNavigation from "./portal/PortalSideNavigation"
import PortalTopNavigation from "./portal/PortalTopNavigation"
import { PORTAL_NAV, type PortalKind } from "./portal/portal-nav"
import { PoweredByPropvora } from "@/lib/branding/white-label"

// ============================================================================
// PortalShell — external magic-link shell, now 1:1 with the operator / supplier
// workspace chrome: the floating navy SideNavigation + the floating white pill
// TopNavigation. The top bar drops the search box and account/avatar dropdown
// (an external session has neither). Nav is cross-checked against the real
// portal pages so every functional page is reachable (see portal-nav.ts).
// ============================================================================

export type { PortalKind }

export default function PortalShell({
  sessionId,
  kind,
  workspaceName,
  displayName,
  children,
  brandVars,
  hidePoweredBy = false,
}: {
  sessionId: string
  kind: PortalKind
  workspaceName: string
  displayName: string
  children: React.ReactNode
  /** Per-workspace brand CSS variables (var(--brand)…) so the portal repaints to the owning workspace colour. */
  brandVars?: Record<string, string>
  /** White-label: hide the "Powered by Propvora" footer for this workspace. */
  hidePoweredBy?: boolean
}) {
  const base = `/portal/${sessionId}/${kind}`
  const groups = PORTAL_NAV[kind]

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("portal-shell-collapsed") === "true"
    return false
  })
  const handleToggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try { localStorage.setItem("portal-shell-collapsed", String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])
  const [mobileOpen, setMobileOpen] = useState(false)

  const sideOffset = (collapsed ? 76 : 200) + 16 + 16

  return (
    <div
      className="h-dvh overflow-hidden"
      style={{ background: "var(--bg-app-shell)", ...(brandVars as React.CSSProperties | undefined) }}
    >
      <SkipLink />

      {/* Desktop floating sidebar */}
      <div className="hidden lg:block">
        <PortalSideNavigation
          base={base}
          kind={kind}
          groups={groups}
          workspaceName={workspaceName}
          displayName={displayName}
          collapsed={collapsed}
          onToggle={handleToggle}
        />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 motion-reduce:transition-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <PortalSideNavigation
          base={base}
          kind={kind}
          groups={groups}
          workspaceName={workspaceName}
          displayName={displayName}
          collapsed={false}
          onToggle={handleToggle}
          onNavigate={() => setMobileOpen(false)}
          fixed={false}
        />
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute top-3 right-3 p-2 rounded text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content column — offset for the sidebar on lg+ */}
      <div
        className="flex flex-col h-dvh overflow-hidden transition-[padding-left] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] pl-0 lg:pl-[var(--side-offset)]"
        style={{ "--side-offset": `${sideOffset}px` } as React.CSSProperties}
      >
        <div className="pt-4 px-4 lg:pr-4 lg:pl-0 shrink-0">
          <PortalTopNavigation
            kind={kind}
            workspaceName={workspaceName}
            displayName={displayName}
            onOpenMobile={() => setMobileOpen(true)}
            helpHref={`${base}/messages`}
          />
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-4 lg:pr-4 lg:pl-0 pb-8 focus:outline-none"
        >
          <div className="max-w-[1400px]">{children}</div>
          <PoweredByPropvora
            hide={hidePoweredBy}
            label="Powered by Propvora"
            className="mt-8 block text-center text-[11px] text-slate-400"
          />
        </main>
      </div>
    </div>
  )
}
