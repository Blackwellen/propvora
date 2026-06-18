import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateLinks } from "@/components/affiliate/AffiliateLinks"

const BASE_PATH = "/property-manager/affiliates"

export default function AffiliatesLinksPage() {
  return (
    <>
      <MobileTopBar title="Affiliate links" subtitle="Refer & earn" />
      <div className="md:hidden -mx-4 mb-4"><AffiliateTabNav basePath={BASE_PATH} /></div>

      <DashboardContainer>
        <div className="hidden md:block -mx-6 mb-5">
          <AffiliateTabNav basePath={BASE_PATH} />
        </div>
        <AffiliateLinks basePath={BASE_PATH} />
      </DashboardContainer>
    </>
  )
}
