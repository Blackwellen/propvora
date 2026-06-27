import Link from "next/link"
import { Home, MapPin, ChevronRight } from "lucide-react"
import { PortalCard, StatusChip, type PortalTone } from "@/components/portals/portal-ui"
import { formatMoney, propertyStatusMeta } from "@/lib/portal/format"

interface Property {
  id: string
  nickname: string | null
  address_line1: string | null
  address_line2?: string | null
  city: string | null
  postcode: string | null
  status: string
  target_rent_pcm: number | null
}

interface LandlordPortalPropertyCardProps {
  property: Property
  href: string
}

function propLabel(p: Property): string {
  return p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
}

export function LandlordPortalPropertyCard({ property, href }: LandlordPortalPropertyCardProps) {
  const meta = propertyStatusMeta(property.status)
  const tone: PortalTone =
    meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "slate"

  return (
    <Link href={href} className="block">
      <PortalCard className="overflow-hidden hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)] hover:border-[#CFE0FB] transition-all h-full">
        <div className="h-28 bg-gradient-to-br from-[#1E3A8A] to-[var(--brand)] flex items-center justify-center">
          <Home className="w-9 h-9 text-white/40" />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#071B4D] truncate">{propLabel(property)}</p>
            <StatusChip tone={tone} dot>
              {meta.label}
            </StatusChip>
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[property.address_line1, property.city, property.postcode].filter(Boolean).join(", ")}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EEF3FB]">
            <span className="text-sm">
              <span className="font-bold text-[#071B4D]">
                {property.target_rent_pcm != null ? formatMoney(property.target_rent_pcm) : "—"}
              </span>{" "}
              <span className="text-xs text-slate-400">pcm</span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--brand)]">
              View details <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </PortalCard>
    </Link>
  )
}
