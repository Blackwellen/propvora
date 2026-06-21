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

const INTEGRATION_CATALOGUE: IntegrationDef[] = [
  { provider: "zapier", name: "Zapier", category: "Automation", description: "Connect Propvora to 5,000+ apps with no-code workflows." },
  { provider: "make", name: "Make (Integromat)", category: "Automation", description: "Build multi-step automations visually with Make." },
  { provider: "slack", name: "Slack", category: "Communication", description: "Send Propvora alerts and notifications directly to Slack channels." },
  { provider: "teams", name: "Microsoft Teams", category: "Communication", description: "Post automation updates to Teams channels." },
  { provider: "google_sheets", name: "Google Sheets", category: "Data", description: "Sync portfolio data and run logs to Google Sheets." },
  { provider: "quickbooks", name: "QuickBooks", category: "Accounting", description: "Push rent and supplier invoices to QuickBooks Online." },
  { provider: "xero", name: "Xero", category: "Accounting", description: "Sync transactions and invoices with Xero." },
  { provider: "stripe", name: "Stripe", category: "Payments", description: "Process rent collections and supplier payouts via Stripe Connect." },
  { provider: "hmrc_mtd", name: "HMRC MTD", category: "Tax", description: "File VAT returns and SA income data via Making Tax Digital." },
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
  const [apiKey, setApiKey] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConnected = existingConnection?.status === "connected"

  async function handleSave() {
    if (!apiKey && !webhookUrl) {
      setError("Enter an API key or webhook URL to connect.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const config: Record<string, string> = {}
      if (apiKey) config.api_key = apiKey
      if (webhookUrl) config.webhook_url = webhookUrl

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
        hasSecret: Boolean(apiKey),
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

        <p className="text-xs text-slate-500">{integration.description}</p>

        {/* API key input */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">API Key / Token</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={isConnected ? "Enter new key to update…" : "Paste your API key here"}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          {isConnected && (
            <p className="mt-1 text-[11px] text-slate-400">
              A key is already stored. Leave blank to keep the existing key.
            </p>
          )}
        </div>

        {/* Webhook URL (for Zapier/Make) */}
        {["zapier", "make"].includes(integration.provider) && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Webhook URL (from {integration.name})</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-[11px] text-blue-700">
          <KeyRound className="h-3.5 w-3.5 shrink-0" />
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
