import { redirect } from "next/navigation"

export default async function MarketplaceWorkspaceDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/workspaces/${id}`)
}
