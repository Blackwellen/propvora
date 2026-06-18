"use client"

import Link from "next/link"
import { Building2, Menu, LogOut, LifeBuoy } from "lucide-react"
import type { PortalKind } from "./portal-nav"

const BADGE: Record<PortalKind, string> = { supplier: "SUPPLIER", landlord: "LANDLORD", tenant: "TENANT" }

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "PV"
}

/**
 * PortalTopNavigation — 1:1 with the operator/supplier workspace top bar (same
 * floating white pill: radius 24, translucent + blur, same shadow/border).
 * The search box and account/avatar dropdown are intentionally removed for the
 * external portal; what remains is a static workspace+portal chip (left) and the
 * contact identity + Sign out (right). No dead controls, no workspace switcher.
 */
export default function PortalTopNavigation({
  kind,
  workspaceName,
  displayName,
  onOpenMobile,
  helpHref,
}: {
  kind: PortalKind
  workspaceName: string
  displayName: string
  onOpenMobile: () => void
  /** "Help & support" target — the messages/support channel for this portal. */
  helpHref: string
}) {
  return (
    <header
      style={{
        borderRadius: 24,
        background: "rgba(255, 255, 255, 0.94)",
        border: "1px solid #E2EAF6",
        boxShadow: "0 14px 40px rgba(15, 23, 42, 0.06)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 mb-3 sm:mb-4 shrink-0 h-14 sm:h-[72px]"
      aria-label="Portal toolbar"
    >
      {/* Mobile: open sidebar drawer */}
      <button
        onClick={onOpenMobile}
        aria-label="Open menu"
        className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-[#071B4D] hover:bg-[#F0F7FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Left: static workspace chip (mirrors the switcher chip, no dropdown) */}
      <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#F8FBFF] border border-[#DDE8F7] text-[13px] font-semibold text-[#071B4D] shrink-0">
        <Building2 className="w-4 h-4 text-[#2563EB] shrink-0" />
        <span className="max-w-[120px] sm:max-w-[200px] truncate">{workspaceName}</span>
      </div>

      {/* Supplier: the portal context pill sits in the LEFT cluster beside the
          workspace pill (per the supplier design) — not crowding the right group. */}
      {kind === "supplier" && (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-semibold shrink-0">
          {BADGE[kind]} PORTAL
        </span>
      )}

      {/* Spacer (search removed) */}
      <div className="flex-1 min-w-0" />

      {/* Help & support — moved here from the sidebar (no floating help circle) */}
      <Link
        href={helpHref}
        className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-white border border-[#E2EAF6] text-[13px] font-semibold text-[#071B4D] hover:border-[#2563EB]/40 hover:text-[#2563EB] transition-colors shadow-sm shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
      >
        <LifeBuoy className="w-4 h-4 text-[#2563EB]" />
        <span className="hidden sm:inline">Help &amp; support</span>
      </Link>

      {/* Right: portal badge (tenant/landlord only — supplier's is on the left) */}
      {kind !== "supplier" && (
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-semibold shrink-0">
          {BADGE[kind]} PORTAL
        </span>
      )}

      <div className="flex items-center gap-2 h-10 pl-1 pr-2.5 rounded-full bg-white border border-[#E2EAF6] shrink-0">
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
          {initialsOf(displayName)}
        </span>
        <span className="hidden sm:block text-[13px] font-semibold text-[#071B4D] max-w-[140px] truncate">{displayName}</span>
      </div>

      <form method="POST" action="/api/portal/logout">
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-white border border-[#E2EAF6] text-[13px] font-semibold text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </header>
  )
}
