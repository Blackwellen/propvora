import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getUserDetail } from "@/lib/admin/data"
import UserDetailClient from "@/components/admin-users/UserDetailClient"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUserDetail(id)
  if (!user) notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/users" className="hover:text-[#2563EB] flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Users</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{user.name ?? user.email ?? "User"}</span>
      </div>
      <UserDetailClient user={user} />
    </div>
  )
}
