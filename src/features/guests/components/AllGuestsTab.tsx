"use client"

import React from "react"
import { BedDouble } from "lucide-react"
import { GuestCard, type GuestCardData } from "./GuestCard"

interface AllGuestsTabProps {
  guests: GuestCardData[]
}

export function AllGuestsTab({ guests }: AllGuestsTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3">Guest</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Latest stay</th>
              <th className="text-center px-4 py-3">Bookings</th>
              <th className="text-right px-4 py-3">Total spend</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {guests.map((g) => (
              <GuestCard key={g.key} guest={g} />
            ))}
          </tbody>
        </table>
      </div>

      {guests.length === 0 && (
        <div className="py-16 text-center">
          <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No guests match your search.</p>
        </div>
      )}
    </div>
  )
}
