import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateOverview } from "@/components/affiliate/AffiliateOverview"

const BASE_PATH = "/property-manager/affiliates"

export default function AffiliatesOverviewPage() {
  return (
    <>
      <MobileTopBar title="Affiliate" subtitle="Refer & earn" />
      <div className="md:hidden -mx-4 mb-4"><AffiliateTabNav basePath={BASE_PATH} /></div>

      <DashboardContainer>
        {/* Page heading must appear before section tabs */}
        <div className="hidden md:flex items-center justify-between pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Affiliates</h1>
            <p className="text-sm text-slate-500 mt-0.5">Refer operators to Propvora and earn commission</p>
          </div>
        </div>
        <div className="hidden md:block -mx-6 mb-5">
          <AffiliateTabNav basePath={BASE_PATH} />
        </div>
        <AffiliateOverview basePath={BASE_PATH} />
      </DashboardContainer>
    </>
  )
}
