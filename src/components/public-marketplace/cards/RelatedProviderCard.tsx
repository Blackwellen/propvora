import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { PublicProvider } from '@/lib/public-marketplace/types'

export default function RelatedProviderCard({ provider, basePath = "/providers" }: { provider: PublicProvider; basePath?: string }) {
  return (
    <Link href={`${basePath}/${provider.slug}`} className="group block">
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-all">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
          <Image src={provider.logo} alt={provider.companyName} fill className="object-cover" sizes="48px" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 truncate">{provider.companyName}</h4>
          <p className="text-xs text-slate-500">{provider.trade}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold">{provider.rating}</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-[var(--brand)] group-hover:text-[var(--brand)]">→</span>
      </div>
    </Link>
  )
}
