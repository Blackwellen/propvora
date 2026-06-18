import React from "react"
import Link from "next/link"
import { Sparkles, Building2, ArrowDownToLine, ArrowUpFromLine, Coins, Hash } from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminSectionCard,
  AdminTable,
  AdminBarChart,
  AdminEmptyState,
  AdminNotConfigured,
  AdminBanner,
  type AdminKpi,
} from "@/components/admin/ui"
import { getAiUsageData } from "@/lib/admin/pages/batch4"

export const dynamic = "force-dynamic"
export const metadata = { title: "AI usage — Propvora admin" }

function fmtTokens(n: number) { return n.toLocaleString("en-GB") }
function fmtCost(pence: number) { return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export default async function AdminAiUsagePage() {
  const data = await getAiUsageData(500)

  const kpis: AdminKpi[] = [
    { label: "Total tokens", value: fmtTokens(data.totals.tokensIn + data.totals.tokensOut), icon: Hash, tone: "blue" },
    { label: "Input tokens", value: fmtTokens(data.totals.tokensIn), icon: ArrowDownToLine, tone: "sky" },
    { label: "Output tokens", value: fmtTokens(data.totals.tokensOut), icon: ArrowUpFromLine, tone: "violet" },
    { label: "Est. cost", value: fmtCost(data.totals.costPence), icon: Coins, tone: "emerald" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Sparkles}
        title="AI usage"
        subtitle="Token consumption, spend and per-workspace breakdown across all AI features. Read-only and metered from real usage rows."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Platform" }, { label: "AI usage" }]}
      />

      {data.notConfigured ? (
        <AdminNotConfigured
          title="AI usage tables not provisioned"
          description="Neither ai_token_usage nor ai_usage_metering is present yet. Usage is metered as workspaces use AI features."
        />
      ) : (
        <>
          {data.source === "metering" && (
            <AdminBanner tone="blue" icon={Sparkles}>Aggregated from <code className="font-mono">ai_usage_metering</code> raw rows (USD cost converted to pence).</AdminBanner>
          )}

          <AdminKpiStrip kpis={kpis} cols={4} />

          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <AdminSectionCard title="Token usage over time" icon={Sparkles}>
              {data.byDay.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-8 text-center">No daily usage recorded yet.</p>
              ) : (
                <AdminBarChart data={data.byDay} tone="blue" height={200} />
              )}
            </AdminSectionCard>

            <AdminSectionCard title="Top workspaces" icon={Building2}>
              {data.byWorkspace.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-8 text-center">No workspace usage yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.byWorkspace.map((w) => (
                    <li key={w.workspaceId} className="flex items-center justify-between gap-2">
                      <Link href={`/admin/workspaces/${w.workspaceId}`} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700 hover:text-[#2563EB] min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate">{w.workspaceName}</span>
                      </Link>
                      <span className="text-[12px] font-semibold text-[#0B1B3F] tabular-nums shrink-0">{fmtTokens(w.tokensIn + w.tokensOut)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSectionCard>
          </div>

          <AdminSectionCard title="Usage by workspace / day">
            {data.rows.length === 0 ? (
              <AdminEmptyState icon={Sparkles} title="No AI usage recorded yet" description="Usage is metered as workspaces use AI features." />
            ) : (
              <AdminTable
                head={[{ label: "Workspace" }, { label: "Day" }, { label: "Tokens in", align: "right" }, { label: "Tokens out", align: "right" }, { label: "Est. cost", align: "right" }]}
                minWidth={680}
              >
                {data.rows.slice(0, 100).map((r) => (
                  <tr key={`${r.workspaceId}-${r.day}`} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/workspaces/${r.workspaceId}`} className="flex items-center gap-1.5 text-[12px] font-medium text-slate-800 hover:text-[#2563EB]">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate">{r.workspaceName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500 whitespace-nowrap">{r.day || "—"}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-slate-700 tabular-nums">{fmtTokens(r.tokensIn)}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-slate-700 tabular-nums">{fmtTokens(r.tokensOut)}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] font-medium text-[#0B1B3F] tabular-nums">{fmtCost(r.costPence)}</td>
                  </tr>
                ))}
              </AdminTable>
            )}
          </AdminSectionCard>
        </>
      )}
    </div>
  )
}
