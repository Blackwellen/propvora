"use client"

import Link from "next/link"

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function FinRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className="text-[12px] font-semibold text-slate-800">{value}</span>
    </div>
  )
}

export default function FinanceSection() {
  return (
    <Panel
      title="Finance &amp; payment settings"
      action={
        <Link href="/customer/payments" className="text-[12px] font-semibold text-[var(--brand)]">
          Open payments →
        </Link>
      }
    >
      <FinRow label="Default payment method" value="Not set" />
      <FinRow label="Autopay" value="Configure in payments" />
      <FinRow label="Refund destination" value="Original payment method" />
      <FinRow label="Billing currency" value="GBP (£)" />
    </Panel>
  )
}
