"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Check,
  Loader2,
  Info,
  ShieldCheck,
  Lock,
  Zap,
  Sliders,
  Users,
  Database,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

/* ------------------------------------------------------------------ */
/* Automation governance — relocated from the Automations module's      */
/* "Admin Controls" tab and redesigned as a first-class workspace        */
/* settings surface. Persists to workspace_settings.module_settings      */
/* .automation_governance (jsonb), which is workspace-scoped + RLS-       */
/* protected. Related enforcement (roles, audit retention) deep-links to  */
/* the existing settings surfaces rather than duplicating them.           */
/* ------------------------------------------------------------------ */

type PublishPermission = "owners_admins" | "managers_up" | "all_members"
type AuditRetention = "90" | "180" | "365" | "730" | "forever"

interface GovernanceState {
  reviewFirstDefault: boolean
  dangerousActionGuardrails: boolean
  publishPermission: PublishPermission
  environmentSeparation: boolean
  auditRetentionDays: AuditRetention
}

const DEFAULTS: GovernanceState = {
  reviewFirstDefault: true,
  dangerousActionGuardrails: true,
  publishPermission: "owners_admins",
  environmentSeparation: false,
  auditRetentionDays: "365",
}

const PUBLISH_OPTIONS: { value: PublishPermission; label: string }[] = [
  { value: "owners_admins", label: "Owners & Admins only" },
  { value: "managers_up", label: "Managers and above" },
  { value: "all_members", label: "All workspace members" },
]

const RETENTION_OPTIONS: { value: AuditRetention; label: string }[] = [
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
  { value: "730", label: "2 years" },
  { value: "forever", label: "Keep forever" },
]

function Toggle({
  on,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
  icon: typeof ShieldCheck
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-900">{label}</p>
          <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1",
          on ? "bg-[#2563EB]" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            on ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  )
}

export default function AutomationGovernancePage() {
  const [state, setState] = useState<GovernanceState>(DEFAULTS)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (active) setLoading(false); return }
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()
        const wsId = (profile?.current_workspace_id as string | undefined) ?? null
        if (!active) return
        setWorkspaceId(wsId)
        if (!wsId) { setLoading(false); return }

        const { data, error } = await supabase
          .from("workspace_settings")
          .select("module_settings")
          .eq("workspace_id", wsId)
          .maybeSingle()
        if (error) { if (active) { setNote("Settings could not be loaded — showing defaults."); setLoading(false) } ; return }
        const gov = (data?.module_settings as { automation_governance?: Partial<GovernanceState> } | null)
          ?.automation_governance
        if (gov && active) {
          setState({ ...DEFAULTS, ...gov })
        }
      } catch {
        if (active) setNote("Settings could not be loaded — showing defaults.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  async function handleSave() {
    if (!workspaceId) { setNote("No active workspace — cannot save."); return }
    setSaving(true)
    setNote(null)
    try {
      const supabase = createClient()
      // Merge into existing module_settings so we never clobber sibling modules.
      const { data: existing } = await supabase
        .from("workspace_settings")
        .select("module_settings")
        .eq("workspace_id", workspaceId)
        .maybeSingle()
      const moduleSettings = {
        ...((existing?.module_settings as Record<string, unknown> | null) ?? {}),
        automation_governance: state,
      }
      // Omit NOT-NULL jsonb columns we aren't setting; never send explicit null.
      const { error } = await supabase
        .from("workspace_settings")
        .upsert(
          { workspace_id: workspaceId, module_settings: moduleSettings, updated_at: new Date().toISOString() },
          { onConflict: "workspace_id" },
        )
      if (error) { setNote("Saving is not available yet for this workspace."); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setNote("Saving failed — please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Automation Governance</h1>
        <p className="mt-0.5 text-[13px] text-slate-500">
          Workspace-wide guardrails for who can publish automations and how high-risk actions are handled.
        </p>
      </div>

      {note && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {note}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 pb-28">
          {/* Policy toggles */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Safety policy</h2>
            <Toggle
              icon={ShieldCheck}
              label="Review-first by default"
              description="New automations require human approval before any external action runs."
              on={state.reviewFirstDefault}
              onChange={(v) => { setState((s) => ({ ...s, reviewFirstDefault: v })); setSaved(false) }}
            />
            <Toggle
              icon={Zap}
              label="Dangerous-action guardrails"
              description="Hold irreversible actions (deletes, payments, notices) for explicit approval regardless of automation settings."
              on={state.dangerousActionGuardrails}
              onChange={(v) => { setState((s) => ({ ...s, dangerousActionGuardrails: v })); setSaved(false) }}
            />
            <Toggle
              icon={Sliders}
              label="Separate test & production runs"
              description="Keep dry-run executions isolated from live actions so testing never touches real records."
              on={state.environmentSeparation}
              onChange={(v) => { setState((s) => ({ ...s, environmentSeparation: v })); setSaved(false) }}
            />
          </section>

          {/* Publish permission */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Permissions</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Lock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900">Who can publish automations</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    Controls which roles can move a draft automation live. Enforced together with role permissions.
                  </p>
                  <select
                    value={state.publishPermission}
                    onChange={(e) => { setState((s) => ({ ...s, publishPermission: e.target.value as PublishPermission })); setSaved(false) }}
                    className="mt-3 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  >
                    {PUBLISH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Database className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900">Audit log retention</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    How long automation run logs and approval decisions are retained.
                  </p>
                  <select
                    value={state.auditRetentionDays}
                    onChange={(e) => { setState((s) => ({ ...s, auditRetentionDays: e.target.value as AuditRetention })); setSaved(false) }}
                    className="mt-3 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  >
                    {RETENTION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Related controls — deep-link to existing enforcement surfaces */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Related controls</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/property-manager/workspace-settings/roles"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-slate-900">Roles &amp; Permissions</span>
                    <span className="block text-[12px] text-slate-500">Define what each role can do</span>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600" />
              </Link>
              <Link
                href="/property-manager/workspace-settings/audit"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                    <Database className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-slate-900">Audit Logs</span>
                    <span className="block text-[12px] text-slate-500">Review every action taken</span>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600" />
              </Link>
            </div>
          </section>
        </div>
      )}

      {/* Save bar */}
      {!loading && (
        <div className="app-save-bar fixed left-0 right-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-8 sm:py-4">
          <p className="min-w-0 truncate text-[13px] text-slate-500">
            {saved ? "Changes saved" : "Governance applies to every automation in this workspace"}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  )
}
