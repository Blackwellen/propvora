import ApplicationWizard from "@/features/customer/lets/ApplicationWizard"
import { findApplication, applications } from "@/features/customer/data/lets"

export const metadata = { title: "Application · Propvora" }

export default async function CustomerApplicationWizardRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const app = findApplication(id) ?? applications[0]
  return <ApplicationWizard app={app} appId={id} />
}
