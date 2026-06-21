"use client"

import Link from "next/link"
import { MessageSquare, KeyRound, Download, PencilLine, Flag, Shield, CheckCircle2, HelpCircle, LifeBuoy, Phone, ChevronRight } from "lucide-react"
import { useCustomerToast } from "../../components/toast"
import type { Booking } from "../data/bookings"

const ACT_TONE: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", amber: "bg-amber-100 text-amber-600", blue: "bg-blue-100 text-blue-600", violet: "bg-violet-100 text-violet-600" }

function Act({ tone, title, sub, when, last }: { tone: string; title: string; sub: string; when: string; last?: boolean }) {
  return (
    <li className="relative flex gap-2.5">
      {!last && <span className="absolute left-[11px] top-6 bottom-[-10px] w-px bg-slate-100" />}
      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${ACT_TONE[tone]}`}><CheckCircle2 className="w-3 h-3" /></span>
      <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-semibold text-slate-800">{title}</p><p className="text-[10px] text-slate-400 shrink-0">{when}</p></div><p className="text-[11px] text-slate-500">{sub}</p></div>
    </li>
  )
}
function NeedLink({ icon: Icon, title, sub, href }: { icon: typeof HelpCircle; title: string; sub: string; href: string }) {
  return <Link href={href} className="flex items-center gap-2.5 py-2 group"><span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0"><Icon className="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-[12px] font-semibold text-slate-800">{title}</p><p className="text-[10.5px] text-slate-500 truncate">{sub}</p></div><ChevronRight className="w-4 h-4 text-slate-300 shrink-0" /></Link>
}
function RailBtn({ icon: Icon, children, onClick }: { icon: typeof Download; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"><Icon className="w-4 h-4" /> {children}</button>
}

interface Props { b: Booking }

export default function BookingDetailRail({ b }: Props) {
  const { toast } = useCustomerToast()
  return (
    <aside className="space-y-5 sticky top-[84px]">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
        <button onClick={() => toast(`Messaging ${b.host}…`, "info")} className="w-full inline-flex items-center justify-center gap-2 bg-[#0D1B2A] text-white rounded-xl py-2.5 text-[13px] font-semibold"><MessageSquare className="w-4 h-4" /> Message host</button>
        <RailBtn icon={KeyRound} onClick={() => toast("Check-in details — coming soon", "info")}>Check-in details</RailBtn>
        <RailBtn icon={Download} onClick={() => toast("Downloading receipt…", "info")}>Download receipt</RailBtn>
        <RailBtn icon={PencilLine} onClick={() => toast("Edit booking — coming soon", "info")}>View / edit booking</RailBtn>
        <button onClick={() => toast("Cancellation flow — coming soon", "info")} className="w-full inline-flex items-center justify-center gap-2 border border-rose-200 text-rose-600 rounded-xl py-2.5 text-[13px] font-semibold hover:bg-rose-50"><Flag className="w-4 h-4" /> Cancel booking</button>
        <p className="text-[11px] text-rose-500 text-center">Free cancellation until 20 May 2025</p>
        <Link href={`/customer/bookings/${b.id}/dispute`} className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-[13px] font-semibold hover:bg-slate-50"><Shield className="w-4 h-4" /> Open dispute</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="text-[13px] font-bold text-slate-900">Booking activity</h3><button className="text-[11.5px] font-semibold text-blue-600">View all</button></div>
        <ol className="space-y-2.5">
          <Act tone="emerald" title="Booking confirmed" sub="Your booking has been confirmed" when="24 May · 10:24" />
          <Act tone="amber" title="Payment successful" sub="£994.40 paid in full" when="24 May · 10:24" />
          <Act tone="blue" title="Host accepted" sub="James accepted your booking" when="24 May · 10:27" />
          <Act tone="violet" title="Check-in instructions sent" sub="Details are now available" when="23 May · 09:12" last />
        </ol>
        <button onClick={() => toast("Full timeline — coming soon", "info")} className="mt-3 w-full border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50">View full timeline</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-[13px] font-bold text-slate-900">Need help?</h3>
        <p className="text-[11.5px] text-slate-400 mb-2">We're here 24/7</p>
        <NeedLink icon={HelpCircle} title="Visit our Help Centre" sub="Find answers to common questions" href="/customer/help" />
        <NeedLink icon={LifeBuoy} title="Contact support" sub="We typically reply in under 5 minutes" href="/customer/help" />
        <NeedLink icon={Phone} title="Emergency assistance" sub="For urgent matters during your stay" href="/customer/help" />
      </div>
    </aside>
  )
}
