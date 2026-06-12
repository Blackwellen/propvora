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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WorkspaceStatus {
  workspaceId: string
  demoDataLoaded: boolean
}

type PageState = "loading" | "idle" | "seeding" | "resetting"

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function fetchWorkspaceStatus(): Promise<WorkspaceStatus | null> {
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

  if (!profile?.current_workspace_id) return null

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, demo_data_loaded")
    .eq("id", profile.current_workspace_id)
    .maybeSingle()

  if (!workspace) return null

  return {
    workspaceId: workspace.id as string,
    demoDataLoaded: !!workspace.demo_data_loaded,
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DemoDataPage() {
  const [pageState, setPageState] = useState<PageState>("loading")
  const [status, setStatus] = useState<WorkspaceStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearText, setClearText] = useState("")

  const loadStatus = useCallback(async () => {
    setPageState("loading")
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const ws = await fetchWorkspaceStatus()
      setStatus(ws)
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
    if (!status?.workspaceId || pageState !== "idle") return
    setPageState("seeding")
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: status.workspaceId }),
      })

      const json = await res.json()

      if (!res.ok) {
        const detail = (json as { error?: string; detail?: string }).error ?? "Seed failed"
        setErrorMessage(detail)
        return
      }

      setSuccessMessage(
        "Demo data loaded — 3 properties, 6+ units, 5 tenancies, 20 tasks, 8 jobs, 8 invoices and more."
      )
      await loadStatus()
    } catch {
      setErrorMessage("Network error. Please try again.")
    } finally {
      setPageState("idle")
    }
  }

  async function handleReset() {
    if (!status?.workspaceId || pageState !== "idle") return
    setPageState("resetting")
    setErrorMessage(null)
    setSuccessMessage(null)
    setShowClearConfirm(false)
    setClearText("")

    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: status.workspaceId }),
      })

      const json = await res.json()

      if (!res.ok) {
        const detail = (json as { error?: string }).error ?? "Reset failed"
        setErrorMessage(detail)
        return
      }

      setSuccessMessage("Demo data removed. Your workspace is clean.")
      await loadStatus()
    } catch {
      setErrorMessage("Network error. Please try again.")
    } finally {
      setPageState("idle")
    }
  }

  const demoLoaded = status?.demoDataLoaded ?? false
  const isWorking = pageState === "seeding" || pageState === "resetting"

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
              style={{ backgroundColor: "#D97706" + "15" }}
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
                  ? "Demo data is active in this workspace"
                  : "No demo data loaded"}
              </p>
            </div>
          </div>

          {pageState !== "loading" && (
            <span
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                demoLoaded
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {demoLoaded ? "Demo Active" : "Not loaded"}
            </span>
          )}
        </div>
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
          The demo dataset includes realistic UK property management data — 3 properties (HMO and
          flat), tenancies, contacts, jobs, invoices, planning sets and compliance certificates.
          All records are labelled <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">is_demo: true</code> and
          can be removed at any time.
        </p>

        {/* What's included */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Properties", count: "3" },
            { label: "Units", count: "9" },
            { label: "Tenancies", count: "5" },
            { label: "Tasks", count: "20" },
            { label: "Jobs", count: "8" },
            { label: "Invoices", count: "8" },
            { label: "Contacts", count: "14" },
            { label: "Certificates", count: "2" },
          ].map(({ label, count }) => (
            <div
              key={label}
              className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5 text-center"
            >
              <p className="text-[18px] font-bold text-slate-900">{count}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

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
              This will permanently delete all demo records from your workspace. Type{" "}
              <strong>REMOVE</strong> to confirm.
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
