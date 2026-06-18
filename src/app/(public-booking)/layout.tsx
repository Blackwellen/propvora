import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { getGlobalFlag } from "@/lib/flags/public"

/**
 * Public direct-booking layout — UNAUTHENTICATED (guest checkout).
 *
 * This group is deliberately NOT in any protected prefix (`/app`,
 * `/supplier-portal`, `/admin`, `/affiliate`) — see `src/proxy.ts`. `/stay/*`
 * must be reachable by anonymous guests, so there is no auth gate here. The
 * only data this group ever touches is the published listing (anon RLS read)
 * and the sanctioned `create_public_reservation` RPC via the API routes.
 *
 * Premium, trustworthy chrome: this is a money page, so it must read as safe
 * and polished. Never use Tailwind `dark:` classes.
 */

export const metadata: Metadata = {
  title: "Book your stay · Propvora",
  description:
    "Reserve your stay directly with the property manager. Secure checkout, transparent pricing, no hidden fees.",
  robots: { index: true, follow: true },
}

export default async function PublicBookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Staged platform: public direct-booking pages are hidden until the global
  // `directBookingPages` flag is on (V1 default OFF). Independent of marketplace.
  if (!(await getGlobalFlag("directBookingPages"))) {
    redirect("/")
  }
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1B3F] antialiased flex flex-col">
      {/* Slim trust header */}
      <header className="bg-white border-b border-[#E2EAF6] sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 rounded-md"
          >
            <span className="text-[18px] font-bold tracking-tight text-[#1D4ED8]">
              Propvora
            </span>
            <span className="hidden sm:inline-block h-4 w-px bg-[#E2EAF6]" />
            <span className="hidden sm:inline text-[12.5px] font-medium text-slate-500">
              Direct booking
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Secure checkout</span>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Trust / legal footer */}
      <footer className="border-t border-[#E2EAF6] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[12px] leading-relaxed text-slate-500 max-w-xl">
            The booking contract is between you and the property manager. Propvora
            provides the booking software and is not the merchant of record unless
            stated otherwise.
          </p>
          <div className="flex items-center gap-4 text-[12px] text-slate-500">
            <Link href="/legal" className="hover:text-[#1D4ED8] transition-colors">
              Booking terms
            </Link>
            <Link href="/legal" className="hover:text-[#1D4ED8] transition-colors">
              Privacy
            </Link>
            <span className="text-slate-300">·</span>
            <span>© {new Date().getFullYear()} Propvora</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
