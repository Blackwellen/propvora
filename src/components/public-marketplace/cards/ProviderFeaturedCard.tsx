import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, MapPin, Clock, Shield, CheckCircle } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicProvider } from '@/lib/public-marketplace/types'

export default function ProviderFeaturedCard({ provider, basePath = '/providers' }: { provider: PublicProvider; basePath?: string }) {
  return (
    <div className="flex flex-col border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow min-w-[280px] max-w-[320px]">
      {/* Banner image */}
      <div className="relative aspect-[16/7] shrink-0">
        <Image
          src={provider.heroImage}
          alt={provider.companyName}
          fill
          className="object-cover"
          sizes="320px"
        />
        {/* Featured badge */}
        <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">Featured</div>
        {/* Vetted badge */}
        {provider.vetted && (
          <div className="absolute top-3 right-10 flex items-center gap-1 bg-white/90 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />Vetted
          </div>
        )}
        {/* Heart */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation() }}
          aria-label="Save provider"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors"
        >
          <Heart className="w-3.5 h-3.5 text-slate-600" />
        </button>
        {/* Avatar overlapping */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="relative w-12 h-12 rounded-full border-2 border-white shadow overflow-hidden bg-white">
            <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="48px" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 pt-9">
        {/* Name + Pro + Rating */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">{provider.companyName}</h3>
            {provider.proBadge && <span className="shrink-0 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">Pro</span>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-slate-900">{provider.rating}</span>
          </div>
        </div>

        <p className="text-slate-500 text-xs mb-1">{provider.trade}</p>
        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />{provider.location}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{provider.responseTime}</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500" />Insured</span>
        </div>

        {/* Certifications */}
        <div className="flex flex-wrap gap-1 mb-3">
          {provider.certifications.slice(0, 3).map(cert => (
            <span key={cert} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">{cert}</span>
          ))}
        </div>

        {/* Stats */}
        <p className="text-xs text-slate-500 mb-3">
          {provider.jobsDone.toLocaleString()}+ jobs · {provider.teamSize} team · {provider.yearsActive} yrs
        </p>

        {/* Price + CTA */}
        <div className="mt-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Services from</p>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-xl font-bold text-slate-900">{formatPence(provider.fromPrice)}</span>
            <span className="text-slate-500 text-sm"> / visit</span>
          </div>
          <Link
            href={`${basePath}/${provider.slug}`}
            className="block w-full border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl py-2.5 text-sm font-semibold text-center transition-colors"
          >
            View profile →
          </Link>
        </div>
      </div>
    </div>
  )
}
