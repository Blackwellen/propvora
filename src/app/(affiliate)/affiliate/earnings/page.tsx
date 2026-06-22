import { AffiliateEarnings } from "@/components/affiliate/AffiliateEarnings"

export const metadata = { title: "Earnings · Propvora" }
const BASE_PATH = "/affiliate"

export default function AffiliatePortalEarningsPage() {
  return <AffiliateEarnings basePath={BASE_PATH} />
}
