'use client'

import { Phone, Clock, MessageCircle, MapPin, AlertTriangle } from 'lucide-react'
import type { PublicEmergencyService } from '@/lib/public-marketplace/types'

export default function EmergencyCTAPanel({ service }: { service: PublicEmergencyService }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 shadow-lg p-6 sticky top-20">
      <div className="text-center mb-4">
        <h3 className="text-base font-bold text-slate-900">NEED IMMEDIATE HELP?</h3>
        <p className="text-sm text-slate-500 mt-1">We&apos;re ready to respond</p>
        <p className="text-xs text-slate-400 mt-0.5">&ldquo;Call, chat or request now...&rdquo;</p>
      </div>

      {/* Call button */}
      <a
        href={`tel:${service.phone}`}
        className="w-full flex items-center justify-center gap-3 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl mb-2 transition-colors"
      >
        <Phone className="h-5 w-5" />
        <div>
          <div className="text-base">Call now: {service.phone}</div>
          <div className="text-xs font-normal opacity-90">Available 24/7</div>
        </div>
      </a>

      <button className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl mb-2 transition-colors text-sm">
        <Clock className="h-4 w-4" />
        Request a call back
      </button>

      <button className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl mb-4 transition-colors text-sm">
        <MessageCircle className="h-4 w-4" />
        <div className="text-left">
          <div>Start live chat</div>
          <div className="text-xs font-normal text-slate-400">No wait — we&apos;re online</div>
        </div>
      </button>

      {/* ETA */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
        <p className="text-xs font-semibold text-amber-800 mb-2">ESTIMATED ARRIVAL</p>
        <div className="flex items-center gap-2 text-base font-bold text-slate-900">
          🚐 {service.responseTimeMin}-{service.responseTimeMax} mins
        </div>
        <p className="text-xs text-slate-500 mt-1">Based on your location</p>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <MapPin className="h-3 w-3" />
          <span>M2 4BG</span>
          <button className="text-[var(--brand)] underline ml-1">Change</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
        <div className="flex items-center gap-1"><span className="text-emerald-500">✓</span> 24/7 Emergency</div>
        {service.noCalloutFee && <div className="flex items-center gap-1"><span className="text-emerald-500">✓</span> No call-out fee</div>}
        <div className="flex items-center gap-1"><span className="text-emerald-500">✓</span> Upfront pricing</div>
        <div className="flex items-center gap-1"><span className="text-emerald-500">✓</span> Satisfaction</div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-xs text-red-700">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">In danger or unsafe?</span>
          <br />If this is an emergency, call <strong>999</strong>
        </div>
      </div>
    </div>
  )
}
