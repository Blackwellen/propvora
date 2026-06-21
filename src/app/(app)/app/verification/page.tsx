"use client"

import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { VerificationCentre } from "@/components/verification"

/* ──────────────────────────────────────────────────────────────────────────
   /app/verification — the operator workspace verification centre.

   Premium, status-driven identity verification (Stripe Identity). The page is
   a thin shell around <VerificationCentre>; all status, stepper, provider
   handoff, document upload and screening-signal handling live in the shared
   verification components and derive strictly from /api/identity/status.

   Access: any workspace member can view their own verification status. The
   "start verification" CTA is meaningful for workspaces that sell / receive
   payouts; the API resolves entitlement + membership server-side (no flags).
─────────────────────────────────────────────────────────────────────────── */

export default function VerificationPage() {
  return (
    <>
      <MobileTopBar title="Verification" subtitle="Identity & payouts" />
      <DashboardContainer className="px-4 sm: py-5 sm:py-6 max-w-[960px]">
        <div className="hidden md:block">
          <PageHeader
            title="Verification"
            description="Verify your identity to enable selling and receiving payouts on Propvora."
          />
        </div>
        <VerificationCentre audience="operator" />
      </DashboardContainer>
    </>
  )
}
