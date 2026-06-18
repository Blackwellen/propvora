"use client"
import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { AccountingStepper } from "./AccountingStepper"
import { useSectionLink } from "@/components/sections/SectionBasePath"

interface WizardStep {
  number: number
  label: string
  sublabel?: string
}

interface AccountingWizardShellProps {
  breadcrumbNumber: string
  breadcrumbLabel: string
  title: string
  subtitle?: string
  badge?: string
  steps: WizardStep[]
  currentStep: number
  leftContent: React.ReactNode
  rightRail?: React.ReactNode
  footer?: React.ReactNode
  accountingHref?: string
  className?: string
}

export function AccountingWizardShell({
  breadcrumbNumber,
  breadcrumbLabel,
  title,
  subtitle,
  badge,
  steps,
  currentStep,
  leftContent,
  rightRail,
  footer,
  accountingHref = "/app/accounting/accounts/overview",
  className,
}: AccountingWizardShellProps) {
  const sectionLink = useSectionLink()
  return (
    <div className={cn("w-full max-w-[1400px] mx-auto", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Link href={sectionLink("/app/accounting")} className="hover:text-slate-600 transition-colors">Accounting</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-500 font-medium">{breadcrumbNumber} · {breadcrumbLabel}</span>
        </div>
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              {badge && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{badge}</span>
              )}
            </div>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 mb-6">
        <AccountingStepper steps={steps} currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full">{leftContent}</div>
        {rightRail && <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 space-y-4">{rightRail}</aside>}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-6 flex items-center justify-between pt-6 border-t border-[#E2E8F0]">
          {footer}
        </div>
      )}
    </div>
  )
}
