"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

/* Shared internal tab bar for tenancy sub-pages (images 27-31) — mirrors the
   8 tenancy tabs from the tenancy profile (image 17). Tabs with a dedicated
   route link there; the rest deep-link back to the profile. */
export default function TenancySubNav({ id, active }: { id: string; active: string }) {
  const router = useRouter()
  const base = `/customer/lets/tenancies/${id}`
  const TABS: { id: string; label: string; href: string }[] = [
    { id: "setup", label: "Tenancy Setup", href: `${base}/setup` },
    { id: "documents", label: "Documents", href: `${base}/documents` },
    { id: "rent", label: "Rent & Deposits", href: `${base}/rent-payments` },
    { id: "maintenance", label: "Maintenance", href: `${base}/maintenance` },
    { id: "inspections", label: "Inspections", href: base },
    { id: "movein", label: "Move-in", href: `${base}/move-in` },
    { id: "renewal", label: "Renewal/Notice", href: base },
    { id: "guarantor", label: "Guarantor / Referencing", href: base },
  ]
  const activeHref = TABS.find((t) => t.id === active)?.href ?? TABS[0].href

  return (
    <div>
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden border-b border-slate-200 pb-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
          aria-label="Navigate section"
        >
          {TABS.map((t) => (
            <option key={t.id} value={t.href}>{t.label}</option>
          ))}
        </select>
      </div>
      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t.id} href={t.href} className={cn("px-3.5 py-2.5 text-[13px] font-semibold border-b-2 -mb-px whitespace-nowrap", t.id === active ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500 hover:text-slate-800")}>{t.label}</Link>
        ))}
      </div>
    </div>
  )
}
