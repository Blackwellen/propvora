"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { StatusPill } from "../../../components/StatusPill"

interface Props {
  icon: React.ElementType
  title: string
  status: string
  tone: "emerald" | "amber" | "slate"
  detail: string
  cta: string
  onClick?: () => void
  href?: string
  primary?: boolean
  ctaIcon: React.ElementType
}

export default function TenancySetupCard({ icon: Icon, title, status, tone, detail, cta, onClick, href, primary, ctaIcon: CtaIcon }: Props) {
  const btnCls = primary
    ? "bg-[#2563EB] text-white"
    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
  const inner = (
    <>
      <CtaIcon className="w-4 h-4" /> {cta}
    </>
  )
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
      <span
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
          tone === "emerald"
            ? "bg-emerald-50 text-emerald-600"
            : tone === "amber"
            ? "bg-amber-50 text-amber-600"
            : "bg-slate-50 text-slate-400"
        )}
      >
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13.5px] font-semibold text-slate-800">{title}</p>
          <StatusPill tone={tone}>{status}</StatusPill>
        </div>
        <p className="text-[12px] text-slate-500 mt-0.5">{detail}</p>
      </div>
      {href ? (
        <Link href={href} className={cn("inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold shrink-0", btnCls)}>
          {inner}
        </Link>
      ) : (
        <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold shrink-0", btnCls)}>
          {inner}
        </button>
      )}
    </div>
  )
}
