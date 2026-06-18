import AccountSettingsClient from "@/features/customer/settings/AccountSettingsClient"

export const metadata = { title: "Account settings · Propvora" }

const TABS = ["overview", "profile", "finance", "security", "notifications", "privacy"]

export default async function CustomerAccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const initialTab = TABS.includes(tab ?? "") ? (tab as string) : "overview"
  return <AccountSettingsClient initialTab={initialTab} />
}
