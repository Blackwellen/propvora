import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateNetwork } from "@/components/affiliate/AffiliateNetwork"

const BASE_PATH = "/property-manager/affiliates"

export default function AffiliatesNetworkPage() {
  return (
    <>
      <MobileTopBar title="Affiliate network" subtitle="Sub-affiliates & earn-through" />
      <div className="md:hidden -mx-4 mb-4"><AffiliateTabNav basePath={BASE_PATH} /></div>

      <DashboardContainer>
        <div className="hidden md:block -mx-6 mb-5">
          <AffiliateTabNav basePath={BASE_PATH} />
        </div>
        <AffiliateNetwork basePath={BASE_PATH} />
      </DashboardContainer>
    </>
  )
}
