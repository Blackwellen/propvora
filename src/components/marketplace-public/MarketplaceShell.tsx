import Link from "next/link"
import { ShieldCheck, Store } from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   MarketplaceShell — public chrome for the (marketplace-public) route group.

   Trust-forward header + footer for the anon-readable marketplace. No auth
   gate (the group is outside every protected prefix in src/proxy.ts). Light
   tokens only; never `dark:`.
─────────────────────────────────────────────────────────────────────────── */

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1B3F] antialiased flex flex-col">
      <header className="bg-white/95 backdrop-blur border-b border-[#E2EAF6] sticky top-0 z-30">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#2563EB] text-white">
              <Store className="w-4 h-4" />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-[#1D4ED8]">Propvora</span>
            <span className="hidden sm:inline-block h-4 w-px bg-[#E2EAF6]" />
            <span className="hidden sm:inline text-[12.5px] font-medium text-slate-500">Marketplace</span>
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link href="/marketplace/stays" className="hidden md:inline px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Stays</Link>
            <Link href="/marketplace/suppliers" className="hidden md:inline px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Suppliers</Link>
            <Link href="/services" className="hidden md:inline px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Services</Link>
            <Link href="/property-manager/marketplace" className="ml-1 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold shadow-[0_2px_10px_rgba(37,99,235,0.30)] hover:bg-[#1d4ed8] transition-colors">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#E2EAF6] bg-white">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Escrow-protected payments · Verified suppliers · No hidden fees</span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-slate-500">
            <Link href="/legal" className="hover:text-[#1D4ED8] transition-colors">Marketplace terms</Link>
            <Link href="/legal" className="hover:text-[#1D4ED8] transition-colors">Privacy</Link>
            <span className="text-slate-300">·</span>
            <span>© {new Date().getFullYear()} Propvora</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MarketplaceShell
