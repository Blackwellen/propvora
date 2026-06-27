"use client"

import { useState, useCallback, useEffect } from "react"
import { OPEN_COPILOT_EVENT, type OpenCopilotDetail } from "@/lib/copilot/open"
import { AnimatePresence } from "framer-motion"
import SideNavigation from "./SideNavigation"
import TopNavigation from "./TopNavigation"
import ShellContent from "./ShellContent"
import MobileBottomNav from "@/components/mobile/MobileBottomNav"
import ChatBubble from "@/components/ai/ChatBubble"
import ChatPanel from "@/components/ai/ChatPanel"
import SkipLink from "@/components/a11y/SkipLink"
import CommandPalette from "@/components/search/CommandPalette"
import { useWorkspace } from "@/providers/AuthProvider"
import { GuidedHelpProvider } from "@/guided-help/GuidedHelpProvider"
import FirstUseModal from "@/guided-help/components/FirstUseModal"

interface AppShellProps {
  children: React.ReactNode
  /** Whether the workspace plan includes AI Copilot access. Passed from the server layout. */
  aiCopilotEnabled?: boolean
  /**
   * True when the workspace is on a free trial. The chat bubble opens the full
   * panel so the Inbox tab is accessible; the Copilot tab shows an upgrade gate.
   */
  isTrial?: boolean
  /** Server-resolved nav-relevant feature flags (V2/V1.5 surfaces). Off = hidden from nav. */
  navFlags?: Record<string, boolean>
}

export default function AppShell({ children, aiCopilotEnabled = false, isTrial = false, navFlags }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("shell-collapsed") === "true"
    }
    return false
  })

  const handleToggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem("shell-collapsed", String(next))
      return next
    })
  }, [])

  const [chatOpen, setChatOpen] = useState(false)
  const [copilotSummaryData, setCopilotSummaryData] = useState<Record<string, unknown> | undefined>(undefined)
  // Any page can open the Copilot by dispatching OPEN_COPILOT_EVENT.
  // Pages may include summaryData in the event detail for page-level context.
  useEffect(() => {
    const open = (e: Event) => {
      const detail = (e as CustomEvent<OpenCopilotDetail>).detail
      if (detail?.summaryData) setCopilotSummaryData(detail.summaryData)
      setChatOpen(true)
    }
    window.addEventListener(OPEN_COPILOT_EVENT, open)
    return () => window.removeEventListener(OPEN_COPILOT_EVENT, open)
  }, [])
  // Copilot/inbox badge — currently 0 until AI messaging threads are tracked.
  // The NotificationBell owns its own realtime count; this is a separate surface.
  const [unreadCount] = useState(0)
  const { workspace } = useWorkspace()

  /* sidebar total footprint: width + left-margin + right-gap */
  const sideOffset = (collapsed ? 76 : 200) + 16 + 16

  return (
    <GuidedHelpProvider workspaceId={workspace?.id}>
    <div className="h-dvh overflow-hidden" style={{ background: "var(--bg-app-shell)" }}>
      {/* Skip to main content — first focusable element (WCAG 2.4.1) */}
      <SkipLink />

      {/* Fixed sidebar — floats over content */}
      <div className="hidden lg:block">
        <SideNavigation collapsed={collapsed} onToggle={handleToggle} navFlags={navFlags} />
      </div>

      {/* Content column — offset for the sidebar on lg+ only; full width below
          lg where the dedicated mobile nav (MobileBottomNav) takes over. */}
      <div
        className="flex flex-col h-dvh overflow-hidden transition-[padding-left] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] pl-0 lg:pl-[var(--side-offset)]"
        style={{ "--side-offset": `${sideOffset}px` } as React.CSSProperties}
      >
        {/* Topbar — desktop workspace toolbar only on lg+. Below lg, pages own
            their own MobileTopBar; the bottom nav owns primary navigation.
            Horizontal padding matches ShellContent (px-4 sm:px-6) so the quick
            action bar's left/right edges align exactly with page content at every
            breakpoint — the canonical width all page types are measured against. */}
        <div className="hidden lg:block pt-4 px-4 sm:px-6 shrink-0">
          <TopNavigation guidedHelp={navFlags?.guidedHelp !== false} />
        </div>

        {/* Content area — extra bottom padding below lg so the fixed bottom nav
            never overlaps content (incl. safe-area inset). */}
        <ShellContent>{children}</ShellContent>
      </div>

      {/* Dedicated mobile primary nav — fixed bottom tab bar (replaces the
          desktop SideNavigation below lg). The raised centre button opens the
          Copilot/Inbox panel (it never navigates) and carries the unread badge.
          Desktop is unaffected. */}
      <MobileBottomNav
        chatOpen={chatOpen}
        onOpenChat={() => setChatOpen(true)}
        unreadCount={unreadCount}
        navFlags={navFlags}
      />

      {/* Global chat bubble — desktop/lg+ only. Below lg the MobileBottomNav
          centre button is the sole Copilot entry point, so the floating bubble
          is not rendered (it would collide with the bottom nav / safe area). */}
      <div className="hidden lg:block">
        <ChatBubble
          unreadCount={unreadCount}
          onClick={() => setChatOpen((o) => !o)}
          isOpen={chatOpen}
        />
      </div>
      <AnimatePresence>
        {chatOpen && (
          <ChatPanel
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            aiCopilotEnabled={aiCopilotEnabled}
            isTrial={isTrial}
            summaryData={copilotSummaryData}
          />
        )}
      </AnimatePresence>

      {/* Global command palette (⌘K) */}
      <CommandPalette />

      {/* Guided Help — first-use popups. The launcher lives in TopNavigation.
          Gated behind the `guidedHelp` operational kill-switch (default ON). */}
      {navFlags?.guidedHelp !== false && <FirstUseModal />}
    </div>
    </GuidedHelpProvider>
  )
}
