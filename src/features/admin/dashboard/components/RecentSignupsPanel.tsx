import React from "react"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { AdminSectionCard, AdminStatusChip } from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"

type WorkspaceRow = {
  id: string
  name: string | null
  ownerName: string | null
  ownerEmail: string | null
  plan: string
  createdAt: string | null
}

function shortDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"
}

function planTone(plan: string): AdminTone {
  if (plan === "enterprise") return "violet"
  if (plan === "business" || plan === "pro") return "blue"
  if (plan === "trial") return "amber"
  return "slate"
}

interface Props {
  workspaces: WorkspaceRow[]
}

export function RecentSignupsPanel({ workspaces }: Props) {
  return (
    <AdminSectionCard title="Recent signups" icon={Building2} viewAllHref="/admin/workspaces" className="lg:col-span-1">
      {workspaces.length === 0 ? (
        <p className="text-[13px] text-slate-400 py-4">No workspaces yet.</p>
      ) : (
        <ul className="space-y-1 -mx-1.5">
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <Link href={`/admin/workspaces/${ws.id}`} className="flex items-center gap-3 px-1.5 py-2 rounded-lg hover:bg-slate-50">
                <span className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[var(--brand)] text-[11px] font-bold flex items-center justify-center shrink-0">
                  {(ws.name ?? "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#0B1B3F] truncate">{ws.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {ws.ownerName ?? ws.ownerEmail ?? "—"} · {shortDate(ws.createdAt)}
                  </p>
                </div>
                <AdminStatusChip tone={planTone(ws.plan)}>{ws.plan}</AdminStatusChip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminSectionCard>
  )
}
