import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateReferrals } from "@/components/affiliate/AffiliateReferrals"

const BASE_PATH = "/supplier/affiliate"

export default function SupplierAffiliateReferralsPage() {
  return (
    <div className="w-full">
      <AffiliateTabNav basePath={BASE_PATH} />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 lg:px-8">
        <AffiliateReferrals basePath={BASE_PATH} />
      </div>
    </div>
  )
}
