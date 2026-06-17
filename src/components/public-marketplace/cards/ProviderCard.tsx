import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, MapPin, Clock, Shield, CheckCircle } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicProvider } from '@/lib/public-marketplace/types'

export default function ProviderCard({ provider, basePath = '/providers' }: { provider: PublicProvider; basePath?: string }) {
  return (
    <div className="flex flex-col h-full border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Banner image with overlays */}
      <div className="relative aspect-[16/7] shrink-0">
        <Image
          src={provider.heroImage}
          alt={provider.companyName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Verified supplier badge — top left */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 text-emerald-600 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Verified supplier
        </div>
        {/* Heart — top right */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation() }}
          aria-label="Save provider"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-colors"
        >
          <Heart className="w-4 h-4 text-slate-600" />
        </button>
        {/* Avatar — bottom-left overlapping */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="relative w-14 h-14 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
            <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="56px" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 pt-10 space-y-2">
        {/* Name + Pro + Rating */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">{provider.companyName}</h3>
            {provider.proBadge && (
              <span className="shrink-0 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-md ml-0.5">Pro</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-slate-900">{provider.rating}</span>
          </div>
        </div>

        {/* Trade */}
        <p className="text-slate-500 text-sm">{provider.trade}</p>

        {/* Location */}
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{provider.location}</span>
        </div>

        <hr className="border-slate-100 my-1" />

        {/* Trust grid: 4 columns */}
        <div className="grid grid-cols-4 gap-1">
          <div className="flex flex-col items-center gap-0.5 text-center">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-slate-700 text-[11px] font-medium leading-tight">Fast response</span>
            <span className="text-slate-400 text-[10px] leading-tight">{provider.responseTime}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-slate-700 text-[11px] font-medium leading-tight">Fully insured</span>
            <span className="text-slate-400 text-[10px] leading-tight">{provider.insuranceAmount ?? '£5M'}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            <span className="text-slate-700 text-[11px] font-medium leading-tight">Qualified</span>
            <span className="text-slate-400 text-[10px] leading-tight">Engineers</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="text-slate-700 text-[11px] font-medium leading-tight">Local cover</span>
            <span className="text-slate-400 text-[10px] leading-tight">{provider.coverageRadius} mi</span>
          </div>
        </div>

        <hr className="border-slate-100 my-1" />

        {/* Price + CTA */}
        <div className="mt-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Services from</p>
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{formatPence(provider.fromPrice)}</span>
              <span className="text-slate-500 text-sm"> / visit</span>
            </div>
          </div>
          <Link
            href={`${basePath}/${provider.slug}`}
            className="mt-3 block w-full border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl py-2.5 text-sm font-semibold text-center transition-colors"
          >
            View profile →
          </Link>
        </div>
      </div>
    </div>
  )
}
