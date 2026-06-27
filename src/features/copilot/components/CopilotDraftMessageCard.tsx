"use client"

import { useState } from "react"
import { Copy, Send, Edit3, CheckSquare } from "lucide-react"

const DRAFT_TO = "admin@brookfieldservices.co.uk"
const DRAFT_BODY = `Hi Brookfield Services,

Our records show the EICR for 16 Rose Gardens expired on 14 May 2025. Could you please arrange a new inspection at your earliest convenience?

As you know, an up-to-date EICR is a legal requirement, and we need to ensure the property remains compliant.

Please confirm your availability so we can coordinate access with the tenant.

Thanks,
Property Management Team`

export default function CopilotDraftMessageCard() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(DRAFT_BODY)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-[12px] font-semibold text-slate-700 leading-snug">
          Here&apos;s a draft chase message for the expired EICR certificate.
        </p>
      </div>

      <div className="p-4">
        {/* To row */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">To</span>
            <p className="text-[12px] font-medium text-slate-700 mt-0.5">{DRAFT_TO}</p>
          </div>
          <button
            onClick={handleCopy}
            className="text-[11px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] flex items-center gap-1 transition-colors"
          >
            <Copy className="w-3 h-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Message body */}
        <div className="bg-slate-50 rounded-xl p-3 mb-3 max-h-[140px] overflow-y-auto">
          <p className="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">
            {DRAFT_BODY}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold hover:bg-[var(--brand-strong)] transition-colors">
            <Send className="w-3 h-3" />
            Send via email
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-colors">
            <Edit3 className="w-3 h-3" />
            Edit message
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-colors">
            <CheckSquare className="w-3 h-3" />
            Create task
          </button>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 bg-amber-50">
        <p className="text-[10px] text-amber-700 font-medium">
          ⚡ AI-generated · Review before sending
        </p>
      </div>
    </div>
  )
}
