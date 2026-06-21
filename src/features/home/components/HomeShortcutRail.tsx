"use client"

import Link from "next/link"
import {
  Building2,
  LayoutGrid,
  Users,
  CheckSquare,
  Briefcase,
  Truck,
  UserCircle,
  FileText,
  Receipt,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ShortcutItem {
  label: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  href: string
}

const SHORTCUTS: ShortcutItem[] = [
  { label: "Properties", icon: Building2, iconBg: "bg-blue-100", iconColor: "text-blue-600", href: "/property-manager/portfolio/properties" },
  { label: "Units", icon: LayoutGrid, iconBg: "bg-indigo-100", iconColor: "text-indigo-600", href: "/property-manager/portfolio/units" },
  { label: "Tenancies", icon: Users, iconBg: "bg-green-100", iconColor: "text-green-600", href: "/property-manager/portfolio/tenancies" },
  { label: "Tasks", icon: CheckSquare, iconBg: "bg-amber-100", iconColor: "text-amber-600", href: "/property-manager/work/tasks" },
  { label: "Jobs", icon: Briefcase, iconBg: "bg-orange-100", iconColor: "text-orange-600", href: "/property-manager/work/jobs" },
  { label: "Suppliers", icon: Truck, iconBg: "bg-purple-100", iconColor: "text-purple-600", href: "/property-manager/work/suppliers" },
  { label: "People", icon: UserCircle, iconBg: "bg-pink-100", iconColor: "text-pink-600", href: "/property-manager/contacts" },
  { label: "Documents", icon: FileText, iconBg: "bg-slate-100", iconColor: "text-slate-600", href: "/property-manager/compliance/documents" },
  { label: "Invoices", icon: Receipt, iconBg: "bg-teal-100", iconColor: "text-teal-600", href: "/property-manager/money/invoices" },
]

export function HomeShortcutRail() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-3">
      <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors min-w-[72px] group flex-shrink-0"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.iconBg} group-hover:scale-105 transition-transform`}>
              <item.icon className={`w-4 h-4 ${item.iconColor}`} />
            </div>
            <span className="text-[11px] font-medium text-slate-600 group-hover:text-blue-600 whitespace-nowrap transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
