"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Edit2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningSet, PlanningComplianceItem } from "@/lib/planning/types"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Status chip ───────────────────────────────────────────────────────────────

type ChipVariant = "emerald" | "blue" | "amber" | "slate" | "red"

const CHIP_CLASSES: Record<ChipVariant, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-100 text-red-700",
}

function StatusChip({ label, variant }: { label: string; variant: ChipVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${CHIP_CLASSES[variant]}`}>
      {label}
    </span>
  )
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ value }: { value: number }) {
  const color = value >= 90 ? "#10B981" : value >= 70 ? "#F59E0B" : "#EF4444"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-semibold tabular-nums w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  )
}

// ── Static rows ───────────────────────────────────────────────────────────────

interface ComplianceRow {
  area: string
  description: string
  status: string
  statusVariant: ChipVariant
  score: number
  dueDate: string
  tasksComplete: number
  tasksTotal: number
  document: string
}

const STATIC_ROWS: ComplianceRow[] = [
  {
    area: "Licensing",
    description: "HMO Additional Licensing (Nottingham City)",
    status: "In Progress",
    statusVariant: "amber",
    score: 80,
    dueDate: "30 Jun 2025",
    tasksComplete: 2,
    tasksTotal: 3,
    document: "License Checklist v1.1",
  },
  {
    area: "Fire Safety",
    description: "Fire Risk Assessment & Safety Measures",
    status: "In Progress",
    statusVariant: "amber",
    score: 75,
    dueDate: "15 Jun 2025",
    tasksComplete: 3,
    tasksTotal: 5,
    document: "FRA (Draft) v0.3",
  },
  {
    area: "EPC",
    description: "Energy Performance Certificate (Min E)",
    status: "Compliant",
    statusVariant: "emerald",
    score: 100,
    dueDate: "Completed",
    tasksComplete: 1,
    tasksTotal: 1,
    document: "EPC Certificate",
  },
  {
    area: "Gas Safety",
    description: "Gas Safety Certificate (Annual)",
    status: "In Progress",
    statusVariant: "amber",
    score: 60,
    dueDate: "01 Jun 2025",
    tasksComplete: 1,
    tasksTotal: 2,
    document: "Gas Cert (Prev)",
  },
  {
    area: "Electrical",
    description: "Electrical Installation Condition Report",
    status: "In Progress",
    statusVariant: "amber",
    score: 70,
    dueDate: "01 Jun 2025",
    tasksComplete: 2,
    tasksTotal: 3,
    document: "EICR (Draft)",
  },
  {
    area: "Planning",
    description: "Change of Use / Planning Consents",
    status: "Compliant",
    statusVariant: "emerald",
    score: 100,
    dueDate: "Completed",
    tasksComplete: 1,
    tasksTotal: 1,
    document: "Planning Decision",
  },
  {
    area: "HMO Obligations",
    description: "Management Regs, House Rules, Info to Tenants",
    status: "In Progress",
    statusVariant: "amber",
    score: 85,
    dueDate: "30 Jun 2025",
    tasksComplete: 3,
    tasksTotal: 4,
    document: "HMO Guide Pack",
  },
  {
    area: "Insurance Documentation",
    description: "Buildings, Landlord, Public Liability",
    status: "In Progress",
    statusVariant: "amber",
    score: 90,
    dueDate: "15 Jun 2025",
    tasksComplete: 2,
    tasksTotal: 2,
    document: "Insurance Certs",
  },
  {
    area: "Inspections",
    description: "Pre-let Inspection & Ongoing Check Schedule",
    status: "Pending",
    statusVariant: "slate",
    score: 25,
    dueDate: "15 Jul 2025",
    tasksComplete: 0,
    tasksTotal: 2,
    document: "Inspection Plan",
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const params = useParams()
  const id = params.id as string

  const [set, setSet] = useState<PlanningSet | null>(null)
  const [dbItems, setDbItems] = useState<PlanningComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [{ data: s, error: sErr }, { data: c }] = await Promise.all([
          supabase.from("planning_sets").select("*").eq("id", id).single(),
          supabase.from("planning_compliance_items").select("*").eq("planning_set_id", id).order("created_at"),
        ])
        if (sErr || !s) { setError("Planning set not found."); return }
        setSet(s as PlanningSet)
        setDbItems((c ?? []) as PlanningComplianceItem[])
      } catch {
        setError("Failed to load data.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-slate-700 font-semibold">{error}</div>
        <Link href="/app/planning/sets" className="text-sm text-[#7C3AED] hover:underline">Back to planning sets</Link>
      </div>
    )
  }

  const overallScore = dbItems.length > 0
    ? Math.round(dbItems.filter(i => i.status === "complete" || i.status === "confirmed").length / dbItems.length * 100)
    : 89

  void set
  void dbItems

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Compliance Score</div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-slate-900">{overallScore}%</div>
                <StatusChip label="Good" variant="emerald" />
              </div>
              <div className="text-[10px] text-slate-400">Across {STATIC_ROWS.length} areas</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Critical Items</div>
              <div className="text-xl font-bold text-red-600">3</div>
              <div className="text-[11px] text-red-500 font-medium">Require immediate attention</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Upcoming Due</div>
              <div className="text-xl font-bold text-amber-600">5</div>
              <div className="text-[11px] text-amber-500 font-medium">Items due within 30 days</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Documents</div>
              <div className="text-xl font-bold text-blue-600">12</div>
              <div className="text-[11px] text-blue-500 font-medium">Compliance documents uploaded</div>
            </div>
          </>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="flex gap-5 items-start">

        {/* ── Left / centre ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Section 6B header + table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">6B</span>
                <h2 className="text-sm font-bold text-slate-900">Compliance</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-5"><Skeleton className="h-80 w-full" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Area</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Requirement / Description</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide w-28">Score</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Tasks</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Documents</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATIC_ROWS.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-2.5 font-bold text-slate-800 whitespace-nowrap">{row.area}</td>
                        <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate">{row.description}</td>
                        <td className="px-4 py-2.5">
                          <StatusChip label={row.status} variant={row.statusVariant} />
                        </td>
                        <td className="px-4 py-2.5 w-28">
                          <ScoreBar value={row.score} />
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`text-[10px] font-medium ${row.dueDate === "Completed" ? "text-emerald-600" : "text-slate-600"}`}>
                            {row.dueDate}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-[11px] font-semibold tabular-nums ${row.tasksComplete === row.tasksTotal ? "text-emerald-600" : "text-amber-600"}`}>
                            {row.tasksComplete}/{row.tasksTotal}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            <FileText className="w-2.5 h-2.5" />
                            {row.document}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-lg">
                            <Edit2 className="w-3 h-3 text-slate-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4 summary cards */}
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Score donut */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col items-center gap-2">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="4"
                      strokeDasharray={`${(overallScore / 100) * 87.96} 87.96`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-800">{overallScore}%</span>
                </div>
                <StatusChip label="Good" variant="emerald" />
                <div className="text-[10px] text-slate-400">Target 100%</div>
              </div>
              {/* Critical Items */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center">
                  <div style={{ color: "#EF4444" }}><AlertTriangle className="w-3.5 h-3.5" /></div>
                </div>
                <div className="text-xs font-bold text-slate-900">Critical Items</div>
                <div className="text-sm font-bold text-red-600">3</div>
                <div className="text-[10px] text-red-500">Require immediate attention</div>
                <button className="text-[11px] text-[#7C3AED] hover:underline font-medium text-left flex items-center gap-0.5">
                  View critical items <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {/* Upcoming Due */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
                  <div style={{ color: "#F59E0B" }}><Calendar className="w-3.5 h-3.5" /></div>
                </div>
                <div className="text-xs font-bold text-slate-900">Upcoming Due</div>
                <div className="text-[11px] text-amber-600 font-medium">5 items due within 30 days</div>
                <button className="text-[11px] text-[#7C3AED] hover:underline font-medium text-left flex items-center gap-0.5">
                  View calendar <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {/* Documents */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
                  <div style={{ color: "#2563EB" }}><FileText className="w-3.5 h-3.5" /></div>
                </div>
                <div className="text-xs font-bold text-slate-900">Documents</div>
                <div className="text-[11px] text-blue-600 font-medium">12 Compliance documents uploaded</div>
                <button className="text-[11px] text-[#7C3AED] hover:underline font-medium text-left flex items-center gap-0.5">
                  View all documents <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">

          {/* AI Insight */}
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 60%, #EFF6FF 100%)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-violet-900">AI Insight</span>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full ml-auto">BETA</span>
              </div>
              <p className="text-xs text-violet-800 leading-relaxed mb-4">
                Your compliance score is strong. Focus on Fire Safety and Electrical to remove critical blockers and improve investor confidence.
              </p>
              <div className="flex flex-col gap-1.5 mb-4">
                {[
                  { icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />, text: "EPC and Planning are fully compliant" },
                  { icon: <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />, text: "Fire Safety FRA requires completion" },
                  { icon: <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />, text: "EICR overdue — schedule urgent inspection" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    {item.icon}
                    <span className="text-[11px] text-violet-900">{item.text}</span>
                  </div>
                ))}
              </div>
              <button className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                View AI recommendations <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick actions */}
          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "View compliance calendar", icon: <Calendar className="w-3.5 h-3.5" />, color: "#2563EB", bg: "bg-blue-50" },
                  { label: "Upload documents", icon: <FileText className="w-3.5 h-3.5" />, color: "#10B981", bg: "bg-emerald-50" },
                  { label: "Mark items complete", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#10B981", bg: "bg-emerald-50" },
                  { label: "Set due date reminders", icon: <Clock className="w-3.5 h-3.5" />, color: "#F59E0B", bg: "bg-amber-50" },
                ].map(({ label, icon, color, bg }) => (
                  <button
                    key={label}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <div style={{ color }}>{icon}</div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
