"use client"

import { useRouter } from "next/navigation"
import { Plus, ArrowRight, Building2, FileCheck2, Receipt, Wrench, CalendarClock, ClipboardList } from "lucide-react"
import { SITE_WIZARDS } from "@/lib/ai/site-map"

// ============================================================================
// Copilot quick actions — instant, visible entry points so the Copilot feels
// CONNECTED and action-rich on open (no model latency). "Create" chips run the
// action THROUGH the Copilot (send it into the conversation so it executes via
// the approval/tool flow, gathering any extra detail) rather than bouncing the
// user out to a wizard page. "Jump to" chips still navigate to a section.
// ============================================================================

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Portfolio: Building2,
  Work: Wrench,
  Money: Receipt,
  Compliance: FileCheck2,
  Calendar: CalendarClock,
  Planning: ClipboardList,
}

// Curated, highest-value creation flows to surface first.
const FEATURED = [
  "Add a property", "Create a tenancy", "Create a task", "Raise a job",
  "Schedule PPM", "Add a certificate", "Create an invoice", "Start a rent chase",
]

const GO_TO: { label: string; route: string }[] = [
  { label: "Overdue compliance", route: "/property-manager/compliance?status=overdue" },
  { label: "Rent arrears", route: "/property-manager/money/arrears" },
  { label: "Overdue tasks", route: "/property-manager/work/tasks?status=overdue" },
  { label: "Calendar", route: "/property-manager/calendar" },
]

export default function CopilotQuickActions({
  onNavigate,
  onSend,
}: {
  onNavigate?: () => void
  /** Run the action THROUGH the Copilot (send it into the conversation). When
   *  provided, "Create" chips send the action instead of navigating away. */
  onSend?: (prompt: string) => void
}) {
  const router = useRouter()
  const go = (route: string) => {
    onNavigate?.()
    router.push(route)
  }
  // "Create" chips: prefer running through Copilot; fall back to opening the
  // wizard only when no send handler is wired.
  const create = (w: (typeof SITE_WIZARDS)[number]) => {
    if (onSend) onSend(w.action)
    else go(w.route)
  }
  const wizards = FEATURED
    .map((a) => SITE_WIZARDS.find((w) => w.action === a))
    .filter((w): w is (typeof SITE_WIZARDS)[number] => !!w)

  return (
    <div className="space-y-3">
      <div>
        <p className="px-1 mb-1.5 text-[10px] font-[700] uppercase tracking-wide text-slate-400">Create</p>
        <div className="flex flex-wrap gap-1.5">
          {wizards.map((w) => {
            const Icon = ICON[w.section] ?? Plus
            return (
              <button
                key={w.route}
                onClick={() => create(w)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/60 px-2.5 py-1.5 text-[11.5px] font-[600] text-violet-700 transition-colors hover:bg-violet-100"
              >
                <Icon className="h-3.5 w-3.5" /> {w.action}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="px-1 mb-1.5 text-[10px] font-[700] uppercase tracking-wide text-slate-400">Jump to</p>
        <div className="flex flex-wrap gap-1.5">
          {GO_TO.map((g) => (
            <button
              key={g.route}
              onClick={() => go(g.route)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-[600] text-slate-600 transition-colors hover:bg-slate-50"
            >
              {g.label} <ArrowRight className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
