import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateSettings } from "@/components/affiliate/AffiliateSettings"

const BASE_PATH = "/property-manager/affiliates"

export default function AffiliatesSettingsPage() {
  return (
    <>
      <MobileTopBar title="Affiliate settings" subtitle="Refer & earn" />
      <div className="md:hidden -mx-4 mb-4"><AffiliateTabNav basePath={BASE_PATH} /></div>

      <DashboardContainer>
        <div className="hidden md:block -mx-6 mb-5">
          <AffiliateTabNav basePath={BASE_PATH} />
        </div>
        <AffiliateSettings basePath={BASE_PATH} />
      </DashboardContainer>
    </>
  )
}
