"use client"

import React from "react"
import Link from "next/link"
import {
  ArrowLeft, Calendar, CalendarPlus, CheckCircle2, Clock, FileText, Info, Mail,
  MapPin, MessageSquare, Navigation, Phone,
} from "lucide-react"
import { useCustomerToast } from "../components/toast"
import { StatusPill } from "../components/StatusPill"
import type { Viewing } from "../data/lets"
import ViewingCountdown from "./components/viewing/ViewingCountdown"
import ViewingManagePanel from "./components/viewing/ViewingManagePanel"

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <p className="text-[13px] font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-slate-400" /> {title}
      </p>
      {children}
    </div>
  )
}
function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[12px] text-slate-500">{l}</span>
      <span className="text-[12px] font-semibold text-slate-800">{r}</span>
    </div>
  )
}
function Mini({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
      <Icon className="w-4 h-4" /> {label}
    </button>
  )
}

export default function ViewingDetail({ v }: { v: Viewing }) {
  const { toast } = useCustomerToast()

  return (
    <div className="space-y-5">
      <Link href="/customer/lets?tab=viewings" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" /> Back to viewings
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5">
          {/* Hero */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="relative h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 flex gap-2">
                <StatusPill tone="violet" className="bg-white/95">Long-term let</StatusPill>
                <StatusPill tone="emerald" className="bg-white/95">{v.status}</StatusPill>
              </div>
            </div>
            <div className="p-5">
              <h1 className="text-[20px] font-bold text-slate-900">{v.property}</h1>
              <p className="text-[12.5px] text-slate-500">{v.location}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" /> {v.date}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" /> {v.time}
                </span>
                <button
                  onClick={() => toast("Added to calendar", "success")}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600"
                >
                  <CalendarPlus className="w-4 h-4" /> Add to calendar
                </button>
              </div>
            </div>
          </div>

          <ViewingCountdown />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card title="Host / agent" icon={CheckCircle2}>
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-slate-200 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{v.agent}</p>
                  <p className="text-[11px] text-slate-400">Lettings agent · Propvora</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <Mini icon={MessageSquare} label="Message" onClick={() => toast(`Messaging ${v.agent}…`, "info")} />
                <Mini icon={Phone} label="Call" onClick={() => toast("Calling…", "info")} />
                <Mini icon={Mail} label="Email" onClick={() => toast("Emailing…", "info")} />
              </div>
            </Card>
            <Card title="Viewing details" icon={Info}>
              <Row l="Date" r={v.date} />
              <Row l="Time" r={v.time} />
              <Row l="Duration" r="30 minutes" />
              <Row l="Type" r="In-person, agent-led" />
            </Card>
          </div>

          <Card title="Meeting &amp; access instructions" icon={MapPin}>
            <p className="text-[12.5px] text-slate-600">{v.access}. Please arrive 5 minutes early and bring a form of ID.</p>
            <div className="mt-3 rounded-xl bg-[#E8EEF4] h-40 flex items-center justify-center text-slate-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[12px] text-slate-500 inline-flex items-center gap-1.5">
                <Navigation className="w-4 h-4" /> {v.transport} from your location
              </span>
              <button onClick={() => toast("Opening directions…", "info")} className="text-[12px] font-semibold text-blue-600">
                Get directions
              </button>
            </div>
          </Card>

          <Card title="Documents" icon={FileText}>
            {[["Property brochure", "PDF · 1.2 MB"], ["EPC certificate", "PDF · 0.4 MB"], ["Floorplan", "PDF · 0.8 MB"]].map(([n, s]) => (
              <button
                key={n}
                onClick={() => toast(`Downloading ${n}…`, "info")}
                className="w-full flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 group"
              >
                <span className="text-left flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>
                    <span className="block text-[12px] font-medium text-slate-700">{n}</span>
                    <span className="block text-[10px] text-slate-400">{s}</span>
                  </span>
                </span>
              </button>
            ))}
          </Card>
        </div>

        <ViewingManagePanel />
      </div>
    </div>
  )
}
