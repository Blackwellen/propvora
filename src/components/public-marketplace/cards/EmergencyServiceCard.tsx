'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Heart, MapPin, ShieldCheck, Siren, Tag, Timer } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicEmergencyService } from '@/lib/public-marketplace/types'

const FEATURES = [
  { icon: Clock, label: '24/7', sub: 'Available' },
  { icon: Timer, label: '30 min', sub: 'Average arrival' },
  { icon: Tag, label: 'Fixed price', sub: 'No call-out fees' },
  { icon: ShieldCheck, label: 'Police vetted', sub: 'DBS checked' },
]

export default function EmergencyServiceCard({ service, basePath = '/emergency' }: { service: PublicEmergencyService; basePath?: string }) {
  const description =
    service.description ||
    'Lockouts, broken locks and post-break-in board-ups. Non-destructive entry where possible.'

  return (
    <div className="relative aspect-[702/428] w-full [container-type:inline-size] transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 active:scale-[0.995]">
    <article className="absolute left-0 top-0 flex h-[428px] w-[702px] origin-top-left overflow-hidden rounded-[22px] border-2 border-red-500 bg-white font-sans shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition-shadow duration-200 hover:shadow-[0_24px_58px_rgba(15,23,42,0.18)]" style={{ transform: 'scale(calc(100cqw / 702px))' }}>
      <div className="flex h-full w-full flex-col">
        <div className="relative flex h-[56%] min-h-[240px] gap-[26px] px-[16px] pt-[16px]">
          <div className="relative h-[218px] w-[41%] overflow-hidden rounded-xl">
            <Image
              src={service.heroImage}
              alt={service.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 286px"
            />
            <span className="absolute left-0 top-0 inline-flex h-10 min-w-[190px] items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-[14px] font-[700] leading-5 text-red-600 shadow-sm">
              <Siren className="h-4 w-4" />
              Emergency service
            </span>
          </div>

          <div className="relative min-w-0 flex-1 pr-[48px] pt-[5px]">
            <button
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              aria-label="Save service"
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.10)] transition-colors hover:bg-slate-50"
            >
              <Heart className="h-5 w-5" />
            </button>
            <h3 className="truncate text-[20px] font-[760] leading-7 text-slate-950">{service.title}</h3>
            <p className="mt-[10px] flex items-center gap-2 text-[14px] font-[700] leading-5 text-red-600">
              <Clock className="h-4 w-4" />
              Responds in {service.responseTimeMin}-{service.responseTimeMax} mins
            </p>
            <p className="mt-[12px] line-clamp-3 text-[15px] font-[500] leading-[23px] text-slate-600">{description}</p>
            <p className="mt-[11px] flex items-center gap-2 truncate text-[15px] font-[500] leading-[22px] text-slate-500">
              <MapPin className="h-4 w-4 text-slate-500" />
              {service.location}
            </p>
          </div>
        </div>

        <div className="mx-[18px] grid h-[19%] min-h-[82px] grid-cols-4 border-y border-slate-200 py-[17px]">
          {FEATURES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3 px-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-[750] leading-4 text-slate-950">{label}</span>
                <span className="mt-1 block truncate text-[12px] font-[500] leading-4 text-slate-500">{sub}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="flex h-[20%] min-h-[86px] items-center justify-between px-[18px] py-[18px]">
          <div>
            <p className="text-[12px] font-[700] uppercase leading-4 text-slate-500">Call-out from</p>
            <span className="mt-1 block text-[25px] font-[800] leading-8 text-slate-950">{formatPence(service.baseCalloutPrice)}</span>
          </div>
          <Link
            href={`${basePath}/${service.slug}`}
            className="inline-flex h-11 min-w-[160px] items-center justify-center gap-3 rounded-lg bg-red-500 px-5 text-[14.5px] font-[750] leading-[18px] text-white transition-colors hover:bg-red-600"
          >
            Request now
            <span aria-hidden>{'->'}</span>
          </Link>
        </div>
      </div>
    </article>
    </div>
  )
}
