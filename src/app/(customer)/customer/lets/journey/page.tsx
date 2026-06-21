import LetsClient from "@/features/customer/lets/LetsClient"

export const metadata = { title: "My letting journey · Propvora" }

const TABS = ["overview", "viewings", "applications", "offers", "tenancy"]

export default async function CustomerLetsJourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const initialTab = TABS.includes(tab ?? "") ? (tab as string) : "overview"
  return <LetsClient initialTab={initialTab} />
}
