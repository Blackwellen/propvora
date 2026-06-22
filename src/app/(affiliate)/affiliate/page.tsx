import { AffiliateOverview } from "@/components/affiliate/AffiliateOverview"

export const metadata = { title: "Affiliate · Propvora" }
const BASE_PATH = "/affiliate"

export default function AffiliatePortalOverviewPage() {
  return <AffiliateOverview basePath={BASE_PATH} />
}
