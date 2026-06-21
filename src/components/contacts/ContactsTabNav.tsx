"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"
import { Lock } from "lucide-react"

/**
 * Guests tab is gated behind the `bookingManagement` v2 feature flag.
 * On the client side we read NEXT_PUBLIC_QA_ALL_FLAGS to allow QA discovery.
 * In production the flag defaults OFF → Guests tab is hidden entirely.
 *
 * The Messages tab has been intentionally removed — Contacts > Messages was a
 * duplicate of the central Inbox. The route /property-manager/contacts/messages
 * now redirects to /property-manager/messages.
 */
const QA_ALL_FLAGS = process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true"

const BASE_TABS = [
  { key: "overview",      label: "Overview",       href: "/property-manager/contacts" },
  { key: "people",        label: "People",          href: "/property-manager/contacts/people" },
  { key: "organisations", label: "Organisations",   href: "/property-manager/contacts/organisations" },
  { key: "board",         label: "Board",           href: "/property-manager/contacts/board" },
  { key: "timeline",      label: "Timeline",        href: "/property-manager/contacts/timeline" },
  { key: "portal",        label: "Portal Access",   href: "/property-manager/contacts/portal-access" },
  { key: "documents",     label: "Documents",       href: "/property-manager/contacts/documents" },
  { key: "activity",      label: "Activity",        href: "/property-manager/contacts/activity" },
] as const

const GUESTS_TAB = {
  key: "guests",
  label: "Guests",
  href: "/property-manager/contacts/guests",
} as const

export function ContactsTabNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Guests tab is visible only when the bookingManagement flag is on (or QA all-flags mode)
  const guestsEnabled = QA_ALL_FLAGS
  // Note: runtime flag check is async/server-only; for client nav we use the env var only.
  // The route itself is also protected server-side.

  const tabs = guestsEnabled
    ? [BASE_TABS[0], BASE_TABS[1], GUESTS_TAB, ...BASE_TABS.slice(2)]
    : BASE_TABS

  const activeKey = tabs.find(tab =>
    tab.href === "/property-manager/contacts"
      ? pathname === "/property-manager/contacts"
      : pathname.startsWith(tab.href)
  )?.key ?? ""
  const activeHref = tabs.find(t => t.key === activeKey)?.href ?? tabs[0].href
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeKey)

  return (
    <div className="border-b border-slate-200 bg-white shadow-[0_1px_0_0_#e2e8f0]">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      {/* relative wrapper enables after: fade to indicate scrollable tab row on desktop */}
      <div className="hidden md:block relative">
      <div
        ref={containerRef}
        className="flex items-end gap-0 overflow-x-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none"
        role="tablist"
        aria-label="Contacts navigation"
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey

          return (
            <Link
              key={tab.key}
              ref={itemRef(tab.key)}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={cn(
                "relative inline-flex items-center gap-1 px-4 py-3.5 text-[13px] font-medium whitespace-nowrap",
                "border-b-2 -mb-px transition-colors duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-t",
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              {tab.label}
              {tab.key === "guests" && (
                <Lock className="w-2.5 h-2.5 text-slate-300 ml-0.5" aria-label="Gated feature" />
              )}
            </Link>
          )
        })}
      </div>
      </div>
    </div>
  )
}
