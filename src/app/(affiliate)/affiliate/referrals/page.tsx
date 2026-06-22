import { AffiliateReferrals } from "@/components/affiliate/AffiliateReferrals"

export const metadata = { title: "Referrals · Propvora" }
const BASE_PATH = "/affiliate"

export default function AffiliatePortalReferralsPage() {
  return <AffiliateReferrals basePath={BASE_PATH} />
}
