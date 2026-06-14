import React from "react"
import Link from "next/link"
import { Sparkles, Building2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { listAiUsage } from "@/lib/admin/ops"

export const dynamic = "force-dynamic"

function fmtDay(d: string) {
  if (!d) return "—"
  const date = new Date(d)
  return isNaN(date.getTime())
    ? d
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtTokens(n: number) {
  return n.toLocaleString("en-GB")
}

/** cost stored in pence -> £ display. */
function fmtCost(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const TH = "text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"
const THR = "text-right text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"

export default async function AdminAiUsagePage() {
  const { available, source, rows, totals } = await listAiUsage(200)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Usage</h1>
        <p className="text-xs text-slate-500">
          {source === "metering"
            ? <>Aggregated from <code className="font-mono">ai_usage_metering</code> raw rows (USD cost → pence)</>
            : <>Per-workspace daily totals from <code className="font-mono">ai_token_usage</code></>}
          {" "}· read-only · newest first
        </p>
      </div>

      {!available ? (
        <Card className="py-12 text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">AI usage tables not provisioned</p>
          <p className="text-xs text-slate-400 mt-1">
            Neither <code className="font-mono">ai_token_usage</code> nor <code className="font-mono">ai_usage_metering</code> is present yet.
          </p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No AI usage recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">Usage is metered as workspaces use AI features.</p>
        </Card>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="px-4 py-3">
              <p className="text-[11px] text-slate-500">Tokens in</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{fmtTokens(totals.tokensIn)}</p>
            </Card>
            <Card className="px-4 py-3">
              <p className="text-[11px] text-slate-500">Tokens out</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{fmtTokens(totals.tokensOut)}</p>
            </Card>
            <Card className="px-4 py-3">
              <p className="text-[11px] text-slate-500">Est. cost</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{fmtCost(totals.costPence)}</p>
            </Card>
          </div>

          {/* Table */}
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50">
                    <th className={TH}>Workspace</th>
                    <th className={TH}>Day</th>
                    <th className={THR}>Tokens in</th>
                    <th className={THR}>Tokens out</th>
                    <th className={THR}>Est. cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {rows.map((r) => (
                    <tr key={`${r.workspaceId}-${r.day}`} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/workspaces/${r.workspaceId}`}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-[#2563EB]"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{r.workspaceName}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{fmtDay(r.day)}</td>
                      <td className="px-3 py-2 text-right text-[11px] text-slate-700 tabular-nums">{fmtTokens(r.tokensIn)}</td>
                      <td className="px-3 py-2 text-right text-[11px] text-slate-700 tabular-nums">{fmtTokens(r.tokensOut)}</td>
                      <td className="px-3 py-2 text-right text-[11px] font-medium text-slate-800 tabular-nums">{fmtCost(r.costPence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-[#E2E8F0]">
              <span className="text-xs text-slate-500">{rows.length} row{rows.length === 1 ? "" : "s"}</span>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
