"use client"

import Link from "next/link"
import { UserCircle, ShieldCheck, Users, MapPin, ChevronRight } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"

const LINKS = [
  {
    href: "/supplier/profile",
    label: "Business profile",
    desc: "Name, bio, trades and presentation",
    icon: UserCircle,
  },
  {
    href: "/supplier/verification",
    label: "Verification & badges",
    desc: "Trust level and evidence",
    icon: ShieldCheck,
  },
  {
    href: "/supplier/team",
    label: "Team & roles",
    desc: "Who can access this workspace",
    icon: Users,
  },
  {
    href: "/supplier/coverage",
    label: "Coverage areas",
    desc: "Where you operate",
    icon: MapPin,
  },
]

export function SettingsNavigationLinks() {
  return (
    <SupplierCard className="divide-y divide-slate-100">
      {LINKS.map((l) => {
        const Icon = l.icon
        return (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{l.label}</p>
              <p className="text-xs text-slate-400">{l.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
        )
      })}
    </SupplierCard>
  )
}
