"use client"

import { useState } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  LayoutTemplate,
  Send,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import { AutomationsStatusBadge } from "../components/AutomationsBadges"
import AutomationsRightRail from "../components/AutomationsRightRail"
import { Btn, Card, CardHeader, useToast } from "../components/primitives"
import { useAutomationAiBuilder } from "../data/hooks"
import { SEED_AI_EXAMPLES } from "../data/seed"

const NODES = [
  { label: "Lease expiry 60 days before", kind: "Trigger", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  { label: "Tenant signed renewal?", kind: "Condition", cls: "border-violet-200 bg-violet-50 text-violet-800" },
  { label: "Send renewal offer", kind: "Action", cls: "border-blue-200 bg-blue-50 text-blue-800" },
  { label: "Create renewal task", kind: "Action", cls: "border-blue-200 bg-blue-50 text-blue-800" },
  { label: "Send reminder (Day 1)", kind: "Action", cls: "border-blue-200 bg-blue-50 text-blue-800" },
  { label: "Wait 7 days", kind: "Delay", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  { label: "Escalate to PM", kind: "Action", cls: "border-blue-200 bg-blue-50 text-blue-800" },
]

export default function AiBuilderPage() {
  const router = useSectionRouter()
  const toast = useToast()
  const { data: builds } = useAutomationAiBuilder()
  const [prompt, setPrompt] = useState("")
  // Nothing is "generated" until the user actually asks for it — never show a
  // pre-baked fake workflow on load.
  const [generated, setGenerated] = useState(false)

  const actions = (
    <>
      <Btn icon={Sparkles} variant="violet" onClick={() => { setGenerated(true); toast("Workflow generated as a draft") }}>Generate workflow</Btn>
      <Btn icon={LayoutTemplate} onClick={() => router.push("/property-manager/automations/canvas")}>Open canvas</Btn>
      <Btn onClick={() => router.push("/property-manager/automations/recipes")}>Templates</Btn>
      <Btn icon={ShieldCheck} onClick={() => toast("Governance settings")}>Governance</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="AI Builder"
      subtitle="Describe what you want to automate and let AI build it for you. Review, refine, and deploy with confidence."
      icon={Bot}
      actions={actions}
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Prompt card */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Describe the automation you want to build</h2>
            <p className="mt-0.5 text-xs text-slate-500">Be specific about the trigger, the steps, and what should happen if there&apos;s no response.</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="When a new lease expires in 60 days, notify the tenant, create a maintenance inspection, and escalate if there is no response in 7 days."
              className="mt-3 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-violet-400 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {SEED_AI_EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => setPrompt(ex)} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50">{ex}</button>
                ))}
              </div>
              <Btn variant="violet" icon={Send} onClick={() => { setGenerated(true); toast("Workflow generated as a draft") }}>Generate</Btn>
            </div>
          </Card>

          {generated && (
            <>
              {/* Workflow preview */}
              <Card>
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">AI-generated workflow preview</h3><span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">Recommended</span></div>
                  <Btn variant="outline" icon={Workflow} onClick={() => router.push("/property-manager/automations/canvas")}>Open in canvas</Btn>
                </div>
                <div className="overflow-x-auto p-4">
                  <div className="flex min-w-max items-center gap-2">
                    {NODES.map((n, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-40 rounded-xl border px-3 py-2.5 ${n.cls}`}>
                          <div className="text-[10px] font-semibold uppercase opacity-70">{n.kind}</div>
                          <div className="mt-0.5 text-xs font-medium">{n.label}</div>
                        </div>
                        {i < NODES.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Below preview */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <h4 className="text-xs font-semibold uppercase text-slate-400">Node summary</h4>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {[["Total nodes", 7], ["Triggers", 1], ["Conditions", 1], ["Actions", 4], ["Delays", 1], ["Integrations", 2], ["Est. runtime", "~2 min"]].map(([l, v]) => (
                      <li key={l as string} className="flex justify-between"><span>{l}</span><span className="font-medium text-slate-800">{v}</span></li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4">
                  <h4 className="text-xs font-semibold uppercase text-emerald-600">Review-first safety checklist</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                    {["Includes escalation for non-response", "No destructive actions detected", "Financial actions require approval"].map((c) => (
                      <li key={c} className="flex gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />{c}</li>
                    ))}
                  </ul>
                  <button onClick={() => toast("Safety model")} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Learn more</button>
                </Card>
                <Card className="p-4">
                  <h4 className="text-xs font-semibold uppercase text-slate-400">Recommended modules</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Notifications", "Tasks", "Leases", "Tenancies", "People", "Approvals"].map((m) => <span key={m} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{m}</span>)}
                  </div>
                  <Btn variant="outline" className="mt-3" onClick={() => toast("Modules added")}>Add modules</Btn>
                </Card>
              </div>
            </>
          )}

          {/* Bottom panels */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader title="Recent AI builds" />
              <div className="p-2">
                {builds.length === 0 ? (
                  <p className="px-2.5 py-3 text-xs text-slate-400">Your AI-generated automations will appear here.</p>
                ) : builds.map((b) => (
                  <button key={b.id} onClick={() => router.push("/property-manager/automations/canvas")} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{b.name}</span>
                    <AutomationsStatusBadge status={b.status === "Deployed" ? "live" : "draft"} label={b.status} />
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Prompt history" />
              <div className="p-2 text-sm text-slate-600">
                {SEED_AI_EXAMPLES.slice(0, 4).map((p) => (
                  <button key={p} onClick={() => setPrompt(p)} className="block w-full truncate rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">{p}</button>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Model usage" />
              <div className="p-4 text-xs text-slate-400">
                AI build usage and timings appear here once you generate automations with the AI Builder.
              </div>
            </Card>
          </div>
        </div>

        {/* Right rail */}
        <AutomationsRightRail>
          <Card className="border-violet-200 bg-violet-50/40">
            <div className="p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-violet-900"><Sparkles className="h-4 w-4" />Tips</h3>
              <p className="mt-1 text-xs text-violet-800">Describe the trigger, the steps, and what should happen if there is no response. The AI Builder always produces a review-first draft you can refine before it runs.</p>
            </div>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/40">
            <div className="flex items-start gap-2.5 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-xs text-emerald-900"><span className="font-semibold">Safety first.</span> Generated workflows are saved as drafts only — nothing runs until you review and deploy.</p>
            </div>
          </Card>
        </AutomationsRightRail>
      </div>
    </AutomationsModuleShell>
  )
}
