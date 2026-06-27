import React from "react"
import Link from "next/link"
import { Users } from "lucide-react"
import {
  AdminCard, AdminTable, AdminStatusChip, AdminActionMenu, AdminEmptyState,
} from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"

type UserRow = {
  id: string
  name: string | null
  email: string | null
  role: string
  workspaceCount: number
  createdAt: string | null
}

function roleTone(role: string): AdminTone {
  if (role === "platform_admin" || role === "admin") return "violet"
  if (role === "support") return "blue"
  return "slate"
}
function roleLabel(role: string) {
  if (role === "platform_admin" || role === "admin") return "Platform admin"
  if (role === "support") return "Support"
  return "User"
}
function initials(name: string | null, email: string | null) {
  return (name || email || "?").split(/[\s@.]+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2)
}
function shortDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}

interface PaginationProps {
  q?: string
  role?: string
  current: number
  total: number
}

interface Props {
  rows: UserRow[]
  allCount: number
  filteredCount: number
  searchParams: { q?: string; role?: string }
  pagination: PaginationProps
}

export function UsersTable({ rows, allCount, filteredCount, searchParams: sp, pagination }: Props) {
  const { current: clamped, total: totalPages } = pagination

  return (
    <AdminCard padded={false}>
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No users match"
          description={allCount === 0 ? "Users appear here as people register." : "Try clearing your search or role filter."}
        />
      ) : (
        <>
          <AdminTable head={[
            { label: "User" }, { label: "Role" }, { label: "Workspaces", align: "center" },
            { label: "Joined" }, { label: "", align: "right" },
          ]} minWidth={720}>
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-[#FAFCFF]">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2.5 group">
                    <span className="w-8 h-8 rounded-full bg-[var(--brand)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {initials(u.name, u.email)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[var(--brand)] truncate">{u.name ?? "—"}</span>
                      <span className="block text-[11px] text-slate-400 truncate">{u.email ?? ""}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <AdminStatusChip tone={roleTone(u.role)}>{roleLabel(u.role)}</AdminStatusChip>
                </td>
                <td className="px-4 py-2.5 text-center text-[13px] text-slate-600">{u.workspaceCount}</td>
                <td className="px-4 py-2.5 text-[12px] text-slate-400 whitespace-nowrap">{shortDate(u.createdAt)}</td>
                <td className="px-4 py-2.5 text-right">
                  <AdminActionMenu actions={[
                    { label: "View user", href: `/admin/users/${u.id}` },
                    { label: "View as customer", href: `/admin/customers/${u.id}` },
                  ]} />
                </td>
              </tr>
            ))}
          </AdminTable>
          <div className="px-4 py-2.5 border-t border-[#EEF3FB] flex items-center justify-between">
            <span className="text-[12px] text-slate-500">Showing {rows.length} of {filteredCount}</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <PageLink sp={sp} page={clamped - 1} disabled={clamped <= 1}>Prev</PageLink>
                <span className="text-[12px] text-slate-500 px-2">{clamped} / {totalPages}</span>
                <PageLink sp={sp} page={clamped + 1} disabled={clamped >= totalPages}>Next</PageLink>
              </div>
            )}
          </div>
        </>
      )}
    </AdminCard>
  )
}

function PageLink({
  sp, page, disabled, children,
}: {
  sp: { q?: string; role?: string }
  page: number
  disabled: boolean
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <span className="h-8 px-3 inline-flex items-center rounded-lg text-[12px] font-semibold text-slate-300">
        {children}
      </span>
    )
  }
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  if (sp.role) params.set("role", sp.role)
  params.set("page", String(page))
  return (
    <Link
      href={`/admin/users?${params.toString()}`}
      className="h-8 px-3 inline-flex items-center rounded-lg border border-[#E2EAF6] text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  )
}
