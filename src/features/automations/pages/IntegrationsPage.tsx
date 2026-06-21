"use client"

// Integrations catalogue — connects Propvora to external apps.
// Wired to /api/automations/integrations (GET + POST).
// Shows real connections from the DB with seed-catalogue fallback.

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle, Cable, CheckCircle2, ExternalLink, KeyRound,
  LayoutGrid, List, Loader2, Plus, Plug, X,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import { Btn, Card, CardHeader, Modal, useToast } from "../components/primitives"
import { useWorkspace } from "@/providers/AuthProvider"

// ── Types ─────────────────────────────────────────────────────────────────────

interface IntegrationDef {
  provider: string
  name: string
  description: string
  category: string
  connectUrl?: string
}

interface IntegrationConnection {
  id: string
  provider: string
  name: string
  status: "connected" | "disconnected" | "error" | "revoked"
  last_used_at: string | null
  created_at: string
  hasSecret: boolean
}

// ── Static catalogue (shown even before any connections exist) ─────────────────

// Config field definitions per provider — tells the modal exactly what to collect
interface ConfigField {
  key: string
  label: string
  type: "password" | "text" | "url" | "textarea"
  placeholder: string
  hint?: string
}

interface IntegrationDef {
  provider: string
  name: string
  description: string
  category: string
  howTo: string
  fields: ConfigField[]
}

