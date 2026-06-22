import { AffiliateSettings } from "@/components/affiliate/AffiliateSettings"

export const metadata = { title: "Affiliate settings · Propvora" }
const BASE_PATH = "/affiliate"

export default function AffiliatePortalSettingsPage() {
  return <AffiliateSettings basePath={BASE_PATH} />
}
