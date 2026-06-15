"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react"

export interface AiSuggestion {
  id: string
  type: "action" | "alert" | "opportunity"
  title: string
  description: string
}

const suggestionIcons = {
  action: { icon: CheckCircle2, color: "text-[#10B981]", bg: "bg-emerald-50" },
  alert: { icon: AlertTriangle, color: "text-[#F59E0B]", bg: "bg-amber-50" },
  opportunity: { icon: TrendingUp, color: "text-[#7C3AED]", bg: "bg-violet-50" },
}

export function AiInsightPanel({ suggestions }: { suggestions: AiSuggestion[] }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#2E1065] to-[#4C1D95] rounded-2xl border border-violet-800/30 shadow-lg p-5 flex flex-col gap-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-400/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-violet-400/20 flex items-center justify-center border border-violet-400/30">
          <Sparkles className="w-4 h-4 text-violet-300" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Copilot</h3>
          <p className="text-xs text-violet-300">Today&apos;s priorities</p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-400/20 border border-violet-400/30 text-violet-300 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse motion-reduce:animate-none" aria-hidden />
            Live
          </span>
        </div>
      </div>

      {/* Suggestions */}
      <div className="relative flex flex-col gap-2.5">
        {suggestions.slice(0, 3).map((suggestion) => {
          const config = suggestionIcons[suggestion.type]
          const Icon = config.icon
          return (
            <div
              key={suggestion.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/8 border border-white/10 hover:bg-white/12 transition-colors duration-150 cursor-pointer"
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                <Icon className={cn("w-3.5 h-3.5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-tight">{suggestion.title}</p>
                <p className="text-xs text-violet-300 mt-0.5 line-clamp-2">{suggestion.description}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="relative">
        <Button
          variant="ai"
          size="sm"
          asChild
          className="w-full bg-violet-500 hover:bg-violet-400 text-white border border-violet-400/30"
        >
          <Link href="/app/ai-copilot">
            <Sparkles className="w-4 h-4" />
            Open AI Copilot
          </Link>
        </Button>
      </div>
    </div>
  )
}
