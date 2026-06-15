"use client"

import { MobileTopBar } from "@/components/mobile"
import { SupplierPageHeader } from "@/components/supplier-workspace/ui"
import { VerificationCentre } from "@/components/verification"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/verification — the supplier KYC / identity verification centre.

   Suppliers must verify their identity before they can publish a marketplace
   profile and receive payouts for completed work. This page reuses the shared
   <VerificationCentre> (Stripe Identity), so operator and supplier flows stay
   in lockstep; only the explanatory copy is supplier-flavoured.

   Status, stepper, provider handoff, document upload and screening signals all
   derive from the real /api/identity/status — nothing claims "verified" unless
   the status says so.
─────────────────────────────────────────────────────────────────────────── */

export default function SupplierVerificationPage() {
  return (
    <div className="space-y-5">
      <MobileTopBar title="Verification" subtitle="Identity & payouts" />

      <SupplierPageHeader
        title="Verification"
        subtitle="Verify your identity to publish your profile and receive payouts"
      />

      <VerificationCentre audience="supplier" />
    </div>
  )
}
