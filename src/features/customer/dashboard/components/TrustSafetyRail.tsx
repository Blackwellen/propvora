"use client"

import Link from "next/link"
import { ShieldCheck, Settings2, CheckCircle2 } from "lucide-react"

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">{children}</div>
}
function TrustRow({ icon: Icon, title, sub }: { icon: typeof ShieldCheck; title: string; sub: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800">{title}</p>
        <p className="text-[12px] text-slate-500">{sub}</p>
      </div>
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
    </li>
  )
}

export default function TrustSafetyRail() {
  return (
    <Card>
      <h3 className="text-[15px] font-bold text-slate-900 mb-3">Trust &amp; safety</h3>
      <ul className="space-y-3">
        <TrustRow icon={ShieldCheck} title="Secure payments" sub="Your payments are protected" />
        <TrustRow icon={Settings2} title="Verified hosts" sub="All hosts are checked and verified" />
      </ul>
      <Link href="/customer/help" className="mt-3 inline-block text-[12.5px] font-semibold text-blue-600 hover:text-blue-700">
        Learn more about safety →
      </Link>
    </Card>
  )
}
