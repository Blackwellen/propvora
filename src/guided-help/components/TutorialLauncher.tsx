"use client"

import React, { useState } from "react"
import Link from "next/link"
import { HelpCircle, X, RotateCcw, Check, BookOpen, PlayCircle } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useGuidedHelp } from "../GuidedHelpProvider"
import SetupChecklist from "./SetupChecklist"

interface TutorialLauncherProps {
  surface?: "app" | "portal"
  placement?: "floating" | "topnav"
}

export default function TutorialLauncher({
  surface = "app",
  placement = "floating",
}: TutorialLauncherProps) {
  const [open, setOpen] = useState(false)
  const { tutorials, isSeen, openTutorial, resetAll, enabled, setEnabled } = useGuidedHelp()
  const { workspace } = useWorkspace()

  const sections = Array.from(new Set(tutorials.map((t) => t.section)))

  const panel = open ? (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={
          placement === "topnav"
            ? "absolute right-0 top-12 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] max-h-[70vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
            : "fixed bottom-20 left-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] max-h-[70vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        }
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold text-slate-900">Help &amp; guides</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-3 space-y-4">
          {surface === "app" && <SetupChecklist workspaceId={workspace?.id} compact />}

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">
              Walkthroughs
            </p>
            <div className="space-y-0.5">
              {sections.map((section) => {
                const tutorial = tutorials.find((item) => item.section === section)
                if (!tutorial) return null
                const done = isSeen(tutorial.key)

                return (
                  <button
                    key={section}
                    onClick={() => {
                      openTutorial(tutorial.key)
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 text-left group"
                  >
                    {done ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{section}</p>
                      <p className="text-[11px] text-slate-400 truncate">{tutorial.summary}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Link
            href="/help"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600"
          >
            <BookOpen className="w-4 h-4 text-slate-400" /> Open Help Centre
          </Link>
        </div>

        <div className="border-t border-slate-100 p-3 flex items-center justify-between shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300"
            />
            Show tips
          </label>
          <button
            onClick={() => {
              resetAll()
              setOpen(false)
            }}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#2563EB]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restart tours
          </button>
        </div>
      </div>
    </>
  ) : null

  if (placement === "topnav") {
    return (
      <div className="relative hidden lg:block">
        <button
          onClick={() => setOpen((value) => !value)}
          aria-label="Help and guides"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex w-[44px] h-[44px] rounded-2xl bg-white border border-[#E2EAF6] items-center justify-center hover:bg-[#F0F7FF] hover:border-[#B9D2F3] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          {open ? (
            <X className="w-5 h-5 text-[#071B4D]" />
          ) : (
            <HelpCircle className="w-5 h-5 text-[#071B4D]" />
          )}
        </button>
        {panel}
      </div>
    )
  }

  return (
    <div className="hidden lg:block">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Help and guides"
        className="fixed bottom-5 left-5 z-40 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-500 hover:text-[#2563EB] hover:border-blue-200 transition-all"
      >
        {open ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </button>
      {panel}
    </div>
  )
}
