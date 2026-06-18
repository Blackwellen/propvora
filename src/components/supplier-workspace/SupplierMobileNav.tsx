"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MoreHorizontal, LifeBuoy } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileSheet } from "@/components/mobile"
import {
  SUPPLIER_PRIMARY,
  SUPPLIER_MORE,
  supplierMoreGroupsForPlan,
  isSupplierNavActive,
  type SupplierNavItem,
} from "./nav"
import { useSupplierPlan } from "./useSupplierPlan"

void SUPPLIER_MORE // retained export; grouped variant used below

/* ──────────────────────────────────────────────────────────────────────────
   SupplierMobileBottomNav — dedicated bottom tab bar for the supplier
   workspace, rendered only below `lg`. It is a DIFFERENT bar from both the
   operator app nav and the V1 supplier-portal:

   • Slots: Dashboard · Jobs · Quotes · More.
   • No raised Copilot centre button (the supplier workspace has no global
     AI/Inbox panel of its own) — instead all four primary destinations are
     flat tabs, and Profile / Marketplace / Earnings / Reviews live in the
     "More" bottom sheet (mirroring the desktop side-nav so nothing is lost).
   • Safe-area-inset padding, ≥44px targets, aria-current on the active tab.
─────────────────────────────────────────────────────────────────────────── */

function BottomTab({ dest, active }: { dest: SupplierNavItem; active: boolean }) {
  const Icon = dest.icon
  return (
    <Link
      href={dest.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/40 motion-reduce:transition-none",
        active ? "text-[#2563EB]" : "text-slate-500 hover:text-slate-700"
      )}
    >
      <span
        className={cn(
          "w-9 h-7 rounded-lg flex items-center justify-center transition-colors",
          active ? "bg-[#EFF6FF]" : "bg-transparent"
        )}
      >
        <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className={cn("text-[10.5px] leading-none", active ? "font-bold" : "font-medium")}>
        {dest.short ?? dest.label}
      </span>
    </Link>
  )
}

export default function SupplierMobileBottomNav() {
  const pathname = usePathname()
  const { planType } = useSupplierPlan()
  const moreGroups = supplierMoreGroupsForPlan(planType)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = moreGroups.some((g) => g.items.some((i) => isSupplierNavActive(pathname, i.href)))

  return (
    <>
      <nav
        aria-label="Supplier workspace"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2EAF6] shadow-[0_-6px_24px_rgba(15,23,42,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="grid grid-cols-4 items-end">
          {SUPPLIER_PRIMARY.map((dest) => (
            <li key={dest.href}>
              <BottomTab dest={dest} active={isSupplierNavActive(pathname, dest.href)} />
            </li>
          ))}
          <li>
            <button
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-current={moreActive ? "page" : undefined}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/40 motion-reduce:transition-none",
                moreActive ? "text-[#2563EB]" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <span
                className={cn(
                  "w-9 h-7 rounded-lg flex items-center justify-center transition-colors",
                  moreActive ? "bg-[#EFF6FF]" : "bg-transparent"
                )}
              >
                <MoreHorizontal className="w-[19px] h-[19px]" strokeWidth={moreActive ? 2.4 : 2} />
              </span>
              <span className={cn("text-[10.5px] leading-none", moreActive ? "font-bold" : "font-medium")}>
                More
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <MobileSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More" description="Manage your supplier workspace">
        <div className="pb-2 space-y-4">
          {moreGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1.5 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">{group.label}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {group.items.map((item) => {
                  const active = isSupplierNavActive(pathname, item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 min-h-[76px] rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                        active
                          ? "bg-[#EFF6FF] border-[#BFD8FB] text-[#2563EB]"
                          : "bg-white border-[#E8EEF8] text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-[20px] h-[20px]" />
                      <span className="text-[11.5px] font-semibold text-center px-1 leading-tight">{item.short ?? item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="px-2 pb-1.5 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Support</p>
            <Link
              href="/supplier/help"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 px-3 min-h-[56px] rounded-2xl border border-[#E8EEF8] bg-white text-slate-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              <span className="w-9 h-9 rounded-xl bg-[#F5F3FF] flex items-center justify-center shrink-0">
                <LifeBuoy className="w-[18px] h-[18px] text-[#7C3AED]" />
              </span>
              <span className="text-[13.5px] font-semibold">Help &amp; Guides</span>
            </Link>
          </div>
        </div>
      </MobileSheet>
    </>
  )
}
