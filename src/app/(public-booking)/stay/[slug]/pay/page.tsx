import type { Metadata } from "next"
import { Suspense } from "react"
import PayClient from "./PayClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Secure payment · Propvora",
  robots: { index: false, follow: false },
}

/* ──────────────────────────────────────────────────────────────────────────
   /stay/[slug]/pay — public guest PAYMENT step.

   Reached from the confirmation flow with ?ref=<bookingId>. The client island
   loads the HELD reservation's payable amount (via /api/payments/status), shows
   the price + escrow explanation, mounts a Stripe Elements card form
   (publishable key only), confirms the PaymentIntent client-side, then routes to
   the confirmation page with an HONEST pending status — capture/confirmation is
   webhook-driven, never asserted here.
─────────────────────────────────────────────────────────────────────────── */

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 py-16 text-center text-slate-500">
          Loading secure payment…
        </div>
      }
    >
      <PayClient />
    </Suspense>
  )
}
