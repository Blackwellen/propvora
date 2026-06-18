import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateEarnings } from "@/components/affiliate/AffiliateEarnings"

export const metadata = { title: "Affiliate earnings · Propvora" }

const BASE_PATH = "/user/affiliate"

export default function CustomerAffiliateEarningsPage() {
  return (
    <div className="space-y-5">
      <MobileTopBar title="Affiliate earnings" subtitle="Refer & earn" />
      <div className="-mx-4 sm:-mx-6"><AffiliateTabNav basePath={BASE_PATH} /></div>
      <div className="w-full max-w-[1200px] mx-auto">
        <AffiliateEarnings basePath={BASE_PATH} />
      </div>
    </div>
  )
}