const INTEGRATION_CATALOGUE: IntegrationDef[] = [
  {
    provider: "zapier",
    name: "Zapier",
    category: "Automation",
    description: "Trigger Zapier Zaps from Propvora automation rules via an incoming webhook.",
    howTo: "In Zapier: New Zap → Trigger = 'Webhooks by Zapier' (Catch Hook) → copy the webhook URL → paste below.",
    fields: [
      { key: "webhook_url", label: "Zapier Webhook URL", type: "url", placeholder: "https://hooks.zapier.com/hooks/catch/…", hint: "Found in your Zap's trigger step" },
    ],
  },
  {
    provider: "make",
    name: "Make (Integromat)",
    category: "Automation",
    description: "Send Propvora events to a Make scenario via an incoming webhook.",
    howTo: "In Make: create a scenario → add 'Webhooks → Custom Webhook' as the trigger → copy the URL → paste below.",
    fields: [
      { key: "webhook_url", label: "Make Webhook URL", type: "url", placeholder: "https://hook.eu1.make.com/…", hint: "Found in your scenario's webhook trigger module" },
    ],
  },
  {
    provider: "slack",
    name: "Slack",
    category: "Communication",
    description: "Post Propvora automation alerts to a Slack channel using an Incoming Webhook (no OAuth required).",
    howTo: "In Slack: go to api.slack.com/apps → create or open an app → Incoming Webhooks → activate → Add New Webhook to Workspace → choose a channel → copy the URL → paste below.",
    fields: [
      { key: "webhook_url", label: "Slack Incoming Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/…", hint: "From your Slack app's Incoming Webhooks page" },
    ],
  },
  {
    provider: "teams",
    name: "Microsoft Teams",
    category: "Communication",
    description: "Post Propvora notifications to a Teams channel via an Incoming Webhook connector.",
    howTo: "In Teams: open the channel → ⋯ Connectors → Incoming Webhook → configure → name it 'Propvora' → copy the URL → paste below.",
    fields: [
      { key: "webhook_url", label: "Teams Webhook URL", type: "url", placeholder: "https://…webhook.office.com/webhookb2/…", hint: "From the Teams channel connector setup" },
    ],
  },
  {
    provider: "stripe",
    name: "Stripe",
    category: "Payments",
    description: "Use your own Stripe account to process rent payments and payouts. Enter a restricted API key.",
    howTo: "In Stripe Dashboard: Developers → API keys → Create restricted key → grant only the permissions Propvora needs (Charges read/write, Customers read/write) → copy and paste below.",
    fields: [
      { key: "secret_key", label: "Stripe Secret Key", type: "password", placeholder: "sk_live_… or sk_test_…", hint: "Use a restricted key, not your full secret key" },
      { key: "publishable_key", label: "Stripe Publishable Key", type: "text", placeholder: "pk_live_… or pk_test_…", hint: "Required for client-side payment forms" },
    ],
  },
  {
    provider: "google_sheets",
    name: "Google Sheets",
    category: "Data",
    description: "Sync portfolio data to Google Sheets using a Service Account (no user login required).",
    howTo: "In Google Cloud Console: create a project → enable Sheets API → create a Service Account → download the JSON key → paste the JSON below. Then share your spreadsheet with the service account's email address.",
    fields: [
      { key: "service_account_json", label: "Service Account JSON", type: "textarea", placeholder: '{"type":"service_account","project_id":"…","private_key":"…","client_email":"…@….iam.gserviceaccount.com"}', hint: "Paste the entire JSON key file downloaded from Google Cloud Console" },
      { key: "spreadsheet_id", label: "Spreadsheet ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms", hint: "Found in your spreadsheet URL: docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit" },
    ],
  },
  {
    provider: "quickbooks",
    name: "QuickBooks",
    category: "Accounting",
    description: "Push rent and supplier invoices to QuickBooks Online. Register your own app in the QuickBooks Developer Portal.",
    howTo: "Go to developer.intuit.com → create an app → select QuickBooks Online → copy your Client ID and Client Secret from the app's Keys & OAuth section → enter them below. Also add your Company ID (Realm ID) found in your QuickBooks URL.",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", placeholder: "ABcde1234…", hint: "From developer.intuit.com → your app → Keys & OAuth" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "ABcde1234…", hint: "From the same page — treat this as a password" },
      { key: "realm_id", label: "Company ID (Realm ID)", type: "text", placeholder: "1234567890", hint: "Found in your QuickBooks URL: qbo.intuit.com/app/…?companyId=REALM_ID" },
    ],
  },
  {
    provider: "xero",
    name: "Xero",
    category: "Accounting",
    description: "Sync transactions and invoices with your Xero organisation. Register your own Xero app.",
    howTo: "Go to developer.xero.com → My Apps → New app → select 'Web app' → enter a redirect URI → copy your Client ID and Client Secret → enter them below.",
    fields: [
      { key: "client_id", label: "Xero Client ID", type: "text", placeholder: "ABCDE1234567890ABCDE…", hint: "From developer.xero.com → your app details" },
      { key: "client_secret", label: "Xero Client Secret", type: "password", placeholder: "abcdefghijklmnopqrstuvwx…", hint: "Keep this secret — generated once on app creation" },
      { key: "tenant_id", label: "Xero Tenant ID (optional)", type: "text", placeholder: "00000000-0000-0000-0000-000000000000", hint: "Your Xero organisation ID — found after completing OAuth for the first time" },
    ],
  },
  {
    provider: "hmrc_mtd",
    name: "HMRC MTD",
    category: "Tax",
    description: "Submit VAT returns and income data via HMRC Making Tax Digital using your own registered MTD application.",
    howTo: "Register at developer.service.hmrc.gov.uk → create an application → request production credentials → receive your Client ID and Client Secret by email → enter them below. Your business must be enrolled in MTD with HMRC.",
    fields: [
      { key: "client_id", label: "HMRC Client ID", type: "text", placeholder: "Provided by HMRC after app approval", hint: "From your approved HMRC developer application" },
      { key: "client_secret", label: "HMRC Client Secret", type: "password", placeholder: "Provided by HMRC after app approval", hint: "Treat this as a password — never share it" },
      { key: "vrn", label: "VAT Registration Number (VRN)", type: "text", placeholder: "123456789", hint: "Your 9-digit VAT number (without the GB prefix)" },
    ],
  },
]

// ── Connect Modal ─────────────────────────────────────────────────────────────

