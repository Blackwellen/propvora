import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getWorkspaceDetail } from "@/lib/admin/data"
import WorkspaceDetailClient from "@/components/admin-workspaces/WorkspaceDetailClient"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminWorkspaceDetailPage({ params }: PageProps) {
  const { id } = await params
  const ws = await getWorkspaceDetail(id)
  if (!ws) notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/workspaces" className="hover:text-[#2563EB] flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Workspaces</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{ws.name}</span>
      </div>
      <WorkspaceDetailClient ws={ws} />
    </div>
  )
}
