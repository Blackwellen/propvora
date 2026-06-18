import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateOverview } from "@/components/affiliate/AffiliateOverview"

export const metadata = { title: "Affiliate · Propvora" }

const BASE_PATH = "/user/affiliate"

export default function CustomerAffiliateOverviewPage() {
  return (
    <div className="space-y-5">
      <MobileTopBar title="Affiliate" subtitle="Refer & earn" />
      <div className="-mx-4 sm:-mx-6"><AffiliateTabNav basePath={BASE_PATH} /></div>
      <div className="w-full max-w-[1200px] mx-auto">
        <AffiliateOverview basePath={BASE_PATH} />
      </div>
    </div>
  )
}
