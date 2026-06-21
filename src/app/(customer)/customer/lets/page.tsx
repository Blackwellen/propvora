import LetsClient from "@/features/customer/lets/LetsClient"

export const metadata = { title: "Lets · Propvora" }

const TABS = ["search", "overview", "viewings", "applications", "offers", "tenancy"]

export default async function CustomerLetsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const initialTab = TABS.includes(tab ?? "") ? (tab as string) : "search"
  return <LetsClient initialTab={initialTab} />
}
