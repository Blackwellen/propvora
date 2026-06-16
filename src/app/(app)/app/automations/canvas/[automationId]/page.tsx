import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { gateAutomation, gateCanvasLite } from "@/lib/billing/gates"
import { UpgradePrompt } from "@/components/automations-builder/shared"
import OpsHeader from "@/components/automations-ops/OpsHeader"
import { LayoutTemplate } from "lucide-react"
import { getDefinition } from "@/lib/automation/definitions"
import { getActiveVersion, listVersions } from "@/lib/automation/canvas-model"
import CanvasShell from "@/components/automations-engine/flow/CanvasShell"

export const metadata = {
  title: "Automation canvas - Propvora",
  description: "Build an automation as a visual node graph with validation, approvals, and dry-run.",
}
export const dynamic = "force-dynamic"

export default async function AutomationCanvasIdPage({ params }: { params: Promise<{ automationId: string }> }) {
  const { automationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
  const workspaceId = (profile?.current_workspace_id as string | undefined) ?? null
  if (!workspaceId) redirect("/property-manager/automations")

  // SERVER gates: base automation + Canvas Lite entitlement.
  const baseGate = await gateAutomation(supabase, workspaceId)
  if (!baseGate.allowed) return <UpgradePrompt title="Automations aren't on your plan" reason={baseGate.reason} />
  const canvasGate = await gateCanvasLite(supabase, workspaceId)
  if (!canvasGate.allowed) return <UpgradePrompt title="Canvas Builder isn't on your plan" reason={canvasGate.reason ?? "The visual node builder is available on Scale and above."} />

  const def = await getDefinition(supabase, workspaceId, automationId)
  if (!def) redirect("/property-manager/automations/my-automations")

  // Workspace owners/admins may edit raw node JSON in the inspector.
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  const canEditJson = ["owner", "admin"].includes(String((member as { role?: string } | null)?.role ?? ""))

  const [active, versions] = await Promise.all([
    getActiveVersion(supabase, workspaceId, automationId),
    listVersions(supabase, workspaceId, automationId),
  ])

  const initialGraph = {
    nodes: (active?.graph.nodes ?? []).map((n) => ({
      node_key: n.node_key, node_type: n.node_type, label: n.label ?? n.node_type,
      category: n.category, risk: String(n.risk), config: n.config, pos_x: n.pos_x, pos_y: n.pos_y,
    })),
    edges: (active?.graph.edges ?? []).map((e) => ({ source_key: e.source_key, target_key: e.target_key, branch_label: e.branch_label })),
  }

  return (
    <div className="space-y-5">
      <OpsHeader
        icon={LayoutTemplate}
        title={`Canvas — ${def.name}`}
        subtitle={`Visual node builder · ${versions.length} version(s)${active ? ` · v${active.version} active` : " · no active version"}`}
        backHref="/property-manager/automations/my-automations"
        backLabel="My automations"
      />
      <CanvasShell
        workspaceId={workspaceId}
        definitionId={automationId}
        definitionName={def.name}
        initialGraph={initialGraph}
        canEditJson={canEditJson}
      />
    </div>
  )
}
