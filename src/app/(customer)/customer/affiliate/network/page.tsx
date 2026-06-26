import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateNetwork } from "@/components/affiliate/AffiliateNetwork"

export const metadata = { title: "Affiliate network · Propvora" }

const BASE_PATH = "/user/affiliate"

export default function CustomerAffiliateNetworkPage() {
  return (
    <div className="space-y-5">
      <MobileTopBar title="Affiliate network" subtitle="Sub-affiliates & earn-through" />
      <div className="-mx-4 sm:-mx-6"><AffiliateTabNav basePath={BASE_PATH} /></div>
      <div className="w-full max-w-[1200px] mx-auto">
        <AffiliateNetwork basePath={BASE_PATH} />
      </div>
    </div>
  )
}
