import React from "react"
import { Sparkles, Cpu, Boxes, Star, Coins } from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminNotConfigured,
  type AdminKpi,
} from "@/components/admin/ui"
import { getAiGatewayAdminData } from "./data"
import AiModelsClient from "./AiModelsClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "AI models — Propvora admin" }

function fmtCost(pence: number) { return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export default async function AdminAiModelsPage() {
  const data = await getAiGatewayAdminData(30)

  const activeModels = data.models.filter((m) => m.enabled).length
  const activeProviders = data.providers.filter((p) => p.enabled).length
  const defaultModel = data.models.find((m) => m.isDefault)

  const kpis: AdminKpi[] = [
    { label: "Active models", value: activeModels, icon: Cpu, tone: "blue", sub: `${data.models.length} in catalogue` },
    { label: "Providers", value: activeProviders, icon: Boxes, tone: "violet", sub: `${data.providers.length} configured` },
    { label: "Default model", value: defaultModel ? defaultModel.label : "None", icon: Star, tone: "amber" },
    { label: `Spend (${data.windowDays}d)`, value: fmtCost(data.totals.costPence), icon: Coins, tone: "emerald" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Sparkles}
        title="AI models"
        subtitle="Multi-provider gateway. Enable providers and models, set the default route, and review usage & cost by workspace. API keys come from server environment variables only — never stored here."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Platform" }, { label: "AI models" }]}
      />

      {!data.available ? (
        <AdminNotConfigured
          title="AI gateway tables not provisioned"
          description="Run the ai_gateway migration to create the provider / model catalogue. Active models, providers and cost guardrails will appear here."
        />
      ) : (
        <>
          <AdminKpiStrip kpis={kpis} cols={4} />
        <AiModelsClient
          providers={data.providers}
          models={data.models}
          usage={data.usage}
          totals={data.totals}
          windowDays={data.windowDays}
        />
        </>
      )}
    </div>
  )
}
