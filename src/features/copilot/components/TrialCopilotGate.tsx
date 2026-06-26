"use client"

import Image from "next/image"
import Link from "next/link"
import { Sparkles, ArrowRight, LifeBuoy } from "lucide-react"

interface TrialCopilotGateProps {
  /** Called when the user clicks "Switch to Inbox" so the parent can swap tabs. */
  onSwitchToInbox: () => void
}

/**
 * Shown on the Copilot tab when the workspace is on a free trial.
 * The Inbox tab remains fully open — this gate blocks AI only.
 */
export default function TrialCopilotGate({ onSwitchToInbox }: TrialCopilotGateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-5 text-center overflow-y-auto">
      {/* Brand mark — favicon + wordmark */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white flex items-center justify-center">
          <Image
            src="/favicon.ico"
            alt="Propvora"
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />
        </div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Propvora
        </p>
      </div>

      {/* Headline */}
      <div className="flex flex-col gap-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-50 flex items-center justify-center mx-auto">
          <Sparkles className="w-5 h-5 text-violet-600" />
        </div>
        <h2 className="text-[17px] font-bold text-slate-900 leading-snug mt-1">
          AI Copilot requires a paid subscription
        </h2>
        <p className="text-[13px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
          Your free trial doesn&apos;t include AI. Subscribe to any paid plan to unlock
          AI-powered property management — draft letters, chase arrears, review
          compliance and more.
        </p>
      </div>

      {/* Feature teasers */}
      <ul className="w-full max-w-[280px] flex flex-col gap-2 text-left">
        {[
          "Draft rent-chase and arrears letters",
          "Review compliance deadlines automatically",
          "Summarise portfolios and cash-flow",
          "Create tasks and jobs from conversation",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
            </span>
            <span className="text-[12px] text-slate-600">{item}</span>
          </li>
        ))}
      </ul>

      {/* Primary CTA */}
      <div className="w-full max-w-[280px] flex flex-col gap-2">
        <Link
          href="/property-manager/workspace-settings/subscription"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white text-[13.5px] font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
        >
          <Image src="/favicon.ico" alt="" width={16} height={16} className="rounded-sm opacity-90" unoptimized />
          Subscribe to Propvora
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Soft CTA — switch to inbox (always open) */}
        <button
          onClick={onSwitchToInbox}
          className="w-full py-2 px-4 rounded-xl text-[12.5px] text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          Open your inbox instead
        </button>
      </div>

      {/* Fine print */}
      <p className="text-[10.5px] text-slate-400 leading-relaxed max-w-[240px]">
        AI Copilot is included on Scale, Pro / Agency and Enterprise plans.
        <br />
        <Link
          href="/property-manager/workspace-settings/subscription"
          className="underline underline-offset-2 hover:text-slate-600"
        >
          View plans &amp; pricing
        </Link>
      </p>
    </div>
  )
}
