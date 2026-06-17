import Link from 'next/link'
import { Clock, Phone } from 'lucide-react'
import type { PublicEmergencyService } from '@/lib/public-marketplace/types'

export default function EmergencyServiceCard({ service, basePath = "/emergency" }: { service: PublicEmergencyService; basePath?: string }) {
  const categoryIcons: Record<string, string> = {
    Plumbing: '🔧',
    Electrical: '⚡',
    Locksmith: '🔐',
    Security: '🛡️',
    Gas: '🔥',
    Drainage: '🌊',
  }
  const icon = categoryIcons[service.category] ?? '🚨'

  return (
    <Link href={`${basePath}/${service.slug}`} className="group block">
      <div className="bg-white rounded-2xl border-2 border-red-100 hover:border-red-200 overflow-hidden shadow-sm hover:shadow-md transition-all p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 leading-tight">{service.title}</h3>
            <p className="text-xs text-slate-500">{service.providerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Clock className="h-3 w-3" />{service.responseTimeMin}-{service.responseTimeMax} mins
          </span>
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />24/7
          </span>
        </div>
      </div>
    </Link>
  )
}
