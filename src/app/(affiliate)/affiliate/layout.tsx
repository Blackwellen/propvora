import Link from "next/link"
import Image from "next/image"
import { requireAffiliateContext } from "@/lib/affiliate/context"
import { AffiliateTabNav } from "@/components/affiliate/AffiliateTabNav"
import AffiliatePortalUserMenu from "@/components/affiliate/AffiliatePortalUserMenu"

export const dynamic = "force-dynamic"

export const BASE_PATH = "/affiliate"

export default async function AffiliatePortalLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireAffiliateContext()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branded top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/affiliate" className="flex items-center gap-2">
            <Image src="/propvora-logo-dark.png" alt="Propvora" width={120} height={26} priority />
            <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 sm:inline">Affiliate</span>
          </Link>
          <AffiliatePortalUserMenu email={email} />
        </div>
      </header>

      <div className="mx-auto max-w-[1200px]">
        <AffiliateTabNav basePath={BASE_PATH} />
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
