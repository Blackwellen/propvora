"use client"

import { ArrowRight } from "lucide-react"
import { useCustomerToast } from "../../components/toast"

export default function InvitePromoRail() {
  const { toast } = useCustomerToast()
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/property-types/holiday.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[#0D1B2A]/85" />
      <div className="relative p-5">
        <h3 className="text-white text-[15px] font-bold">Invite friends, earn credit</h3>
        <p className="text-white/80 text-[12.5px] mt-1">Give £25, get £25 when they book their first stay.</p>
        <button
          onClick={() => toast("Referral link copied to clipboard", "success")}
          className="mt-3 inline-flex items-center gap-2 bg-white text-[#0D1B2A] rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-slate-100"
        >
          Invite friends <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
