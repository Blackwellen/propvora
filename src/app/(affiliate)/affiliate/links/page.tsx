import { AffiliateLinks } from "@/components/affiliate/AffiliateLinks"

export const metadata = { title: "Affiliate links · Propvora" }
const BASE_PATH = "/affiliate"

export default function AffiliatePortalLinksPage() {
  return <AffiliateLinks basePath={BASE_PATH} />
}
