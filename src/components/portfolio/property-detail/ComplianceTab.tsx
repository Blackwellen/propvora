"use client"

import React from "react"
import Link from "next/link"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import {
  Plus, ArrowUpRight, Shield, AlertCircle, XCircle, CheckCircle2, Eye,
} from "lucide-react"
import { StatusPill, Card, fmtDate, complianceCounts, complianceStatusLabel, type ComplianceItemRow } from "./shared"

export function ComplianceTab({ items, loaded, propertyId }: { items: ComplianceItemRow[]; loaded: boolean; propertyId: string }) {
  const comp = complianceCounts(items)

  const statusIcon = (s: string) => {
    if (s === "Compliant") return <CheckCircle2 size={15} className="text-emerald-500" />
    if (s === "Overdue") return <XCircle size={15} className="text-red-500" />
    return <AlertCircle size={15} className="text-amber-500" />
  }

  return (
    <div className="space-y-5">
      {/* Summary cards — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Items", value: String(comp.total), icon: Shield, color: "#2563EB", sub: "Tracked for this property" },
          { label: "Due Soon", value: String(comp.dueSoon), icon: AlertCircle, color: "#F59E0B", sub: "Within 30 days" },
          { label: "Overdue", value: String(comp.overdue), icon: XCircle, color: "#EF4444", sub: "Action required" },
          { label: "Compliant", value: comp.pct != null ? `${comp.pct}%` : "—", icon: CheckCircle2, color: "#10B981", sub: "Up to date" },
        ].map((k) => (
          <Card key={k.label} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${k.color}18` }}>
              <k.icon size={18} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 tabular-nums leading-tight">{k.value}</p>
              <p className="text-[12px] font-medium text-slate-700">{k.label}</p>
              <p className="text-[11px] text-slate-500">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Compliance table — live */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[14px] font-bold text-slate-900">Compliance Register</p>
          <Link href={`/property-manager/compliance?property=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={13} /> Add Item
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Shield size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">{loaded ? "No compliance items yet" : "Loading…"}</p>
            <p className="text-[12px] text-slate-500 mt-1">Track certificates and inspections in the Compliance section.</p>
            <Link href={`/property-manager/compliance?property=${propertyId}`} className="mt-3 text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
              Open Compliance <ArrowUpRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Certificate / Inspection", "Type", "Due Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const label = complianceStatusLabel(item)
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {statusIcon(label)}
                          <span className="font-medium text-slate-800">{item.title ?? item.type ?? "Compliance item"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.type ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">{fmtDate(item.due_date)}</td>
                      <td className="px-4 py-3"><StatusPill status={label} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ActionMenu align="right" items={[
                            { label: "View in Compliance", icon: Eye, onClick: () => { window.location.href = `/property-manager/compliance?property=${propertyId}` } },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-100">
          <Link href={`/property-manager/compliance?property=${propertyId}`} className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
            View all compliance items <ArrowUpRight size={12} />
          </Link>
        </div>
      </Card>
    </div>
  )
}
