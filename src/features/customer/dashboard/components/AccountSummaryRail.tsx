"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { account } from "../../data/mock"

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">{children}</div>
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12.5px] text-slate-500 shrink-0">{label}</dt>
      <dd className="text-[12.5px] font-semibold text-slate-800 truncate text-right">{value}</dd>
    </div>
  )
}

export default function AccountSummaryRail() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-bold text-slate-900">Account summary</h3>
        <Link href="/customer/account-settings" className="text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)] inline-flex items-center gap-1">
          View profile <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <dl className="space-y-2.5">
        <SummaryRow label="Full name" value={account.fullName} />
        <SummaryRow label="Email address" value={account.email} />
        <SummaryRow label="Phone number" value={account.phone} />
        <SummaryRow label="Member since" value={account.memberSince} />
        <div className="flex items-center justify-between">
          <dt className="text-[12.5px] text-slate-500">Verification</dt>
          <dd className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </dd>
        </div>
      </dl>
    </Card>
  )
}
