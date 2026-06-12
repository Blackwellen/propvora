"use client"

import { useState } from "react"
import {
  BookOpen,
  AlertCircle,
  Shield,
  Truck,
  CheckSquare,
  Search,
} from "lucide-react"
import { motion } from "framer-motion"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
interface ActionApproval {
  id: string
  actionKey: string
  label: string
  description: string
  status: "needs_review" | "approved" | "rejected" | "executed"
  draftContent: string
  linkedRecord?: string
  creditCost: number
  createdAt: string
}

interface QuickAction {
  key: string
  label: string
  desc: string
  icon: React.ElementType
  credits: number
  colour: string
}

/* ------------------------------------------------------------------ */
/* Demo approvals                                                       */
/* ------------------------------------------------------------------ */
const DEMO_APPROVALS: ActionApproval[] = [
  {
    id: "ap1",
    actionKey: "draft-chase-email",
    label: "Draft Arrears Chase — J.Barrett",
    description: "Email draft for £850 arrears on 5 Tower St",
    status: "needs_review",
    draftContent:
      "Dear Mr Barrett,\n\nI hope this email finds you well. I'm writing regarding the outstanding rent balance of £850 for the property at 5 Tower St...",
    linkedRecord: "Arrears · 5 Tower St",
    creditCost: 2,
    createdAt: "2 minutes ago",
  },
  {
    id: "ap2",
    actionKey: "create-renewal-tasks",
    label: "Create Renewal Tasks (3 certs)",
    description: "Tasks for gas cert, EICR, and EPC renewals",
    status: "needs_review",
    draftContent:
      "3 tasks will be created:\n1. Renew Gas Safety — 8 Clarence Rd — Due 4 Jun\n2. Renew EICR — 16 Rose Gardens — Urgent\n3. Renew EPC — 22 Park Lane — Due 11 Jun",
    linkedRecord: "Compliance · 3 properties",
    creditCost: 1,
    createdAt: "5 minutes ago",
  },
]

/* ------------------------------------------------------------------ */
/* Quick actions grid data                                             */
/* ------------------------------------------------------------------ */
const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "summarise",
    label: "Summarise Page",
    desc: "AI overview of current context",
    icon: BookOpen,
    credits: 1,
    colour: "#2563EB",
  },
  {
    key: "chase-arrears",
    label: "Chase Arrears",
    desc: "Draft arrears chase messages",
    icon: AlertCircle,
    credits: 2,
    colour: "#DC2626",
  },
  {
    key: "review-compliance",
    label: "Review Compliance",
    desc: "Find gaps and create tasks",
    icon: Shield,
    credits: 2,
    colour: "#D97706",
  },
  {
    key: "draft-supplier",
    label: "Draft Supplier Msg",
    desc: "Message to supplier/contractor",
    icon: Truck,
    credits: 2,
    colour: "#7C3AED",
  },
  {
    key: "create-task",
    label: "Create Task",
    desc: "Task from current context",
    icon: CheckSquare,
    credits: 1,
    colour: "#059669",
  },
  {
    key: "find-missing",
    label: "Find Missing Docs",
    desc: "Scan for missing compliance docs",
    icon: Search,
    credits: 2,
    colour: "#D97706",
  },
]

/* ------------------------------------------------------------------ */
/* ApprovalCard                                                         */
/* ------------------------------------------------------------------ */
function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: ActionApproval
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3.5 mb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-slate-800">{approval.label}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{approval.description}</p>
          {approval.linkedRecord && (
            <span className="text-[10px] text-blue-600 mt-1 block">{approval.linkedRecord}</span>
          )}
        </div>
        <span className="text-[10px] text-violet-500 shrink-0">{approval.creditCost} cr</span>
      </div>

      {expanded && (
        <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-amber-100 text-[11.5px] text-slate-700 whitespace-pre-wrap font-mono">
          {approval.draftContent}
        </div>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? "Hide" : "Preview"}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onReject(approval.id)}
          className="px-2.5 py-1 rounded-lg text-[11px] text-red-500 border border-red-200 hover:bg-red-50 transition-colors font-medium"
        >
          Reject
        </button>
        <button
          onClick={() => onApprove(approval.id)}
          className="px-2.5 py-1 rounded-lg text-[11px] text-white bg-emerald-500 hover:bg-emerald-600 transition-colors font-medium"
        >
          Approve
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* AiActionsPanel                                                       */
/* ------------------------------------------------------------------ */
export default function AiActionsPanel() {
  const [pendingApprovals, setPendingApprovals] =
    useState<ActionApproval[]>(DEMO_APPROVALS)
  const [executingAction, setExecutingAction] = useState<string | null>(null)

  async function handleRunAction(key: string) {
    setExecutingAction(key)
    await new Promise((r) => setTimeout(r, 1500))
    setExecutingAction(null)

    if (
      key === "chase-arrears" ||
      key === "draft-supplier" ||
      key === "review-compliance"
    ) {
      const action = QUICK_ACTIONS.find((a) => a.key === key)
      setPendingApprovals((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          actionKey: key,
          label: `AI Draft — ${action?.label ?? key}`,
          description: "Review and approve before executing",
          status: "needs_review",
          draftContent: "AI has prepared a draft. Review carefully before approving.",
          creditCost: action?.credits ?? 1,
          createdAt: "Just now",
        },
      ])
    }
  }

  function handleApprove(id: string) {
    setPendingApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a))
    )
  }

  function handleReject(id: string) {
    setPendingApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a))
    )
  }

  const needsReview = pendingApprovals.filter((a) => a.status === "needs_review")

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Actions grid */}
      <div className="px-4 pt-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            const isExecuting = executingAction === action.key
            return (
              <button
                key={action.key}
                onClick={() => handleRunAction(action.key)}
                disabled={isExecuting}
                className="flex flex-col gap-2 p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm transition-all text-left group disabled:opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: action.colour + "15" }}
                  >
                    <div style={{ color: action.colour }}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[10px] text-violet-500 font-medium">
                    {action.credits} cr
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">{action.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{action.desc}</p>
                </div>
                {isExecuting && (
                  <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#2563EB] rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5 }}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pending approvals */}
      {needsReview.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 mt-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Pending Approval ({needsReview.length})
          </p>
          {needsReview.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-4 shrink-0" />
    </div>
  )
}
