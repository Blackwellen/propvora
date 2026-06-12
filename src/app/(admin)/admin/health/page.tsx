import React from "react"
import { RefreshCw, CheckCircle2, AlertCircle, Database, Zap, Mail, CreditCard, HardDrive, Activity } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { createAdminClient } from "@/lib/supabase/admin"

// Check which env vars are present (server-side only)
function checkEnvVars() {
  return {
    supabase:  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    resend:    !!process.env.RESEND_API_KEY,
    r2:        !!process.env.R2_ACCESS_KEY_ID || !!process.env.CLOUDFLARE_R2_ACCESS_KEY,
    stripe:    !!process.env.STRIPE_SECRET_KEY,
    openai:    !!process.env.OPENAI_API_KEY,
  }
}

async function pingSupabase(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    const admin = createAdminClient()
    const { error } = await admin.from("workspaces").select("id").limit(1)
    return { ok: !error, latencyMs: Date.now() - start }
  } catch {
    return { ok: false, latencyMs: Date.now() - start }
  }
}

function statusBadge(status: "healthy" | "not_configured" | "degraded") {
  if (status === "healthy")        return <Badge variant="success" dot size="sm">Healthy</Badge>
  if (status === "not_configured") return <Badge variant="warning" dot size="sm">Not configured</Badge>
  return <Badge variant="danger" dot size="sm">Degraded</Badge>
}

export default async function AdminHealthPage() {
  const env = checkEnvVars()
  const supabasePing = await pingSupabase()

  const services: Array<{
    name: string
    status: "healthy" | "not_configured" | "degraded"
    detail: string
    icon: React.ElementType
  }> = [
    {
      name:   "Supabase Database",
      status: supabasePing.ok ? "healthy" : "degraded",
      detail: supabasePing.ok ? `Latency: ${supabasePing.latencyMs}ms` : "Connection failed",
      icon:   Database,
    },
    {
      name:   "Supabase Auth",
      status: env.supabase ? "healthy" : "not_configured",
      detail: env.supabase ? "Env vars present" : "NEXT_PUBLIC_SUPABASE_URL or SERVICE_ROLE_KEY missing",
      icon:   Activity,
    },
    {
      name:   "Resend Email",
      status: env.resend ? "healthy" : "not_configured",
      detail: env.resend ? "RESEND_API_KEY configured" : "RESEND_API_KEY not set",
      icon:   Mail,
    },
    {
      name:   "Cloudflare R2",
      status: env.r2 ? "healthy" : "not_configured",
      detail: env.r2 ? "R2 credentials present" : "R2_ACCESS_KEY_ID not set",
      icon:   HardDrive,
    },
    {
      name:   "Stripe",
      status: env.stripe ? "healthy" : "not_configured",
      detail: env.stripe ? "STRIPE_SECRET_KEY configured" : "STRIPE_SECRET_KEY not set",
      icon:   CreditCard,
    },
    {
      name:   "OpenAI / AI",
      status: env.openai ? "healthy" : "not_configured",
      detail: env.openai ? "OPENAI_API_KEY configured" : "OPENAI_API_KEY not set",
      icon:   Zap,
    },
  ]

  const allHealthy   = services.every(s => s.status === "healthy")
  const notConfigured = services.filter(s => s.status === "not_configured").length
  const degraded      = services.filter(s => s.status === "degraded").length

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Health</h1>
          <p className="text-xs text-slate-500">Last checked: {new Date().toLocaleTimeString("en-GB")}</p>
        </div>
        <form action="">
          <Button variant="outline" size="sm" type="submit">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </form>
      </div>

      {/* Overall status banner */}
      {allHealthy ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ECFDF5] border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">All systems operational</p>
            <p className="text-xs text-emerald-600">All env vars configured and Supabase is reachable</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FFFBEB] border border-amber-200">
          <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {degraded > 0 ? `${degraded} service${degraded > 1 ? "s" : ""} degraded` : ""}{" "}
              {notConfigured > 0 ? `${notConfigured} service${notConfigured > 1 ? "s" : ""} not configured` : ""}
            </p>
            <p className="text-xs text-amber-600">Check the service list below for details</p>
          </div>
        </div>
      )}

      {/* Service status */}
      <Card>
        <CardHeader><CardTitle>Service Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((svc) => {
              const Icon = svc.icon
              return (
                <div key={svc.name} className={cn("flex items-center justify-between p-3 rounded-xl border",
                  svc.status === "healthy"        ? "border-emerald-100 bg-[#ECFDF5]/50" :
                  svc.status === "not_configured" ? "border-amber-200 bg-[#FFFBEB]" :
                  "border-red-200 bg-[#FEF2F2]")}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{svc.name}</p>
                      <p className="text-[10px] text-slate-400">{svc.detail}</p>
                    </div>
                  </div>
                  {statusBadge(svc.status)}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
