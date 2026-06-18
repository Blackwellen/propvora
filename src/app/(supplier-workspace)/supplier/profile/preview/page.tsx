"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/profile/preview — public profile preview (manifest image 55).

   A supplier-side preview of how the public marketplace listing looks, with a
   visibility status, desktop + mobile preview frames, an "improve your profile"
   checklist and an "Edit listing" CTA. The preview renders only public-safe
   fields (no private finance / compliance files / customer data). The live
   public page lives at /marketplace/suppliers/[slug].
─────────────────────────────────────────────────────────────────────────── */

import Link from "next/link"
import {
  ChevronLeft, Eye, ExternalLink, Pencil, CheckCircle2, Circle, Star, MapPin,
  ShieldCheck, Wrench,
} from "lucide-react"
import { SupplierCard, SupplierButton, SupplierStatusBadge } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"

export const dynamic = "force-dynamic"

const PROFILE = {
  name: "Morgan Heating & Plumbing",
  slug: "morgan-heating-plumbing",
  tagline: "Gas Safe heating & plumbing specialists",
  area: "Greater Manchester",
  rating: 4.8,
  reviews: 124,
  jobs: 318,
  services: ["Boiler service", "Boiler repair", "Bathroom installs", "Emergency plumbing"],
  verified: true,
  visibility: "Visible" as const,
}

const IMPROVEMENTS = [
  { label: "Add a profile photo / logo", done: true },
  { label: "Write a business description", done: true },
  { label: "Add at least 3 services", done: true },
  { label: "Upload featured work photos", done: false },
  { label: "Verify insurance & licences", done: false },
  { label: "Set your coverage area", done: true },
]

export default function SupplierProfilePreviewPage() {
  const doneCount = IMPROVEMENTS.filter((i) => i.done).length
  const pct = Math.round((doneCount / IMPROVEMENTS.length) * 100)

  return (
    <div className="space-y-5">
      <MobileTopBar title="Profile preview" subtitle="Public listing" showBack backHref="/supplier/profile" />

      <div className="hidden md:flex items-center justify-between gap-3 flex-wrap">
        <Link href="/supplier/profile" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to profile
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/marketplace/suppliers/${PROFILE.slug}`} target="_blank"><SupplierButton variant="outline"><ExternalLink className="w-4 h-4" /> Open public page</SupplierButton></Link>
          <Link href="/supplier/profile"><SupplierButton><Pencil className="w-4 h-4" /> Edit listing</SupplierButton></Link>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <h1 className="text-xl font-semibold text-slate-900">Public profile preview</h1>
        <SupplierStatusBadge tone="emerald"><Eye className="w-3 h-3 inline mr-1" />{PROFILE.visibility}</SupplierStatusBadge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        {/* Preview frames */}
        <div className="space-y-4 min-w-0">
          {/* Desktop preview */}
          <SupplierCard className="p-0 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-slate-50">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="ml-2 text-[11px] text-slate-400">propvora.com/suppliers/{PROFILE.slug}</span>
            </div>
            <PreviewBody />
          </SupplierCard>
        </div>

        {/* Mobile preview + improvements */}
        <div className="space-y-4">
          <SupplierCard className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Mobile preview</p>
            <div className="mx-auto w-full max-w-[260px] rounded-[2rem] border-4 border-slate-200 overflow-hidden">
              <PreviewBody compact />
            </div>
          </SupplierCard>

          <SupplierCard className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-900">Improve your profile</h2>
              <span className="text-xs font-bold text-slate-700">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3"><div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${pct}%` }} /></div>
            <ul className="space-y-2">
              {IMPROVEMENTS.map((i) => (
                <li key={i.label} className="flex items-start gap-2 text-sm">
                  {i.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
                  <span className={i.done ? "text-slate-500" : "text-slate-800 font-medium"}>{i.label}</span>
                </li>
              ))}
            </ul>
            <Link href="/supplier/profile" className="mt-4 block"><SupplierButton className="w-full justify-center"><Pencil className="w-4 h-4" /> Edit listing</SupplierButton></Link>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function PreviewBody({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "p-3" : "p-5"}>
      <div className="h-24 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 mb-3 flex items-end p-3">
        <div className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center -mb-6 ml-1"><Wrench className="w-6 h-6 text-blue-600" /></div>
      </div>
      <div className="pt-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className={`font-bold text-slate-900 ${compact ? "text-sm" : "text-lg"}`}>{PROFILE.name}</h3>
          {PROFILE.verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
        </div>
        <p className="text-xs text-slate-500">{PROFILE.tagline}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 flex-wrap">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{PROFILE.rating} ({PROFILE.reviews})</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{PROFILE.area}</span>
          <span>{PROFILE.jobs} jobs</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PROFILE.services.slice(0, compact ? 2 : 4).map((s) => <span key={s} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">{s}</span>)}
        </div>
        {!compact && <div className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#2563EB] text-white px-4 py-2 text-sm font-semibold">Request a quote</div>}
      </div>
    </div>
  )
}
