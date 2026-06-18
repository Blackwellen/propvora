import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateSettings } from "@/components/affiliate/AffiliateSettings"

const BASE_PATH = "/supplier/affiliate"

export default function SupplierAffiliateSettingsPage() {
  return (
    <div className="w-full">
      <AffiliateTabNav basePath={BASE_PATH} />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 lg:px-8">
        <AffiliateSettings basePath={BASE_PATH} />
      </div>
    </div>
  )
}
