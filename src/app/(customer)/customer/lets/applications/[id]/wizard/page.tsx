import { notFound } from "next/navigation"
import ApplicationWizard from "@/features/customer/lets/ApplicationWizard"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { getApplication } from "@/lib/customer/lets"

export const metadata = { title: "Application · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerApplicationWizardRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireCustomerContext()
  const app = await getApplication(supabase, id)
  if (!app) notFound()
  return <ApplicationWizard app={app} appId={id} />
}
