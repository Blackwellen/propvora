"use client"

import React, { useState } from "react"
import { ArrowRight, Gavel, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { DisputeStatusBadge } from "./badges"
import DisputeResolvePanel from "./DisputeResolvePanel"
import type { AdminDisputeRow } from "./data"

function shortId(id: string | null | undefined) {
  return id ? id.slice(0, 8) : "—"
}

function fmtDate(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"
}

/**
 * Cross-workspace dispute queue with an inline resolve panel. The resolve action
 * goes through DisputeResolvePanel → /api/admin/disputes (authorised + audited).
 * Desktop: table with an expandable resolve row. Mobile: cards with a resolve
 * sheet. Resolution is always explicit — never auto-applied.
 */
export default function DisputesQueue({ rows }: { rows: AdminDisputeRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [sheetId, setSheetId] = useState<string | null>(null)

  const sheetRow = rows.find((r) => r.id === sheetId) ?? null

  return (
    <>
      {/* Mobile card list */}
      <ul className="lg:hidden space-y-2.5" role="list">
        {rows.map((d) => (
          <li key={d.id} className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-[11px] text-slate-400">{shortId(d.id)}</span>
              <DisputeStatusBadge status={d.status} />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-1.5">
              <span className="truncate">{d.raisedByWorkspaceName ?? shortId(d.raisedByWorkspaceId)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="truncate">{d.againstWorkspaceName ?? shortId(d.againstWorkspaceId)}</span>
            </div>
            {d.reason && <p className="text-xs font-medium text-slate-700">{d.reason}</p>}
            {d.detail && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{d.detail}</p>}
            <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{fmtDate(d.createdAt)}</span>
              <button
                type="button"
                onClick={() => setSheetId(d.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB]"
              >
                <Gavel className="w-3.5 h-3.5" /> Resolve
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-slate-50">
              {["Dispute", "Raised by → Against", "Reason", "Status", "Opened", ""].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-semibold text-slate-400 px-4 py-2.5 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {rows.map((d) => (
              <React.Fragment key={d.id}>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{shortId(d.id)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-medium text-slate-800 truncate max-w-[130px]">
                        {d.raisedByWorkspaceName ?? shortId(d.raisedByWorkspaceId)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                      <span className="font-medium text-slate-800 truncate max-w-[130px]">
                        {d.againstWorkspaceName ?? shortId(d.againstWorkspaceId)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[260px]">
                    <span className="font-medium text-slate-700">{d.reason ?? "—"}</span>
                    {d.detail && <span className="block text-[11px] text-slate-400 truncate">{d.detail}</span>}
                  </td>
                  <td className="px-4 py-2.5"><DisputeStatusBadge status={d.status} /></td>
                  <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setOpenId((id) => (id === d.id ? null : d.id))}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      <Gavel className="w-3.5 h-3.5" /> Resolve
                      <ChevronDown
                        className={cn("w-3.5 h-3.5 transition-transform", openId === d.id && "rotate-180")}
                      />
                    </button>
                  </td>
                </tr>
                {openId === d.id && (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 bg-slate-50">
                      <div className="max-w-md">
                        <DisputeResolvePanel
                          disputeId={d.id}
                          status={d.status}
                          onClose={() => setOpenId(null)}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile resolve sheet */}
      {sheetRow && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSheetId(null)} />
          <div className="relative w-full bg-white rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto motion-safe:animate-[slideUpSheet_0.2s_ease-out]">
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-3" />
            <div className="mb-3">
              <p className="text-xs text-slate-400 font-mono">{shortId(sheetRow.id)}</p>
              <p className="text-sm font-semibold text-slate-900">{sheetRow.reason ?? "Dispute"}</p>
            </div>
            <DisputeResolvePanel
              disputeId={sheetRow.id}
              status={sheetRow.status}
              onClose={() => setSheetId(null)}
            />
          </div>
        </div>
      )}
    </>
  )
}
