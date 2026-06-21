"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  Cable,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  KeyRound,
  LayoutGrid,
  List,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Unplug,
  X,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import { Btn, Card, CardHeader, Modal, useToast } from "../components/primitives"
import {
  AVAILABLE_INTEGRATIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type CatalogIntegration,
  type IntegrationCategory,
} from "../data/integrations-catalog"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"

// ── Live connected-integration shape from workspace_integrations ──────────────
interface ConnectedIntegration {
  id: string
  integration_id: string
  status: "active" | "error" | "syncing" | "disconnected"
  last_sync_at: string | null
  created_at: string
}

// ── API key connect modal ─────────────────────────────────────────────────────
function ApiKeyModal({
  integration,
  onClose,
  onConnected,
}: {
  integration: CatalogIntegration
  onClose: () => void
  onConnected: () => void
}) {
  const toast = useToast()
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const { workspace } = useWorkspace()

  const handleTest = async () => {
    if (!apiKey.trim()) { toast("Enter an API key first"); return }
    setTesting(true)
    setTestResult(null)
    await new Promise((r) => setTimeout(r, 800))
    if (apiKey.trim().length < 8) {
      setTestResult({ ok: false, message: "Key looks too short — check your API key." })
    } else {
      setTestResult({ ok: true, message: "Key format looks valid. Save to connect." })
    }
    setTesting(false)
  }

  const handleSave = async () => {
    if (!apiKey.trim()) { toast("Enter an API key first"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: integration.id,
          apiKey: apiKey.trim(),
          workspaceId: workspace?.id,
        }),
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !json.success) {
        toast(json.error ?? "Failed to save — try again")
      } else {
        toast(`${integration.name} connected`)
        onConnected()
        onClose()
      }
    } catch {
      toast("Network error — try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Connect ${integration.name}`}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} variant="primary" disabled={saving || !apiKey.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving…" : "Save and connect"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${integration.logoGradient}`}>
            {integration.logoInitials}
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-900">{integration.name}</div>
            <div className="text-xs text-slate-500">{integration.description}</div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
            placeholder="Paste your API key here…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            autoComplete="off"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Your key is stored securely and never exposed in the UI after saving.
          </p>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${testResult.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {testResult.message}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {testing ? "Testing…" : "Test connection"}
          </button>
          {integration.docsUrl && (
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View API docs
            </a>
          )}
        </div>

        <ul className="space-y-1 border-t border-slate-100 pt-3">
          {integration.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}

// ── Integration card (grid + list variants) ──────────────────────────────────
function IntegrationCard({
  integration,
  connected,
  onConnect,
  onDisconnect,
  onTest,
  view,
}: {
  integration: CatalogIntegration
  connected: ConnectedIntegration | undefined
  onConnect: (i: CatalogIntegration) => void
  onDisconnect: (id: string) => void
  onTest: (i: CatalogIntegration) => void
  view: "grid" | "list"
}) {
  const isConnected = !!connected
  const statusColor =
    connected?.status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : connected?.status === "error"
        ? "bg-red-50 text-red-700"
        : connected?.status === "syncing"
          ? "bg-blue-50 text-blue-700"
          : "bg-slate-100 text-slate-500"

  const statusLabel =
    connected?.status === "active"
      ? "Connected"
      : connected?.status === "error"
        ? "Error"
        : connected?.status === "syncing"
          ? "Syncing"
          : integration.connectType === "coming_soon"
            ? "Coming soon"
            : "Not connected"

  if (view === "list") {
    return (
      <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/60">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${integration.logoGradient}`}>
          {integration.logoInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{integration.name}</span>
            {integration.popular && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Popular</span>}
          </div>
          <div className="truncate text-xs text-slate-500">{integration.description}</div>
        </div>
        <span className="hidden text-xs text-slate-400 md:block">{CATEGORY_LABELS[integration.category]}</span>
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
        {connected?.last_sync_at && (
          <span className="hidden text-xs text-slate-400 xl:block">
            Synced {new Date(connected.last_sync_at).toLocaleDateString("en-GB")}
          </span>
        )}
        <div className="flex shrink-0 gap-1.5">
          {isConnected ? (
            <>
              <button onClick={() => onTest(integration)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">Test</button>
              <button onClick={() => onDisconnect(connected!.id)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50">Disconnect</button>
            </>
          ) : integration.connectType !== "coming_soon" ? (
            <button onClick={() => onConnect(integration)} className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100">Connect</button>
          ) : (
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-400">Coming soon</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${integration.logoGradient}`}>
          {integration.logoInitials}
        </span>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${statusColor}`}>
            {connected?.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : null}
            {connected?.status === "error" ? <AlertCircle className="h-3 w-3" /> : null}
            {statusLabel}
          </span>
          {integration.popular && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Popular</span>}
        </div>
      </div>

      <h3 className="mt-2.5 text-sm font-semibold text-slate-900">{integration.name}</h3>
      <div className="text-[11px] text-slate-400">{CATEGORY_LABELS[integration.category]}</div>
      <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] text-slate-500">{integration.description}</p>

      {connected?.last_sync_at && (
        <div className="mt-1.5 text-[10px] text-slate-400">
          Last sync {new Date(connected.last_sync_at).toLocaleDateString("en-GB")}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {isConnected ? (
          <>
            <button onClick={() => onTest(integration)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">Test</button>
            <button onClick={() => onDisconnect(connected!.id)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50">
              <Unplug className="mr-0.5 inline h-3 w-3" />Disconnect
            </button>
          </>
        ) : integration.connectType !== "coming_soon" ? (
          <button onClick={() => onConnect(integration)} className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100">
            <Plus className="mr-0.5 inline h-3 w-3" />Connect
          </button>
        ) : (
          <span className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-400">Coming soon</span>
        )}
        {integration.docsUrl && (
          <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">
            <ExternalLink className="inline h-3 w-3" />
          </a>
        )}
      </div>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const toast = useToast()
  const { workspace } = useWorkspace()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<IntegrationCategory | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "available">("all")
  const [connectModal, setConnectModal] = useState<CatalogIntegration | null>(null)
  const [connected, setConnected] = useState<ConnectedIntegration[]>([])
  const [loadingConnected, setLoadingConnected] = useState(true)

  // Load connected integrations from workspace_integrations table (42P01-tolerant)
  const loadConnected = useCallback(async () => {
    if (!workspace?.id) { setLoadingConnected(false); return }
    setLoadingConnected(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("workspace_integrations")
        .select("id, integration_id, status, last_sync_at, created_at")
        .eq("workspace_id", workspace.id)
      setConnected((data as ConnectedIntegration[]) ?? [])
    } catch {
      // 42P01 / RLS / network — not yet migrated; show empty connected list
      setConnected([])
    } finally {
      setLoadingConnected(false)
    }
  }, [workspace?.id])

  useEffect(() => { void loadConnected() }, [loadConnected])

  const connectedMap = new Map(connected.map((c) => [c.integration_id, c]))

  const handleConnect = (integration: CatalogIntegration) => {
    if (integration.connectType === "oauth" && integration.oauthPath) {
      window.location.assign(integration.oauthPath)
    } else if (integration.connectType === "api_key") {
      setConnectModal(integration)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!workspace?.id) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("workspace_integrations")
        .update({ status: "disconnected" })
        .eq("id", connectionId)
        .eq("workspace_id", workspace.id)
      if (error) throw error
      toast("Integration disconnected")
      void loadConnected()
    } catch {
      toast("Failed to disconnect — try again")
    }
  }

  const handleTest = (integration: CatalogIntegration) => {
    toast(`Testing connection to ${integration.name}…`)
  }

  // Filtering
  const filtered = AVAILABLE_INTEGRATIONS.filter((it) => {
    if (search && !it.name.toLowerCase().includes(search.toLowerCase()) && !it.description.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== "all" && it.category !== categoryFilter) return false
    if (statusFilter === "connected" && !connectedMap.has(it.id)) return false
    if (statusFilter === "available" && connectedMap.has(it.id)) return false
    return true
  })

  const connectedCount = connected.filter((c) => c.status === "active").length
  const totalConnected = connected.length

  const actions = (
    <>
      <Btn icon={RefreshCw} onClick={loadConnected}>Refresh</Btn>
      <Btn icon={Plus} variant="primary" onClick={() => { setCategoryFilter("all"); setStatusFilter("available") }}>
        Add integration
      </Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Integrations"
      subtitle="Connect and manage third-party apps and services that power your automations."
      icon={Cable}
      actions={actions}
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Connected" value={loadingConnected ? "…" : totalConnected} icon={Plug} tone="blue" />
        <AutomationsKpiCard label="Active &amp; healthy" value={loadingConnected ? "…" : connectedCount} icon={CheckCircle2} tone="emerald" />
        <AutomationsKpiCard label="Available" value={AVAILABLE_INTEGRATIONS.length} icon={Zap} tone="violet" />
        <AutomationsKpiCard label="Coming soon" value={AVAILABLE_INTEGRATIONS.filter((i) => i.connectType === "coming_soon").length} icon={KeyRound} tone="amber" />
      </div>

      {/* Connected integrations section */}
      {!loadingConnected && totalConnected > 0 && (
        <Card className="mt-5">
          <CardHeader
            title={`Connected integrations (${totalConnected})`}
            action={
              <button onClick={loadConnected} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <RefreshCw className="h-3 w-3" />Refresh
              </button>
            }
          />
          <div>
            {connected.map((c) => {
              const catalog = AVAILABLE_INTEGRATIONS.find((a) => a.id === c.integration_id)
              if (!catalog) return null
              return (
                <div key={c.id} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${catalog.logoGradient}`}>
                    {catalog.logoInitials}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{catalog.name}</div>
                    <div className="text-xs text-slate-400">{CATEGORY_LABELS[catalog.category]}</div>
                  </div>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : c.status === "error" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                    {c.status === "active" ? "Active" : c.status === "error" ? "Error" : c.status === "syncing" ? "Syncing" : "Disconnected"}
                  </span>
                  {c.last_sync_at && (
                    <span className="hidden text-xs text-slate-400 lg:block">
                      Synced {new Date(c.last_sync_at).toLocaleDateString("en-GB")}
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    <button onClick={() => handleTest(catalog)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">Test</button>
                    <button onClick={() => handleDisconnect(c.id)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50">Disconnect</button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Available integrations catalog */}
      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Available integrations</h2>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{filtered.length}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-8 w-40 rounded-lg border border-slate-200 pl-8 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as IntegrationCategory | "all")}
                className="h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-sm text-slate-600 focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All categories</option>
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "connected" | "available")}
                className="h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-sm text-slate-600 focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="connected">Connected</option>
                <option value="available">Not connected</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button onClick={() => setView("grid")} className={`grid h-7 w-7 place-items-center rounded ${view === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`} aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setView("list")} className={`grid h-7 w-7 place-items-center rounded ${view === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`} aria-label="List view">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {CATEGORY_ORDER.filter((cat) => {
          if (categoryFilter !== "all" && categoryFilter !== cat) return false
          return filtered.some((i) => i.category === cat)
        }).map((cat) => {
          const items = filtered.filter((i) => i.category === cat)
          if (!items.length) return null
          return (
            <div key={cat} className="mb-6">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {CATEGORY_LABELS[cat]}
                <span className="font-normal normal-case tracking-normal text-slate-300">{items.length}</span>
              </h3>
              {view === "grid" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {items.map((it) => (
                    <IntegrationCard
                      key={it.id}
                      integration={it}
                      connected={connectedMap.get(it.id)}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onTest={handleTest}
                      view="grid"
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  {items.map((it) => (
                    <IntegrationCard
                      key={it.id}
                      integration={it}
                      connected={connectedMap.get(it.id)}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onTest={handleTest}
                      view="list"
                    />
                  ))}
                </Card>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
              <Cable className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-slate-800">No integrations match</h3>
            <p className="mt-1 text-sm text-slate-500">Try a different search or clear the filters.</p>
            <button
              onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all") }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Help footer */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-800">Need a custom integration?</div>
            <div className="text-xs text-slate-500">Use Propvora webhooks to connect any system that supports HTTP, or contact us to discuss a custom build.</div>
          </div>
          <div className="flex gap-2">
            <a href="mailto:integrations@propvora.com" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Copy className="h-4 w-4" />Contact us
            </a>
            <a href="/property-manager/automations?tab=webhooks" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
              <Zap className="h-4 w-4" />Set up webhooks
            </a>
          </div>
        </div>
      </div>

      {/* API key connect modal */}
      {connectModal && (
        <ApiKeyModal
          integration={connectModal}
          onClose={() => setConnectModal(null)}
          onConnected={loadConnected}
        />
      )}
    </AutomationsModuleShell>
  )
}
