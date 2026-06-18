"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Building2,
  Columns3,
  Clock,
  Globe,
  MessageSquare,
  FileText,
  Activity,
} from "lucide-react"

const CONTACTS_TABS = [
  { key: "overview",      label: "Overview",       href: "/app/contacts",               icon: LayoutDashboard },
  { key: "people",        label: "People",          href: "/app/contacts/people",         icon: Users },
  { key: "guests",        label: "Guests",          href: "/app/contacts/guests",         icon: BedDouble },
  { key: "organisations", label: "Organisations",   href: "/app/contacts/organisations",  icon: Building2 },
  { key: "board",         label: "Board",           href: "/app/contacts/board",          icon: Columns3 },
  { key: "timeline",      label: "Timeline",        href: "/app/contacts/timeline",       icon: Clock },
  { key: "portal",        label: "Portal Access",   href: "/app/contacts/portal-access",  icon: Globe },
  { key: "messages",      label: "Messages",        href: "/app/contacts/messages",       icon: MessageSquare },
  { key: "documents",     label: "Documents",       href: "/app/contacts/documents",      icon: FileText },
  { key: "activity",      label: "Activity",        href: "/app/contacts/activity",       icon: Activity },
] as const

export function ContactsTabNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white shadow-[0_1px_0_0_#e2e8f0]">
      <div
        className="flex items-end gap-0 overflow-x-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        role="tablist"
        aria-label="Contacts navigation"
      >
        {CONTACTS_TABS.map((tab) => {
          const active =
            tab.href === "/app/contacts"
              ? pathname === "/app/contacts"
              : pathname.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.key}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-medium whitespace-nowrap",
                "border-b-2 -mb-px transition-colors duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-t",
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              <Icon
                className={cn(
                  "w-[15px] h-[15px] shrink-0 transition-colors duration-150",
                  active ? "text-blue-600" : "text-slate-400"
                )}
              />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
