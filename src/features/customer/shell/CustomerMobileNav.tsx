"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Compass, BookOpen, CalendarCheck, MessageSquare, type LucideIcon } from "lucide-react"

/* Customer mobile bottom nav — a thumb-reachable subset of the top nav, shown
   only below md. Routes are the literal `/customer/*` paths. */

const ITEMS: { label: string; href: string; icon: LucideIcon; match: string[]; badge?: "messages" }[] = [
  { label: "Home", href: "/customer", icon: Home, match: ["/customer", "/customer/home"] },
  { label: "Stays", href: "/customer/stays", icon: Compass, match: ["/customer/stays"] },
  { label: "Lets", href: "/customer/lets", icon: BookOpen, match: ["/customer/lets"] },
  { label: "Bookings", href: "/customer/bookings", icon: CalendarCheck, match: ["/customer/bookings"] },
  { label: "Messages", href: "/customer/messages", icon: MessageSquare, match: ["/customer/messages"], badge: "messages" },
]

export default function CustomerMobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.match.some((m) =>
            m === "/customer" ? pathname === "/customer" : pathname === m || pathname.startsWith(m + "/")
          )
          const badge = item.badge === "messages" ? unreadMessages : 0
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10.5px] font-semibold transition-colors",
                  active ? "text-[#2563EB]" : "text-slate-500"
                )}
              >
                <span className="relative">
                  <Icon className="w-[22px] h-[22px]" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
