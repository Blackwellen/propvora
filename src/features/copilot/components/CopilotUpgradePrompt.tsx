"use client"

import { motion } from "framer-motion"
import { X, Sparkles, Zap, LifeBuoy, BookOpen, ChevronRight } from "lucide-react"
import Link from "next/link"

interface CopilotUpgradePromptProps {
  isOpen: boolean
  onClose: () => void
}

export default function CopilotUpgradePrompt({ isOpen, onClose }: CopilotUpgradePromptProps) {
  if (!isOpen) return null

  return (
    <motion.div
      style={{
        position: "fixed",
        bottom: 100,
        right: 24,
        width: 380,
        maxWidth: "calc(100vw - 48px)",
        borderRadius: 24,
        zIndex: 50,
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(124,58,237,0.12)",
        overflow: "hidden",
      }}
      initial={{ scale: 0.92, opacity: 0, y: 16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.92, opacity: 0, y: 16 }}
      transition={{ type: "spring", stiffness: 380, damping: 35 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
            }}
          >
            <span style={{ color: "#fff", fontSize: 16, lineHeight: 1 }}>✦</span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-900 leading-tight">
              Propvora Copilot
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              AI assistant for property management
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-50 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-violet-600" />
        </div>

        <div>
          <p className="text-[15px] font-bold text-slate-900 mb-1">
            Upgrade to unlock AI Copilot
          </p>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
            Propvora Copilot is available on the Pro plan and above. Draft messages,
            chase arrears, review compliance — all with AI.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2">
          <Link
            href="/app/workspace-settings/billing"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white text-[13px] font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            View plans &amp; upgrade
          </Link>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-slate-500 text-[12px] hover:bg-slate-50 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>

      {/* Quick help: Support + Help Centre (always available, even without AI). */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-100">
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

      {/* Footer */}
      <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50">
        <p className="text-[10px] text-slate-400 text-center leading-tight">
          AI Copilot is included in Pro, Business, and Enterprise plans
        </p>
      </div>
    </motion.div>
  )
}
