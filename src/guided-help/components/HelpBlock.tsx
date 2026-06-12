"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Lightbulb, X } from "lucide-react"
import { useGuidedHelp } from "../GuidedHelpProvider"

/**
 * Dismissible inline help card for empty states / page tops. Pass a stable
 * `dismissKey` to remember dismissal per user (via the guided-help store).
 */
export default function HelpBlock({
  title,
  children,
  dismissKey,
  href,
  hrefLabel = "Learn more",
}: {
  title: string
  children: React.ReactNode
  dismissKey?: string
  href?: string
  hrefLabel?: string
}) {
  const { isSeen, markStatus } = useGuidedHelp()
  const [hidden, setHidden] = useState(false)

  if (hidden || (dismissKey && isSeen(dismissKey))) return null

  return (
    <div className="rounded-2xl bg-[#EFF6FF] border border-blue-100 p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
        <Lightbulb className="w-4 h-4 text-[#2563EB]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1e3a8a]">{title}</p>
        <div className="text-sm text-slate-600 mt-0.5 leading-relaxed">{children}</div>
        {href && (
          <Link href={href} className="inline-block mt-2 text-xs font-semibold text-[#2563EB] hover:underline">
            {hrefLabel} →
          </Link>
        )}
      </div>
      {dismissKey && (
        <button
          aria-label="Dismiss"
          onClick={() => { markStatus(dismissKey, "dismissed"); setHidden(true) }}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 flex items-center justify-center shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
