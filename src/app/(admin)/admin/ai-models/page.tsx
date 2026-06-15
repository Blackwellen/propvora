import React from "react"
import { Sparkles } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { getAiGatewayAdminData } from "./data"
import AiModelsClient from "./AiModelsClient"

export const dynamic = "force-dynamic"

export default async function AdminAiModelsPage() {
  const data = await getAiGatewayAdminData(30)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Model Controls</h1>
        <p className="text-xs text-slate-500">
          Multi-provider gateway. Enable providers and models, set the default, and review usage &amp; cost by
          workspace. API keys come from server environment variables only — never stored here.
        </p>
      </div>

      {!data.available ? (
        <Card className="py-12 text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">AI gateway tables not provisioned</p>
          <p className="text-xs text-slate-400 mt-1">
            Run migration <code className="font-mono">20260615010000_ai_gateway.sql</code> to create the
            provider/model catalogue.
          </p>
        </Card>
      ) : (
        <AiModelsClient
          providers={data.providers}
          models={data.models}
          usage={data.usage}
          totals={data.totals}
          windowDays={data.windowDays}
        />
      )}
    </div>
  )
}
