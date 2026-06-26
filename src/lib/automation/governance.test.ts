import { describe, it, expect } from "vitest"
import {
  requiresReview,
  DEFAULT_GOVERNANCE,
  DANGEROUS_ACTION_TYPES,
  type AutomationGovernance,
} from "./governance"
import { AUTOMATIONS_TABS } from "@/features/automations/components/AutomationsTabs"

const guardOn: AutomationGovernance = { ...DEFAULT_GOVERNANCE, dangerousActionGuardrails: true }
const guardOff: AutomationGovernance = { ...DEFAULT_GOVERNANCE, dangerousActionGuardrails: false }

describe("requiresReview — dangerous-action guardrail enforcement", () => {
  it("holds a dangerous action for review when the guardrail is ON, even if the rule auto-runs", () => {
    expect(requiresReview(guardOn, "send_webhook", false)).toBe(true)
    expect(requiresReview(guardOn, "update_unit_status", false)).toBe(true)
    expect(requiresReview(guardOn, "archive_record", false)).toBe(true)
  })

  it("auto-runs a dangerous action when the guardrail is OFF and the rule auto-runs", () => {
    expect(requiresReview(guardOff, "send_webhook", false)).toBe(false)
    expect(requiresReview(guardOff, "update_unit_status", false)).toBe(false)
  })

  it("never downgrades a review-first rule (guardrail can only ADD review)", () => {
    expect(requiresReview(guardOff, "create_task", true)).toBe(true)
    expect(requiresReview(guardOn, "create_task", true)).toBe(true)
  })

  it("leaves safe/reversible actions on the auto-run path even with the guardrail ON", () => {
    for (const safe of ["create_task", "create_notification", "draft_message", "flag_record", "create_calendar_reminder", "add_note"] as const) {
      expect(requiresReview(guardOn, safe, false)).toBe(false)
    }
  })

  it("classifies exactly the record-mutating / outbound actions as dangerous", () => {
    expect([...DANGEROUS_ACTION_TYPES].sort()).toEqual(
      ["archive_record", "generate_document", "request_quote", "send_portal_message", "send_webhook", "update_unit_status"].sort(),
    )
  })
})

describe("Automations tab strip — flag gating + Admin Controls removal", () => {
  const labels = AUTOMATIONS_TABS.map((t) => t.label)

  it("no longer exposes 'Admin Controls' as a module tab (moved to Workspace Settings)", () => {
    expect(labels).not.toContain("Admin Controls")
  })

  it("renamed the landing tab Home → Overview pointing at /automations/overview", () => {
    const overview = AUTOMATIONS_TABS.find((t) => t.label === "Overview")
    expect(labels).not.toContain("Home")
    expect(overview?.href).toBe("/property-manager/automations/overview")
    // still matches the legacy /home path so old deep links highlight correctly
    expect(overview?.match).toContain("/automations/home")
  })

  it("hides exactly the flag-gated tabs when hiddenTabs is applied (flags OFF path)", () => {
    // Webhooks is a sub-tab of Integrations now, so gating Integrations hides both.
    const hidden = ["Canvas Builder", "Integrations"]
    const visible = AUTOMATIONS_TABS.filter((t) => !hidden.includes(t.label)).map((t) => t.label)
    for (const h of hidden) expect(visible).not.toContain(h)
    // Webhooks is not a standalone main tab
    expect(AUTOMATIONS_TABS.map((t) => t.label)).not.toContain("Webhooks")
    // core always-on tabs survive
    for (const keep of ["Overview", "Recipes", "My Automations", "Runs & Logs", "Approvals", "Errors", "AI Builder", "Usage & Limits"]) {
      expect(visible).toContain(keep)
    }
  })
})
