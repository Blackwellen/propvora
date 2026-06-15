import type { Metadata } from "next"
import { Suspense } from "react"
import ConfirmationClient from "./ConfirmationClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Booking received · Propvora",
  robots: { index: false, follow: false },
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 py-16 text-center text-slate-500">
          Loading your booking…
        </div>
      }
    >
      <ConfirmationClient />
    </Suspense>
  )
}
