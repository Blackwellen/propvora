import type { WorkspacePlan } from "@/types/database"

/**
 * Re-export WorkspacePlan as Plan for convenience.
 * Maps to the database enum: 'trial' | 'basic' | 'pro' | 'business' | 'enterprise'
 */
export type Plan = WorkspacePlan

export const PLAN_LIMITS = {
  trial:      { properties: 3,        users: 1,        aiCopilot: false, advancedReports: false },
  basic:      { properties: 10,       users: 3,        aiCopilot: false, advancedReports: true  },
  pro:        { properties: 50,       users: 10,       aiCopilot: true,  advancedReports: true  },
  business:   { properties: 200,      users: 25,       aiCopilot: true,  advancedReports: true  },
  enterprise: { properties: Infinity, users: Infinity, aiCopilot: true,  advancedReports: true  },
} as const

export type PlanFeature = keyof typeof PLAN_LIMITS.trial

/**
 * Returns true if the given plan has access to the specified feature.
 * Boolean features return the flag value; numeric limits return true
 * when the plan allows more than zero (i.e. always for numeric limits).
 */
export function canAccess(plan: Plan, feature: PlanFeature): boolean {
  const limits = PLAN_LIMITS[plan]
  if (!limits) return false
  const value = limits[feature]
  if (typeof value === "boolean") return value
  return (value as number) > 0
}

/**
 * Returns the numeric limit for a given plan/feature combo.
 * Returns 0 if the plan is unknown.
 */
export function getLimit(plan: Plan, feature: PlanFeature): number {
  const limits = PLAN_LIMITS[plan]
  if (!limits) return 0
  const value = limits[feature]
  return typeof value === "number" ? value : value ? 1 : 0
}
