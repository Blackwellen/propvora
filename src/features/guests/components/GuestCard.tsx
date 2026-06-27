import React from "react"
import Link from "next/link"
import { Mail, Phone, MapPin, ArrowUpRight, CalendarCheck, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export type GuestType = "Short stay" | "Long-term" | "Mixed"

export interface GuestCardData {
  key: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  bookings: number
  totalSpend: number
  lastProperty: string
  lastLocation: string
  lastDate: string
  type: GuestType
}

const TYPE_TONE: Record<GuestType, string> = {
  "Short stay": "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",
  "Long-term":  "bg-emerald-50 text-emerald-700 border-emerald-200",
  Mixed:        "bg-violet-50 text-violet-700 border-violet-200",
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100)
}

interface GuestCardProps {
  guest: GuestCardData
}

export function GuestCard({ guest: g }: GuestCardProps) {
  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {g.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.avatar} alt={g.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
              {g.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{g.name}</p>
            {g.bookings > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" /> Repeat guest
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-0.5 text-slate-600">
          {g.email && (
            <span className="flex items-center gap-1.5 text-xs">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {g.email}
            </span>
          )}
          {g.phone && (
            <span className="flex items-center gap-1.5 text-xs">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {g.phone}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{g.lastProperty}</p>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="w-3 h-3" /> {g.lastLocation}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
          <CalendarCheck className="w-3 h-3" /> {fmtDate(g.lastDate)}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-semibold text-slate-800">{g.bookings}</td>
      <td className="px-4 py-3 text-right font-semibold text-slate-900">{gbp(g.totalSpend)}</td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", TYPE_TONE[g.type])}>
          {g.type}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href="/property-manager/bookings"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand)]"
        >
          Bookings <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  )
}
