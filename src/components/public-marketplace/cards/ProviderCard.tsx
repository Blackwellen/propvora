import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, CheckCircle, Clock } from 'lucide-react'
import type { PublicProvider } from '@/lib/public-marketplace/types'

export default function ProviderCard({ provider, basePath = "/providers" }: { provider: PublicProvider; basePath?: string }) {
  const fromPrice = (provider.fromPrice / 100).toFixed(0)
  return (
    <Link href={`${basePath}/${provider.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
        <div className="relative h-36 overflow-hidden">
          <Image src={provider.heroImage} alt={provider.companyName} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0 -mt-8">
              <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="48px" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">{provider.companyName}</h3>
                {provider.proBadge && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold shrink-0">Pro</span>}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold">{provider.rating}</span>
                <span className="text-xs text-slate-400">({provider.reviewCount})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            {provider.vetted && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle className="h-3 w-3" /> Vetted
              </span>
            )}
            <span className="text-xs text-slate-500">{provider.trade}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
            <MapPin className="h-3 w-3" />
            {provider.location}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {provider.certifications.slice(0, 3).map(cert => (
              <span key={cert} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cert}</span>
            ))}
          </div>

          <div className="text-xs text-slate-500 space-y-0.5 mb-3">
            <span>{provider.teamSize} team · {provider.jobsDone.toLocaleString()}+ jobs · {provider.yearsActive} yrs</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <Clock className="h-3 w-3" /> {provider.responseTime} avg response
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-bold text-slate-900">From £{fromPrice}<span className="text-xs font-normal text-slate-500">/visit</span></span>
            <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">View profile →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
