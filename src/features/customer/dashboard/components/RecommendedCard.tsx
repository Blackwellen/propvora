"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CustomerPropertyCard } from "../../components/PropertyCard"
import { recommended } from "../../data/mock"

interface Props {
  saved: Record<string, boolean>
  onToggleSave: (id: string) => void
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">{children}</div>
}
function CardHead({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      <Link href={href} className="text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)] inline-flex items-center gap-1">
        {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

export default function RecommendedCard({ saved, onToggleSave }: Props) {
  return (
    <Card>
      <CardHead title="Recommended for you" href="/customer/stays" linkLabel="View all stays" />
      {recommended.length === 0 ? (
        <p className="text-[13px] text-slate-400 py-4 text-center">Recommendations will appear here once you have booking history.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {recommended.map((p) => (
            <CustomerPropertyCard key={p.id} p={{ ...p, saved: saved[p.id] }} onToggleSave={onToggleSave} />
          ))}
        </div>
      )}
    </Card>
  )
}
