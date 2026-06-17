import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin } from 'lucide-react'
import type { PublicProvider } from '@/lib/public-marketplace/types'

export default function ProviderFeaturedCard({ provider, basePath = "/providers" }: { provider: PublicProvider; basePath?: string }) {
  return (
    <Link href={`${basePath}/${provider.slug}`} className="group block min-w-72 max-w-80">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all">
        <div className="relative h-36 overflow-hidden">
          <Image src={provider.heroImage} alt={provider.companyName} fill className="object-cover" sizes="320px" />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow -mt-8 shrink-0">
              <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="48px" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-sm">{provider.companyName}</h3>
                {provider.proBadge && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold">{provider.rating}</span>
                <span className="text-xs text-slate-400">({provider.reviewCount})</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-1">{provider.trade}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500 mb-3">
            <MapPin className="h-3 w-3" />{provider.location}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {provider.certifications.slice(0, 3).map(cert => (
              <span key={cert} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{cert}</span>
            ))}
          </div>

          <p className="text-xs text-slate-500 mb-3">
            {provider.teamSize} team · {provider.jobsDone.toLocaleString()}+ jobs · {provider.yearsActive} yrs
          </p>

          <button className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors">
            View profile
          </button>
        </div>
      </div>
    </Link>
  )
}
