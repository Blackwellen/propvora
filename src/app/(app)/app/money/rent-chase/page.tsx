"use client"

import React, { useState, useMemo } from "react"
import {
  Siren,
  Wallet,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Settings,
  Plus,
  Pause,
  Eye,
  Gavel,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { MoneyTabNav, MoneyKpiCard, MoneyPageHeader } from "@/components/money"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { useWorkspace } from "@/providers/AuthProvider"
import { useMoneyArrears, useMoneyArrearsSummary } from "@/hooks/useMoneyData"
import type { MoneyArrearsRow } from "@/hooks/useMoneyData"
import { createClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

// ─── Money formatting ─────────────────────────────────────────────────────────

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
function fmtGBP(n: number): string { return gbp.format(Number.isFinite(n) ? n : 0) }

// ─── Types ────────────────────────────────────────────────────────────────────

type EscalationLevel = "level1" | "level2" | "level3" | "level4"

interface ChaseCase {
  id: string
  tenant: string
  property: string
  amount: number
  daysOverdue: number
  level: EscalationLevel
  levelLabel: string
  lastAction: string
  notes: string | null
}

type ChaseSettingDay = {
  day: number
  label: string
  channels: string[]
}

const CHASE_DAYS: ChaseSettingDay[] = [
  { day: 1,  label: "Friendly reminder",       channels: ["Email only"] },
  { day: 3,  label: "Formal reminder",         channels: ["Email", "SMS (if addon)"] },
  { day: 7,  label: "Formal arrears notice",   channels: ["Email", "SMS", "WhatsApp (if addon)"] },
  { day: 14, label: "Legal escalation",        channels: ["Email", "Post letter", "Create evidence file"] },
  { day: 30, label: "Pre-legal letter",        channels: ["Email", "Post", "Prompt to start possession"] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelFromDays(days: number): { level: EscalationLevel; label: string } {
  if (days >= 30) return { level: "level4", label: "Level 4 — Pre-Legal" }
  if (days >= 14) return { level: "level3", label: "Level 3 — Legal Escalation" }
  if (days >= 7) return { level: "level2", label: "Level 2 — Formal Reminder" }
  return { level: "level1", label: "Level 1 — Reminder" }
}

function levelBadgeClass(level: EscalationLevel): string {
  switch (level) {
    case "level1": return "bg-blue-50 text-blue-700 border-blue-200"
    case "level2": return "bg-amber-50 text-amber-700 border-amber-200"
    case "level3": return "bg-red-50 text-red-700 border-red-200"
    case "level4": return "bg-red-100 text-red-800 border-red-300"
  }
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
        on ? "bg-emerald-500" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  )
}

// ─── Chase Case Row ───────────────────────────────────────────────────────────

function ChaseCaseRow({
  c,
  onResolve,
  onPause,
}: {
  c: ChaseCase
  onResolve: (c: ChaseCase) => void
  onPause: (c: ChaseCase) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
        <td className="px-5 py-4">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 hover:text-blue-600 transition-colors"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {c.tenant}
          </button>
        </td>
        <td className="px-4 py-4 text-[13px] text-slate-600">{c.property}</td>
        <td className="px-4 py-4">
          <span className="text-[13px] font-bold text-red-600">{fmtGBP(c.amount)}</span>
        </td>
        <td className="px-4 py-4">
          <span className={cn(
            "text-[13px] font-semibold",
            c.daysOverdue >= 30 ? "text-red-600" : c.daysOverdue >= 14 ? "text-amber-600" : "text-slate-700"
          )}>
            {c.daysOverdue} days
          </span>
        </td>
        <td className="px-4 py-4">
          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium border", levelBadgeClass(c.level))}>
            {c.levelLabel}
          </span>
        </td>
        <td className="px-4 py-4 text-[12px] text-slate-600">{c.lastAction}</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1.5">
            <Link href="/app/money/arrears" className="flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2 py-1 rounded-lg transition-colors">
              <Eye className="w-3 h-3" />
              View
            </Link>
            <button onClick={() => onPause(c)} className="flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2 py-1 rounded-lg transition-colors">
              <Pause className="w-3 h-3" />
              Pause
            </button>
            <button onClick={() => onResolve(c)} className="flex items-center gap-1 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-medium px-2 py-1 rounded-lg transition-colors">
              <CheckCircle className="w-3 h-3" />
              Resolve
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50/60 border-b border-slate-100">
          <td colSpan={7} className="px-10 py-4">
            <div className="text-[12px] text-slate-600">
              <p className="font-semibold text-slate-700 mb-1">Notes</p>
              <p>{c.notes || "No notes recorded for this case."}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RentChasePage() {
  const { workspace } = useWorkspace()
  const { data: liveArrears, isLoading } = useMoneyArrears(workspace?.id)
  const { data: summary } = useMoneyArrearsSummary(workspace?.id)

  const [aiChaseOn, setAiChaseOn] = useState(true)
  const [chaseMode, setChaseMode] = useState<"review" | "auto">("review")
  const [emailOn] = useState(true)
  const [smsOn, setSmsOn] = useState(false)
  const [whatsappOn, setWhatsappOn] = useState(false)
  const [evidenceOn, setEvidenceOn] = useState(true)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  // Active chase cases = arrears that are open or being chased (live)
  const chaseCases: ChaseCase[] = useMemo(() => {
    return (liveArrears ?? [])
      .filter((r) => (r.status === "open" || r.status === "being_chased") && !hiddenIds.has(r.id))
      .map((r: MoneyArrearsRow): ChaseCase => {
        const days = Math.max(0, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000))
        const lvl = levelFromDays(days)
        return {
          id: r.id,
          tenant: r.tenant_id ?? "Unknown tenant",
          property: r.property_id ?? "—",
          amount: (r.amount_owed ?? 0) - (r.amount_paid ?? 0),
          daysOverdue: days,
          level: lvl.level,
          levelLabel: lvl.label,
          lastAction: r.last_chased_at
            ? `Last chased ${new Date(r.last_chased_at).toLocaleDateString("en-GB")}`
            : "Not yet chased",
          notes: r.notes,
        }
      })
  }, [liveArrears, hiddenIds])

  const totalOutstanding = chaseCases.reduce((acc, c) => acc + c.amount, 0)
  const avgDays = chaseCases.length > 0
    ? Math.round(chaseCases.reduce((acc, c) => acc + c.daysOverdue, 0) / chaseCases.length)
    : 0

  async function resolveCase(c: ChaseCase) {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("money_arrears")
        .update({ status: "resolved" })
        .eq("id", c.id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      setHiddenIds((p) => new Set(p).add(c.id))
      showToast(error?.code === "42P01" ? "Arrears table not provisioned yet" : `Case resolved for ${c.tenant}`)
    } catch { showToast("Could not resolve case") }
  }

  async function pauseCase(c: ChaseCase) {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("money_arrears")
        .update({ status: "open" })
        .eq("id", c.id).eq("workspace_id", workspace?.id ?? "")
      if (error && error.code !== "42P01") throw error
      showToast(error?.code === "42P01" ? "Arrears table not provisioned yet" : `Chasing paused for ${c.tenant}`)
    } catch { showToast("Could not pause chasing") }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      <MoneyTabNav />

      <DashboardContainer className="px-6 py-6 flex flex-col gap-6">
        <MoneyPageHeader
          breadcrumb="Rent Chase"
          title="Rent Chase"
          subtitle="Automated rent arrears chasing and legal escalation."
          actions={
            <>
              <Link href="/app/money/arrears" className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <Settings className="w-3.5 h-3.5" />
                Manage Arrears
              </Link>
              <Link href="/app/money/arrears" className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" />
                New Case
              </Link>
            </>
          }
        />

        {/* Chase status banner — live */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <Siren className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Rent Chase</span> is tracking{" "}
              <span className="font-semibold">{chaseCases.length} tenanc{chaseCases.length === 1 ? "y" : "ies"}</span>{" "}
              with outstanding rent. Configure escalation rules on the right.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className={cn("text-xs font-semibold", aiChaseOn ? "text-emerald-700" : "text-slate-500")}>
              Auto Chase: {aiChaseOn ? "ON" : "OFF"}
            </span>
            <Toggle on={aiChaseOn} onToggle={() => setAiChaseOn((v) => !v)} />
          </div>
        </div>

        {/* KPI row — live */}
        <div className="grid grid-cols-4 gap-4">
          <MoneyKpiCard
            label="Currently Chasing"
            value={chaseCases.length}
            icon={<Siren className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <MoneyKpiCard
            label="Total Outstanding"
            value={fmtGBP(totalOutstanding)}
            icon={<Wallet className="w-5 h-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
          <MoneyKpiCard
            label="Resolved This Month"
            value={summary?.resolvedThisMonth ?? 0}
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <MoneyKpiCard
            label="Avg Days Overdue"
            value={avgDays}
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left: Active chase cases */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Active Chase Cases</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tenant</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Property</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Days</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Escalation</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Last Action</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && chaseCases.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">Loading chase cases…</td></tr>
                    )}
                    {!isLoading && chaseCases.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-emerald-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">No active chase cases</p>
                            <p className="text-xs text-slate-400">Open arrears cases appear here for chasing.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {chaseCases.map((c) => (
                      <ChaseCaseRow key={c.id} c={c} onResolve={resolveCase} onPause={pauseCase} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Chase Settings */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-5">
              <h3 className="text-sm font-semibold text-slate-900">Chase Settings</h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Auto-chase</span>
                <Toggle on={aiChaseOn} onToggle={() => setAiChaseOn((v) => !v)} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-700">Chase mode</span>
                <div className="flex flex-col gap-1.5">
                  {(
                    [
                      { value: "review", label: "Review before send" },
                      { value: "auto",   label: "Fully automatic" },
                    ] as const
                  ).map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="chaseMode"
                        value={opt.value}
                        checked={chaseMode === opt.value}
                        onChange={() => setChaseMode(opt.value)}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-700">Escalation schedule</span>
                <div className="flex flex-col gap-2.5">
                  {CHASE_DAYS.map((day) => (
                    <div key={day.day} className="flex items-start gap-3">
                      <div className="w-10 shrink-0 flex items-center justify-center bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md h-6 mt-0.5">
                        D{day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-slate-800">{day.label}</p>
                        <p className="text-[11px] text-slate-400">{day.channels.join(" · ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-700">Channels</span>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Email</span>
                    <span className="text-[10px] text-slate-400">(always on)</span>
                  </div>
                  <Toggle on={emailOn} onToggle={() => {}} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">SMS via Twilio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!smsOn && (
                      <span className="text-[10px] text-slate-400">Add-on</span>
                    )}
                    <Toggle on={smsOn} onToggle={() => setSmsOn((v) => !v)} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!whatsappOn && (
                      <span className="text-[10px] text-slate-400">Add-on</span>
                    )}
                    <Toggle on={whatsappOn} onToggle={() => setWhatsappOn((v) => !v)} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Auto evidence filing</span>
                  </div>
                  <Toggle on={evidenceOn} onToggle={() => setEvidenceOn((v) => !v)} />
                </div>
              </div>

              <button
                onClick={() => showToast("Chase settings saved")}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </DashboardContainer>
    </div>
  )
}