function ConnectModal({
  integration,
  existingConnection,
  workspaceId,
  onClose,
  onConnected,
}: {
  integration: IntegrationDef
  existingConnection: IntegrationConnection | null
  workspaceId: string
  onClose: () => void
  onConnected: (conn: IntegrationConnection) => void
}) {
  const toast = useToast()
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConnected = existingConnection?.status === "connected"

  function setField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    // Validate at least the first required field is filled
    const firstField = integration.fields[0]
    if (firstField && !fieldValues[firstField.key]?.trim()) {
      setError(`${firstField.label} is required.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Build config — only include non-empty values
      const config: Record<string, string> = {}
      for (const field of integration.fields) {
        const val = fieldValues[field.key]?.trim()
        if (val) config[field.key] = val
      }

      const res = await fetch("/api/automations/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          provider: integration.provider,
          name: integration.name,
          status: "connected",
          config,
        }),
      })
      const json = await res.json() as { ok?: boolean; id?: string; error?: string }
      if (!json.ok) throw new Error(json.error ?? "Failed to save integration.")
      toast(`${integration.name} connected`)
      onConnected({
        id: json.id ?? `local_${Date.now()}`,
        provider: integration.provider,
        name: integration.name,
        status: "connected",
        last_used_at: null,
        created_at: new Date().toISOString(),
        hasSecret: integration.fields.some((f) => f.type === "password"),
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isConnected ? `Reconfigure ${integration.name}` : `Connect ${integration.name}`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving…" : isConnected ? "Update" : "Connect"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600">
            {integration.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{integration.name}</div>
            <div className="text-[11px] text-slate-500">{integration.category}</div>
          </div>
          {isConnected && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* How-to instructions */}
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-blue-800 mb-1">How to get your credentials:</p>
          <p className="text-[11px] text-blue-700 leading-relaxed">{integration.howTo}</p>
        </div>

        {/* Dynamic fields per provider */}
        {integration.fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                value={fieldValues[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={isConnected ? "Leave blank to keep the current value" : field.placeholder}
                rows={5}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none resize-none"
              />
            ) : (
              <input
                type={field.type}
                value={fieldValues[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={isConnected ? "Leave blank to keep the current value" : field.placeholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            )}
            {field.hint && (
              <p className="mt-1 text-[10px] text-slate-400">{field.hint}</p>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
          <KeyRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          Credentials are stored encrypted and never returned in API responses.
        </div>
      </div>
    </Modal>
  )
}

// ── Integration card ──────────────────────────────────────────────────────────

function IntegrationCard({
  def,
  connection,
  view,
  onConnect,
}: {
  def: IntegrationDef
  connection: IntegrationConnection | null
  view: "grid" | "list"
  onConnect: () => void
}) {
  const isConnected = connection?.status === "connected"

  if (view === "list") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            {def.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{def.name}</div>
            <div className="text-[11px] text-slate-500">{def.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 ml-4 shrink-0">
          <span className={`text-[11px] font-semibold ${isConnected ? "text-emerald-600" : "text-slate-400"}`}>
            {isConnected ? "Connected" : "Not connected"}
          </span>
          <button
            onClick={onConnect}
            className={[
              "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
              isConnected
                ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                : "bg-blue-600 text-white hover:bg-blue-700",
            ].join(" ")}
          >
            {isConnected ? "Configure" : "Connect"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col p-3.5">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          {def.name.slice(0, 2).toUpperCase()}
        </div>
        <span className={[
          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
          isConnected
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500",
        ].join(" ")}>
          {isConnected ? <CheckCircle2 className="h-3 w-3" /> : <Plug className="h-3 w-3" />}
          {isConnected ? "Connected" : "Not connected"}
        </span>
      </div>
      <h3 className="mt-2.5 text-sm font-semibold text-slate-900">{def.name}</h3>
      <div className="text-[11px] text-slate-400">{def.category}</div>
      <p className="mt-1.5 flex-1 text-[11px] text-slate-500">{def.description}</p>
      {connection?.last_used_at && (
        <div className="mt-1.5 text-[10px] text-slate-400">
          Last used {new Date(connection.last_used_at).toLocaleDateString("en-GB")}
        </div>
      )}
      <div className="mt-3">
        <button
          onClick={onConnect}
          className={[
            "w-full rounded-lg py-1.5 text-[12px] font-semibold transition",
            isConnected
              ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
              : "bg-blue-600 text-white hover:bg-blue-700",
          ].join(" ")}
        >
          {isConnected ? "Configure" : "Connect"}
        </button>
      </div>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const toast = useToast()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id ?? ""

  const [connections, setConnections] = useState<IntegrationConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [connectTarget, setConnectTarget] = useState<IntegrationDef | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/automations/integrations?workspaceId=${workspaceId}`)
      const json = await res.json() as { ok?: boolean; connections?: IntegrationConnection[] }
      if (json.ok && json.connections) setConnections(json.connections)
    } catch {/* non-fatal */} finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { void load() }, [load])

  const filtered = INTEGRATION_CATALOGUE.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()),
  )

  const connectedCount = INTEGRATION_CATALOGUE.filter((d) =>
    connections.some((c) => c.provider === d.provider && c.status === "connected"),
  ).length

  function getConnection(provider: string): IntegrationConnection | null {
    return connections.find((c) => c.provider === provider) ?? null
  }

  const actions = (
    <>
      <Btn icon={Plus} variant="primary" onClick={() => toast("Select an integration below to connect")}>
        Add integration
      </Btn>
      <a
        href="https://docs.propvora.com/automations/integrations"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
      >
        <ExternalLink className="h-4 w-4" /> Docs
      </a>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Integrations"
      subtitle="Connect and manage third-party apps and services that power your automations."
      icon={Cable}
      actions={actions}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Available integrations" value={INTEGRATION_CATALOGUE.length} icon={Plug} tone="blue" />
        <AutomationsKpiCard label="Connected" value={connectedCount} icon={CheckCircle2} tone="emerald" />
        <AutomationsKpiCard label="Not connected" value={INTEGRATION_CATALOGUE.length - connectedCount} icon={AlertCircle} tone="amber" />
        <AutomationsKpiCard label="Categories" value={[...new Set(INTEGRATION_CATALOGUE.map((d) => d.category))].length} icon={Cable} tone="violet" />
      </div>

      {/* Filter bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search integrations…"
          className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          <button onClick={() => setView("grid")} className={`grid h-7 w-7 place-items-center rounded ${view === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView("list")} className={`grid h-7 w-7 place-items-center rounded ${view === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Integration catalogue */}
      {loading ? (
        <div className={`mt-4 grid gap-3 ${view === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className={`mt-4 grid gap-3 ${view === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
          {filtered.map((def) => (
            <IntegrationCard
              key={def.provider}
              def={def}
              connection={getConnection(def.provider)}
              view={view}
              onConnect={() => setConnectTarget(def)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-10 text-center text-sm text-slate-400">
              No integrations match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Connection health summary */}
      {connectedCount > 0 && (
        <Card className="mt-5">
          <CardHeader title="Connected integrations" />
          <div className="p-3 space-y-1.5">
            {connections.filter((c) => c.status === "connected").map((conn) => (
              <div key={conn.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{conn.name}</span>
                <div className="flex items-center gap-2">
                  {conn.last_used_at && (
                    <span className="text-xs text-slate-400">
                      Used {new Date(conn.last_used_at).toLocaleDateString("en-GB")}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Connect modal */}
      {connectTarget && (
        <ConnectModal
          integration={connectTarget}
          existingConnection={getConnection(connectTarget.provider)}
          workspaceId={workspaceId}
          onClose={() => setConnectTarget(null)}
          onConnected={(conn) => {
            setConnections((prev) => {
              const existing = prev.findIndex((c) => c.provider === conn.provider)
              if (existing >= 0) {
                const updated = [...prev]
                updated[existing] = conn
                return updated
              }
              return [conn, ...prev]
            })
            setConnectTarget(null)
          }}
        />
      )}
    </AutomationsModuleShell>
  )
}
