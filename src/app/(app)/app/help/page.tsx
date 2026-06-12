"use client"

import React from "react"
import Link from "next/link"
import { BookOpen, PlayCircle, Check, ExternalLink, RotateCcw } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useGuidedHelp } from "@/guided-help/GuidedHelpProvider"
import SetupChecklist from "@/guided-help/components/SetupChecklist"

export default function AppHelpPage() {
  const { workspace } = useWorkspace()
  const { tutorials, isSeen, openTutorial, resetAll } = useGuidedHelp()

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Help & Getting Started</h1>
          <p className="text-sm text-slate-500 mt-0.5">Guided walkthroughs, your setup checklist and the Help Centre.</p>
        </div>
        <button onClick={resetAll} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#2563EB]">
          <RotateCcw className="w-3.5 h-3.5" /> Restart tours
        </button>
      </div>

      {/* Setup checklist */}
      <SetupChecklist workspaceId={workspace?.id} />

      {/* Walkthroughs */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Section walkthroughs</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {tutorials.map((t) => {
            const done = isSeen(t.key)
            return (
              <button
                key={t.key}
                onClick={() => openTutorial(t.key)}
                className="flex items-start gap-3 rounded-2xl bg-white border border-slate-200 p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  {done ? <Check className="w-4 h-4 text-emerald-500" /> : <PlayCircle className="w-4 h-4 text-violet-600" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.summary}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Help Centre */}
      <Link href="/help" className="flex items-center justify-between rounded-2xl bg-[#0D1B2A] text-white p-5 hover:opacity-95 transition-opacity">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-violet-300" />
          <div>
            <p className="text-sm font-semibold">Browse the Help Centre</p>
            <p className="text-xs text-slate-300">Articles, FAQs and detailed guides.</p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400" />
      </Link>
    </div>
  )
}
