"use client"

import { useState } from "react"
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react"

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function PrefRow({
  icon: Icon,
  title,
  sub,
  defaultOn,
}: {
  icon: typeof Mail
  title: string
  sub: string
  defaultOn?: boolean
}) {
  const [on, setOn] = useState(!!defaultOn)
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
        <div>
          <p className="text-[12.5px] font-semibold text-slate-800">{title}</p>
          <p className="text-[11px] text-slate-400">{sub}</p>
        </div>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`w-9 h-5 rounded-full p-0.5 transition ${on ? "bg-emerald-500" : "bg-slate-200"}`}
      >
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
      </button>
    </div>
  )
}

export default function NotificationsSection() {
  return (
    <Panel title="Communication preferences">
      <PrefRow icon={Mail} title="Email notifications" sub="Booking updates, receipts and offers" defaultOn />
      <PrefRow icon={MessageSquare} title="SMS notifications" sub="Time-sensitive booking alerts" defaultOn />
      <PrefRow icon={Smartphone} title="Push notifications" sub="On your devices" />
      <PrefRow icon={Bell} title="Marketing &amp; offers" sub="Curated deals and credits" defaultOn />
    </Panel>
  )
}
