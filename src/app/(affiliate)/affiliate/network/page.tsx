import { AffiliateNetwork } from "@/components/affiliate/AffiliateNetwork"

export const metadata = { title: "Affiliate network · Propvora" }
const BASE_PATH = "/affiliate"

export default function AffiliatePortalNetworkPage() {
  return <AffiliateNetwork basePath={BASE_PATH} />
}
