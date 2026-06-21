import { Brain, Sparkles, AlertCircle } from "lucide-react"

const exchanges = [
  {
    user: "Which properties have gas safety certs expiring in 60 days?",
    ai: "3 properties need attention. 12 Maple Street (22 Jun), 8 Park Lane (30 Jun), 4 Oak Close (14 Jul). Want me to schedule renewal reminders and draft supplier briefs?",
  },
  {
    user: "Summarise my rent arrears this month",
    ai: "Total arrears: £4,250 across 3 tenancies. Unit 5A is £1,800 overdue (47 days), Unit 12B £1,200 (23 days), Unit 3C £1,250 (18 days). I can draft a formal arrears notice for Unit 5A if needed.",
  },
]

const capabilities = [
  "Deal analysis",
  "Document drafting",
  "Portfolio insights",
  "Compliance alerts",
]

export default function AiCopilotSection() {
  return (
    <section
      id="ai-copilot"
      className="py-24 relative overflow-hidden"
      style={{ background: "var(--bg-marketing-dark)" }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />
      {/* Glow */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, #6366f1 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-indigo-500/30">
              <Brain className="h-3.5 w-3.5" />
              AI Copilot
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              AI that understands{" "}
              <span className="text-indigo-400">your portfolio</span>
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-8">
              The Propvora AI Copilot is workspace-aware. It knows your properties, tenancies,
              compliance deadlines, and financials — so its answers are grounded in your actual data,
              not generic advice.
            </p>

            {/* Capability pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 text-white/80 text-sm rounded-full border border-white/20"
                >
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  {cap}
                </span>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-white/50 text-xs leading-relaxed">
                AI Copilot operates on a human-approval model. It does not provide regulated
                financial or legal advice. All suggested actions require your explicit confirmation.
              </p>
            </div>
          </div>

          {/* Right: mock chat interface */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/5">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-white text-sm font-semibold">Propvora AI Copilot</div>
                <div className="text-indigo-400 text-xs">Workspace-aware · Human-approval model</div>
              </div>
              <div className="ml-auto flex gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white/40 text-xs">Online</span>
              </div>
            </div>

            {/* Exchanges */}
            <div className="px-5 py-6 space-y-5">
              {exchanges.map((ex, i) => (
                <div key={i} className="space-y-3">
                  {/* User bubble */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed">
                      {ex.user}
                    </div>
                  </div>
                  {/* AI bubble */}
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-3 w-3 text-indigo-300" />
                    </div>
                    <div className="bg-white/10 border border-white/10 text-white/90 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed">
                      {ex.ai}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-indigo-300" />
                </div>
                <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div className="px-5 py-4 border-t border-white/10">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                <span className="text-white/30 text-sm flex-1">Ask anything about your portfolio…</span>
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
