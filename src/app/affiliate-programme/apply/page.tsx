import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import ApplyClient from "./ApplyClient"

export const metadata: Metadata = {
  title: "Apply — Propvora Affiliate Programme",
  description:
    "Apply to become a Propvora partner and earn 10% recurring commission for 6 months on every paying customer you refer.",
  robots: { index: true, follow: true },
}

export default async function AffiliateApplyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const recruitedBy = typeof params.recruited_by === "string" ? params.recruited_by : null

  return (
    <div className="min-h-screen bg-[#F6FAFF] flex flex-col">
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none flex-1 px-6 pt-28 pb-16">
        <ApplyClient recruitedByWorkspaceId={recruitedBy} />
      </main>
      <PublicFooter />
    </div>
  )
}
