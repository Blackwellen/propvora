import { Shield, CheckCircle, Lock, HeadphonesIcon } from 'lucide-react'

interface TrustItem {
  icon: React.ElementType
  title: string
  desc: string
}

const DEFAULT_ITEMS: TrustItem[] = [
  { icon: Shield, title: 'Verified stays', desc: 'Every listing is operator-verified before going live.' },
  { icon: CheckCircle, title: 'Licensed & compliant', desc: 'All providers meet UK licensing requirements.' },
  { icon: Lock, title: 'Secure payments', desc: 'Escrow-protected, with full dispute resolution.' },
  { icon: HeadphonesIcon, title: '24/7 guest support', desc: 'Round-the-clock help for guests and customers.' },
]

interface MarketplaceTrustStripProps {
  items?: TrustItem[]
  className?: string
}

export default function MarketplaceTrustStrip({ items = DEFAULT_ITEMS, className }: MarketplaceTrustStripProps) {
  return (
    <section className={`py-12 px-4 bg-slate-50 border-t border-slate-100 ${className ?? ''}`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
