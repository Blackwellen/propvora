import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateLinks } from "@/components/affiliate/AffiliateLinks"

export const metadata = { title: "Affiliate links · Propvora" }

const BASE_PATH = "/user/affiliate"

export default function CustomerAffiliateLinksPage() {
  return (
    <div className="space-y-5">
      <MobileTopBar title="Affiliate links" subtitle="Refer & earn" />
      <div className="-mx-4 sm:-mx-6"><AffiliateTabNav basePath={BASE_PATH} /></div>
      <div className="w-full max-w-[1200px] mx-auto">
        <AffiliateLinks basePath={BASE_PATH} />
      </div>
    </div>
  )
}
