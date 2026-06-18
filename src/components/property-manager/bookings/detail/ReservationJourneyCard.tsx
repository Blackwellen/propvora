'use client'

import { CheckCircle, Clock, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  { key: 'booked', label: 'Booked', date: '17 Jun', status: 'completed' },
  { key: 'pre_arrival', label: 'Pre-arrival', date: '18–20 Jun', status: 'current' },
  { key: 'check_in', label: 'Check-in', date: '21 Jun, 03:00 PM', status: 'upcoming' },
  { key: 'in_stay', label: 'In stay', date: '21–24 Jun', status: 'upcoming' },
  { key: 'check_out', label: 'Check-out', date: '24 Jun, 11:00 AM', status: 'upcoming' },
  { key: 'post_stay', label: 'Post-stay', date: 'After 24 Jun', status: 'upcoming' },
]

export default function ReservationJourneyCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold">
          C
        </div>
        <h3 className="font-semibold text-slate-800">Reservation journey</h3>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 z-0" />

        <div className="relative z-10 flex justify-between">
          {STAGES.map((stage) => (
            <div key={stage.key} className="flex flex-col items-center gap-2">
              {stage.status === 'completed' ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              ) : stage.status === 'current' ? (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-sm ring-4 ring-blue-100">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
              )}
              <div className="text-center">
                <p className={cn(
                  'text-xs font-semibold',
                  stage.status === 'completed' ? 'text-emerald-600' :
                  stage.status === 'current' ? 'text-blue-600' :
                  'text-slate-400'
                )}>
                  {stage.label}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{stage.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert */}
      <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Pre-arrival in progress</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Send check-in instructions 24 hours before arrival.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-blue-700 transition-colors shrink-0">
          <Send className="w-3 h-3" />
          Send now
        </button>
      </div>
    </div>
  )
}
