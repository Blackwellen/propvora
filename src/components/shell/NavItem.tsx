"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface NavItemProps {
  label: string
  href: string
  icon: React.ElementType
  collapsed: boolean
  active: boolean
  onClick?: () => void
}

export default function NavItem({
  label,
  href,
  icon: Icon,
  collapsed,
  active,
  onClick,
}: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative mx-2 mb-0.5",
        // When collapsed, centre the icon (and its highlight) within the rail.
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-[rgba(37,99,235,0.26)] border border-[rgba(56,189,248,0.55)] text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          : "text-[#DCEBFF] hover:bg-white/[0.07] hover:text-white border border-transparent"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 shrink-0 transition-colors",
          active
            ? "text-[#38BDF8]"
            : "text-[#93C5FD] group-hover:text-[#DCEBFF]"
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0F172A] text-white text-[12px] font-medium rounded-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl border border-white/10">
          {label}
        </div>
      )}
    </Link>
  )
}
