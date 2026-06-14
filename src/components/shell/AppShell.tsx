"use client"

import { useState, useCallback, useEffect } from "react"
import { OPEN_COPILOT_EVENT } from "@/lib/copilot/open"
import { AnimatePresence } from "framer-motion"
import { Menu } from "lucide-react"
import SideNavigation from "./SideNavigation"
import TopNavigation from "./TopNavigation"
import ShellContent from "./ShellContent"
import ChatBubble from "@/components/ai/ChatBubble"
import ChatPanel from "@/components/ai/ChatPanel"
import SkipLink from "@/components/a11y/SkipLink"
import { useWorkspace } from "@/providers/AuthProvider"
import { GuidedHelpProvider } from "@/guided-help/GuidedHelpProvider"
import FirstUseModal from "@/guided-help/components/FirstUseModal"
import TutorialLauncher from "@/guided-help/components/TutorialLauncher"

interface AppShellProps {
  children: React.ReactNode
  /** Whether the workspace plan includes AI Copilot access. Passed from the server layout. */
  aiCopilotEnabled?: boolean
}

export default function AppShell({ children, aiCopilotEnabled = false }: AppShellProps) {
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
  // Any page can open the Copilot by dispatching OPEN_COPILOT_EVENT.
  useEffect(() => {
    const open = () => setChatOpen(true)
    window.addEventListener(OPEN_COPILOT_EVENT, open)
    return () => window.removeEventListener(OPEN_COPILOT_EVENT, open)
  }, [])
  const [unreadCount] = useState(3)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { workspace } = useWorkspace()

  /* sidebar total footprint: width + left-margin + right-gap */
  const sideOffset = (collapsed ? 76 : 200) + 16 + 16

  return (
    <GuidedHelpProvider workspaceId={workspace?.id}>
    <div className="h-dvh overflow-hidden" style={{ background: "#F6FAFF" }}>
      {/* Skip to main content — first focusable element (WCAG 2.4.1) */}
      <SkipLink />

      {/* Fixed sidebar — floats over content */}
      <div className="hidden lg:block">
        <SideNavigation collapsed={collapsed} onToggle={handleToggle} />
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer — conditionally mounted so it's truly hidden when
          closed. (The SideNavigation is position:fixed, so a translate wrapper of
          auto width can't move it off-screen — mounting on demand is correct.) */}
      {mobileOpen && (
        <div className="lg:hidden animate-[slideInLeft_0.2s_ease-out]">
          <SideNavigation collapsed={false} onToggle={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Content column — offset for the sidebar on lg+ only; full width on
          mobile/tablet where the sidebar is a hidden drawer. */}
      <div
        className="flex flex-col h-dvh overflow-hidden transition-[padding-left] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] pl-0 lg:pl-[var(--side-offset)]"
        style={{ "--side-offset": `${sideOffset}px` } as React.CSSProperties}
      >
        {/* Topbar — sticky inside content column */}
        <div className="pt-4 pr-4 shrink-0">
          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center gap-3 mb-2 pl-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-[40px] h-[40px] rounded-xl bg-white border border-[#E2EAF6] flex items-center justify-center hover:bg-[#F0F7FF] transition-all shadow-sm"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5 text-[#071B4D]" />
            </button>
          </div>
          <TopNavigation />
        </div>

        {/* Content area */}
        <ShellContent>{children}</ShellContent>
      </div>

      {/* Global chat bubble + panel */}
      <ChatBubble
        unreadCount={unreadCount}
        onClick={() => setChatOpen((o) => !o)}
        isOpen={chatOpen}
      />
      <AnimatePresence>
        {chatOpen && (
          <ChatPanel
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            aiCopilotEnabled={aiCopilotEnabled}
          />
        )}
      </AnimatePresence>

      {/* Guided Help — first-use popups + help launcher */}
      <FirstUseModal />
      <TutorialLauncher />
    </div>
    </GuidedHelpProvider>
  )
}
