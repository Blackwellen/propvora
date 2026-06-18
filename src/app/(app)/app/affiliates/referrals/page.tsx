import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateReferrals } from "@/components/affiliate/AffiliateReferrals"

const BASE_PATH = "/property-manager/affiliates"

export default function AffiliatesReferralsPage() {
  return (
    <>
      <MobileTopBar title="Affiliate referrals" subtitle="Refer & earn" />
      <div className="md:hidden -mx-4 mb-4"><AffiliateTabNav basePath={BASE_PATH} /></div>

      <DashboardContainer>
        <div className="hidden md:block -mx-6 mb-5">
          <AffiliateTabNav basePath={BASE_PATH} />
        </div>
        <AffiliateReferrals basePath={BASE_PATH} />
      </DashboardContainer>
    </>
  )
}
