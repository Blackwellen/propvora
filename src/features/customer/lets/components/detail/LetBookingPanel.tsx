"use client"

import Link from "next/link"
import { CheckCircle2, Circle, Heart, Star } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../../../components/toast"
import { StatusPill } from "../../../components/StatusPill"
import type { LetProperty } from "../../../data/lets"

function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-slate-500">{l}</span>
      <span className="text-slate-700 font-medium">{r}</span>
    </div>
  )
}

function J({ text, done }: { text: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
      )}
      <span className="text-[11.5px] text-slate-600">{text}</span>
    </li>
  )
}

export default function LetBookingPanel({ p }: { p: LetProperty }) {
  const { toast } = useCustomerToast()
  return (
    <aside className="space-y-5 sticky top-[84px]">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[24px] font-bold text-slate-900">
              {formatPence(p.rentPence, "GBP")}
              <span className="text-[13px] text-slate-400 font-medium">/month</span>
            </p>
            <StatusPill tone="emerald">{p.available}</StatusPill>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <Link
            href="/customer/lets/viewings/VW-2042"
            className="block text-center bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold"
          >
            Book a viewing
          </Link>
          <Link
            href="/customer/lets/applications/AP-7841/wizard"
            className="block text-center border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Start application
          </Link>
          <Link
            href="/customer/lets/offers/OFF-250418-22"
            className="block text-center border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Make an offer
          </Link>
          <button
            onClick={() => toast("Saved to favourites", "success")}
            className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Heart className="w-4 h-4" /> Save to favourites
          </button>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          <Row l="Monthly rent" r={formatPence(p.rentPence, "GBP")} />
          <Row l="Holding deposit" r={formatPence(Math.round(p.rentPence * 0.23), "GBP")} />
          <Row l="Security deposit" r={formatPence(Math.round(p.rentPence * 1.15), "GBP")} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2">Your journey to a new home</p>
        <ol className="space-y-2">
          <J done text="Browse &amp; shortlist" />
          <J done text="Book a viewing" />
          <J text="Apply &amp; reference" />
          <J text="Make an offer" />
          <J text="Sign &amp; move in" />
        </ol>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2 flex items-center gap-1.5">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Reviews from tenants
        </p>
        <p className="text-[12px] text-slate-600">
          "Brilliant building and a responsive landlord — everything was sorted within hours."
        </p>
        <p className="text-[10.5px] text-slate-400 mt-1">— Previous tenant · 4.9/5</p>
      </div>
    </aside>
  )
}
