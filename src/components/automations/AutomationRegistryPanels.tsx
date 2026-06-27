import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Lock,
  Settings2,
  ShieldCheck,
} from "lucide-react"
import {
  AUTOMATION_HARD_CAPS,
  AUTOMATION_NODE_REGISTRY,
  AUTOMATION_PLAN_LIMITS,
  AUTOMATION_SETTINGS_SECTIONS,
  type AutomationNodeGroup,
} from "@/lib/automation/node-registry"

const riskClasses: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  high: "bg-orange-50 text-orange-700 ring-orange-200",
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
  restricted: "bg-slate-900 text-white ring-slate-900",
}

export function NodeGroupPanel({ groups }: { groups: AutomationNodeGroup[] }) {
  const nodes = AUTOMATION_NODE_REGISTRY.filter((node) => groups.includes(node.group))

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {nodes.map((node) => (
        <article key={node.type} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">{node.group}</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">{node.label}</h3>
              <p className="mt-1 text-xs font-mono text-slate-500">{node.type}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${riskClasses[node.risk]}`}>
              {node.risk}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">{node.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-2 py-1">{node.scope}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{node.plan}</span>
            {node.requiresApproval && (
              <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 font-medium text-[var(--brand)]">approval required</span>
            )}
            {node.blockedFromAutoRun && (
              <span className="rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-700">blocked from autorun</span>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

export function PlanLimitsPanel() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              {["Plan", "Active", "Runs", "Canvas", "AI Builder", "Webhooks", "AI Nodes", "Max Nodes", "Retention"].map((heading) => (
                <th key={heading} className="px-4 py-3">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {AUTOMATION_PLAN_LIMITS.map((limit) => (
              <tr key={limit.plan}>
                <td className="px-4 py-3 font-semibold text-slate-900">{limit.plan}</td>
                <td className="px-4 py-3 text-slate-600">{limit.active}</td>
                <td className="px-4 py-3 text-slate-600">{limit.runs}</td>
                <td className="px-4 py-3 text-slate-600">{limit.canvas}</td>
                <td className="px-4 py-3 text-slate-600">{limit.nl}</td>
                <td className="px-4 py-3 text-slate-600">{limit.webhooks}</td>
                <td className="px-4 py-3 text-slate-600">{limit.ai}</td>
                <td className="px-4 py-3 text-slate-600">{limit.maxNodes}</td>
                <td className="px-4 py-3 text-slate-600">{limit.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function HardCapsPanel() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {AUTOMATION_HARD_CAPS.map((cap) => (
        <div key={cap} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
          <p className="text-sm font-medium text-slate-700">{cap}</p>
        </div>
      ))}
    </div>
  )
}

export function SettingsSectionsPanel() {
  const icons = [Settings2, CircleDollarSign, CheckCircle2, AlertTriangle, Lock]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {AUTOMATION_SETTINGS_SECTIONS.map((section, index) => {
        const Icon = icons[index % icons.length]
        return (
          <article key={section} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{section}</h3>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>Enabled</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-slate-900" />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span>Audit changes</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-slate-900" />
              </label>
            </div>
          </article>
        )
      })}
    </div>
  )
}
