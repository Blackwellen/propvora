"use client"

import React, { useState } from "react"
import Link from "next/link"
import { HelpCircle, X, RotateCcw, Check, BookOpen, PlayCircle } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useGuidedHelp } from "../GuidedHelpProvider"
import SetupChecklist from "./SetupChecklist"

export default function TutorialLauncher({ surface = "app" }: { surface?: "app" | "portal" }) {
  const [open, setOpen] = useState(false)
  const { tutorials, isSeen, openTutorial, resetAll, enabled, setEnabled } = useGuidedHelp()
  const { workspace } = useWorkspace()

  // Group tutorials by section for the menu.
  const sections = Array.from(new Set(tutorials.map((t) => t.section)))

  return (
    /* Desktop/lg+ only. On mobile/PWA the floating launcher is suppressed (it
       would collide with the fixed bottom nav, sticky save bars, and the raised
       Copilot centre button); "Help & Guides" is surfaced inside the mobile
       "More" sheet instead. */
    <div className="hidden lg:block">
      {/* Floating help button — bottom-left, clear of the AI bubble (bottom-right) */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Help & guides"
        className="fixed bottom-5 left-5 z-40 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-500 hover:text-[#2563EB] hover:border-blue-200 transition-all"
      >
        {open ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 left-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] max-h-[70vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Help & guides</h3>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-3 space-y-4">
              {/* Setup checklist — app workspaces only (not external portals) */}
              {surface === "app" && <SetupChecklist workspaceId={workspace?.id} compact />}

              {/* Tutorials by section */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">Walkthroughs</p>
                <div className="space-y-0.5">
                  {sections.map((section) => {
                    const t = tutorials.find((x) => x.section === section)
                    if (!t) return null
                    const done = isSeen(t.key)
                    return (
                      <button
                        key={section}
                        onClick={() => { openTutorial(t.key); setOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 text-left group"
                      >
                        {done ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <PlayCircle className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{section}</p>
                          <p className="text-[11px] text-slate-400 truncate">{t.summary}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Help centre */}
              <Link href="/help" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600">
                <BookOpen className="w-4 h-4 text-slate-400" /> Open Help Centre
              </Link>
            </div>

            {/* Footer controls */}
            <div className="border-t border-slate-100 p-3 flex items-center justify-between shrink-0">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300" />
                Show tips
              </label>
              <button onClick={() => { resetAll(); setOpen(false) }} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#2563EB]">
                <RotateCcw className="w-3.5 h-3.5" /> Restart tours
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
