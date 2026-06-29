"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Home, Users, Eye, MoreHorizontal } from "lucide-react"
import type { Unit } from "@/hooks/useUnits"

const STATUS_BADGE: Record<Unit["status"], { label: string; classes: string }> = {
  occupied:    { label: "Occupied",    classes: "bg-green-50 text-green-700 border border-green-200" },
  available:   { label: "Vacant",      classes: "bg-amber-50 text-amber-700 border border-amber-200" },
  offline:     { label: "Offline",     classes: "bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]" },
  maintenance: { label: "Under works", classes: "bg-orange-50 text-orange-700 border border-orange-200" },
}

interface RoomCardProps {
  room: Unit
  propertyId: string
}

export function RoomCard({ room, propertyId }: RoomCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = STATUS_BADGE[room.status]

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{room.unit_name}</span>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {room.status === "occupied" ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-[var(--brand)]" />
          </div>
          <span className="text-sm text-slate-700 font-medium">Tenant assigned</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
            <Home className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-sm text-slate-500 italic">No tenant</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-slate-400 uppercase tracking-wide font-medium">Target Rent</p>
          <p className="text-slate-700 font-semibold">
            {room.target_rent ? `${room.target_rent.toLocaleString()}/mo` : "—"}
            {room.status === "available" ? " asking" : ""}
          </p>
        </div>
        {room.floor !== null && (
          <div>
            <p className="text-slate-400 uppercase tracking-wide font-medium">Floor</p>
            <p className="text-slate-700 font-semibold">{room.floor}</p>
          </div>
        )}
        {room.floor_area_sqm !== null && (
          <div className="col-span-2">
            <p className="text-slate-400 uppercase tracking-wide font-medium">Area</p>
            <p className="text-slate-700 font-semibold">{room.floor_area_sqm} sqm</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
        {room.status === "available" ? (
          <Link
            href={`/property-manager/portfolio/properties/${propertyId}/hmo/rooms`}
            className="flex-1 bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-1.5 rounded-lg text-center transition-colors"
          >
            Find Tenant
          </Link>
        ) : (
          <Link
            href={`/property-manager/portfolio/properties/${propertyId}/hmo/rooms`}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </Link>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
              <button className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                Edit Room
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                Maintenance
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                Mark Vacant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
