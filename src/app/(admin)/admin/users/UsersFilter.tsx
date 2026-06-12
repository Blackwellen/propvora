"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, Users } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import type { AdminUserRow } from "@/lib/admin/data"

const ROLE_FILTERS = ["All", "platform_admin", "support", "user"] as const

function roleBadge(role: string) {
  if (role === "platform_admin") return <Badge variant="ai" size="sm">Platform admin</Badge>
  if (role === "support")        return <Badge variant="primary" size="sm">Support</Badge>
  return <Badge variant="default" size="sm">User</Badge>
}

function initials(name: string | null, email: string | null) {
  const base = name || email || "?"
  return base.split(/[\s@.]+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2)
}

export default function UsersFilter({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "All" || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input placeholder="Search users..." className="pl-9 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTERS.map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize",
                roleFilter === r ? "bg-[#2563EB] text-white" : "bg-white border border-[#E2E8F0] text-slate-500 hover:bg-slate-50")}>
              {r === "platform_admin" ? "Admin" : r}
            </button>
          ))}
        </div>
      </div>

      <Card noPadding className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50">
                {["User", "Role", "Workspaces", "Joined", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {initials(u.name, u.email)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-800">{u.name ?? "—"}</p>
                        <p className="text-[10px] text-slate-400">{u.email ?? ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{roleBadge(u.role)}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{u.workspaceCount}</td>
                  <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${u.id}`}>
                      <Button variant="outline" size="xs" rightIcon={<ChevronRight className="w-3 h-3" />}>View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <Users className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No users match your filters</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-[#E2E8F0]">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {users.length}</span>
        </div>
      </Card>
    </>
  )
}
