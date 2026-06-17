'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Heart, MapPin, Shield, Sparkles, Star } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicProvider } from '@/lib/public-marketplace/types'

const FEATURE_ITEMS = [
  { icon: Clock, title: 'Fast response', subtitle: 'Typically replies in 30 mins' },
  { icon: Shield, title: 'Fully insured', subtitle: 'GBP5M public liability' },
  { icon: Sparkles, title: 'Qualified engineers', subtitle: 'Gas Safe registered' },
  { icon: MapPin, title: 'Local coverage', subtitle: '24/7 emergency' },
]

export default function ProviderCard({ provider, basePath = '/providers' }: { provider: PublicProvider; basePath?: string }) {
  return (
    <div className="relative aspect-[702/490] w-full [container-type:inline-size] transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 active:scale-[0.995]">
    <article className="absolute left-0 top-0 flex h-[490px] w-[702px] origin-top-left flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white font-sans shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-shadow duration-200 hover:shadow-[0_24px_58px_rgba(15,23,42,0.18)]" style={{ transform: 'scale(calc(100cqw / 702px))' }}>
      <div className="relative h-[32.7%] min-h-[160px] shrink-0">
        <Image
          src={provider.heroImage}
          alt={provider.companyName}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 702px"
        />
        <span className="absolute left-[22px] top-[20px] inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-[650] leading-4 text-emerald-700 shadow-sm">
          <Shield className="h-4 w-4" />
          Verified supplier
        </span>
        <button
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          aria-label="Save provider"
          className="absolute right-[19px] top-[17px] flex h-[50px] w-[50px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition-colors hover:bg-slate-50"
        >
          <Heart className="h-6 w-6" />
        </button>
      </div>

      <div className="flex h-[27.3%] min-h-[134px] items-center px-[18px] py-[18px]">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100">
          <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="80px" />
        </div>
        <div className="ml-[28px] min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[20px] font-[750] leading-7 text-slate-950">{provider.companyName}</h3>
            {provider.proBadge && (
              <span className="rounded-md bg-blue-600 px-2 py-1 text-[12px] font-[800] leading-4 text-white">Pro</span>
            )}
          </div>
          <p className="mt-[7px] truncate text-[14px] font-[500] leading-5 text-slate-500">{provider.trade} Services</p>
          <p className="mt-[7px] flex items-center gap-2 truncate text-[14px] font-[500] leading-5 text-slate-500">
            <MapPin className="h-4 w-4 text-slate-500" />
            {provider.location}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 flex-col items-end gap-[18px]">
          <div className="flex items-center gap-1.5 text-[14px] leading-5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-[800] text-slate-950">{provider.rating}</span>
            <span className="font-[500] text-slate-500">({provider.reviewCount})</span>
          </div>
          {provider.vetted && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-[14px] font-[700] leading-5 text-emerald-700">
              <Shield className="h-4 w-4" />
              Vetted
            </span>
          )}
        </div>
      </div>

      <div className="mx-[18px] grid h-[20%] min-h-[98px] grid-cols-4 border-y border-slate-200 py-[20px]">
        {FEATURE_ITEMS.map(({ icon: Icon, title, subtitle }, index) => (
          <div key={title} className={`flex gap-3 px-3 ${index > 0 ? 'border-l border-slate-200' : ''}`}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-[700] leading-4 text-slate-950">{title}</span>
              <span className="mt-1 block text-[12px] font-[500] leading-4 text-slate-500">{subtitle}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex h-[20%] min-h-[98px] items-center justify-between px-[20px] py-[21px]">
        <div>
          <p className="text-[12px] font-[700] uppercase leading-4 text-slate-500">Services from</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[24px] font-[800] leading-[30px] text-slate-950">{formatPence(provider.fromPrice)}</span>
            <span className="text-[14px] font-[500] leading-5 text-slate-500">/ visit</span>
          </div>
        </div>
        <Link
          href={`${basePath}/${provider.slug}`}
          className="inline-flex h-11 min-w-[150px] items-center justify-center gap-3 rounded-lg border border-blue-600 px-4 text-[15px] font-[700] leading-5 text-blue-600 transition-colors hover:bg-blue-50"
        >
          View profile
          <span aria-hidden>{'->'}</span>
        </Link>
      </div>
    </article>
    </div>
  )
}
