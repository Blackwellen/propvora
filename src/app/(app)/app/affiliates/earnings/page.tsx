import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateEarnings } from "@/components/affiliate/AffiliateEarnings"

const BASE_PATH = "/property-manager/affiliates"

export default function AffiliatesEarningsPage() {
  return (
    <>
      <MobileTopBar title="Affiliate earnings" subtitle="Refer & earn" />
      <div className="md:hidden -mx-4 mb-4"><AffiliateTabNav basePath={BASE_PATH} /></div>

      <DashboardContainer>
        <div className="hidden md:block -mx-6 mb-5">
          <AffiliateTabNav basePath={BASE_PATH} />
        </div>
        <AffiliateEarnings basePath={BASE_PATH} />
      </DashboardContainer>
    </>
  )
}
