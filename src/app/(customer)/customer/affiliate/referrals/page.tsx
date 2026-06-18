import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateReferrals } from "@/components/affiliate/AffiliateReferrals"

export const metadata = { title: "Affiliate referrals · Propvora" }

const BASE_PATH = "/user/affiliate"

export default function CustomerAffiliateReferralsPage() {
  return (
    <div className="space-y-5">
      <MobileTopBar title="Affiliate referrals" subtitle="Refer & earn" />
      <div className="-mx-4 sm:-mx-6"><AffiliateTabNav basePath={BASE_PATH} /></div>
      <div className="w-full max-w-[1200px] mx-auto">
        <AffiliateReferrals basePath={BASE_PATH} />
      </div>
    </div>
  )
}
