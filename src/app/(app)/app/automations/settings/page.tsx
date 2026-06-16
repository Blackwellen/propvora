import { Settings2, ShieldCheck, Ban, Clock, CreditCard, Scale } from "lucide-react"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import { SettingsSectionsPanel } from "@/components/automations/AutomationRegistryPanels"

export const metadata = {
  title: "Automation settings - Propvora",
  description: "Workspace automation settings for approvals, safety, limits, webhooks, AI, and retention.",
}
export const dynamic = "force-dynamic"

const SAFETY_GUARANTEES = [
  { icon: CreditCard, text: "Payment releases and refunds never auto-run — they always create an approval object first." },
  { icon: Scale, text: "Legal serve/file actions are blocked from automated execution and require a human, audited action." },
  { icon: Ban, text: "Delete, suspend, and other destructive actions are not on the auto-executable path." },
  { icon: Clock, text: "Dry runs never send messages, take payments, or perform legal actions — they only simulate." },
]

export default function AutomationSettingsPage() {
  return (
    <div className="space-y-6">
      <OpsHeader
        icon={Settings2}
        title="Settings"
        subtitle="Workspace-level controls for approvals, notifications, AI, safety, logs, retention, and admin policy."
      />

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-sm font-semibold text-emerald-900">Always-on safety guarantees</h2>
        </div>
        <p className="mt-1 text-xs text-emerald-800">These are enforced in the executor itself — they can&apos;t be turned off by any setting, recipe, or AI draft.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SAFETY_GUARANTEES.map((g) => (
            <div key={g.text} className="flex items-start gap-2 rounded-lg border border-emerald-200/70 bg-white px-3 py-2.5">
              <g.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs text-slate-700">{g.text}</p>
            </div>
          ))}
        </div>
      </section>

      <SettingsSectionsPanel />
    </div>
  )
}
