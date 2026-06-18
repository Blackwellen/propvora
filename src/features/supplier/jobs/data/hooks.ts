"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import type { JobsData, SupplierJob, JobStatus, JobTab } from "./types"
import { SEED_JOBS } from "./seed"

/* ──────────────────────────────────────────────────────────────────────────
   useSupplierJobs — supplier-workspace-scoped read of the job execution data,
   with a 42P01-safe rich-seed fallback. Returns the standard envelope:
   { data, loading, error, source, reload }.

   The read is intentionally tolerant: the supplier_job_assignments table is the
   real backbone, but the companion tables (materials / notes / messages /
   signoffs / cancellations) ship in the same migration that may not yet be
   applied in every environment. Any missing table / permission error degrades
   the WHOLE surface to the seed (never a broken tab), surfaced via `source`.

   When the assignment table exists but returns no rows we still fall back to the
   seed so the demo is populated; an explicit empty live result is reported as
   source: "empty" only when the table is present and intentionally cleared via
   the (future) live wiring. For V1 we treat 0 live rows as "seed" to guarantee a
   populated field-work demo.
─────────────────────────────────────────────────────────────────────────── */

const ACTIVE_STATUSES: JobStatus[] = ["assigned", "accepted", "in_progress"]

/** Map a raw assignment row to a (thin) SupplierJob. Companion data is absent in
 *  the thin live read; the seed provides the rich shape used by the full UI. */
function deriveTab(status: string, scheduledFor: string | null, completedAt: string | null): JobTab {
  const s = (status ?? "").toLowerCase()
  if (s === "cancelled") return "cancelled"
  if (s === "completed" || completedAt) return "completed"
  if (s === "accepted" && scheduledFor) {
    // Future appointment → scheduled; otherwise active.
    const t = new Date(scheduledFor).getTime()
    if (!Number.isNaN(t) && t > Date.now() + 60 * 60 * 1000) return "scheduled"
  }
  return "active"
}

export function useSupplierJobs(): JobsData {
  const { workspaceId, ready } = useSupplierWorkspace()
  const [data, setData] = useState<SupplierJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"live" | "seed" | "empty">("seed")
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)

      // No workspace resolved yet → seed so the surface is never blank.
      if (!workspaceId) {
        if (!cancelled) {
          setData(SEED_JOBS)
          setSource("seed")
          setLoading(false)
        }
        return
      }

      try {
        const supabase = createClient()
        const { data: rows, error: qErr } = await supabase
          .from("supplier_job_assignments")
          .select("id, status, scheduled_for, completed_at, created_at, updated_at, job_id, quote_id")
          .eq("supplier_workspace_id", workspaceId)
          .order("created_at", { ascending: false })

        if (qErr) {
          // 42P01 (table missing) / permission / anything → tolerant seed.
          if (!cancelled) {
            setData(SEED_JOBS)
            setSource("seed")
            setLoading(false)
          }
          return
        }

        const liveRows = Array.isArray(rows) ? rows : []
        if (liveRows.length === 0) {
          // Populated demo guarantee for V1.
          if (!cancelled) {
            setData(SEED_JOBS)
            setSource("seed")
            setLoading(false)
          }
          return
        }

        // Thin live mapping. Rich companion fields fall back to seed-like blanks.
        const mapped: SupplierJob[] = liveRows.map((r) => {
          const row = r as {
            id: string
            status: string
            scheduled_for: string | null
            completed_at: string | null
            created_at: string
            updated_at: string | null
          }
          const status = (ACTIVE_STATUSES.includes(row.status as JobStatus)
            ? (row.status as JobStatus)
            : (row.status as JobStatus)) ?? "assigned"
          return {
            id: row.id,
            ref: `JOB-${row.id.slice(0, 6).toUpperCase()}`,
            title: "Assigned job",
            service: "—",
            status,
            tab: deriveTab(row.status, row.scheduled_for, row.completed_at),
            customerName: "Customer",
            customerPhone: null,
            address: { line1: "—", city: "", postcode: "", lat: 51.4545, lng: -2.5879 },
            keySafeCode: null,
            accessNotes: null,
            appointmentAt: row.scheduled_for,
            appointmentEndAt: null,
            appointmentConfirmed: false,
            reminderSent: false,
            reminderScheduledAt: null,
            travelMins: null,
            travelMiles: null,
            rescheduleRisk: "low",
            routePosition: null,
            routeTotal: null,
            progressPct: status === "completed" ? 100 : status === "in_progress" ? 50 : 0,
            onTrack: true,
            startedAt: null,
            onSiteAt: null,
            slaDueAt: row.scheduled_for,
            pricePence: 0,
            platformFeePct: 10,
            vatPct: 20,
            escrowStatus: status === "completed" ? "paid" : "held",
            escrowPence: 0,
            payoutPaidAt: row.completed_at,
            evidence: [],
            evidenceFiles: [],
            materials: [],
            notes: [],
            messages: [],
            signoffStatus: "none",
            completedAt: row.completed_at,
            rating: null,
            reviewText: null,
            repeatCustomer: false,
            rebookChance: "low",
            cancellation: null,
            audit: [],
            createdAt: row.created_at,
            updatedAt: row.updated_at ?? row.created_at,
          }
        })

        if (!cancelled) {
          setData(mapped)
          setSource("live")
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setData(SEED_JOBS)
          setSource("seed")
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [workspaceId, ready, nonce])

  return { data, loading, error, source, reload }
}

/** Filter the full job set down to a single tab. */
export function jobsForTab(jobs: SupplierJob[], tab: JobTab): SupplierJob[] {
  return jobs.filter((j) => j.tab === tab)
}
