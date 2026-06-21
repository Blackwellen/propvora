"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronLeft, Star, BadgeCheck, ShieldCheck, Zap, Check, Minus, MessageSquare,
  GitCompare,
} from "lucide-react"
import { formatPence } from "@/components/marketplace/PriceTag"
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState"
import { DashboardContainer } from "@/components/layout/PageContainer"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import type { SupplierCard } from "@/lib/marketplace/suppliers"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierCompare — side-by-side comparison of selected suppliers (operator).

   Reads real SupplierCard data loaded server-side (getSuppliersByIds). Every
   row is a real, comparable signal; missing signals show an honest "—".
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  suppliers: SupplierCard[]
}

const BAND_LABEL: Record<string, string> = { budget: "Budget", mid: "Mid", premium: "Premium", quote: "On request" }

export function SupplierCompare({ suppliers }: Props) {
  if (suppliers.length === 0) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Compare" showBack backHref="/property-manager/marketplace/suppliers" />
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <MarketplaceEmptyState variant="no-results" title="Nothing to compare yet" description="Select suppliers from the directory to compare them side by side on rating, price, coverage and verification." action={{ label: "Browse suppliers", href: "/property-manager/marketplace/suppliers", icon: GitCompare }} />
        </div>
      </DashboardContainer>
    )
  }

  const rows: { label: string; render: (s: SupplierCard) => React.ReactNode }[] = [
    { label: "Rating", render: (s) => s.rating != null && s.rating > 0 ? <span className="inline-flex items-center gap-1 font-semibold text-slate-800"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)} <span className="font-normal text-slate-400">({s.reviewCount ?? 0})</span></span> : <Dash /> },
    { label: "From price", render: (s) => <span className="font-semibold tabular-nums text-slate-800">{formatPence(s.basePricePence ?? s.priceBand.minPence, s.currency)}</span> },
    { label: "Price band", render: (s) => BAND_LABEL[s.priceBand.band] ?? "—" },
    { label: "Verified", render: (s) => (s.verificationStatus === "verified" || s.verificationStatus === "approved") ? <YesIcon /> : <Dash /> },
    { label: "Insured", render: (s) => s.insuranceVerified ? <YesIcon /> : <Dash /> },
    { label: "Emergency", render: (s) => s.acceptsEmergency ? <YesIcon /> : <Dash /> },
    { label: "Response time", render: (s) => s.responseTimeHours != null ? `~${s.responseTimeHours}h` : <Dash /> },
    { label: "Experience", render: (s) => s.yearsExperience != null ? `${s.yearsExperience} yrs` : <Dash /> },
    { label: "Service radius", render: (s) => s.serviceRadiusKm != null ? `${s.serviceRadiusKm} km` : <Dash /> },
    { label: "Services", render: (s) => s.serviceCount > 0 ? `${s.serviceCount}` : <Dash /> },
    { label: "Trades", render: (s) => s.trades.length > 0 ? <span className="text-[12px] text-slate-600 capitalize">{s.trades.slice(0, 3).join(", ")}{s.trades.length > 3 ? "…" : ""}</span> : <Dash /> },
    { label: "Location", render: (s) => s.location ?? s.baseLocation ?? <Dash /> },
  ]

  return (
    <DashboardContainer>
      <MobileTopBar title="Compare suppliers" showBack backHref="/property-manager/marketplace/suppliers" />
      <div className="hidden md:flex items-center gap-2 mb-4">
        <Link href="/property-manager/marketplace/suppliers" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /> Back to suppliers</Link>
      </div>
      <h1 className="text-[20px] font-bold text-[#0B1B3F] mb-4">Comparing {suppliers.length} suppliers</h1>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse" style={{ minWidth: 220 + suppliers.length * 200 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white w-[200px] p-3 text-left border-b border-slate-200" />
              {suppliers.map((s) => (
                <th key={s.id} className="p-3 text-left align-top border-b border-l border-slate-100 min-w-[200px]">
                  <Link href={`/property-manager/marketplace/suppliers/${s.id}`} className="group block">
                    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] mb-2">
                      {s.thumbnailUrl && <Image src={s.thumbnailUrl} alt={s.title} fill className="object-cover" sizes="200px" />}
                      <div className="absolute top-1.5 left-1.5 flex gap-1">
                        {(s.verificationStatus === "verified" || s.verificationStatus === "approved") && <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-white/95 text-[#2563EB] shadow-sm"><BadgeCheck className="w-3 h-3" /></span>}
                        {s.insuranceVerified && <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-600/95 text-white shadow-sm"><ShieldCheck className="w-3 h-3" /></span>}
                        {s.acceptsEmergency && <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-red-600/95 text-white shadow-sm"><Zap className="w-3 h-3" /></span>}
                      </div>
                    </div>
                    <p className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors">{s.title}</p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.label} className={ri % 2 ? "bg-slate-50/40" : ""}>
                <td className="sticky left-0 z-10 bg-inherit w-[200px] p-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100">{row.label}</td>
                {suppliers.map((s) => <td key={s.id} className="p-3 text-[13px] text-slate-700 border-b border-l border-slate-100 align-top">{row.render(s)}</td>)}
              </tr>
            ))}
            <tr>
              <td className="sticky left-0 z-10 bg-white w-[200px] p-3" />
              {suppliers.map((s) => (
                <td key={s.id} className="p-3 border-l border-slate-100">
                  <Link href={`/property-manager/marketplace/suppliers/${s.id}`} className="inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-[#2563EB] text-white text-[12.5px] font-semibold hover:bg-[#1d4ed8] transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Request quote</Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardContainer>
  )
}

function YesIcon() {
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-50 text-emerald-600"><Check className="w-3.5 h-3.5" /></span>
}
function Dash() {
  return <span className="inline-flex items-center justify-center text-slate-300"><Minus className="w-3.5 h-3.5" /></span>
}

export default SupplierCompare
