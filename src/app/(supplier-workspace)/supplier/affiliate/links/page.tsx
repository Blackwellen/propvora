import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateLinks } from "@/components/affiliate/AffiliateLinks"

const BASE_PATH = "/supplier/affiliate"

export default function SupplierAffiliateLinksPage() {
  return (
    <div className="w-full">
      <AffiliateTabNav basePath={BASE_PATH} />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 lg:px-8">
        <AffiliateLinks basePath={BASE_PATH} />
      </div>
    </div>
  )
}
