"use client"

import Link from "next/link"
import { Send, CheckCircle2 } from "lucide-react"
import { SupplierCard, SupplierButton } from "@/components/supplier-workspace/ui"
import { moneyPence } from "@/components/supplier-workspace/format"
import { WinScoreRing } from "@/features/supplier/requests/components/primitives"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface RequestAiAssistantProps {
  request: PipelineRequest
  newQuoteHref: string
}

export function RequestAiAssistant({ request: r, newQuoteHref }: RequestAiAssistantProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Quote assistant</p>
        {r.winScore > 0 && <WinScoreRing score={r.winScore} />}
      </div>
      {r.recommendation.suggestedPricePence != null ? (
        <>
          <p className="text-2xl font-bold text-slate-900">{moneyPence(r.recommendation.suggestedPricePence)}</p>
          <p className="text-xs text-slate-400">
            Suggested price
            {r.recommendation.marginEstPct != null ? ` · ~${r.recommendation.marginEstPct}% margin` : ""}
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500">Price this request to see a win-probability estimate.</p>
      )}
      {r.recommendation.fitChecks.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {r.recommendation.fitChecks.map((c, i) => (
            <li key={i} className={`flex items-start gap-2 text-xs ${c.ok ? "text-slate-600" : "text-slate-400"}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${c.ok ? "text-emerald-500" : "text-slate-300"}`} />
              {c.label}
            </li>
          ))}
        </ul>
      )}
      <Link href={newQuoteHref} className="mt-4 block">
        <SupplierButton className="w-full justify-center">
          <Send className="w-4 h-4" /> Build quote
        </SupplierButton>
      </Link>
    </SupplierCard>
  )
}
