"use client"

// ============================================================================
// ServiceBookingPanel — reactive booking sidebar for a service offer.
// Tier selector (Basic / Standard / Premium) drives the price, the included
// list and the "Book" CTA. Routes to the multi-step checkout with the chosen
// package. Light tokens only — NEVER `dark:`.
// ============================================================================

import { useState } from "react"
import Link from "next/link"
import { BadgeCheck, CheckCircle, Clock, Lock, MessageCircle, Shield, Zap } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import type { PublicServiceOffer } from "@/lib/public-marketplace/types"

interface Pkg {
  name: string
  price: number
  description: string
  includes: string[]
}

export default function ServiceBookingPanel({
  offer,
  slug,
}: {
  offer: PublicServiceOffer
  slug: string
}) {
  const packages: Pkg[] =
    offer.packages && offer.packages.length >= 2
      ? offer.packages
      : [
          { name: "Basic", price: offer.basePrice, description: "Essential service", includes: ["Core service", "Labour included"] },
          { name: "Standard", price: offer.standardPrice, description: "Most popular", includes: ["Everything in Basic", "Priority scheduling", "Detailed report"] },
          { name: "Premium", price: offer.premiumPrice, description: "Full-service", includes: ["Everything in Standard", "Premium materials", "12-month guarantee"] },
        ]

  // Default to the "Standard" tier (index 1) when present.
  const [selected, setSelected] = useState(Math.min(1, packages.length - 1))
  const pkg = packages[selected]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sticky top-24">
      {/* Tier segmented control */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {packages.map((p, i) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setSelected(i)}
            className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
              selected === i ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Price */}
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{pkg.name} package</p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-4xl font-extrabold text-slate-900">{formatPence(pkg.price)}</span>
      </div>
      {pkg.description ? <p className="text-sm text-slate-500 mb-4">{pkg.description}</p> : <div className="mb-4" />}

      {/* Includes */}
      {pkg.includes.length > 0 && (
        <div className="space-y-1.5 mb-5">
          {pkg.includes.slice(0, 5).map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              {item}
            </div>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="space-y-2 mb-5 text-sm border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="h-4 w-4 text-blue-500 shrink-0" />
          <span>Responds in <strong className="text-slate-900">{offer.responseTime}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Next available: <strong className="text-slate-900">{offer.nextAvailable}</strong></span>
        </div>
        {offer.insured && (
          <div className="flex items-center gap-2 text-slate-600">
            <Shield className="h-4 w-4 text-violet-500 shrink-0" />
            <span>Fully insured</span>
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <Link
        href={`/property-manager/marketplace/suppliers-hub/services/${slug}/book?package=${pkg.name.toLowerCase()}`}
        className="block w-full py-3.5 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mb-3"
      >
        Book {pkg.name} · {formatPence(pkg.price)} →
      </Link>

      {/* Secondary CTA */}
      <Link
        href={`/property-manager/messages?service=${slug}`}
        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors mb-4"
      >
        <MessageCircle className="h-4 w-4" /> Get Custom Quote
      </Link>

      {/* Trust */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        {[
          { icon: Lock, text: "Protected by Propvora escrow" },
          { icon: BadgeCheck, text: "Vetted & DBS-checked provider" },
          { icon: Shield, text: "Satisfaction guaranteed" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
            <Icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}
