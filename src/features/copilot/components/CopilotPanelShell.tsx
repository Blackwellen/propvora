"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { X, Maximize2, Minimize2, LifeBuoy, BookOpen, ChevronRight } from "lucide-react"
import type { CopilotTab, InboxScreen } from "../types"
import type { SuggestedContact } from "../types"
import CopilotChatScreen from "../screens/CopilotChatScreen"
import CopilotInboxScreen from "../screens/CopilotInboxScreen"
import CopilotStartConversationScreen from "../screens/CopilotStartConversationScreen"
import CopilotConversationView from "../screens/CopilotConversationView"
import CopilotBrandMark from "./CopilotBrandMark"
import TrialCopilotGate from "./TrialCopilotGate"
import { zIndex } from "@/lib/ui/z-index"

interface CopilotPanelShellProps {
  isOpen: boolean
  onClose: () => void
  /** Structured page-level data injected from the page that opened the copilot. */
  summaryData?: Record<string, unknown>
  /**
   * True when the workspace is on a free trial. The Copilot tab shows an upgrade
   * gate; the Inbox tab is unaffected and remains fully functional.
   */
  isTrial?: boolean
}

function PropvoraCopilotIcon() {
  return <CopilotBrandMark size={36} radius={10} />
}

export default function CopilotPanelShell({ isOpen, onClose, summaryData, isTrial = false }: CopilotPanelShellProps) {
  const [activeTab, setActiveTab] = useState<CopilotTab>("copilot")
  const [expanded, setExpanded] = useState(false)
  const [inboxScreen, setInboxScreen] = useState<InboxScreen>("list")
  const [activeConvId, setActiveConvId] = useState<string | null>(null)

  // Reactive mobile detection so the panel resizes on rotate/resize, not just
  // at first open. Phones get a true full-screen sheet so it never overflows.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    window.addEventListener("orientationchange", check)
    return () => {
      window.removeEventListener("resize", check)
      window.removeEventListener("orientationchange", check)
    }
  }, [])

  if (!isOpen) return null

  /* Panel size */
  const panelStyle: React.CSSProperties = expanded
    ? {
        position: "fixed",
        bottom: 24,
        right: 24,
        width: "min(1100px, calc(100vw - 48px))",
        height: "90vh",
        maxHeight: "calc(100vh - 48px)",
        borderRadius: 28,
        zIndex: zIndex.panel,
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 8px 32px rgba(37,99,235,0.12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }
    : {
        position: "fixed",
        bottom: 100,
        right: 24,
        width: 720,
        maxWidth: "calc(100vw - 48px)",
        height: "82vh",
        minHeight: 600,
        maxHeight: "calc(100vh - 48px)",
        borderRadius: 28,
        zIndex: zIndex.panel,
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(37,99,235,0.10), 0 0 0 1px rgba(37,99,235,0.06)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }

  /* Mobile override — full-screen sheet with safe-area insets */
  if (isMobile) {
    Object.assign(panelStyle, {
      bottom: 0,
      right: 0,
      left: 0,
      top: 0,
      width: "100vw",
      height: "100dvh",
      maxWidth: "100vw",
      maxHeight: "100dvh",
      borderRadius: 0,
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
    })
  }

  function handleOpenConversation(id: string) {
    setActiveConvId(id)
    setInboxScreen("conversation")
  }

  function handleNewConversation() {
    setInboxScreen("new-conversation")
  }

  function handleStartChat(_contact: SuggestedContact) {
    setInboxScreen("conversation")
  }

  function handleBackToList() {
    setInboxScreen("list")
    setActiveConvId(null)
  }

  return (
    <motion.div
      style={panelStyle}
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 380, damping: 35 }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <PropvoraCopilotIcon />
          <div>
            <p className="text-[14px] font-bold text-slate-900 leading-tight">Propvora Copilot</p>
            <p className="text-[11px] text-slate-400 leading-tight">
              AI assistant for property management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Expand/compact only matters for the floating desktop panel — on the
              full-screen mobile sheet it is hidden. */}
          {!isMobile && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center"
              title={expanded ? "Compact" : "Expand"}
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center"
            aria-label="Close Copilot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab pills ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-5 pt-3 pb-2 border-b border-slate-100 shrink-0">
        {(["copilot", "inbox"] as CopilotTab[]).map((tab) => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative inline-flex items-center gap-1.5 px-4 py-1.5 text-[12.5px] font-semibold transition-all rounded-full ${
                active
                  ? "text-violet-700 bg-violet-50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab === "copilot" ? <CopilotBrandMark size={15} radius={4} /> : <span aria-hidden>✉</span>}
              {tab === "copilot" ? "Copilot" : "Inbox"}
              {active && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-violet-600"
                  style={{ bottom: -2 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === "copilot" && (
          isTrial
            ? <TrialCopilotGate onSwitchToInbox={() => setActiveTab("inbox")} />
            : <CopilotChatScreen />
        )}

        {activeTab === "inbox" && inboxScreen === "list" && (
          <CopilotInboxScreen
            onOpenConversation={handleOpenConversation}
            onNewConversation={handleNewConversation}
          />
        )}

        {activeTab === "inbox" && inboxScreen === "new-conversation" && (
          <CopilotStartConversationScreen
            onBack={handleBackToList}
            onStartChat={handleStartChat}
          />
        )}

        {activeTab === "inbox" && inboxScreen === "conversation" && (
          <CopilotConversationView
            onBack={handleBackToList}
            isExpanded={expanded}
            conversationId={null}
          />
        )}
      </div>

      {/* ── Quick help: Support + Help Centre (always available) ──────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-100 shrink-0">
        <Link
          href="/contact"
          onClick={onClose}
          className="group flex-1 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-blue-200 hover:bg-[#F8FBFF] transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <LifeBuoy className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-slate-800 leading-tight">Contact support</p>
            <p className="text-[10px] text-slate-400 leading-tight">We aim to reply within 12 hours</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#2563EB] shrink-0" />
        </Link>
        <Link
          href="/help"
          onClick={onClose}
          className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-violet-200 hover:bg-[#F9F7FF] transition-all"
          title="Help Centre"
        >
          <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <span className="text-[12px] font-semibold text-slate-800 hidden sm:inline">Help</span>
        </Link>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {(activeTab === "copilot" || (activeTab === "inbox" && inboxScreen === "list")) && (
        <div className="flex items-center justify-between gap-2 px-5 py-2 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <p className="inline-flex items-center gap-1.5 text-[10px] text-violet-600 font-semibold shrink-0">
            <CopilotBrandMark size={13} radius={4} /> Propvora Copilot
          </p>
          {/* AI honesty disclaimer — kept visible on every breakpoint (incl. mobile). */}
          <p className="text-[9.5px] text-slate-400 text-right max-w-[240px] leading-tight">
            Responses may be inaccurate. Please review important information.
          </p>
        </div>
      )}
    </motion.div>
  )
}
