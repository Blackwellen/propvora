"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  FlaskConical,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CalendarClock,
  CalendarPlus,
  PencilRuler,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DemoCounts {
  properties: number
  contacts: number
  tenancies: number
  units: number
  tasks: number
  jobs: number
  compliance: number
  transactions: number
  events: number
  rent_schedules: number
  message_threads: number
}

interface DemoStatus {
  loaded: boolean
  injected_at: string | null
  expires_at: string | null
  total_count: number
  edited_count: number
  counts: DemoCounts
}

interface WorkspaceContext {
  workspaceId: string
  status: DemoStatus | null
}

type PageState = "loading" | "idle" | "seeding" | "resetting"

const COUNT_ROWS: { key: keyof DemoCounts; label: string }[] = [
  { key: "properties", label: "Properties" },
  { key: "units", label: "Units" },
  { key: "tenancies", label: "Tenancies" },
  { key: "contacts", label: "Contacts" },
  { key: "tasks", label: "Tasks" },
  { key: "jobs", label: "Jobs" },
  { key: "compliance", label: "Compliance" },
  { key: "transactions", label: "Transactions" },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value: string | null): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function daysUntil(value: string | null): number | null {
  if (!value) return null
  const ms = new Date(value).getTime() - Date.now()
  if (Number.isNaN(ms)) return null
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

async function resolveWorkspaceId(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()
  return (profile?.current_workspace_id as string | null) ?? null
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DemoDataPage() {
  const [pageState, setPageState] = useState<PageState>("loading")
  const [ctx, setCtx] = useState<WorkspaceContext | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearText, setClearText] = useState("")
  const [preserveEdited, setPreserveEdited] = useState(true)

  const loadStatus = useCallback(async () => {
    setPageState("loading")
    setErrorMessage(null)
    try {
      const workspaceId = await resolveWorkspaceId()
      if (!workspaceId) {
        setCtx(null)
        return
      }
      const res = await fetch(`/api/demo/status?workspaceId=${encodeURIComponent(workspaceId)}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMessage((json as { error?: string }).error ?? "Failed to load demo status.")
        setCtx({ workspaceId, status: null })
        return
      }
      setCtx({ workspaceId, status: (json as { status: DemoStatus }).status })
    } catch {
      setErrorMessage("Failed to load workspace status.")
    } finally {
      setPageState("idle")
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  async function handleSeed() {
    if (!ctx?.workspaceId || pageState !== "idle") return
    setPageState("seeding")
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: ctx.workspaceId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMessage((json as { error?: string; detail?: string }).error ?? "Seed failed")
        return
      }
      setSuccessMessage(
        "Demo data loaded — properties (with photos), units, tenancies, rent, tasks, jobs, compliance, messages and more. It auto-expires after 30 days."
      )
      await loadStatus()
    } catch {
      setErrorMessage("Network error. Please try again.")
    } finally {
      setPageState("idle")
    }
  }

  async function handleReset() {
    if (!ctx?.workspaceId || pageState !== "idle") return
    setPageState("resetting")
    setErrorMessage(null)
    setSuccessMessage(null)
    setShowClearConfirm(false)
    setClearText("")
    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: ctx.workspaceId, preserveEdited }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMessage((json as { error?: string }).error ?? "Reset failed")
        return
      }
      setSuccessMessage(
        preserveEdited
          ? "Demo data removed. Any demo records you had edited were kept."
          : "Demo data removed. Your workspace is clean."
      )
      await loadStatus()
    } catch {
      setErrorMessage("Network error. Please try again.")
    } finally {
      setPageState("idle")
    }
  }

  const status = ctx?.status ?? null
  const demoLoaded = status?.loaded ?? false
  const isWorking = pageState === "seeding" || pageState === "resetting"
  const expiryDays = daysUntil(status?.expires_at ?? null)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Demo Data</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Load sample properties, tenants, jobs and finances to explore Propvora.
        </p>
      </div>

      {/* Status card */}
      <div
        className={cn(
          "bg-white rounded-2xl border p-6 mb-6",
          pageState === "loading"
            ? "border-slate-200"
            : demoLoaded
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-warning-light)" }}
            >
              {pageState === "loading" ? (
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              ) : (
                <FlaskConical className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-900">Demo Data Status</p>
              <p className="text-[12px] text-slate-500">
                {pageState === "loading"
                  ? "Checking workspace…"
                  : demoLoaded
                  ? `Demo data is active — ${status?.total_count ?? 0} records`
                  : "No demo data loaded"}
              </p>
            </div>
          </div>

          {pageState !== "loading" && (
            <span
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                demoLoaded ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
              )}
            >
              {demoLoaded ? "Demo Active" : "Not loaded"}
            </span>
          )}
        </div>

        {/* Injected / expiry / edited summary */}
        {demoLoaded && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="flex items-center gap-2.5 rounded-xl bg-white border border-amber-100 px-3.5 py-3">
              <CalendarPlus className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400">Injected</p>
                <p className="text-[12.5px] font-semibold text-slate-800">{formatDate(status?.injected_at ?? null)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white border border-amber-100 px-3.5 py-3">
              <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400">Expires</p>
                <p className="text-[12.5px] font-semibold text-slate-800">
                  {formatDate(status?.expires_at ?? null)}
                  {expiryDays != null && (
                    <span className="text-[11px] font-normal text-slate-400"> · {expiryDays}d left</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white border border-amber-100 px-3.5 py-3">
              <PencilRuler className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400">Edited records</p>
                <p className="text-[12.5px] font-semibold text-slate-800">{status?.edited_count ?? 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-6">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-emerald-800 leading-relaxed">{successMessage}</p>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-700 leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Sample Dataset</h3>
        <p className="text-[12.5px] text-slate-500 mb-5 leading-relaxed">
          The demo dataset includes realistic UK property management data — HMOs, flats, a serviced
          let and a student let (with real photos), tenancies, rent schedules, contacts, tasks, jobs,
          compliance items, messages and finances. Every record is labelled{" "}
          <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">demo: true</code>,
          can be removed at any time, and auto-expires 30 days after loading.
        </p>

        {/* Counts (live when loaded, illustrative when not) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {COUNT_ROWS.map(({ key, label }) => (
            <div
              key={key}
              className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5 text-center"
            >
              <p className="text-[18px] font-bold text-slate-900">
                {demoLoaded ? status?.counts?.[key] ?? 0 : "—"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Preserve-edited toggle (only meaningful when demo is active) */}
        {demoLoaded && (
          <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preserveEdited}
              onChange={(e) => setPreserveEdited(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/30"
            />
            <span className="text-[12.5px] text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Keep records I&apos;ve edited.</span>{" "}
              When removing demo data, any demo record you have since changed is preserved (and
              becomes part of your real workspace). Untouched demo records are deleted.
            </span>
          </label>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {!demoLoaded && pageState !== "loading" && (
            <button
              onClick={handleSeed}
              disabled={isWorking}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pageState === "seeding" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {pageState === "seeding" ? "Seeding data…" : "Load Demo Data"}
            </button>
          )}

          {demoLoaded && pageState !== "loading" && (
            <>
              <button
                onClick={loadStatus}
                disabled={isWorking}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh status
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={isWorking}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pageState === "resetting" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {pageState === "resetting" ? "Removing data…" : "Remove Demo Data"}
              </button>
            </>
          )}
        </div>

        {demoLoaded && (
          <p className="text-[11.5px] text-amber-600 mt-4">
            Demo data is currently active. Remove it before going live with real data.
          </p>
        )}
      </div>

      {/* Clear confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              setShowClearConfirm(false)
              setClearText("")
            }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-[440px] mx-4 shadow-2xl">
            <h3 className="text-[15px] font-bold text-slate-900 mb-2">Remove demo data?</h3>
            <p className="text-[13px] text-slate-500 mb-4">
              This will permanently delete{" "}
              {preserveEdited ? "all untouched demo records (your edits are kept)" : "all demo records"}{" "}
              from your workspace. Type <strong>REMOVE</strong> to confirm.
            </p>
            <input
              value={clearText}
              onChange={(e) => setClearText(e.target.value)}
              placeholder="Type REMOVE to confirm"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] mb-4 focus:outline-none focus:border-red-400 transition-all"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClearConfirm(false)
                  setClearText("")
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={clearText !== "REMOVE"}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-red-600 transition-colors"
              >
                Remove data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
