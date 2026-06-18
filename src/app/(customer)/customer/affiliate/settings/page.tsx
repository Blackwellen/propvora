import { MobileTopBar } from "@/components/mobile"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import { AffiliateSettings } from "@/components/affiliate/AffiliateSettings"

export const metadata = { title: "Affiliate settings · Propvora" }

const BASE_PATH = "/user/affiliate"

export default function CustomerAffiliateSettingsPage() {
  return (
    <div className="space-y-5">
      <MobileTopBar title="Affiliate settings" subtitle="Refer & earn" />
      <div className="-mx-4 sm:-mx-6"><AffiliateTabNav basePath={BASE_PATH} /></div>
      <div className="w-full max-w-[1200px] mx-auto">
        <AffiliateSettings basePath={BASE_PATH} />
      </div>
    </div>
  )
}
