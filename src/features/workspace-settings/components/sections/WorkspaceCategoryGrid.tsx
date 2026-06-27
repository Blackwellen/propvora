"use client"

import React from "react"
import Link from "next/link"
import { Settings, CreditCard, Zap, Sliders, Shield, AlertTriangle } from "lucide-react"

export interface CategoryItem {
  href: string
  icon: React.ReactNode
  label: string
  description: string
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    href: "/property-manager/workspace-settings/profile",
    icon: <Settings className="w-5 h-5" />,
    label: "General",
    description: "Workspace identity, contact details and regional settings",
  },
  {
    href: "/property-manager/workspace-settings/billing",
    icon: <CreditCard className="w-5 h-5" />,
    label: "Billing",
    description: "Manage your subscription, payment methods and invoices",
  },
  {
    href: "/property-manager/workspace-settings/ai",
    icon: <Zap className="w-5 h-5" />,
    label: "AI",
    description: "Configure AI Copilot policies and usage limits",
  },
  {
    href: "/property-manager/workspace-settings/notifications",
    icon: <Sliders className="w-5 h-5" />,
    label: "Configuration",
    description: "Notifications, integrations and storage preferences",
  },
  {
    href: "/property-manager/workspace-settings/security",
    icon: <Shield className="w-5 h-5" />,
    label: "Security",
    description: "MFA policies, session timeouts and access controls",
  },
  {
    href: "/property-manager/workspace-settings/danger-zone",
    icon: <AlertTriangle className="w-5 h-5" />,
    label: "Advanced",
    description: "Data export, workspace transfer and deletion",
  },
]

export interface WorkspaceCategoryGridProps {
  categories?: CategoryItem[]
}

export function WorkspaceCategoryGrid({ categories = DEFAULT_CATEGORIES }: WorkspaceCategoryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-8">
      {categories.map((cat) => (
        <Link
          key={cat.href}
          href={cat.href}
          className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[var(--brand)] hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)] mb-3 group-hover:bg-[var(--brand)] group-hover:text-white transition-colors">
            {cat.icon}
          </div>
          <p className="text-[14px] font-bold text-slate-900 mb-1">{cat.label}</p>
          <p className="text-[12px] text-slate-500 leading-relaxed">{cat.description}</p>
        </Link>
      ))}
    </div>
  )
}
