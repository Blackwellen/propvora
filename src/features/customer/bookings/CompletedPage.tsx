"use client"

import Link from "next/link"
import {
  CheckCircle2, Copy, Calendar, Users, Download, Star, Gift, AlertTriangle, RotateCcw,
  Shield, Settings2, Headphones, ChevronRight, Heart, Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { propertyImages as IMG } from "../data/mock"

const RECS: { id: string; title: string; location: string; image: string; rating: number; reviews: number; price: string }[] = []

export default function CompletedPage() {
  const { toast } = useCustomerToast()
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-6">
        {/* Hero header */}
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><CheckCircle2 className="w-8 h-8 text-white" /></span>
          <div>
            <h1 className="text-[26px] font-bold text-slate-900">Booking complete!</h1>
            <p className="text-[13.5px] text-slate-500">Thank you for staying with us. We hope you had a wonderful experience.</p>
          </div>
        </div>

        {/* Booking hero card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="relative sm:w-72 h-48 sm:h-auto shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.lakeside} alt="" className="w-full h-full object-cover" />
              <span className="absolute bottom-2.5 left-2.5 bg-emerald-500 text-white text-[11px] font-semibold rounded-full px-2.5 py-1">Completed</span>
            </div>
            <div className="flex-1 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] text-slate-400">Booking reference</span>
                <button onClick={() => toast("Booking reference copied", "success")} className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600"><span className="text-slate-800">—</span><Copy className="w-3.5 h-3.5" /></button>
              </div>
              <h2 className="text-[19px] font-bold text-slate-900 mt-1">Your completed stay</h2>
              <p className="text-[13px] text-slate-500">Details will appear here from your booking.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
                <Mini label="Check-in" value="—" />
                <Mini label="Check-out" value="—" />
                <Mini label="Guests" value="—" />
                <Mini label="Total paid" value="—" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-50/60 border-t border-emerald-100 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
            <StatusItem title="Stay completed" sub="Thank you for staying with us." />
            <StatusItem title="Deposit" sub="Deposit status will appear here." />
            <div className="flex flex-col"><span className="text-[11px] text-slate-500">Payment status</span><span className="text-[12px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 w-fit mt-0.5">Paid in full</span></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
            <ActBtn icon={Download} onClick={() => window.location.assign("/customer/bookings")}>View receipt</ActBtn>
            <ActBtn icon={Download} onClick={() => window.location.assign("/customer/bookings")}>View invoice</ActBtn>
            <ActBtn icon={Calendar} onClick={() => window.location.assign("/customer/bookings")}>View bookings</ActBtn>
          </div>
        </div>

        {/* What happens next */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-3">What happens next?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NextCard icon={Mail} tone="slate" title="Thanks for staying!" sub="Your receipt and booking details have been sent to your email address." />
            <NextCard icon={CheckCircle2} tone="emerald" title="Deposit" sub="Your security deposit will be returned to your original payment method if applicable." />
            <NextCard icon={Heart} tone="violet" title="We'd love your feedback" sub="Leave a review to help your host and future guests." />
          </div>
        </div>

        {/* Share your experience */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-3">Share your experience</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ShareCard icon={Star} tone="blue" title="Leave a review" sub="Rate your stay and help others" cta="Write a review" href="/customer/reviews" />
            <ShareCard icon={RotateCcw} tone="amber" title="Rebook this stay" sub="Loved it? Book again" cta="Book again" onClick={() => toast("Rebooking…", "info")} />
            <ShareCard icon={AlertTriangle} tone="red" title="Report an issue" sub="Something not right?" cta="Report issue" href="/customer/bookings" />
          </div>
        </div>

        {/* Trip summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[15px] font-bold text-slate-900 mb-3">Your trip summary</h3>
          <dl className="space-y-2.5">
            <SumLine icon={Calendar} l="Stay duration" r="—" />
            <SumLine icon={Users} l="Travellers" r="—" />
            <SumLine icon={Calendar} l="Check-in" r="—" />
          </dl>
        </div>
      </div>

      {/* Right rail */}
      <aside className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Recommended for you</h3><Link href="/customer/stays" className="text-[12px] font-semibold text-[var(--brand)]">View all</Link></div>
          <ul className="space-y-3">
            {RECS.map((r) => (
              <li key={r.id}><Link href={`/customer/stays/${r.id}`} className="flex gap-3 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-slate-800 truncate group-hover:text-[var(--brand)]">{r.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{r.location}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {r.rating} ({r.reviews})</p>
                </div>
                <span className="text-[12px] font-bold text-slate-900 shrink-0">{r.price}<span className="text-slate-400 font-normal text-[10px]"> / night</span></span>
              </Link></li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-[14px] font-bold text-slate-900 mb-3">Your safety, our priority</h3>
          <ul className="space-y-3">
            <Safe icon={Shield} title="Secure payments" sub="Your payments are protected" />
            <Safe icon={Settings2} title="Verified hosts" sub="All hosts are checked and verified" />
            <Safe icon={Headphones} title="Support when you need it" sub="Message our team any time" />
          </ul>
          <Link href="/customer/help" className="mt-3 inline-block text-[12px] font-semibold text-[var(--brand)]">Learn more about safety →</Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-[14px] font-bold text-slate-900 mb-2">Your host</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="w-9 h-9 rounded-full bg-slate-200" /><div><p className="text-[12.5px] font-semibold text-slate-800">Host details</p><p className="text-[11px] text-slate-400">Available from your booking</p></div></div>
            <button onClick={() => toast("Messaging host…", "info")} className="text-[11.5px] font-semibold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1">Message host</button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/property-types/holiday.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0D1B2A]/85" />
          <div className="relative p-4">
            <h3 className="text-white text-[14px] font-bold">Earn credit for your next stay</h3>
            <p className="text-white/80 text-[12px] mt-1">Invite friends and you'll both get £25 when they book their first stay.</p>
            <button onClick={() => toast("Referral link copied", "success")} className="mt-3 inline-flex items-center gap-1.5 bg-white text-[#0D1B2A] rounded-lg px-3 py-1.5 text-[12.5px] font-semibold"><Gift className="w-4 h-4" /> Invite friends</button>
          </div>
        </div>
      </aside>
    </div>
  )
}

/* helpers */
function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[13px] font-semibold text-slate-800">{value}</p>{sub && <p className="text-[10.5px] text-slate-400">{sub}</p>}</div>
}
function StatusItem({ title, sub }: { title: string; sub: string }) {
  return <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><div><p className="text-[12.5px] font-semibold text-slate-800">{title}</p><p className="text-[11px] text-slate-500">{sub}</p></div></div>
}
function ActBtn({ icon: Icon, children, onClick }: { icon: typeof Download; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"><Icon className="w-4 h-4" /> {children}</button>
}
const TONE_BG: Record<string, string> = { slate: "bg-slate-100 text-slate-500", emerald: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600", blue: "bg-[var(--brand-soft)] text-[var(--brand)]", amber: "bg-amber-50 text-amber-600", red: "bg-rose-50 text-rose-500" }
function NextCard({ icon: Icon, tone, title, sub }: { icon: typeof Mail; tone: string; title: string; sub: string }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"><span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", TONE_BG[tone])}><Icon className="w-4 h-4" /></span><p className="text-[13px] font-semibold text-slate-800 mt-2.5">{title}</p><p className="text-[11.5px] text-slate-500 mt-1">{sub}</p></div>
}
function ShareCard({ icon: Icon, tone, title, sub, cta, href, onClick }: { icon: typeof Star; tone: string; title: string; sub: string; cta: string; href?: string; onClick?: () => void }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 h-full">
      <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", TONE_BG[tone])}><Icon className="w-4 h-4" /></span>
      <p className="text-[13px] font-semibold text-slate-800 mt-2.5">{title}</p>
      <p className="text-[11.5px] text-slate-500 mt-1">{sub}</p>
      <span className="mt-3 inline-block text-[12.5px] font-semibold text-[var(--brand)]">{cta} →</span>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <button onClick={onClick} className="text-left w-full">{inner}</button>
}
function SumLine({ icon: Icon, l, r }: { icon: typeof Calendar; l: string; r: string }) {
  return <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-[12.5px] text-slate-500"><Icon className="w-4 h-4 text-slate-400" /> {l}</span><span className="text-[12.5px] font-semibold text-slate-800">{r}</span></div>
}
function Safe({ icon: Icon, title, sub }: { icon: typeof Shield; title: string; sub: string }) {
  return <li className="flex items-start gap-3"><span className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span><div className="flex-1"><p className="text-[12.5px] font-semibold text-slate-800">{title}</p><p className="text-[11px] text-slate-500">{sub}</p></div><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" /></li>
}
