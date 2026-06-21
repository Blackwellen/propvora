"use client"

import React, { useState, useTransition } from "react"
import { Save, AlertTriangle, Info, Wrench } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { setFeatureFlag, savePlatformSetting } from "../actions"
import { saveMaintenanceMode } from "@/lib/admin/mutations"
import AiModelsManager from "@/components/admin-settings/AiModelsManager"
import type { PlatformFlag } from "@/lib/admin/data"
import type { ProviderRow, ModelRow } from "@/app/(admin)/admin/ai-models/data"

interface Props {
  flagsAvailable: boolean
  flags: PlatformFlag[]
  settingsAvailable: boolean
  general: { platform_name?: string; support_email?: string; trial_length_days?: number }
  maintenance: { enabled?: boolean; message?: string; allow_admins?: boolean }
  ai: { available: boolean; providers: ProviderRow[]; models: ModelRow[] }
}

function Toast({ kind, msg }: { kind: "ok" | "err"; msg: string }) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-[11px] ${kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      {kind === "err" && <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
      <span>{msg}</span>
    </div>
  )
}

export default function SettingsClient({ flagsAvailable, flags, settingsAvailable, general, maintenance, ai }: Props) {
  const [tab, setTab] = useState("platform")
  const [, startTransition] = useTransition()

  // Maintenance mode
  const [maintEnabled, setMaintEnabled] = useState(!!maintenance.enabled)
  const [maintMsg, setMaintMsg] = useState(maintenance.message ?? "")
  const [maintAllowAdmins, setMaintAllowAdmins] = useState(maintenance.allow_admins ?? true)
  const [savingMaint, setSavingMaint] = useState(false)
  const [maintResult, setMaintResult] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  async function saveMaint() {
    setSavingMaint(true); setMaintResult(null)
    const res = await saveMaintenanceMode({ enabled: maintEnabled, message: maintMsg, allowAdmins: maintAllowAdmins })
    setSavingMaint(false)
    setMaintResult(res.ok ? { kind: "ok", msg: "Maintenance settings saved." } : { kind: "err", msg: res.error ?? "Failed to save" })
  }

  // Flags
  const [flagState, setFlagState] = useState(flags)
  const [flagMsg, setFlagMsg] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  async function toggle(key: string, next: boolean) {
    setFlagMsg(null)
    setFlagState((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: next } : f)))
    const res = await setFeatureFlag(key, next)
    if (!res.ok) {
      setFlagState((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !next } : f)))
      setFlagMsg({ kind: "err", msg: res.error ?? "Failed to save flag" })
    } else {
      setFlagMsg({ kind: "ok", msg: `Saved "${key}".` })
      startTransition(() => {})
    }
  }

  // General settings
  const [name, setName] = useState(general.platform_name ?? "Propvora")
  const [supportEmail, setSupportEmail] = useState(general.support_email ?? "")
  const [trialDays, setTrialDays] = useState(String(general.trial_length_days ?? 7))
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [generalMsg, setGeneralMsg] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  async function saveGeneral() {
    setSavingGeneral(true)
    setGeneralMsg(null)
    const res = await savePlatformSetting("general", {
      platform_name: name,
      support_email: supportEmail,
      trial_length_days: Number(trialDays) || 7,
    })
    setSavingGeneral(false)
    setGeneralMsg(res.ok ? { kind: "ok", msg: "Platform settings saved." } : { kind: "err", msg: res.error ?? "Failed to save" })
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList variant="underline">
        <TabsTrigger value="platform">Platform</TabsTrigger>
        <TabsTrigger value="flags">Feature Flags</TabsTrigger>
        <TabsTrigger value="ai">AI Models</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>

      {/* Platform settings */}
      <TabsContent value="platform">
        <Card className="max-w-xl">
          <CardHeader><CardTitle>Platform Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!settingsAvailable && (
              <Toast kind="err" msg="platform_settings table not provisioned — apply migration 20260612000004 to persist these values." />
            )}
            <Input label="Platform Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Support Email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            <Input label="Trial Length (days)" type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
            {generalMsg && <Toast kind={generalMsg.kind} msg={generalMsg.msg} />}
            <Button variant="primary" size="sm" onClick={saveGeneral} loading={savingGeneral} disabled={!settingsAvailable}>
              <Save className="w-4 h-4" /> Save Platform Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Feature flags */}
      <TabsContent value="flags">
        <Card className="max-w-xl">
          <CardHeader><CardTitle>Feature Flags</CardTitle></CardHeader>
          <CardContent>
            {!flagsAvailable ? (
              <Toast kind="err" msg="platform_feature_flags table not provisioned — apply migration 20260612000004 to enable persistent flags." />
            ) : (
              <>
                {flagMsg && <div className="mb-3"><Toast kind={flagMsg.kind} msg={flagMsg.msg} /></div>}
                <div className="space-y-3">
                  {flagState.map((flag) => (
                    <div key={flag.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 capitalize">{flag.key.replace(/_/g, " ")}</p>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{flag.key}</span>
                        </div>
                        {flag.description && <p className="text-xs text-slate-400 mt-0.5">{flag.description}</p>}
                      </div>
                      <button
                        onClick={() => toggle(flag.key, !flag.enabled)}
                        aria-pressed={flag.enabled}
                        className={`w-10 h-[22px] rounded-full transition-colors relative shrink-0 ml-4 ${flag.enabled ? "bg-[#10B981]" : "bg-slate-200"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${flag.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 mt-4 p-2.5 rounded-lg bg-[#EFF6FF] border border-blue-100">
                  <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600">Flags persist immediately on toggle and are server-readable across the app. Each change is written to the audit log.</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* AI Models — full provider/model catalogue management */}
      <TabsContent value="ai">
        <AiModelsManager available={ai.available} providers={ai.providers} models={ai.models} />
      </TabsContent>

      {/* Maintenance mode */}
      <TabsContent value="maintenance">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-500" /> Maintenance Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!settingsAvailable && (
              <Toast kind="err" msg="platform_settings table not provisioned — maintenance settings cannot persist." />
            )}
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-800">Enable maintenance mode</p>
                <p className="text-xs text-slate-400">Displays a maintenance notice to users platform-wide.</p>
              </div>
              <button
                onClick={() => setMaintEnabled((v) => !v)}
                aria-pressed={maintEnabled}
                className={`w-10 h-[22px] rounded-full transition-colors relative shrink-0 ml-4 ${maintEnabled ? "bg-amber-500" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${maintEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Notice message</label>
              <textarea
                value={maintMsg}
                onChange={(e) => setMaintMsg(e.target.value)}
                rows={3}
                placeholder="We're performing scheduled maintenance and will be back shortly."
                className="mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={maintAllowAdmins} onChange={(e) => setMaintAllowAdmins(e.target.checked)} className="w-4 h-4 rounded accent-[#2563EB]" />
              <span className="text-sm text-slate-700">Allow platform admins to bypass maintenance mode</span>
            </label>
            {maintResult && <Toast kind={maintResult.kind} msg={maintResult.msg} />}
            <Button variant="primary" size="sm" onClick={saveMaint} loading={savingMaint} disabled={!settingsAvailable}>
              <Save className="w-4 h-4" /> Save Maintenance Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Integrations — honest, reflects env presence is shown on Health */}
      <TabsContent value="integrations">
        <Card className="max-w-xl">
          <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Integration connection status (Supabase, Stripe, Resend, R2, AI) is derived from server environment
              configuration. See the <a href="/admin/health" className="text-[#2563EB] hover:underline font-medium">System Health</a> page
              for the live, env-based status of each service rather than a hard-coded list.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
