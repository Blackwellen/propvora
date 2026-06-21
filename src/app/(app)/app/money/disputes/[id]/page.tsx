import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { getMoneyWorkspace } from "../../_shared"
import { assertWorkspaceMember } from "@/lib/money/server"
import { createClient } from "@/lib/supabase/server"
import { getDisputeWithActions } from "@/lib/payments/disputes"
import DisputeDetailClient from "./DisputeDetailClient"

export const dynamic = "force-dynamic"

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { workspaceId } = await getMoneyWorkspace()
  if (!workspaceId) notFound()

  const svc = createAdminClient()
  const { dispute, actions } = await getDisputeWithActions(svc, id)
  if (!dispute) notFound()

  // Authorise: caller must be a member of a party workspace.
  const supabase = await createClient()
  const parties = [dispute.raised_by_workspace_id, dispute.against_workspace_id, dispute.workspace_id].filter(
    Boolean
  ) as string[]
  let allowed = false
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    for (const ws of parties) {
      if (await assertWorkspaceMember(supabase, user.id, ws)) { allowed = true; break }
    }
  }
  if (!allowed) notFound()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 px-6 py-6 gap-4">
      <Link href="/property-manager/money/disputes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to disputes
      </Link>
      <DisputeDetailClient dispute={dispute} actions={actions} />
    </div>
  )
}
