import { Workflow, CheckCircle2, Zap, GitBranch, Play } from "lucide-react"

const bullets = [
  "Trigger / condition / action recipes — no code required",
  "Run on schedules or in response to events",
  "Compliance reminders, rent chasers and task creation",
  "Per-plan run and node limits with an Automation Pack add-on",
  "Full run log so you can see exactly what fired and when",
]

const recipes = [
  { trigger: "Certificate expiring in 30 days", action: "Create renewal task + notify owner", icon: Zap },
  { trigger: "Rent overdue by 3 days", action: "Send reminder + flag arrears", icon: Play },
  { trigger: "New booking confirmed", action: "Schedule turnover clean", icon: GitBranch },
]

export default function AutomationsSection() {
  return (
    <section id="automations" className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-violet-200">
              <Workflow className="h-3.5 w-3.5" />
              Smart Automations
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Put your routine ops{" "}
              <span className="text-violet-600">on autopilot</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Build automations from simple triggers, conditions and actions. Propvora handles the
              repetitive chasing, reminders and task creation so your team can focus on the work
              that needs a human.
            </p>
            <ul className="space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            {recipes.map((r) => {
              const Icon = r.icon
              return (
                <div
                  key={r.trigger}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Recipe
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700">
                      <span className="block text-[10px] font-semibold uppercase text-slate-400 mb-0.5">
                        When
                      </span>
                      {r.trigger}
                    </div>
                    <div className="text-violet-400 font-bold">→</div>
                    <div className="flex-1 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2 text-violet-900">
                      <span className="block text-[10px] font-semibold uppercase text-violet-400 mb-0.5">
                        Then
                      </span>
                      {r.action}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
