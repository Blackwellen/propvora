"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupplierWorkspace } from "./SupplierWorkspaceContext"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier plan + permissions — single source of truth for plan-gating the
   supplier workspace nav, tabs and detail surfaces.

   `plan_type` drives the Solo vs Team experience:
     • solo — a single-operator supplier. No team/dispatch/automations/insights.
     • team — a multi-member supplier business. Full surface.

   We resolve the plan from Supabase with a 42P01-safe fallback. The column may
   not exist yet (additive migration ships separately), so a missing
   table/column degrades to the dev default ('team') so every surface renders.
─────────────────────────────────────────────────────────────────────────── */

export type SupplierPlanType = "solo" | "team" | "enterprise"

/** Roles available in a supplier workspace (Team plan). Solo collapses to owner. */
export type SupplierRole =
  | "owner"
  | "admin"
  | "manager"
  | "dispatcher"
  | "finance"
  | "worker"
  | "read_only"

export interface SupplierPlanValue {
  planType: SupplierPlanType
  /** The signed-in member's role in this supplier workspace. */
  role: SupplierRole
  /** Total members in the workspace (drives the Team nav badge). */
  memberCount: number
  /** True while the first resolution is in flight. */
  loading: boolean
  /** team OR enterprise — everything beyond the Solo surface. */
  isTeam: boolean
  isSolo: boolean
  /** enterprise only — advanced admin/security/governance (SSO, API, audit). */
  isEnterprise: boolean
}

const DEFAULT_VALUE: SupplierPlanValue = {
  planType: "solo", // safe default — team view requires explicit DB value or >1 member
  role: "owner",
  memberCount: 1,
  loading: true,
  isTeam: false,
  isSolo: true,
  isEnterprise: false,
}

const SupplierPlanContext = createContext<SupplierPlanValue>(DEFAULT_VALUE)

export function SupplierPlanProvider({
  children,
  /** Server-resolved seed (optional). When omitted we resolve client-side. */
  seedPlanType,
  seedRole,
  seedMemberCount,
}: {
  children: React.ReactNode
  seedPlanType?: SupplierPlanType
  seedRole?: SupplierRole
  seedMemberCount?: number
}) {
  const { workspaceId } = useSupplierWorkspace()
  const [planType, setPlanType] = useState<SupplierPlanType>(seedPlanType ?? "solo")
  const [role, setRole] = useState<SupplierRole>(seedRole ?? "owner")
  const [memberCount, setMemberCount] = useState<number>(seedMemberCount ?? 1)
  const [loading, setLoading] = useState(!seedPlanType)

  useEffect(() => {
    if (seedPlanType) {
      setLoading(false)
      return
    }
    if (!workspaceId) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: auth } = await supabase.auth.getUser()
        const uid = auth?.user?.id

        // Plan type lives on the workspace row (additive `plan_type` column).
        // Default to solo — team requires explicit DB value or >1 member.
        let resolvedPlan: SupplierPlanType = "solo"
        try {
          const { data: ws } = await supabase
            .from("workspaces")
            .select("plan_type")
            .eq("id", workspaceId)
            .maybeSingle()
          const raw = (ws as { plan_type?: string } | null)?.plan_type
          if (raw === "solo" || raw === "team" || raw === "enterprise") resolvedPlan = raw
        } catch {
          /* 42P01 / missing column — keep solo default */
        }

        // Member count + this user's role from supplier_workspace_members.
        let count = 1
        let resolvedRole: SupplierRole = "owner"
        try {
          const { data: members } = await supabase
            .from("supplier_workspace_members")
            .select("user_id, role")
            .eq("workspace_id", workspaceId)
          if (Array.isArray(members) && members.length > 0) {
            count = members.length
            const mine = members.find((m) => (m as { user_id?: string }).user_id === uid)
            const r = (mine as { role?: string } | undefined)?.role
            if (
              r === "owner" || r === "admin" || r === "manager" ||
              r === "dispatcher" || r === "finance" || r === "worker" || r === "read_only"
            ) {
              resolvedRole = r
            }
          }
        } catch {
          /* tolerate */
        }

        // A workspace with >1 member is implicitly a team workspace even if the
        // plan_type column hasn't been backfilled.
        if (count > 1) resolvedPlan = "team"

        if (!cancelled) {
          setPlanType(resolvedPlan)
          setRole(resolvedRole)
          setMemberCount(count)
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId, seedPlanType])

  const value = useMemo<SupplierPlanValue>(
    () => ({
      planType,
      role,
      memberCount,
      loading,
      isTeam: planType === "team" || planType === "enterprise",
      isSolo: planType === "solo",
      isEnterprise: planType === "enterprise",
    }),
    [planType, role, memberCount, loading]
  )

  return <SupplierPlanContext.Provider value={value}>{children}</SupplierPlanContext.Provider>
}

export function useSupplierPlan(): SupplierPlanValue {
  return useContext(SupplierPlanContext)
}

/* ── Permissions ──────────────────────────────────────────────────────────── */

/**
 * Capability keys gated by role (and implicitly by plan, since Solo only ever
 * has the owner role + the Solo nav). Mirrors the access matrix in the spec:
 *   finance/payouts   → owner, admin, finance
 *   automations/account → owner, admin
 *   team / roles      → owner, admin
 *   worker            → assigned jobs + evidence only
 */
export type SupplierCapability =
  | "finance"
  | "payouts"
  | "automations"
  | "account"
  | "team_manage"
  | "roles_manage"
  | "billing"
  | "insights"
  | "dispatch"
  | "assign_worker"
  | "respond_review"
  | "resolve_dispute"

const ROLE_CAPS: Record<SupplierRole, SupplierCapability[]> = {
  owner: [
    "finance", "payouts", "automations", "account", "team_manage", "roles_manage",
    "billing", "insights", "dispatch", "assign_worker", "respond_review", "resolve_dispute",
  ],
  admin: [
    "finance", "payouts", "automations", "account", "team_manage", "roles_manage",
    "billing", "insights", "dispatch", "assign_worker", "respond_review", "resolve_dispute",
  ],
  manager: ["insights", "dispatch", "assign_worker", "respond_review", "resolve_dispute"],
  dispatcher: ["dispatch", "assign_worker"],
  finance: ["finance", "payouts", "billing"],
  worker: [],
  read_only: [],
}

export interface SupplierPermissions {
  role: SupplierRole
  can: (cap: SupplierCapability) => boolean
}

export function useSupplierPermissions(): SupplierPermissions {
  const { role } = useSupplierPlan()
  return useMemo(
    () => ({
      role,
      can: (cap: SupplierCapability) => (ROLE_CAPS[role] ?? []).includes(cap),
    }),
    [role]
  )
}
