// Typed shapes for the Automations control-centre pages. These intentionally
// mirror the additive Supabase tables in
// supabase/migrations/<ts>_automations_section.sql so hooks can read live data
// and fall back to seed with the SAME shape.

export type RiskLevel = "low" | "medium" | "high" | "critical"
export type ImpactLevel = "low" | "medium" | "high"
export type Health = "excellent" | "good" | "fair" | "poor" | "unknown"

export interface AutomationRow {
  id: string
  ref: string
  name: string
  category: string
  trigger: string
  actionsSummary: string
  actionCount: number
  status: "live" | "review" | "paused" | "draft" | "failed"
  lastChecked: string
  owner: string
  modules: string[]
  frequency: string
  reviewFirst: boolean
  enabled: boolean
  nextRun?: string
  lastRun?: string
  health?: Health
  version?: string
}

export interface ReviewQueueItem {
  id: string
  title: string
  risk: RiskLevel
}

export interface ActivityItem {
  id: string
  kind: "run_completed" | "action_executed" | "approval_required" | "error" | "paused"
  text: string
  at: string
}

export interface Recipe {
  id: string
  name: string
  category: string
  tags: string[]
  badge?: "New" | "Popular" | "Most popular" | "High impact" | "Time saver" | "Risk reducer"
  trigger: string
  actionCount: number
  modules: string[]
  timeSaved: string
  successRate: number
  difficulty: "Easy" | "Medium" | "Hard"
  reviewFirst: boolean
  usedCount?: number
  favourite?: boolean
}

export interface RunRow {
  id: string
  ref: string
  automation: string
  triggerEvent: string
  status: "success" | "failed" | "skipped"
  startedAt: string
  duration: string
  outputs: number
  approvals: number
  initiatedBy: string
  initiatedKind: "System" | "Manual"
  steps?: RunStep[]
}

export interface RunStep {
  step: string
  status: "success" | "failed" | "skipped"
  duration: string
  startedAt: string
  details: string
}

export interface ApprovalRow {
  id: string
  ref: string
  automation: string
  proposedAction: string
  risk: RiskLevel
  relatedTo: string
  relatedRef: string
  created: string
  requestedBy: string
  impact: ImpactLevel
  deadline: string
  deadlineSoon?: boolean
  confidence?: number
  summary?: string
}

export interface ErrorRow {
  id: string
  ref: string
  title: string
  subtitle: string
  automation: string
  automationRef: string
  severity: RiskLevel
  firstSeen: string
  latestSeen: string
  impactedRecord: string
  retryCount: number
  owner: string
  status: "active" | "needs_config" | "resolved"
  safeToRetry?: boolean
  retriesRemaining?: number
}

export interface IntegrationRow {
  id: string
  name: string
  category: string
  health: "healthy" | "warning" | "error" | "disconnected"
  environment: string
  lastSync: string
  permissions: string
  capabilities: string
  executions?: number
  successRate?: number
}

export interface CredentialAlert {
  id: string
  name: string
  credential: string
  daysLeft: number
  tone: "warning" | "ok"
}

export interface WebhookEndpoint {
  id: string
  name: string
  slug: string
  url: string
  eventGroups: string[]
  eventCount: number
  secretSet: boolean
  environment: "Production" | "Staging" | "Development"
  lastDelivery: string
  successRate: number
  enabled: boolean
}

export interface WebhookDelivery {
  id: string
  event: string
  eventId: string
  endpoint: string
  environment: string
  status: "success" | "failed"
  deliveredAt: string
  response: number
  latency: string
  retries: number
}

export interface AiBuild {
  id: string
  name: string
  status: "Draft" | "Deployed"
  at: string
}

export interface UsageDriver {
  id: string
  name: string
  runs: number
  share: number
}

export interface PlanQuotaRow {
  id: string
  name: string
  plan: string
  runs: string
  runsUsedPct: number
  aiCredits: string
  webhooks: string
  storage: string
  activeAutomations: string
  concurrentRuns: string
  approvalQueue: string
  status: "Healthy" | "On track" | "Warning"
}
