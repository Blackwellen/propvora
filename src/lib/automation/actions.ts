"use server"

// Smart Rules — server actions for the UI.
// All actions resolve the authenticated user + their active workspace and use
// the cookie-scoped (RLS-enforced) client. No service-role here.

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { recordAudit } from "@/lib/audit/log"
import { approveRun, evaluateWorkspace, skipRun } from "./engine"
import { RULE_TEMPLATES } from "./templates"
import type { ActionType, TriggerType } from "./types"

interface Ctx {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  workspaceId: string
}

async function resolveContext(): Promise<Ctx> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated.")

  const { data: profile } = await supabase
    .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
  let workspaceId = profile?.current_workspace_id as string | undefined

  if (!workspaceId) {
    const { data: m } = await supabase
      .from("workspace_members").select("workspace_id").eq("user_id", user.id)
      .order("created_at", { ascending: true }).limit(1).maybeSingle()
    workspaceId = m?.workspace_id as string | undefined
  }
  if (!workspaceId) throw new Error("No active workspace.")
  return { supabase, userId: user.id, workspaceId }
}

const REVALIDATE = "/app/automations"

export interface RuleInput {
  name: string
  description?: string
  trigger_type: TriggerType
  trigger_config?: Record<string, unknown>
  condition_config?: Record<string, unknown>
  action_type: ActionType
  action_config?: Record<string, unknown>
  review_required?: boolean
  enabled?: boolean
}

export async function createRule(input: RuleInput): Promise<{ id: string }> {
  const { supabase, userId, workspaceId } = await resolveContext()
  const { data, error } = await supabase
    .from("smart_rules")
    .insert({
      workspace_id: workspaceId,
      name: input.name.trim() || "Untitled rule",
      description: input.description?.trim() || null,
      trigger_type: input.trigger_type,
      trigger_config: input.trigger_config ?? {},
      condition_config: input.condition_config ?? {},
      action_type: input.action_type,
      action_config: input.action_config ?? {},
      review_required: input.review_required ?? true,
      enabled: input.enabled ?? true,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Failed to create rule")
  await recordAudit(supabase, {
    workspaceId, userId, action: "automation.rule_created",
    resourceType: "smart_rule", resourceId: data.id,
    metadata: { trigger_type: input.trigger_type, action_type: input.action_type, review_required: input.review_required ?? true },
  })
  revalidatePath(REVALIDATE)
  return { id: data.id }
}

export async function updateRule(id: string, input: Partial<RuleInput>): Promise<void> {
  const { supabase, userId, workspaceId } = await resolveContext()
  const patch: Record<string, unknown> = { updated_by: userId, updated_at: new Date().toISOString() }
  for (const k of ["name", "description", "trigger_type", "trigger_config", "condition_config", "action_type", "action_config", "review_required", "enabled"] as const) {
    if (input[k] !== undefined) patch[k] = input[k]
  }
  const { error } = await supabase.from("smart_rules").update(patch).eq("id", id).eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
  await recordAudit(supabase, { workspaceId, userId, action: "automation.rule_updated", resourceType: "smart_rule", resourceId: id })
  revalidatePath(REVALIDATE)
}

export async function setRuleEnabled(id: string, enabled: boolean): Promise<void> {
  const { supabase, userId, workspaceId } = await resolveContext()
  const { error } = await supabase
    .from("smart_rules").update({ enabled, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", id).eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
  await recordAudit(supabase, { workspaceId, userId, action: enabled ? "automation.rule_enabled" : "automation.rule_disabled", resourceType: "smart_rule", resourceId: id })
  revalidatePath(REVALIDATE)
}

export async function deleteRule(id: string): Promise<void> {
  const { supabase, userId, workspaceId } = await resolveContext()
  const { error } = await supabase.from("smart_rules").delete().eq("id", id).eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
  await recordAudit(supabase, { workspaceId, userId, action: "automation.rule_deleted", resourceType: "smart_rule", resourceId: id })
  revalidatePath(REVALIDATE)
}

export async function installTemplate(templateId: string): Promise<{ id: string }> {
  const tpl = RULE_TEMPLATES.find((t) => t.template_id === templateId)
  if (!tpl) throw new Error("Unknown template")
  const { supabase, userId, workspaceId } = await resolveContext()
  const { data, error } = await supabase
    .from("smart_rules")
    .insert({
      workspace_id: workspaceId,
      name: tpl.name,
      description: tpl.description,
      trigger_type: tpl.trigger_type,
      trigger_config: tpl.trigger_config,
      condition_config: tpl.condition_config,
      action_type: tpl.action_type,
      action_config: tpl.action_config,
      review_required: tpl.review_required,
      enabled: true,
      template_id: tpl.template_id,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Failed to install template")
  await recordAudit(supabase, { workspaceId, userId, action: "automation.template_installed", resourceType: "smart_rule", resourceId: data.id, metadata: { template_id: templateId } })
  revalidatePath(REVALIDATE)
  return { id: data.id }
}

export async function runEvaluation(ruleId?: string) {
  const { supabase, userId, workspaceId } = await resolveContext()
  const summary = await evaluateWorkspace(supabase, workspaceId, userId, ruleId ? { ruleId } : {})
  revalidatePath(REVALIDATE)
  return summary
}

export async function approveRunAction(runId: string) {
  const { supabase, userId, workspaceId } = await resolveContext()
  const res = await approveRun(supabase, workspaceId, userId, runId)
  revalidatePath(REVALIDATE)
  return res
}

export async function skipRunAction(runId: string) {
  const { supabase, userId, workspaceId } = await resolveContext()
  const res = await skipRun(supabase, workspaceId, userId, runId)
  revalidatePath(REVALIDATE)
  return res
}
