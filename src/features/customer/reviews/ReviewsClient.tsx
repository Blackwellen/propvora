"use client"

import { useState } from "react"
import Link from "next/link"
import {
  PencilLine, FileText, Star, MessagesSquare, ShieldCheck, Calendar, Users, Lightbulb,
  Gift, Headphones, MoreHorizontal, Globe, CheckCircle2, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { StatusPill } from "../components/StatusPill"

const TABS = ["To write", "Submitted", "Responses", "Saved stays"]
const RATING_CATS = ["Cleanliness", "Communication", "Location", "Value for money", "Overall"]

export interface AwaitingReview {
  id: string
  title: string
  location: string
  image: string
  dates: string
  guests: number
  completed: string
}
export interface SubmittedReview {
  id: string
  stay: string
  loc: string
  image: string
  rating: number
  when: string
  responded: boolean
  respWhen?: string
}

export default function ReviewsClient({ awaiting = [], submitted = [] }: { awaiting?: AwaitingReview[]; submitted?: SubmittedReview[] }) {
  const { toast } = useCustomerToast()
  const [tab, setTab] = useState("To write")

  const AWAITING = awaiting
  const SUBMITTED = submitted
  const avgRating = SUBMITTED.length ? (SUBMITTED.reduce((s, r) => s + r.rating, 0) / SUBMITTED.length) : 0
  const responses = SUBMITTED.filter((s) => s.responded).length
  const KPIS = [
    { id: "pending", label: "Reviews pending", value: String(AWAITING.length), sub: AWAITING.length ? "Awaiting your review" : "All caught up", icon: PencilLine, bg: "bg-violet-50 text-violet-600" },
    { id: "submitted", label: "Submitted reviews", value: String(SUBMITTED.length), sub: "View all", icon: FileText, bg: "bg-emerald-50 text-emerald-600", link: "#submitted" },
    { id: "rating", label: "Average stay rating", value: avgRating ? avgRating.toFixed(1) : "—", sub: SUBMITTED.length ? `From ${SUBMITTED.length} review${SUBMITTED.length === 1 ? "" : "s"}` : "No reviews yet", icon: Star, bg: "bg-amber-50 text-amber-600" },
    { id: "responses", label: "Host responses", value: String(responses), sub: "From your hosts", icon: MessagesSquare, bg: "bg-[var(--brand-soft)] text-[var(--brand)]" },
    { id: "trust", label: "Reviewer", value: SUBMITTED.length >= 3 ? "Trusted" : "New", sub: "Based on your activity", icon: ShieldCheck, bg: "bg-emerald-50 text-emerald-600" },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold text-slate-900">Reviews</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Share your experience, help other travellers, and build trust in the Propvora community.</p>
      </div>

      {/* Tabs */}
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden border-b border-slate-200 pb-2.5">
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
          aria-label="Navigate section"
        >
          {TABS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-3.5 py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px", t === tab ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500 hover:text-slate-800")}>{t}</button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
            <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[12px] font-medium text-slate-500 mt-1">{k.label}</p>
            <p className="text-[11px] text-[var(--brand)] mt-0.5 font-semibold">{k.sub}</p>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          {/* Awaiting review */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1"><h3 className="text-[15px] font-bold text-slate-900">Stays awaiting your review</h3>{AWAITING.length > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center">{AWAITING.length}</span>}</div>
            <p className="text-[12.5px] text-slate-500 mb-3">Share your feedback to help other guests and hosts.</p>
            {AWAITING.length === 0 && <p className="py-6 text-center text-[13px] text-slate-400">No stays are awaiting a review right now.</p>}
            <div className="divide-y divide-slate-100">
              {AWAITING.map((a) => (
                <div key={a.id} className="flex flex-col lg:flex-row gap-4 py-4 first:pt-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.image} alt="" className="w-full lg:w-28 h-24 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900">{a.title}</p>
                    <p className="text-[12.5px] text-slate-500">{a.location}</p>
                    <p className="text-[11.5px] text-slate-400 mt-0.5 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {a.dates} <Users className="w-3.5 h-3.5 ml-1" /> {a.guests} guests</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                      {RATING_CATS.map((c) => (
                        <div key={c}><p className="text-[10.5px] text-slate-500 mb-0.5">{c}</p><StarInput onRate={() => toast(`Rated ${c}`, "success")} /></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:w-36 shrink-0">
                    <button onClick={() => toast("Opening review editor…", "info")} className="bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white rounded-xl py-2 text-[12.5px] font-semibold">Write review</button>
                    <Link href={`/customer/stays/${a.id}`} className="text-center border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50">View property</Link>
                    <p className="text-[10.5px] text-slate-400 text-center">Stay completed {a.completed}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-2 text-[12.5px] font-semibold text-[var(--brand)] inline-flex items-center justify-center gap-1">View all stays <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>

          {/* Submitted reviews table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5" id="submitted">
            <h3 className="text-[15px] font-bold text-slate-900 mb-3">Your submitted reviews</h3>
            {SUBMITTED.length === 0 && <p className="py-6 text-center text-[13px] text-slate-400">You haven&apos;t submitted any reviews yet.</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-2 font-semibold">Stay</th><th className="py-2 px-2 font-semibold">Your review</th><th className="py-2 px-2 font-semibold">Host response</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 font-semibold">Visibility</th><th className="py-2 px-2 w-8"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {SUBMITTED.map((s) => (
                    <tr key={s.id} className="text-[12.5px]">
                      <td className="py-3 pr-2"><div className="flex items-center gap-2.5 min-w-[170px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" /><div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{s.stay}</p><p className="text-slate-400 text-[11px] truncate">{s.loc}</p></div></div></td>
                      <td className="py-3 px-2"><Stars value={s.rating} /><p className="text-[10.5px] text-slate-400 mt-0.5">Submitted {s.when}</p></td>
                      <td className="py-3 px-2">{s.responded ? <div><StatusPill tone="emerald">Responded</StatusPill><p className="text-[10.5px] text-slate-400 mt-0.5">{s.respWhen}</p></div> : <span className="text-[11.5px] text-slate-400">No response yet</span>}</td>
                      <td className="py-3 px-2"><StatusPill tone="emerald">Published</StatusPill></td>
                      <td className="py-3 px-2"><span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500"><Globe className="w-3.5 h-3.5" /> Public</span></td>
                      <td className="py-3 px-2 text-right"><MoreHorizontal className="w-4 h-4 text-slate-400 inline" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="w-full mt-3 text-[12.5px] font-semibold text-[var(--brand)] inline-flex items-center justify-center gap-1">View all submitted reviews <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>

          {/* bottom cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <Lightbulb className="w-5 h-5 text-amber-500" /><p className="text-[13px] font-bold text-slate-900 mt-2">Review tips</p>
              {["Be honest and specific", "Mention what you loved", "Share helpful details", "Keep it respectful"].map((t) => <p key={t} className="text-[11.5px] text-slate-500 flex items-center gap-1.5 mt-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t}</p>)}
              <Link href="#" className="mt-2 inline-block text-[12px] font-semibold text-[var(--brand)]">Read our review guidelines →</Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <Gift className="w-5 h-5 text-violet-500" /><p className="text-[13px] font-bold text-slate-900 mt-2">Earn review credits</p>
              <p className="text-[11.5px] text-slate-500 mt-1">You have 2 credits. Earn 1 credit for each published review.</p>
              <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden"><div className="h-full bg-[var(--brand)] rounded-full" style={{ width: "20%" }} /></div>
              <p className="text-[10.5px] text-slate-400 mt-1">2 / 10 credits</p>
              <Link href="#" className="mt-1 inline-block text-[12px] font-semibold text-[var(--brand)]">How credits work →</Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <Headphones className="w-5 h-5 text-[var(--brand)]" /><p className="text-[13px] font-bold text-slate-900 mt-2">Need help?</p>
              <p className="text-[11.5px] text-slate-500 mt-1">Our support team is here to help with reviews, responses, or any issues.</p>
              <Link href="/customer/help" className="mt-3 inline-block bg-[var(--brand)] text-white rounded-xl px-3 py-1.5 text-[12px] font-semibold">Contact support</Link>
            </div>
          </div>
        </div>

        {/* Right rail: how reviews work + tips (no fabricated example) */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <h3 className="text-[14px] font-bold text-slate-900">Writing a great review</h3>
          <p className="text-[12px] text-slate-500 mt-1">Honest, specific reviews help other guests and hosts. You can review a stay once it&apos;s completed.</p>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-700 mb-2">What to rate</p>
            {RATING_CATS.map((c) => (
              <p key={c} className="text-[11.5px] text-slate-500 flex items-center gap-1.5 py-0.5"><Star className="w-3.5 h-3.5 text-amber-400" /> {c}</p>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-700 mb-2">Tips</p>
            {["Be specific about what stood out", "Keep it fair and factual", "Mention anything the host could improve"].map((t) => (
              <p key={t} className="text-[11.5px] text-slate-500 flex items-center gap-1.5 py-0.5"><Lightbulb className="w-3.5 h-3.5 text-[var(--brand)]" /> {t}</p>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[var(--brand)]" /> Trust &amp; safety</p>
            <p className="text-[11.5px] text-slate-500">Reviews are tied to completed bookings, so they reflect real stays.</p>
            <Link href="/customer/help" className="mt-2 inline-block text-[12px] font-semibold text-[var(--brand)]">Learn more about reviews →</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("w-3.5 h-3.5", i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />)}</span>
}
function StarInput({ onRate }: { onRate: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  const [val, setVal] = useState(0)
  return (
    <span className="inline-flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} onMouseEnter={() => setHover(i)} onClick={() => { setVal(i); onRate(i) }}>
          <Star className={cn("w-4 h-4", i <= (hover || val) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
        </button>
      ))}
    </span>
  )
}
function Mini({ l, v }: { l: string; v: string }) {
  return <div><p className="text-[10px] text-slate-400">{l}</p><p className="text-[11.5px] font-semibold text-slate-800">{v}</p></div>
}
