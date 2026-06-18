import React from "react"
import { notFound } from "next/navigation"
import { UserCircle2 } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/ui"
import { getUserDetail } from "@/lib/admin/data"
import UserDetailClient from "@/components/admin-users/UserDetailClient"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUserDetail(id)
  if (!user) notFound()
  const name = user.name ?? user.email ?? "User"

  return (
    <div className="space-y-4">
      <AdminPageHeader
        breadcrumb={[{ label: "Users", href: "/admin/users" }, { label: name }]}
        icon={UserCircle2}
        title={`User account — ${name}`}
        subtitle={user.email ?? undefined}
      />
      <UserDetailClient user={user} />
    </div>
  )
}
