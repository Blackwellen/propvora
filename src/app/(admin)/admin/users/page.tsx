import React from "react"
import { Users } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { listUsers } from "@/lib/admin/data"
import UsersFilter from "./UsersFilter"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const users = await listUsers(500)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Users</h1>
        <p className="text-xs text-slate-500">
          {users.length} user{users.length === 1 ? "" : "s"} on the platform · live from profiles + memberships
        </p>
      </div>

      {users.length === 0 ? (
        <Card className="py-12 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No users found</p>
          <p className="text-xs text-slate-400 mt-1">Users appear here as people register.</p>
        </Card>
      ) : (
        <UsersFilter users={users} />
      )}
    </div>
  )
}
