import Link from "next/link"
import { SearchX } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMarketplaceAccess } from "@/components/marketplace/server"
import { getSupplierDetail } from "@/lib/marketplace/suppliers"
import { OperatorSupplierDetail } from "@/components/suppliers/OperatorSupplierDetail"
import { DashboardContainer } from "@/components/layout/PageContainer"
import MobileTopBar from "@/components/mobile/MobileTopBar"

/* ──────────────────────────────────────────────────────────────────────────
   Operator SUPPLIER DETAIL (procurement view). Resolves entitlement + the
   buyer session server-side, loads the deep supplier payload (real supplier
   substrate via getSupplierDetail), and renders the ~15-section detail. Browse
   entitlement is required; non-entitled workspaces are redirected to the gated
   directory shell.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function OperatorSupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const access = await getMarketplaceAccess()

  if (!access.canBrowse) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Supplier" showBack backHref="/app/marketplace/suppliers" />
        <NotAvailable
          title="Supplier procurement isn't on your plan"
          body={`Your ${access.planName} plan doesn't include the supplier marketplace yet.`}
          cta={{ label: "View plans", href: "/app/workspace-settings/subscription" }}
        />
      </DashboardContainer>
    )
  }

  const supabase = await createClient()
  const [detail, { data: userData }] = await Promise.all([
    getSupplierDetail(supabase, id),
    supabase.auth.getUser(),
  ])

  if (!detail) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Supplier" showBack backHref="/app/marketplace/suppliers" />
        <NotAvailable
          title="This supplier isn't available"
          body="It may have been unpublished or is no longer taking enquiries."
          cta={{ label: "Browse suppliers", href: "/app/marketplace/suppliers" }}
        />
      </DashboardContainer>
    )
  }

  const user = userData?.user
  const session = {
    signedIn: Boolean(user),
    email: user?.email ?? null,
    name: (user?.user_metadata?.full_name as string | undefined) ?? null,
    buyerWorkspaceId: access.workspaceId,
  }

  return (
    <>
      <MobileTopBar title={detail.title} showBack backHref="/app/marketplace/suppliers" />
      <OperatorSupplierDetail supplier={detail} session={session} />
    </>
  )
}

function NotAvailable({ title, body, cta }: { title: string; body: string; cta: { label: string; href: string } }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <SearchX className="w-8 h-8 text-slate-300" />
      </div>
      <h1 className="text-[19px] font-bold text-[#0B1B3F]">{title}</h1>
      <p className="mt-2 text-[13.5px] text-slate-500">{body}</p>
      <Link href={cta.href} className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors">{cta.label}</Link>
    </div>
  )
}
